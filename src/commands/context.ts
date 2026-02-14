import { Command } from 'commander';
import { join } from 'path';
import { readFile, readdir, access } from 'fs/promises';
import {
  getStoragePath,
  appendToMarkdown,
  readMarkdown,
  ensureDirectory,
  serializeContextItemEntryYaml,
  type ContextItemEntry,
} from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate, formatDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';
import { parseNaturalDate } from '../utils/date-parser.js';

const contextCommand = new Command('context');

async function isFile(path: string): Promise<boolean> {
  try {
    await access(path);
    const stat = await import('fs/promises').then(m => m.stat(path));
    return stat.isFile();
  } catch {
    return false;
  }
}

contextCommand
  .command('log')
  .description('Log context-specific information (use --date for retroactive logging)')
  .argument('<context>', 'Context name (e.g., work, diet, fitness)')
  .argument('<input>', 'Text or file path to log')
  .option('-g, --goal [keyword]', 'Link this context entry to a goal (optional keyword for matching)')
  .option('-d, --date <date>', 'Date for the entry (YYYY-MM-DD or natural language like "yesterday")')
  .action(async (context: string, input: string, options: { goal?: string | boolean; date?: string }) => {
    try {
      const storagePath = await getStoragePath();

      // Parse date if provided, otherwise use current date
      let date = getCurrentDate();
      if (options.date) {
        // Try parsing as natural language first
        const naturalDate = parseNaturalDate(options.date);
        if (naturalDate) {
          // Use the 'from' date from the range (start of period)
          date = formatDate(naturalDate.from);
        } else if (parseDate(options.date)) {
          // Fall back to ISO date parsing
          date = options.date;
        } else {
          error(`Invalid date format: ${options.date}`);
          info('Use YYYY-MM-DD format or natural language like "yesterday", "last Monday", etc.');
          return;
        }
      }

      const time = getCurrentTime();
      const contextPath = join(storagePath, 'context', context);
      await ensureDirectory(contextPath);

      const filePath = join(contextPath, `${date}.md`);

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      let content: string;
      let source: string;

      // Check if input is a file path
      if (await isFile(input)) {
        const fileContent = await readFile(input, 'utf-8');
        content = fileContent;
        source = `File: ${input}`;
      } else {
        content = input;
        source = 'Text';
      }

      // Build context entry using YAML format
      const contextEntry: ContextItemEntry = {
        timestamp: time,
        source,
        text: content,
        goal: goalLinkResult.codename || null,
        kind: null,
        metadata: {},
        rawEntry: '', // Will be set by serializer
      };

      const entry = serializeContextItemEntryYaml(contextEntry);
      await appendToMarkdown(filePath, entry);

      if (goalLinkResult.codename) {
        success(`Context logged to "${context}" and linked to goal: ${goalLinkResult.codename}`);
      } else {
        if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
          info(goalLinkResult.message);
        }
        success(`Context logged to "${context}"`);
      }
    } catch (err) {
      error(`Failed to log context: ${(err as Error).message}`);
      throw err;
    }
  });

contextCommand
  .command('list')
  .description('List available contexts')
  .action(async () => {
    try {
      const storagePath = await getStoragePath();
      const contextPath = join(storagePath, 'context');

      try {
        const contexts = await readdir(contextPath, { withFileTypes: true });
        const contextNames = contexts.filter(c => c.isDirectory()).map(c => c.name);

        if (contextNames.length === 0) {
          info('No contexts found. Create one with: aissist context log <context> <input>');
          return;
        }

        console.log('\nAvailable contexts:\n');
        contextNames.forEach(name => console.log(`  • ${name}`));
      } catch {
        info('No contexts found. Create one with: aissist context log <context> <input>');
      }
    } catch (err) {
      error(`Failed to list contexts: ${(err as Error).message}`);
      throw err;
    }
  });

contextCommand
  .command('show')
  .description('Show context entries')
  .argument('<context>', 'Context name')
  .option('-d, --date <date>', 'Show entries for specific date (YYYY-MM-DD)')
  .option('-e, --entity <name>', 'Show a specific entity file')
  .action(async (context: string, options) => {
    try {
      const storagePath = await getStoragePath();
      const contextPath = join(storagePath, 'context', context);

      // Warn if both flags provided
      if (options.entity && options.date) {
        info('Both --entity and --date provided; showing entity file.');
      }

      // Show a specific entity file
      if (options.entity) {
        const entityPath = join(contextPath, `${options.entity}.md`);
        const content = await readMarkdown(entityPath);

        if (!content) {
          info(`No entity file found for "${options.entity}" in context "${context}"`);
          return;
        }

        console.log(`\nContext "${context}" entity "${options.entity}":\n`);
        console.log(content);
        return;
      }

      // Show entries for a specific date
      if (options.date) {
        if (!parseDate(options.date)) {
          error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
          return;
        }

        const filePath = join(contextPath, `${options.date}.md`);
        const content = await readMarkdown(filePath);

        if (!content) {
          info(`No entries found for context "${context}" on ${options.date}`);
          return;
        }

        console.log(`\nContext "${context}" for ${options.date}:\n`);
        console.log(content);
        return;
      }

      // No flags: list all files in the category
      const datePattern = /^\d{4}-\d{2}-\d{2}\.md$/;

      try {
        const files = await readdir(contextPath);
        const mdFiles = files.filter(f => f.endsWith('.md'));

        if (mdFiles.length === 0) {
          info(`No entries found for context "${context}"`);
          return;
        }

        const entityFiles = mdFiles.filter(f => !datePattern.test(f)).map(f => f.replace(/\.md$/, ''));
        const dateFiles = mdFiles.filter(f => datePattern.test(f)).map(f => f.replace(/\.md$/, ''));

        console.log(`\nContext "${context}":\n`);

        if (entityFiles.length > 0) {
          console.log('  Entities:');
          entityFiles.forEach(name => console.log(`    • ${name}`));
        }

        if (dateFiles.length > 0) {
          if (entityFiles.length > 0) console.log('');
          console.log('  Date entries:');
          dateFiles.forEach(name => console.log(`    • ${name}`));
        }
      } catch {
        info(`No entries found for context "${context}"`);
      }
    } catch (err) {
      error(`Failed to show context: ${(err as Error).message}`);
      throw err;
    }
  });

contextCommand
  .command('query')
  .description('Query context entries by kind or field values')
  .option('-k, --kind <kind>', 'Filter by kind (e.g., contact, email, trade)')
  .option('-f, --field <field>', 'Filter by field value (format: key=value)')
  .option('-c, --context <name>', 'Limit to specific context subcategory')
  .action(async (options: { kind?: string; field?: string; context?: string }) => {
    try {
      // Parse --field option (validate before scanning directories)
      let fieldKey: string | undefined;
      let fieldValue: string | undefined;
      if (options.field) {
        const eqIndex = options.field.indexOf('=');
        if (eqIndex === -1) {
          error('Invalid --field format. Use key=value (e.g., --field "project=my-project")');
          return;
        }
        fieldKey = options.field.slice(0, eqIndex).trim();
        fieldValue = options.field.slice(eqIndex + 1).trim();
        if (!fieldKey || !fieldValue) {
          error('Invalid --field format. Both key and value must be non-empty (e.g., --field "project=my-project")');
          return;
        }
      }

      const storagePath = await getStoragePath();
      const contextRoot = join(storagePath, 'context');

      // Get context subdirectories to search
      let categories: string[];
      if (options.context) {
        categories = [options.context];
      } else {
        try {
          const entries = await readdir(contextRoot, { withFileTypes: true });
          categories = entries.filter(e => e.isDirectory()).map(e => e.name);
        } catch {
          info('No contexts found.');
          return;
        }
      }

      const results: { category: string; filename: string; kind: string; summary: string }[] = [];

      for (const category of categories) {
        const categoryPath = join(contextRoot, category);
        let files: string[];
        try {
          files = await readdir(categoryPath).then(f => f.filter(name => name.endsWith('.md')));
        } catch {
          continue; // Directory doesn't exist or isn't readable
        }

        for (const file of files) {
          const filePath = join(categoryPath, file);
          const content = await readFile(filePath, 'utf-8');

          // Extract frontmatter section only (between --- delimiters)
          let frontmatter = '';
          let body = '';
          const fmStart = content.indexOf('---');
          const fmEnd = fmStart !== -1 ? content.indexOf('---', fmStart + 3) : -1;
          if (fmStart !== -1 && fmEnd !== -1) {
            frontmatter = content.slice(fmStart + 3, fmEnd);
            body = content.slice(fmEnd + 3).trim();
          } else {
            body = content.trim();
          }

          // Check kind filter (exact match in frontmatter only)
          if (options.kind) {
            const kindRegex = new RegExp(`^kind:\\s*${options.kind}\\s*$`, 'm');
            if (!kindRegex.test(frontmatter)) {
              continue;
            }
          }

          // Check field filter (exact match in frontmatter only)
          if (fieldKey && fieldValue) {
            const fieldRegex = new RegExp(`^${fieldKey}:\\s*${fieldValue}\\s*$`, 'm');
            if (!fieldRegex.test(frontmatter)) {
              continue;
            }
          }

          // Extract kind from frontmatter
          const kindMatch = frontmatter.match(/^kind:\s*(.+)$/m);
          const kind = kindMatch ? kindMatch[1].trim() : 'unknown';

          // Get first line of body (after frontmatter)
          let summary = '';
          if (body) {
            const firstLine = body.split('\n').find(line => line.trim().length > 0);
            summary = firstLine ? firstLine.replace(/^#+\s*/, '').trim() : '';
          }

          results.push({
            category,
            filename: file.replace(/\.md$/, ''),
            kind,
            summary,
          });
        }
      }

      if (results.length === 0) {
        info('No matching entries found.');
        return;
      }

      console.log(`\nFound ${results.length} matching entries:\n`);
      for (const r of results) {
        console.log(`  ${r.category}/${r.filename} [${r.kind}] — ${r.summary}`);
      }
    } catch (err) {
      error(`Failed to query context: ${(err as Error).message}`);
      throw err;
    }
  });

contextCommand
  .command('ingest')
  .description('Bulk ingest files from a directory')
  .argument('<context>', 'Context name')
  .argument('<directory>', 'Directory path to ingest')
  .action(async (context: string, directory: string) => {
    try {
      const storagePath = await getStoragePath();
      const contextPath = join(storagePath, 'context', context);
      await ensureDirectory(contextPath);

      const entries = await readdir(directory, { withFileTypes: true });
      let count = 0;

      for (const entry of entries) {
        if (entry.isFile()) {
          const fullPath = join(directory, entry.name);
          const fileContent = await readFile(fullPath, 'utf-8');

          const date = getCurrentDate();
          const time = getCurrentTime();
          const filePath = join(contextPath, `${date}.md`);

          const contextEntry: ContextItemEntry = {
            timestamp: time,
            source: `file:${entry.name}`,
            text: fileContent,
            goal: null,
            kind: null,
            metadata: {},
            rawEntry: '', // Will be set by serializer
          };
          const logEntry = serializeContextItemEntryYaml(contextEntry);
          await appendToMarkdown(filePath, logEntry);
          count++;
        }
      }

      success(`Ingested ${count} files into context "${context}"`);
    } catch (err) {
      error(`Failed to ingest directory: ${(err as Error).message}`);
      throw err;
    }
  });

export { contextCommand };
