#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { handleError } from './utils/cli.js';
import { printBrand } from './utils/brand.js';
import { checkForUpdates, formatUpdateNotification } from './utils/update-checker.js';
import { getStoragePath, loadConfig } from './utils/storage.js';

// Import commands
import { initCommand } from './commands/init.js';
import { goalCommand } from './commands/goal.js';
import { historyCommand } from './commands/history.js';
import { contextCommand } from './commands/context.js';
import { reflectCommand } from './commands/reflect.js';
import { recallCommand } from './commands/recall.js';
import { pathCommand } from './commands/path.js';
import { proposeCommand } from './commands/propose.js';
import { todoCommand } from './commands/todo.js';
import { clearCommand } from './commands/clear.js';
import { configCommand } from './commands/config.js';
import { backupCommand } from './commands/backup.js';
import { restoreCommand } from './commands/restore.js';
import { syncCommand } from './commands/sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const packageJsonPath = join(__dirname, '..', 'package.json');
let version = '1.0.0';
try {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  version = packageJson.version;
} catch {
  // Use default version if package.json can't be read
}

// Print brand logo
printBrand();

// Start update check in background (non-blocking)
async function performUpdateCheck(): Promise<void> {
  try {
    // Check if update checks are enabled in config
    const storagePath = await getStoragePath();
    const config = await loadConfig(storagePath);
    const updateCheckEnabled = config.updateCheck?.enabled ?? true;

    if (!updateCheckEnabled) {
      return;
    }

    const result = await checkForUpdates(version);

    if (result.updateAvailable) {
      const notification = formatUpdateNotification(result);
      if (notification) {
        // Store notification to display after command execution
        process.on('beforeExit', () => {
          console.log('\n' + chalk.yellow(notification) + '\n');
        });
      }
    }
  } catch {
    // Silently fail - update check is not critical
  }
}

// Trigger update check asynchronously (don't await)
void performUpdateCheck();

const program = new Command();

program
  .name('aissist')
  .description('A local-first, AI-powered CLI personal assistant')
  .version(version);

// Register commands
program
  .command('init')
  .description('Initialize aissist storage (use --global for ~/.aissist/)')
  .option('-g, --global', 'Initialize global storage in ~/.aissist/')
  .option('-d, --description <text>', 'Set instance description (skips interactive prompt)')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program.addCommand(goalCommand);
program.addCommand(historyCommand);
program.addCommand(contextCommand);
program.addCommand(reflectCommand);
program.addCommand(proposeCommand);
program.addCommand(todoCommand);
program.addCommand(clearCommand);
program.addCommand(configCommand);
program.addCommand(backupCommand);
program.addCommand(restoreCommand);
program.addCommand(syncCommand);

// Top-level alias: `aissist log` → `aissist history log`
program
  .command('log')
  .description('Log a history entry (shortcut for "history log")')
  .argument('[text]', 'History entry text (omit when using --from)')
  .option('-g, --goal [keyword]', 'Link this history entry to a goal (optional keyword for matching)')
  .option('-f, --from <timeframe>', 'Import GitHub activity from timeframe (e.g., "this week", "today")')
  .option('-d, --date <date>', 'Date for the entry (YYYY-MM-DD or natural language like "yesterday")')
  .option('-s, --smart', 'Use AI to clean up text and auto-link to goals')
  .action(async (text, options) => {
    // Rewrite argv to delegate to `history log`
    const args = ['history', 'log'];
    if (text) args.push(text);
    if (options.goal !== undefined) {
      args.push('--goal');
      if (typeof options.goal === 'string') args.push(options.goal);
    }
    if (options.from) args.push('--from', options.from);
    if (options.date) args.push('--date', options.date);
    if (options.smart) args.push('--smart');
    await program.parseAsync(['node', 'aissist', ...args]);
  });

program
  .command('recall')
  .description('AI-powered semantic search')
  .argument('<query>', 'Search query')
  .option('--raw', 'Output raw Markdown (for piping or AI consumption)')
  .action(async (query, options) => {
    try {
      await recallCommand(query, options);
    } catch (error) {
      handleError(error);
    }
  });

program
  .command('path')
  .description('Show current storage path')
  .option('--hierarchy', 'Show read hierarchy (including parent paths)')
  .action(async (options) => {
    try {
      await pathCommand(options);
    } catch (error) {
      handleError(error);
    }
  });

program.parse();
