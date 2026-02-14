#!/usr/bin/env npx tsx

/**
 * Clarity Vault -> Aissist Migration Script
 *
 * Migrates all data from the Obsidian vault at ~/clarity/ to aissist's
 * storage at ~/.aissist/.
 *
 * Usage:
 *   npx tsx scripts/migrate-clarity.ts            # Dry run (preview)
 *   npx tsx scripts/migrate-clarity.ts --execute   # Actually write files
 *   npx tsx scripts/migrate-clarity.ts --force      # Overwrite existing files
 *   npx tsx scripts/migrate-clarity.ts --execute --force
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  appendFileSync,
} from 'fs';
import { join, basename, relative, extname } from 'path';
import { homedir } from 'os';
import matter from 'gray-matter';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CLARITY_PATH = join(homedir(), 'clarity');
const AISSIST_PATH = join(homedir(), '.aissist');
const DRY_RUN = !process.argv.includes('--execute');
const FORCE = process.argv.includes('--force');

// Directories to skip entirely
const SKIP_DIRS = new Set(['.obsidian', 'templates', 'bases']);

// Specific files to skip (basenames)
const SKIP_FILES = new Set(['Dashboard.md']);

// ---------------------------------------------------------------------------
// Counters for report
// ---------------------------------------------------------------------------

interface MigrationStats {
  created: number;
  skipped: number;
  errors: number;
}

const stats: Record<string, MigrationStats> = {};
const warnings: string[] = [];
const errors: string[] = [];

function getStat(type: string): MigrationStats {
  if (!stats[type]) {
    stats[type] = { created: 0, skipped: 0, errors: 0 };
  }
  return stats[type];
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Convert a filename or wiki-link target to a URL-safe slug */
function slugify(name: string): string {
  return name
    .replace(/\.md$/, '')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1') // extract wiki-link target
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Strip wiki-link syntax: [[target|alias]] -> target slug, [[target]] -> target slug */
function stripWikiLink(value: string): string {
  if (typeof value !== 'string') return String(value ?? '');
  const match = value.match(/^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  if (match) return slugify(match[1]);
  // Already a plain string — might be quoted with [[ ]]
  const innerMatch = value.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  if (innerMatch) return slugify(innerMatch[1]);
  return value;
}

/** Convert wiki-links in body text: [[Note Name]] -> note-name, [[a|b]] -> a slug */
function convertWikiLinks(text: string): string {
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, _alias) => {
    return slugify(target);
  });
}

/** Get the `created` date from frontmatter, falling back to today */
function getCreatedDate(data: Record<string, unknown>): string {
  if (data.created) {
    const d = data.created;
    if (d instanceof Date) return formatDate(d);
    if (typeof d === 'string') return d;
  }
  if (data.date) {
    const d = data.date;
    if (d instanceof Date) return formatDate(d);
    if (typeof d === 'string') return d;
  }
  return formatDate(new Date());
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Safely write a file, respecting DRY_RUN and FORCE flags.
 *  Returns true if the file was written (or would be written in dry-run).
 */
function safeWrite(destPath: string, content: string): boolean {
  if (existsSync(destPath) && !FORCE) {
    return false; // Skip — already exists
  }
  if (!DRY_RUN) {
    mkdirSync(join(destPath, '..'), { recursive: true });
    writeFileSync(destPath, content, 'utf-8');
  }
  return true;
}

/**
 * Track which append-target files have been initialized this run.
 * When --force is set, the first append to a file truncates it;
 * subsequent appends add to it.
 */
const initializedAppendFiles = new Set<string>();

/** Safely append to a file, respecting DRY_RUN flag.
 *  Creates the file if it doesn't exist.
 *  In --force mode, the first write to each file truncates it.
 *  Returns true always (append operations always succeed).
 */
function safeAppend(destPath: string, content: string): boolean {
  if (!DRY_RUN) {
    mkdirSync(join(destPath, '..'), { recursive: true });

    // In force mode, first touch of an existing file truncates it
    if (FORCE && existsSync(destPath) && !initializedAppendFiles.has(destPath)) {
      writeFileSync(destPath, content, 'utf-8');
      initializedAppendFiles.add(destPath);
    } else if (existsSync(destPath)) {
      const existing = readFileSync(destPath, 'utf-8');
      const separator = existing.trim() ? '\n\n' : '';
      appendFileSync(destPath, separator + content, 'utf-8');
      initializedAppendFiles.add(destPath);
    } else {
      writeFileSync(destPath, content, 'utf-8');
      initializedAppendFiles.add(destPath);
    }
  }
  return true;
}

/** Build YAML frontmatter string */
function buildFrontmatter(fields: Record<string, unknown>): string {
  const lines: string[] = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'string') {
      // Quote strings that might need it
      if (value.includes(':') || value.includes('#') || value.includes('"') || value.includes("'") || value.includes('\n')) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: "${value}"`);
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${String(value)}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

interface SourceFile {
  absolutePath: string;
  relativePath: string; // relative to CLARITY_PATH
  filename: string;     // basename without .md
}

function discoverFiles(): SourceFile[] {
  const files: SourceFile[] = [];

  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relative(CLARITY_PATH, fullPath);

      // Skip hidden directories and specific dirs
      const topDir = relPath.split('/')[0];
      if (SKIP_DIRS.has(topDir)) continue;
      if (entry.startsWith('.')) continue;

      let st;
      try {
        st = statSync(fullPath);
      } catch {
        continue;
      }

      if (st.isDirectory()) {
        walk(fullPath);
      } else if (st.isFile() && extname(entry) === '.md') {
        if (SKIP_FILES.has(entry)) continue;

        files.push({
          absolutePath: fullPath,
          relativePath: relPath,
          filename: basename(entry, '.md'),
        });
      }
    }
  }

  walk(CLARITY_PATH);
  return files;
}

// ---------------------------------------------------------------------------
// Migration: Areas -> goals/
// ---------------------------------------------------------------------------

function migrateArea(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('area');
  const date = getCreatedDate(data);
  const codename = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'goals', `${date}.md`);

  const description = body.trim().split('\n').slice(0, 3).join(' ').replace(/^#\s+.*\n?/, '').trim();

  const frontmatter = buildFrontmatter({
    schema_version: '1.0',
    timestamp: '00:00',
    codename,
    kind: 'area',
    status: data.archived ? 'paused' : 'active',
    description: description || null,
  });

  const convertedBody = convertWikiLinks(body.trim());
  const entry = `${frontmatter}\n\n${convertedBody}`;

  if (existsSync(destPath) && !FORCE) {
    // Check if this codename is already in the file
    try {
      const existing = readFileSync(destPath, 'utf-8');
      if (existing.includes(`codename: "${codename}"`)) {
        stat.skipped++;
        return;
      }
    } catch { /* file might not exist yet in dry-run */ }
  }

  safeAppend(destPath, entry);
  stat.created++;
}

// ---------------------------------------------------------------------------
// Migration: Projects -> goals/
// ---------------------------------------------------------------------------

function migrateProject(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('project');
  const date = getCreatedDate(data);
  const codename = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'goals', `${date}.md`);

  // Extract parent_goal from area field
  const parentGoal = data.area ? stripWikiLink(String(data.area)) : null;

  // Map status
  let status: string = 'active';
  if (data.status === 'completed') status = 'completed';
  else if (data.status === 'cancelled') status = 'paused';
  else if (data.status === 'not-started') status = 'active';

  // Build description from first few meaningful lines
  const description = body.trim().split('\n').filter(l => !l.startsWith('#') && l.trim()).slice(0, 2).join(' ').trim();

  // Deadline from timeframe (e.g., "2026-Q1" -> "2026-03-31")
  let deadline: string | null = null;
  if (data.timeframe && typeof data.timeframe === 'string') {
    const qMatch = data.timeframe.match(/(\d{4})-Q(\d)/);
    if (qMatch) {
      const year = qMatch[1];
      const quarter = parseInt(qMatch[2], 10);
      const lastMonth = quarter * 3;
      const lastDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][lastMonth - 1];
      deadline = `${year}-${String(lastMonth).padStart(2, '0')}-${lastDay}`;
    }
  }

  const frontmatter = buildFrontmatter({
    schema_version: '1.0',
    timestamp: '00:00',
    codename,
    kind: 'project',
    parent_goal: parentGoal,
    status,
    deadline,
    description: description || null,
  });

  const convertedBody = convertWikiLinks(body.trim());
  const entry = `${frontmatter}\n\n${convertedBody}`;

  if (existsSync(destPath) && !FORCE) {
    try {
      const existing = readFileSync(destPath, 'utf-8');
      if (existing.includes(`codename: "${codename}"`)) {
        stat.skipped++;
        return;
      }
    } catch { /* ignore */ }
  }

  safeAppend(destPath, entry);
  stat.created++;
}

// ---------------------------------------------------------------------------
// Migration: Tasks -> todos/
// ---------------------------------------------------------------------------

function migrateTask(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('task');
  const date = getCreatedDate(data);
  const destPath = join(AISSIST_PATH, 'todos', `${date}.md`);

  // Extract title from first heading or filename
  const headingMatch = body.match(/^#\s+(.+)$/m);
  const title = headingMatch ? headingMatch[1].trim() : file.filename.replace(/-/g, ' ');

  // Map priority: high=3, medium=2, low=1, default=0
  let priority = 0;
  if (data.priority === 'high') priority = 3;
  else if (data.priority === 'medium') priority = 2;
  else if (data.priority === 'low') priority = 1;

  // Completed?
  const completed = data.status === 'done';

  // Goal from project
  const goal = data.project ? stripWikiLink(String(data.project)) : null;

  // Build tags for effort/priority
  const tags: string[] = [];
  if (data.priority) tags.push(`#${data.priority}`);
  if (data.effort) tags.push(`#${data.effort}`);

  // Due date — handle Date objects from gray-matter
  let due: string | null = null;
  if (data.due) {
    if (data.due instanceof Date) {
      due = formatDate(data.due);
    } else {
      due = String(data.due);
    }
  }

  const frontmatter = buildFrontmatter({
    schema_version: '1.0',
    timestamp: '00:00',
    completed,
    priority: priority > 0 ? priority : null,
    goal,
  });

  const checkbox = completed ? '[x]' : '[ ]';
  const tagStr = tags.length > 0 ? ' ' + tags.join(' ') : '';
  const dueStr = due ? ` due::${due}` : '';
  const todoLine = `- ${checkbox} ${title}${tagStr}${dueStr}`;

  // Include the rest of the body (minus the heading) as context below the todo
  const bodyWithoutHeading = body.replace(/^#\s+.+$/m, '').trim();
  const convertedBody = convertWikiLinks(bodyWithoutHeading);
  const bodySection = convertedBody ? `\n\n${convertedBody}` : '';

  const entry = `${frontmatter}\n\n${todoLine}${bodySection}`;

  if (existsSync(destPath) && !FORCE) {
    try {
      const existing = readFileSync(destPath, 'utf-8');
      // Check if this specific task already exists by title
      if (existing.includes(title)) {
        stat.skipped++;
        return;
      }
    } catch { /* ignore */ }
  }

  safeAppend(destPath, entry);
  stat.created++;
}

// ---------------------------------------------------------------------------
// Migration: Contacts -> context/people/{slug}.md
// ---------------------------------------------------------------------------

function migrateContact(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('contact');
  const slug = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'context', 'people', `${slug}.md`);

  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: '00:00',
    kind: 'contact',
  };

  if (data.role) metadata.role = String(data.role);
  if (data.institution) metadata.institution = String(data.institution);
  if (data.email) metadata.email = String(data.email);
  if (data.project) metadata.project = stripWikiLink(String(data.project));

  const frontmatter = buildFrontmatter(metadata);
  const convertedBody = convertWikiLinks(body.trim());
  const content = `${frontmatter}\n\n${convertedBody}`;

  if (safeWrite(destPath, content)) {
    stat.created++;
  } else {
    stat.skipped++;
  }
}

// ---------------------------------------------------------------------------
// Migration: Emails -> context/email/{slug}.md
// ---------------------------------------------------------------------------

function migrateEmail(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('email');
  const slug = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'context', 'email', `${slug}.md`);

  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: '00:00',
    kind: 'email',
  };

  if (data.direction) metadata.direction = String(data.direction);
  if (data.correspondent) metadata.correspondent = stripWikiLink(String(data.correspondent));
  if (data.date) {
    const d = data.date;
    metadata.date = d instanceof Date ? formatDate(d) : String(d);
  }
  if (data.previous) metadata.previous = stripWikiLink(String(data.previous));
  if (data.project) metadata.project = stripWikiLink(String(data.project));

  const frontmatter = buildFrontmatter(metadata);
  const convertedBody = convertWikiLinks(body.trim());
  const content = `${frontmatter}\n\n${convertedBody}`;

  if (safeWrite(destPath, content)) {
    stat.created++;
  } else {
    stat.skipped++;
  }
}

// ---------------------------------------------------------------------------
// Migration: Trades -> context/trading/{slug}.md
// ---------------------------------------------------------------------------

function migrateTrade(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('trade');
  const slug = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'context', 'trading', `${slug}.md`);

  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: '00:00',
    kind: 'trade',
  };

  // Preserve all trade-specific fields
  if (data.status) metadata.trade_status = String(data.status);
  if (data.result) metadata.result = String(data.result);
  if (data.coin) metadata.coin = String(data.coin);
  if (data.side) metadata.side = String(data.side);
  if (data.size) metadata.size = String(data.size);
  if (data.entry) metadata.entry = String(data.entry);
  if (data.exit) metadata.exit = String(data.exit);
  if (data.pnl) metadata.pnl = String(data.pnl);
  if (data.duration) metadata.duration = String(data.duration);
  if (data.account) metadata.account = String(data.account);
  if (data['date-open']) {
    const d = data['date-open'];
    metadata.date_open = d instanceof Date ? formatDate(d) : String(d);
  }
  if (data['date-close']) {
    const d = data['date-close'];
    metadata.date_close = d instanceof Date ? formatDate(d) : String(d);
  }
  if (data.project) metadata.goal = stripWikiLink(String(data.project));

  const frontmatter = buildFrontmatter(metadata);
  const convertedBody = convertWikiLinks(body.trim());
  const content = `${frontmatter}\n\n${convertedBody}`;

  if (safeWrite(destPath, content)) {
    stat.created++;
  } else {
    stat.skipped++;
  }
}

// ---------------------------------------------------------------------------
// Migration: Diary -> context/trading/diary-{slug}.md
// ---------------------------------------------------------------------------

function migrateDiary(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('diary');
  const slug = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'context', 'trading', `diary-${slug}.md`);

  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: '00:00',
    kind: 'diary',
  };

  if (data.date) {
    const d = data.date;
    metadata.date = d instanceof Date ? formatDate(d) : String(d);
  }
  if (data.project) metadata.goal = stripWikiLink(String(data.project));

  const frontmatter = buildFrontmatter(metadata);
  const convertedBody = convertWikiLinks(body.trim());
  const content = `${frontmatter}\n\n${convertedBody}`;

  if (safeWrite(destPath, content)) {
    stat.created++;
  } else {
    stat.skipped++;
  }
}

// ---------------------------------------------------------------------------
// Migration: References -> context/reference/{slug}.md
// ---------------------------------------------------------------------------

function migrateReference(file: SourceFile, data: Record<string, unknown>, body: string, category?: string): void {
  const stat = getStat('reference');
  const slug = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'context', 'reference', `${slug}.md`);

  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: '00:00',
    kind: 'reference',
  };

  if (category) metadata.category = category;
  if (data.category && String(data.category).trim()) metadata.category = String(data.category);
  if (data.project) metadata.project = stripWikiLink(String(data.project));
  if (data.area) {
    const area = String(data.area).trim();
    if (area) metadata.area = stripWikiLink(area);
  }
  if (data.link && String(data.link).trim()) metadata.link = String(data.link);

  const frontmatter = buildFrontmatter(metadata);
  const convertedBody = convertWikiLinks(body.trim());
  const content = `${frontmatter}\n\n${convertedBody}`;

  if (safeWrite(destPath, content)) {
    stat.created++;
  } else {
    stat.skipped++;
  }
}

// ---------------------------------------------------------------------------
// Migration: PHD archive tasks -> context/reference/{slug}.md
// ---------------------------------------------------------------------------

function migrateArchivePhdTask(file: SourceFile, data: Record<string, unknown>, body: string): void {
  // These are completed tasks that belong in reference with category: phd-corrections
  const stat = getStat('archive-phd-task');
  const slug = slugify(file.filename);
  const destPath = join(AISSIST_PATH, 'context', 'reference', `${slug}.md`);

  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
    timestamp: '00:00',
    kind: 'reference',
    category: 'phd-corrections',
  };

  if (data.chapter) metadata.chapter = String(data.chapter);
  if (data.project) metadata.project = stripWikiLink(String(data.project));

  const frontmatter = buildFrontmatter(metadata);
  const convertedBody = convertWikiLinks(body.trim());
  const content = `${frontmatter}\n\n${convertedBody}`;

  if (safeWrite(destPath, content)) {
    stat.created++;
  } else {
    stat.skipped++;
  }
}

// ---------------------------------------------------------------------------
// Migration: Daily journals -> history/{date}.md
// ---------------------------------------------------------------------------

function migrateDaily(file: SourceFile, data: Record<string, unknown>, body: string): void {
  const stat = getStat('daily');

  // Use the filename as the date (it's already YYYY-MM-DD)
  const date = file.filename;
  const destPath = join(AISSIST_PATH, 'history', `${date}.md`);

  const frontmatter = buildFrontmatter({
    schema_version: '1.0',
    timestamp: '00:00',
    source: 'clarity-vault',
  });

  const convertedBody = convertWikiLinks(body.trim());
  const entry = `${frontmatter}\n\n${convertedBody}`;

  if (existsSync(destPath) && !FORCE) {
    // Check if we already appended clarity content
    try {
      const existing = readFileSync(destPath, 'utf-8');
      if (existing.includes('source: "clarity-vault"')) {
        stat.skipped++;
        return;
      }
    } catch { /* ignore */ }
  }

  // Append to existing history file if present, otherwise create
  safeAppend(destPath, entry);
  stat.created++;
}

// ---------------------------------------------------------------------------
// Main orchestration
// ---------------------------------------------------------------------------

function main(): void {
  const separator = '='.repeat(60);

  console.log('');
  console.log(separator);
  console.log('  Clarity -> Aissist Migration');
  console.log(`  Source: ${CLARITY_PATH}`);
  console.log(`  Destination: ${AISSIST_PATH}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'EXECUTE (writing files)'}`);
  if (FORCE) console.log('  Force: ON (overwriting existing files)');
  console.log(separator);
  console.log('');

  // Verify source exists
  if (!existsSync(CLARITY_PATH)) {
    console.error(`ERROR: Source directory not found: ${CLARITY_PATH}`);
    process.exit(1);
  }

  // Discover all source files
  const files = discoverFiles();
  console.log(`Found ${files.length} source files`);
  console.log('');

  // Categorize files by type
  const categorized: Record<string, { file: SourceFile; data: Record<string, unknown>; body: string }[]> = {};
  const uncategorized: SourceFile[] = [];

  for (const file of files) {
    try {
      const raw = readFileSync(file.absolutePath, 'utf-8');
      const { data, content: body } = matter(raw);

      const type = data.type as string | undefined;
      if (!type) {
        // Check if it's a phd-tasks archive file (they should all have type, but just in case)
        if (file.relativePath.startsWith('4-archive/phd-tasks/')) {
          if (!categorized['archive-phd-task']) categorized['archive-phd-task'] = [];
          categorized['archive-phd-task'].push({ file, data, body });
        } else {
          uncategorized.push(file);
          warnings.push(`No frontmatter type: ${file.relativePath}`);
        }
        continue;
      }

      if (!categorized[type]) categorized[type] = [];
      categorized[type].push({ file, data, body });
    } catch (err) {
      errors.push(`Failed to parse ${file.relativePath}: ${(err as Error).message}`);
      getStat('parse-error').errors++;
    }
  }

  if (uncategorized.length > 0) {
    console.log(`  Warnings: ${uncategorized.length} files without frontmatter type (see report)`);
    console.log('');
  }

  // Phase 1: Areas & Projects -> goals/
  console.log('Phase 1: Areas & Projects -> goals/');
  const areaFiles = categorized['area'] || [];
  for (const { file, data, body } of areaFiles) {
    try {
      migrateArea(file, data, body);
    } catch (err) {
      errors.push(`Error migrating area ${file.relativePath}: ${(err as Error).message}`);
      getStat('area').errors++;
    }
  }
  console.log(`  Areas: ${getStat('area').created} created, ${getStat('area').skipped} skipped, ${getStat('area').errors} errors`);

  const projectFiles = categorized['project'] || [];
  for (const { file, data, body } of projectFiles) {
    try {
      migrateProject(file, data, body);
    } catch (err) {
      errors.push(`Error migrating project ${file.relativePath}: ${(err as Error).message}`);
      getStat('project').errors++;
    }
  }
  console.log(`  Projects: ${getStat('project').created} created, ${getStat('project').skipped} skipped, ${getStat('project').errors} errors`);
  console.log('');

  // Phase 2: Tasks -> todos/
  console.log('Phase 2: Tasks -> todos/');
  const taskFiles = categorized['task'] || [];
  for (const { file, data, body } of taskFiles) {
    try {
      // Decide: if it's an archived phd-task, route to reference instead
      if (file.relativePath.startsWith('4-archive/phd-tasks/')) {
        migrateArchivePhdTask(file, data, body);
      } else {
        migrateTask(file, data, body);
      }
    } catch (err) {
      errors.push(`Error migrating task ${file.relativePath}: ${(err as Error).message}`);
      getStat('task').errors++;
    }
  }
  console.log(`  Tasks: ${getStat('task').created} created, ${getStat('task').skipped} skipped, ${getStat('task').errors} errors`);
  if (getStat('archive-phd-task').created > 0 || getStat('archive-phd-task').skipped > 0) {
    console.log(`  Archive PHD tasks -> reference: ${getStat('archive-phd-task').created} created, ${getStat('archive-phd-task').skipped} skipped, ${getStat('archive-phd-task').errors} errors`);
  }
  console.log('');

  // Phase 3: Context migration
  console.log('Phase 3: Context migration');

  // Contacts -> context/people/
  console.log('  - Contacts -> context/people/');
  const contactFiles = categorized['contact'] || [];
  for (const { file, data, body } of contactFiles) {
    try {
      migrateContact(file, data, body);
    } catch (err) {
      errors.push(`Error migrating contact ${file.relativePath}: ${(err as Error).message}`);
      getStat('contact').errors++;
    }
  }
  console.log(`    ${getStat('contact').created} created, ${getStat('contact').skipped} skipped, ${getStat('contact').errors} errors`);

  // Emails -> context/email/
  console.log('  - Emails -> context/email/');
  const emailFiles = categorized['email'] || [];
  for (const { file, data, body } of emailFiles) {
    try {
      migrateEmail(file, data, body);
    } catch (err) {
      errors.push(`Error migrating email ${file.relativePath}: ${(err as Error).message}`);
      getStat('email').errors++;
    }
  }
  console.log(`    ${getStat('email').created} created, ${getStat('email').skipped} skipped, ${getStat('email').errors} errors`);

  // Trades -> context/trading/
  console.log('  - Trades -> context/trading/');
  const tradeFiles = categorized['trade'] || [];
  for (const { file, data, body } of tradeFiles) {
    try {
      migrateTrade(file, data, body);
    } catch (err) {
      errors.push(`Error migrating trade ${file.relativePath}: ${(err as Error).message}`);
      getStat('trade').errors++;
    }
  }
  console.log(`    ${getStat('trade').created} created, ${getStat('trade').skipped} skipped, ${getStat('trade').errors} errors`);

  // Diary -> context/trading/diary-{slug}.md
  console.log('  - Diary -> context/trading/diary-{slug}.md');
  const diaryFiles = categorized['diary'] || [];
  for (const { file, data, body } of diaryFiles) {
    try {
      migrateDiary(file, data, body);
    } catch (err) {
      errors.push(`Error migrating diary ${file.relativePath}: ${(err as Error).message}`);
      getStat('diary').errors++;
    }
  }
  console.log(`    ${getStat('diary').created} created, ${getStat('diary').skipped} skipped, ${getStat('diary').errors} errors`);

  // References -> context/reference/
  console.log('  - References -> context/reference/');
  const referenceFiles = categorized['reference'] || [];
  for (const { file, data, body } of referenceFiles) {
    try {
      migrateReference(file, data, body);
    } catch (err) {
      errors.push(`Error migrating reference ${file.relativePath}: ${(err as Error).message}`);
      getStat('reference').errors++;
    }
  }
  console.log(`    ${getStat('reference').created} created, ${getStat('reference').skipped} skipped, ${getStat('reference').errors} errors`);

  // Archive PHD tasks that had type=task already handled above
  // Handle any archive-phd-task items that were categorized separately (no type field)
  const archivePhdFiles = categorized['archive-phd-task'] || [];
  for (const { file, data, body } of archivePhdFiles) {
    try {
      migrateArchivePhdTask(file, data, body);
    } catch (err) {
      errors.push(`Error migrating archive phd task ${file.relativePath}: ${(err as Error).message}`);
      getStat('archive-phd-task').errors++;
    }
  }
  console.log('');

  // Phase 4: Daily journals -> history/
  console.log('Phase 4: Daily journals -> history/');
  const dailyFiles = categorized['daily'] || [];
  for (const { file, data, body } of dailyFiles) {
    try {
      migrateDaily(file, data, body);
    } catch (err) {
      errors.push(`Error migrating daily ${file.relativePath}: ${(err as Error).message}`);
      getStat('daily').errors++;
    }
  }
  console.log(`  ${getStat('daily').created} created, ${getStat('daily').skipped} skipped, ${getStat('daily').errors} errors`);
  console.log('');

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------

  console.log(separator);
  console.log('  Migration Report');
  console.log(separator);

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const typeOrder = ['area', 'project', 'task', 'archive-phd-task', 'contact', 'email', 'trade', 'diary', 'reference', 'daily'];
  for (const type of typeOrder) {
    const s = stats[type];
    if (!s) continue;
    console.log(`  ${type}: ${s.created} created, ${s.skipped} skipped, ${s.errors} errors`);
    totalCreated += s.created;
    totalSkipped += s.skipped;
    totalErrors += s.errors;
  }

  // Report any unexpected types
  for (const [type, s] of Object.entries(stats)) {
    if (typeOrder.includes(type) || type === 'parse-error') continue;
    console.log(`  ${type}: ${s.created} created, ${s.skipped} skipped, ${s.errors} errors`);
    totalCreated += s.created;
    totalSkipped += s.skipped;
    totalErrors += s.errors;
  }

  if (stats['parse-error']) {
    totalErrors += stats['parse-error'].errors;
  }

  console.log('');
  console.log(`  Total: ${totalCreated + totalSkipped + totalErrors} entries processed`);
  console.log(`         ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors`);

  if (warnings.length > 0) {
    console.log('');
    console.log('  Warnings:');
    for (const w of warnings) {
      console.log(`    - ${w}`);
    }
  }

  if (errors.length > 0) {
    console.log('');
    console.log('  Errors:');
    for (const e of errors) {
      console.log(`    - ${e}`);
    }
  }

  console.log('');
  if (DRY_RUN) {
    console.log('  *** DRY RUN -- no files were written ***');
    console.log('  Run with --execute to perform the migration');
  } else {
    console.log('  Migration complete.');
  }
  console.log('');
}

main();
