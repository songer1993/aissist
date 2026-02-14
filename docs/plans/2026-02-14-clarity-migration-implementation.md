# Clarity → Aissist Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend aissist's context system to support entity files, add a `kind` field to goals, write a migration script to move all ~/clarity data, and enhance the plugin with new hooks and slash commands.

**Architecture:** Extend `context/` to accept named entity files (`{slug}.md`) alongside date-based files. Add `kind` and `status` fields to goals for area/project distinction. Build a TypeScript migration script. Enhance the Claude Code plugin with auto-categorization and DESCRIPTION.md self-evolution.

**Tech Stack:** TypeScript, Commander.js, js-yaml, Vitest, gray-matter (new dep for migration), Claude Code plugin API

---

### Task 1: Extend GoalEntry interface with `kind` and `status` fields

**Files:**
- Modify: `src/utils/storage.ts:388-396` (GoalEntry interface)
- Modify: `src/utils/storage.ts:506-526` (serializeGoalEntryYaml)
- Modify: `src/utils/storage.ts:471-501` (parseGoalEntryYaml)
- Test: `src/utils/goal.test.ts`

**Step 1: Write the failing test**

Add to `src/utils/goal.test.ts`:

```typescript
it('should serialize goal with kind and status fields', () => {
  const goal: GoalEntry = {
    timestamp: '10:00',
    codename: 'phd-academia',
    text: 'PhD & Academia',
    description: 'Research, thesis, supervision, conferences',
    deadline: null,
    parent_goal: null,
    kind: 'area',
    status: 'active',
    rawEntry: '',
  };

  const serialized = serializeGoalEntryYaml(goal);

  expect(serialized).toContain('kind: area');
  expect(serialized).toContain('status: active');
  expect(serialized).toContain('codename: phd-academia');
});

it('should parse goal with kind and status fields', () => {
  const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:00"
codename: phd-academia
kind: area
status: active
---

PhD & Academia`;

  const parsed = parseGoalEntryYaml(yamlEntry);

  expect(parsed).not.toBeNull();
  expect(parsed!.kind).toBe('area');
  expect(parsed!.status).toBe('active');
  expect(parsed!.codename).toBe('phd-academia');
});

it('should default kind to null and status to null when not present', () => {
  const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
codename: test-goal
---

A regular goal without kind or status`;

  const parsed = parseGoalEntryYaml(yamlEntry);

  expect(parsed).not.toBeNull();
  expect(parsed!.kind).toBeNull();
  expect(parsed!.status).toBeNull();
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Development/aissist && npx vitest run src/utils/goal.test.ts`
Expected: FAIL — `kind` and `status` don't exist on `GoalEntry`

**Step 3: Write minimal implementation**

In `src/utils/storage.ts`, update the `GoalEntry` interface (line 388):

```typescript
export interface GoalEntry {
  timestamp: string;
  codename: string | null;
  text: string;
  description: string | null;
  deadline: string | null;
  parent_goal: string | null;
  kind: string | null;      // 'area' | 'project' | null (regular goal)
  status: string | null;    // 'active' | 'completed' | 'paused' | null
  rawEntry: string;
}
```

Update `parseGoalEntryYaml` (around line 471) to extract `kind` and `status`:

```typescript
// After extracting parent_goal, add:
const kind = (metadata.kind as string) || null;
const status = (metadata.status as string) || null;

// In the return object, add:
kind,
status,
```

Update `serializeGoalEntryYaml` (around line 506) to serialize `kind` and `status`:

```typescript
// After the parent_goal block, add:
if (goal.kind) {
  metadata.kind = goal.kind;
}
if (goal.status) {
  metadata.status = goal.status;
}
```

Update `parseGoalEntry` (inline format parser) to include `kind: null, status: null` in its return.

Update all other places that construct `GoalEntry` objects (search for `rawEntry:` in storage.ts) to include `kind: null, status: null`.

**Step 4: Run test to verify it passes**

Run: `cd ~/Development/aissist && npx vitest run src/utils/goal.test.ts`
Expected: PASS

**Step 5: Run full test suite to check for regressions**

Run: `cd ~/Development/aissist && npx vitest run`
Expected: All tests PASS (existing goals without kind/status default to null)

**Step 6: Commit**

```bash
cd ~/Development/aissist
git add src/utils/storage.ts src/utils/goal.test.ts
git commit -m "feat: add kind and status fields to GoalEntry for area/project support"
```

---

### Task 2: Extend context system to support entity files (named files)

**Files:**
- Modify: `src/commands/context.ts:29-107` (context log command)
- Modify: `src/commands/context.ts:137-166` (context show command)
- Modify: `src/commands/context.ts:109-135` (context list command)
- Modify: `src/utils/storage.ts:1527-1636` (ContextItemEntry + serializers)
- Test: `src/utils/context.test.ts`
- Test: `src/__tests__/e2e/context.e2e.test.ts`

**Step 1: Write the failing tests**

Add to `src/utils/context.test.ts`:

```typescript
it('should serialize context entity with kind and extra metadata', () => {
  const context: ContextItemEntry = {
    timestamp: '14:30',
    source: 'Entity',
    text: 'Per Ola Kristensson is my PhD supervisor at Cambridge.',
    goal: null,
    kind: 'contact',
    metadata: { role: 'PhD Supervisor', institution: 'Cambridge', email: 'pok21@cam.ac.uk' },
    rawEntry: '',
  };

  const serialized = serializeContextItemEntryYaml(context);

  expect(serialized).toContain('kind: contact');
  expect(serialized).toContain('role: PhD Supervisor');
  expect(serialized).toContain('institution: Cambridge');
  expect(serialized).toContain('email: pok21@cam.ac.uk');
});

it('should parse context entity with kind and extra metadata', () => {
  const yamlEntry = `---
schema_version: "1.0"
kind: contact
role: PhD Supervisor
institution: Cambridge
email: pok21@cam.ac.uk
---

Per Ola Kristensson is my PhD supervisor at Cambridge.`;

  const parsed = parseContextItemEntryYaml(yamlEntry);

  expect(parsed).not.toBeNull();
  expect(parsed!.kind).toBe('contact');
  expect(parsed!.metadata).toBeDefined();
  expect(parsed!.metadata!.role).toBe('PhD Supervisor');
  expect(parsed!.text).toContain('Per Ola Kristensson');
});

it('should preserve backward compatibility - no kind defaults to null', () => {
  const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
source: Meeting
---

Regular context without kind`;

  const parsed = parseContextItemEntryYaml(yamlEntry);

  expect(parsed).not.toBeNull();
  expect(parsed!.kind).toBeNull();
  expect(parsed!.metadata).toEqual({});
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Development/aissist && npx vitest run src/utils/context.test.ts`
Expected: FAIL — `kind` and `metadata` don't exist on `ContextItemEntry`

**Step 3: Write minimal implementation**

Update `ContextItemEntry` interface in `src/utils/storage.ts:1527`:

```typescript
export interface ContextItemEntry {
  timestamp: string;
  source: string;
  text: string;
  goal: string | null;
  kind: string | null;                           // NEW: 'contact', 'email', 'trade', etc.
  metadata: Record<string, unknown>;             // NEW: extra type-specific fields
  rawEntry: string;
}
```

Update `serializeContextItemEntryYaml` in `src/utils/storage.ts:1624`:

```typescript
export function serializeContextItemEntryYaml(context: ContextItemEntry): string {
  const metadata: Record<string, unknown> = {
    schema_version: '1.0',
  };

  // For entity files, timestamp is optional (they have kind instead)
  if (context.timestamp) {
    metadata.timestamp = context.timestamp;
  }

  // Source is only for date-based entries
  if (context.source && context.source !== 'Entity') {
    metadata.source = context.source;
  }

  if (context.kind) {
    metadata.kind = context.kind;
  }

  if (context.goal) {
    metadata.goal = context.goal;
  }

  // Spread extra metadata fields (role, institution, coin, etc.)
  if (context.metadata) {
    for (const [key, value] of Object.entries(context.metadata)) {
      if (value !== null && value !== undefined) {
        metadata[key] = value;
      }
    }
  }

  return serializeYamlFrontMatter(metadata, context.text);
}
```

Update `parseContextItemEntryYaml` in `src/utils/storage.ts:1593`:

```typescript
export function parseContextItemEntryYaml(entry: string): ContextItemEntry | null {
  const parsed = parseYamlFrontMatter(entry);
  if (!parsed) return null;

  const [meta, body] = parsed;

  normalizeSchemaVersion(meta.schema_version as string | undefined);

  const timestamp = (meta.timestamp as string) || '';
  const source = (meta.source as string) || 'Text';
  const goal = (meta.goal as string) || null;
  const kind = (meta.kind as string) || null;

  // Collect extra metadata (everything except known fields)
  const knownFields = new Set(['schema_version', 'timestamp', 'source', 'goal', 'kind']);
  const extraMetadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!knownFields.has(key)) {
      extraMetadata[key] = value;
    }
  }

  return {
    timestamp,
    source,
    text: body.trim(),
    goal,
    kind,
    metadata: extraMetadata,
    rawEntry: entry,
  };
}
```

Update `parseContextItemEntry` (inline format) to include `kind: null, metadata: {}`.

Update all other places constructing `ContextItemEntry` objects to include `kind: null, metadata: {}`.

**Step 4: Run test to verify it passes**

Run: `cd ~/Development/aissist && npx vitest run src/utils/context.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `cd ~/Development/aissist && npx vitest run`
Expected: All tests PASS

**Step 6: Commit**

```bash
cd ~/Development/aissist
git add src/utils/storage.ts src/utils/context.test.ts
git commit -m "feat: add kind and metadata fields to ContextItemEntry for entity support"
```

---

### Task 3: Add `context show` support for entity files (non-date files)

**Files:**
- Modify: `src/commands/context.ts:137-166` (context show)
- Modify: `src/commands/context.ts:109-135` (context list)
- Test: `src/__tests__/e2e/context.e2e.test.ts`

**Step 1: Write the failing E2E test**

Add to `src/__tests__/e2e/context.e2e.test.ts`:

```typescript
it('should show entity files in context listing', async () => {
  // Manually create an entity file (not date-based)
  const entityDir = harness.getStoragePath() + '/context/people';
  const fs = await import('fs');
  fs.mkdirSync(entityDir, { recursive: true });
  fs.writeFileSync(entityDir + '/per-ola.md', `---
schema_version: "1.0"
kind: contact
role: PhD Supervisor
---

Per Ola Kristensson`);

  // List contexts should show 'people'
  const listResult = await harness.run(['context', 'list']);
  harness.expectSuccess(listResult);
  expect(listResult.stdout).toContain('people');

  // Show context should list entity files
  const showResult = await harness.run(['context', 'show', 'people']);
  harness.expectSuccess(showResult);
  expect(showResult.stdout).toContain('per-ola');
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Development/aissist && npx vitest run src/__tests__/e2e/context.e2e.test.ts`
Expected: FAIL — `context show people` only looks for date-based files

**Step 3: Modify context show command**

In `src/commands/context.ts`, update the `show` subcommand to handle both patterns:

```typescript
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

      if (options.entity) {
        // Show specific entity file
        const filePath = join(contextPath, `${options.entity}.md`);
        const content = await readMarkdown(filePath);
        if (!content) {
          info(`No entity "${options.entity}" found in context "${context}"`);
          return;
        }
        console.log(`\nContext "${context}" entity "${options.entity}":\n`);
        console.log(content);
        return;
      }

      if (options.date) {
        // Show date-based entries (existing behavior)
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

      // Default: list all files in context (both entity and date-based)
      try {
        const files = await readdir(contextPath);
        const mdFiles = files.filter(f => f.endsWith('.md'));

        if (mdFiles.length === 0) {
          info(`No entries found for context "${context}"`);
          return;
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}\.md$/;
        const dateFiles = mdFiles.filter(f => datePattern.test(f));
        const entityFiles = mdFiles.filter(f => !datePattern.test(f));

        console.log(`\nContext "${context}":\n`);

        if (entityFiles.length > 0) {
          console.log('  Entities:');
          entityFiles.forEach(f => console.log(`    • ${f.replace('.md', '')}`));
        }

        if (dateFiles.length > 0) {
          console.log('  Date entries:');
          dateFiles.forEach(f => console.log(`    • ${f.replace('.md', '')}`));
        }
      } catch {
        info(`No entries found for context "${context}"`);
      }
    } catch (err) {
      error(`Failed to show context: ${(err as Error).message}`);
      throw err;
    }
  });
```

**Step 4: Run test to verify it passes**

Run: `cd ~/Development/aissist && npx vitest run src/__tests__/e2e/context.e2e.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `cd ~/Development/aissist && npx vitest run`
Expected: All tests PASS

**Step 6: Commit**

```bash
cd ~/Development/aissist
git add src/commands/context.ts src/__tests__/e2e/context.e2e.test.ts
git commit -m "feat: context show supports entity files alongside date-based entries"
```

---

### Task 4: Add `context query` command for filtering by kind/fields

**Files:**
- Modify: `src/commands/context.ts` (add `query` subcommand)
- Test: `src/__tests__/e2e/context.e2e.test.ts`

**Step 1: Write the failing E2E test**

Add to `src/__tests__/e2e/context.e2e.test.ts`:

```typescript
it('should query context by kind', async () => {
  // Create entity files
  const peopleDir = harness.getStoragePath() + '/context/people';
  const emailDir = harness.getStoragePath() + '/context/email';
  const fs = await import('fs');
  fs.mkdirSync(peopleDir, { recursive: true });
  fs.mkdirSync(emailDir, { recursive: true });

  fs.writeFileSync(peopleDir + '/alice.md', `---
schema_version: "1.0"
kind: contact
role: Engineer
---

Alice Smith`);

  fs.writeFileSync(emailDir + '/from-alice-update.md', `---
schema_version: "1.0"
kind: email
direction: from
correspondent: alice
project: my-project
---

Hi, here's an update.`);

  // Query by kind
  const result = await harness.run(['context', 'query', '--kind', 'contact']);
  harness.expectSuccess(result);
  expect(result.stdout).toContain('alice');
});
```

**Step 2: Run test to verify it fails**

Run: `cd ~/Development/aissist && npx vitest run src/__tests__/e2e/context.e2e.test.ts`
Expected: FAIL — no `query` subcommand

**Step 3: Add context query subcommand**

Add to `src/commands/context.ts`:

```typescript
contextCommand
  .command('query')
  .description('Query context entries by kind or field values')
  .option('-k, --kind <kind>', 'Filter by kind (e.g., contact, email, trade)')
  .option('-f, --field <field>', 'Filter by field value (format: key=value)')
  .option('-c, --context <name>', 'Limit to specific context subcategory')
  .action(async (options: { kind?: string; field?: string; context?: string }) => {
    try {
      const storagePath = await getStoragePath();
      const contextRoot = join(storagePath, 'context');

      let searchDirs: string[] = [];
      if (options.context) {
        searchDirs = [join(contextRoot, options.context)];
      } else {
        try {
          const dirs = await readdir(contextRoot, { withFileTypes: true });
          searchDirs = dirs.filter(d => d.isDirectory()).map(d => join(contextRoot, d.name));
        } catch {
          info('No context entries found.');
          return;
        }
      }

      const results: { category: string; file: string; kind: string; preview: string }[] = [];

      for (const dir of searchDirs) {
        const category = dir.split('/').pop()!;
        let files: string[];
        try {
          files = (await readdir(dir)).filter(f => f.endsWith('.md'));
        } catch {
          continue;
        }

        for (const file of files) {
          const content = await readMarkdown(join(dir, file));
          if (!content) continue;

          // Quick frontmatter check without full parsing
          if (options.kind && !content.includes(`kind: ${options.kind}`)) continue;
          if (options.field) {
            const [key, value] = options.field.split('=');
            if (!content.includes(`${key}: ${value}`)) continue;
          }

          const nameSlug = file.replace('.md', '');
          const kindMatch = content.match(/kind:\s*(.+)/);
          const kindStr = kindMatch ? kindMatch[1].trim() : '-';
          const bodyStart = content.indexOf('---', 4);
          const preview = bodyStart > -1
            ? content.slice(bodyStart + 3).trim().split('\n')[0].slice(0, 60)
            : nameSlug;

          results.push({ category, file: nameSlug, kind: kindStr, preview });
        }
      }

      if (results.length === 0) {
        info('No matching entries found.');
        return;
      }

      console.log(`\nFound ${results.length} matching entries:\n`);
      for (const r of results) {
        console.log(`  ${r.category}/${r.file} [${r.kind}] — ${r.preview}`);
      }
    } catch (err) {
      error(`Failed to query context: ${(err as Error).message}`);
      throw err;
    }
  });
```

**Step 4: Run test to verify it passes**

Run: `cd ~/Development/aissist && npx vitest run src/__tests__/e2e/context.e2e.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `cd ~/Development/aissist && npx vitest run`
Expected: All tests PASS

**Step 6: Commit**

```bash
cd ~/Development/aissist
git add src/commands/context.ts src/__tests__/e2e/context.e2e.test.ts
git commit -m "feat: add context query command for filtering by kind and field values"
```

---

### Task 5: Write the migration script

**Files:**
- Create: `scripts/migrate-clarity.ts`
- Create: `scripts/tsconfig.json` (for scripts compilation)
- Modify: `package.json` (add `gray-matter` dependency, add `migrate` script)

**Step 1: Install gray-matter dependency**

Run: `cd ~/Development/aissist && npm install gray-matter --save-dev`

**Step 2: Create migration script**

Create `scripts/migrate-clarity.ts`:

```typescript
#!/usr/bin/env npx tsx

/**
 * Migration script: ~/clarity (Obsidian PARA vault) → ~/.aissist
 *
 * Reads all markdown files from the Obsidian vault, transforms frontmatter
 * to aissist format, and writes to the aissist storage directory.
 *
 * Usage:
 *   npx tsx scripts/migrate-clarity.ts                    # Dry run
 *   npx tsx scripts/migrate-clarity.ts --execute          # Execute migration
 *   npx tsx scripts/migrate-clarity.ts --execute --force  # Overwrite existing
 *
 * Source is NEVER modified. Idempotent (skips existing files unless --force).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';
import { homedir } from 'os';
import matter from 'gray-matter';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CLARITY_PATH = join(homedir(), 'clarity');
const AISSIST_PATH = join(homedir(), '.aissist');
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--execute');
const FORCE = args.includes('--force');

interface MigrationResult {
  source: string;
  destination: string;
  type: string;
  status: 'created' | 'skipped' | 'overwritten' | 'error';
  warning?: string;
}

const results: MigrationResult[] = [];

// ============================================================================
// HELPERS
// ============================================================================

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveWikiLinks(text: string): string {
  // Convert [[Note Name]] to codename references
  return text.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, (_, name) => {
    return slugify(name);
  });
}

function readAllMdFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...readAllMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function writeOutput(destPath: string, content: string, source: string, type: string): void {
  if (existsSync(destPath) && !FORCE) {
    results.push({ source, destination: destPath, type, status: 'skipped' });
    return;
  }

  if (DRY_RUN) {
    results.push({ source, destination: destPath, type, status: 'created' });
    return;
  }

  mkdirSync(join(destPath, '..'), { recursive: true });
  writeFileSync(destPath, content, 'utf-8');
  results.push({
    source,
    destination: destPath,
    type,
    status: existsSync(destPath) ? 'overwritten' : 'created',
  });
}

function serializeYaml(metadata: Record<string, unknown>, body: string): string {
  const yaml = Object.entries(metadata)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      if (typeof v === 'string') return `${k}: "${v}"`;
      if (typeof v === 'number') return `${k}: ${v}`;
      if (typeof v === 'boolean') return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  return `---\n${yaml}\n---\n\n${body}`;
}

function quartEndDate(timeframe: string): string | null {
  // Convert "2026-Q1" → "2026-03-31"
  const match = timeframe?.match(/(\d{4})-Q(\d)/);
  if (!match) return null;
  const [_, year, q] = match;
  const monthEnd = { '1': '03-31', '2': '06-30', '3': '09-30', '4': '12-31' };
  return `${year}-${monthEnd[q as keyof typeof monthEnd] || '12-31'}`;
}

// ============================================================================
// MIGRATORS
// ============================================================================

function migrateAreas(files: string[]): void {
  const areaFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'area';
  });

  for (const file of areaFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));
    const created = data.created || '2026-01-01';

    const goalMeta: Record<string, unknown> = {
      schema_version: '1.0',
      timestamp: '10:00',
      codename: slug,
      kind: 'area',
      status: 'active',
    };

    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'goals', `${created}.md`);

    // Append to existing date file or create new
    const entry = serializeYaml(goalMeta, body);
    if (DRY_RUN) {
      results.push({ source: file, destination: destPath, type: 'area', status: 'created' });
    } else {
      mkdirSync(join(destPath, '..'), { recursive: true });
      if (existsSync(destPath) && !FORCE) {
        // Append to existing file
        const existing = readFileSync(destPath, 'utf-8');
        writeFileSync(destPath, existing + '\n\n' + entry, 'utf-8');
      } else {
        writeFileSync(destPath, entry, 'utf-8');
      }
      results.push({ source: file, destination: destPath, type: 'area', status: 'created' });
    }
  }
}

function migrateProjects(files: string[]): void {
  const projectFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'project';
  });

  for (const file of projectFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));
    const created = data.created || '2026-01-01';

    const goalMeta: Record<string, unknown> = {
      schema_version: '1.0',
      timestamp: '14:00',
      codename: slug,
      kind: 'project',
      status: data.status === 'completed' ? 'completed' : 'active',
    };

    if (data.area) {
      goalMeta.parent_goal = slugify(data.area.replace(/\[\[|\]\]/g, ''));
    }
    if (data.timeframe) {
      goalMeta.deadline = quartEndDate(data.timeframe);
    }

    const body = resolveWikiLinks(content.trim());
    const isFinished = data.status === 'completed';
    const destDir = isFinished ? join('goals', 'finished') : 'goals';
    const destPath = join(AISSIST_PATH, destDir, `${created}.md`);

    const entry = serializeYaml(goalMeta, body);
    if (DRY_RUN) {
      results.push({ source: file, destination: destPath, type: 'project', status: 'created' });
    } else {
      mkdirSync(join(destPath, '..'), { recursive: true });
      if (existsSync(destPath)) {
        const existing = readFileSync(destPath, 'utf-8');
        writeFileSync(destPath, existing + '\n\n' + entry, 'utf-8');
      } else {
        writeFileSync(destPath, entry, 'utf-8');
      }
      results.push({ source: file, destination: destPath, type: 'project', status: 'created' });
    }
  }
}

function migrateTasks(files: string[]): void {
  const taskFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'task';
  });

  // Group tasks by created date
  const byDate = new Map<string, { file: string; data: Record<string, unknown>; content: string }[]>();

  for (const file of taskFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const created = (data.created as string) || '2026-01-01';
    if (!byDate.has(created)) byDate.set(created, []);
    byDate.get(created)!.push({ file, data, content });
  }

  for (const [date, tasks] of byDate) {
    for (const task of tasks) {
      const { data, content, file } = task;
      const isDone = data.status === 'done';
      const checkbox = isDone ? '[x]' : '[ ]';
      const title = basename(file, '.md').replace(/-/g, ' ');

      // Build inline tags
      const tags: string[] = [];
      if (data.priority) tags.push(`#${data.priority}`);
      if (data.effort) tags.push(`#${data.effort}`);
      const dueStr = data.due ? ` due::${data.due}` : '';
      const tagStr = tags.length > 0 ? ' ' + tags.join(' ') : '';

      const goalCodename = data.project
        ? slugify((data.project as string).replace(/\[\[|\]\]/g, ''))
        : null;

      const todoMeta: Record<string, unknown> = {
        schema_version: '1.0',
        timestamp: '12:00',
        completed: isDone,
      };
      if (goalCodename) todoMeta.goal = goalCodename;

      const bodyText = `- ${checkbox} ${title}${tagStr}${dueStr}`;
      const fullBody = content.trim()
        ? bodyText + '\n\n' + resolveWikiLinks(content.trim())
        : bodyText;

      const entry = serializeYaml(todoMeta, fullBody);
      const destPath = join(AISSIST_PATH, 'todos', `${date}.md`);

      if (DRY_RUN) {
        results.push({ source: file, destination: destPath, type: 'task', status: 'created' });
      } else {
        mkdirSync(join(destPath, '..'), { recursive: true });
        if (existsSync(destPath)) {
          const existing = readFileSync(destPath, 'utf-8');
          writeFileSync(destPath, existing + '\n\n' + entry, 'utf-8');
        } else {
          writeFileSync(destPath, entry, 'utf-8');
        }
        results.push({ source: file, destination: destPath, type: 'task', status: 'created' });
      }
    }
  }
}

function migrateContacts(files: string[]): void {
  const contactFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'contact';
  });

  for (const file of contactFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));

    const meta: Record<string, unknown> = {
      schema_version: '1.0',
      kind: 'contact',
    };
    if (data.role) meta.role = data.role;
    if (data.institution) meta.institution = data.institution;
    if (data.email) meta.email = data.email;

    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'context', 'people', `${slug}.md`);
    writeOutput(destPath, serializeYaml(meta, body), file, 'contact');
  }
}

function migrateEmails(files: string[]): void {
  const emailFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'email';
  });

  for (const file of emailFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));

    const meta: Record<string, unknown> = {
      schema_version: '1.0',
      kind: 'email',
    };
    if (data.direction) meta.direction = data.direction;
    if (data.correspondent) {
      meta.correspondent = slugify((data.correspondent as string).replace(/\[\[|\]\]/g, ''));
    }
    if (data.date) meta.date = data.date;
    if (data.project) {
      meta.project = slugify((data.project as string).replace(/\[\[|\]\]/g, ''));
    }
    if (data.previous) {
      meta.thread = slugify((data.previous as string).replace(/\[\[|\]\]/g, ''));
    }

    // FULL ORIGINAL EMAIL BODY — no summarization
    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'context', 'email', `${slug}.md`);
    writeOutput(destPath, serializeYaml(meta, body), file, 'email');
  }
}

function migrateTrades(files: string[]): void {
  const tradeFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'trade';
  });

  for (const file of tradeFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));

    const meta: Record<string, unknown> = {
      schema_version: '1.0',
      kind: 'trade',
    };
    // Preserve ALL numeric and string fields exactly
    const tradeFields = ['status', 'result', 'coin', 'side', 'size', 'entry', 'exit',
      'pnl', 'duration', 'account', 'date-open', 'date-close'];
    for (const field of tradeFields) {
      if (data[field] !== undefined && data[field] !== null) {
        // Convert kebab-case to snake_case for aissist
        const key = field.replace(/-/g, '_');
        meta[key] = data[field];
      }
    }
    if (data.project) {
      meta.project = slugify((data.project as string).replace(/\[\[|\]\]/g, ''));
    }

    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'context', 'trading', `${slug}.md`);
    writeOutput(destPath, serializeYaml(meta, body), file, 'trade');
  }
}

function migrateTradingDiary(files: string[]): void {
  const diaryFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'diary';
  });

  for (const file of diaryFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));

    const meta: Record<string, unknown> = {
      schema_version: '1.0',
      kind: 'diary',
    };
    if (data.date) meta.date = data.date;
    if (data.project) {
      meta.project = slugify((data.project as string).replace(/\[\[|\]\]/g, ''));
    }

    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'context', 'trading', `diary-${slug}.md`);
    writeOutput(destPath, serializeYaml(meta, body), file, 'diary');
  }
}

function migrateReferences(files: string[]): void {
  const refFiles = files.filter(f => {
    const parsed = matter(readFileSync(f, 'utf-8'));
    return parsed.data.type === 'reference';
  });

  for (const file of refFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));

    const meta: Record<string, unknown> = {
      schema_version: '1.0',
      kind: 'reference',
    };
    if (data.category) meta.category = data.category;
    if (data.link) meta.link = data.link;
    if (data.project) {
      meta.project = slugify((data.project as string).replace(/\[\[|\]\]/g, ''));
    }

    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'context', 'reference', `${slug}.md`);
    writeOutput(destPath, serializeYaml(meta, body), file, 'reference');
  }
}

function migrateArchivedPhdTasks(files: string[]): void {
  // Files in 4-archive/phd-tasks/ — treat as reference knowledge
  const phdFiles = files.filter(f => f.includes('4-archive/phd-tasks/'));

  for (const file of phdFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const slug = slugify(basename(file, '.md'));

    const meta: Record<string, unknown> = {
      schema_version: '1.0',
      kind: 'reference',
      category: 'phd-corrections',
      project: 'phd-thesis-corrections',
    };

    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'context', 'reference', `${slug}.md`);
    writeOutput(destPath, serializeYaml(meta, body), file, 'phd-archive');
  }
}

function migrateDailyNotes(files: string[]): void {
  const dailyFiles = files.filter(f => f.includes('journals/daily/'));

  for (const file of dailyFiles) {
    const raw = readFileSync(file, 'utf-8');
    const { content } = matter(raw);
    const dateSlug = basename(file, '.md'); // YYYY-MM-DD

    if (!content.trim()) continue;

    // Write full content as history entry
    const meta: Record<string, unknown> = {
      schema_version: '1.0',
      timestamp: '12:00',
    };

    const body = resolveWikiLinks(content.trim());
    const destPath = join(AISSIST_PATH, 'history', `${dateSlug}.md`);
    writeOutput(destPath, serializeYaml(meta, body), file, 'daily');
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Clarity → Aissist Migration`);
  console.log(`  Source: ${CLARITY_PATH}`);
  console.log(`  Destination: ${AISSIST_PATH}`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'EXECUTE'}`);
  console.log(`${'='.repeat(60)}\n`);

  if (!existsSync(CLARITY_PATH)) {
    console.error(`ERROR: Source vault not found at ${CLARITY_PATH}`);
    process.exit(1);
  }

  // Ensure aissist storage exists
  if (!DRY_RUN) {
    mkdirSync(join(AISSIST_PATH, 'goals'), { recursive: true });
    mkdirSync(join(AISSIST_PATH, 'goals', 'finished'), { recursive: true });
    mkdirSync(join(AISSIST_PATH, 'history'), { recursive: true });
    mkdirSync(join(AISSIST_PATH, 'todos'), { recursive: true });
    mkdirSync(join(AISSIST_PATH, 'reflections'), { recursive: true });
    mkdirSync(join(AISSIST_PATH, 'context'), { recursive: true });
  }

  // Read all markdown files from source
  const allFiles = readAllMdFiles(CLARITY_PATH)
    .filter(f => !f.includes('.obsidian/'))
    .filter(f => !f.includes('templates/'))
    .filter(f => !f.includes('bases/'))
    .filter(f => !f.includes('Dashboard.md'));

  console.log(`Found ${allFiles.length} source files\n`);

  // Phase 1: Goals
  console.log('Phase 1: Areas & Projects → goals/');
  migrateAreas(allFiles);
  migrateProjects(allFiles);

  // Phase 2: Tasks
  console.log('Phase 2: Tasks → todos/');
  migrateTasks(allFiles);

  // Phase 3: Context
  console.log('Phase 3: Context migration');
  console.log('  - Contacts → context/people/');
  migrateContacts(allFiles);
  console.log('  - Emails → context/email/');
  migrateEmails(allFiles);
  console.log('  - Trades → context/trading/');
  migrateTrades(allFiles);
  console.log('  - Trading diary → context/trading/');
  migrateTradingDiary(allFiles);
  console.log('  - References → context/reference/');
  migrateReferences(allFiles);
  console.log('  - PhD archive → context/reference/');
  migrateArchivedPhdTasks(allFiles);

  // Phase 4: Daily notes
  console.log('Phase 4: Daily notes → history/');
  migrateDailyNotes(allFiles);

  // Report
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Migration Report');
  console.log(`${'='.repeat(60)}\n`);

  const byType = new Map<string, MigrationResult[]>();
  for (const r of results) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type)!.push(r);
  }

  for (const [type, items] of byType) {
    const created = items.filter(i => i.status === 'created').length;
    const skipped = items.filter(i => i.status === 'skipped').length;
    const errors = items.filter(i => i.status === 'error').length;
    console.log(`  ${type}: ${created} created, ${skipped} skipped, ${errors} errors`);
  }

  console.log(`\n  Total: ${results.length} entries processed`);

  if (DRY_RUN) {
    console.log('\n  *** DRY RUN — no files were written ***');
    console.log('  Run with --execute to perform the migration\n');
  }

  // Write report
  const reportPath = DRY_RUN
    ? join(CLARITY_PATH, 'migration-report-dryrun.json')
    : join(AISSIST_PATH, 'migration-report.json');

  if (!DRY_RUN) {
    writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`  Report saved to: ${reportPath}\n`);
  }
}

main();
```

**Step 3: Add npm script**

Add to `package.json` scripts section:
```json
"migrate:clarity": "npx tsx scripts/migrate-clarity.ts"
```

**Step 4: Test dry run**

Run: `cd ~/Development/aissist && npx tsx scripts/migrate-clarity.ts`
Expected: Report showing all files that would be created, no files actually written

**Step 5: Commit**

```bash
cd ~/Development/aissist
git add scripts/migrate-clarity.ts package.json package-lock.json
git commit -m "feat: add Clarity vault migration script (dry-run by default)"
```

---

### Task 6: Write DESCRIPTION.md for the migrated data

**Files:**
- Create: (written to `~/.aissist/DESCRIPTION.md` during migration, but template lives in repo)
- Create: `scripts/post-migrate-description.md` (template)

**Step 1: Create the DESCRIPTION.md template**

Create `scripts/post-migrate-description.md`:

```markdown
# My Personal Assistant

I'm a PhD student at Cambridge working on thesis corrections, attending IEEE VR 2026 in Korea, and trading crypto on the side.

## My Context Categories
- email: correspondence records (direction, correspondent, date, project, thread)
- people: contact directory (role, institution, email)
- trading: trade records and diary entries (kind=trade: coin, side, entry, exit, pnl, account; kind=diary: date, project)
- reference: permanent knowledge, guides, certificates, PhD correction records (category, project)
- work: general work notes and logs
```

**Step 2: Commit**

```bash
cd ~/Development/aissist
git add scripts/post-migrate-description.md
git commit -m "docs: add DESCRIPTION.md template for post-migration setup"
```

---

### Task 7: Enhance plugin — add `/aissist:context` slash command

**Files:**
- Create: `aissist-plugin/commands/context.md`

**Step 1: Create the slash command**

Create `aissist-plugin/commands/context.md`:

```markdown
---
description: Log context with auto-categorization or query existing context
argument-hint: <text or query>
allowed-tools: Bash(aissist:*), Bash(npx aissist:*), Grep, Read, Glob, Write
---

# Context Management

You help the user log and retrieve context-specific knowledge.

## Behavior

1. **Read DESCRIPTION.md** from the aissist storage path to understand available context categories and their field schemas
2. **Determine intent**: Is the user logging new context or querying existing?

### Logging New Context

If the user is sharing information (email, contact update, trade, note):

1. Identify the correct context category from DESCRIPTION.md
2. Extract structured fields from the content (direction, correspondent, coin, etc.)
3. Generate a slug for the filename (kebab-case, descriptive)
4. Write the entity file to `context/{category}/{slug}.md` with proper YAML frontmatter
5. Preserve the FULL original text verbatim in the body — never summarize
6. Run `aissist history log "Logged {kind} to context/{category}/{slug}"` to record the activity

### Querying Context

If the user is asking about existing context:

1. Use `aissist context query --kind {kind}` to find matching entries
2. Use Grep to search frontmatter fields (e.g., `correspondent: per-ola`)
3. Use Read to display full content of matching files
4. Synthesize a response from the found entries

## Category Field Reference

Read DESCRIPTION.md at the start to get the current category definitions. If a category doesn't exist yet, create the subcategory folder and suggest updating DESCRIPTION.md.

## Examples

User: "I got an email from Per Ola saying corrections look good"
→ Create `context/email/from-per-ola-corrections-approved-2026-02-14.md` with kind=email, direction=from, correspondent=per-ola-kristensson, project=phd-thesis-corrections

User: "What emails have I had about the PhD?"
→ Grep `project: phd-thesis-corrections` in `context/email/`, read and summarize results

User: "Log that I met John Dudley at IEEE VR"
→ Update `context/people/john-dudley.md` or create if new

$ARGUMENTS
```

**Step 2: Commit**

```bash
cd ~/Development/aissist
git add aissist-plugin/commands/context.md
git commit -m "feat(plugin): add /aissist:context slash command for auto-categorized context logging"
```

---

### Task 8: Enhance plugin — add category-sync hook for DESCRIPTION.md self-evolution

**Files:**
- Create: `aissist-plugin/hooks/category-sync.sh`
- Modify: `aissist-plugin/settings.json`

**Step 1: Create the hook script**

Create `aissist-plugin/hooks/category-sync.sh`:

```bash
#!/bin/bash
# category-sync.sh — Detect new context categories and suggest DESCRIPTION.md updates
# Triggered on PostToolUse(Write) to check if new context subcategories were created

# Find aissist storage
AISSIST_DIR="$HOME/.aissist"
if [ ! -d "$AISSIST_DIR" ]; then
  # Try local
  DIR="$(pwd)"
  while [ "$DIR" != "/" ]; do
    if [ -d "$DIR/.aissist" ]; then
      AISSIST_DIR="$DIR/.aissist"
      break
    fi
    DIR="$(dirname "$DIR")"
  done
fi

[ ! -d "$AISSIST_DIR" ] && exit 0

CONTEXT_DIR="$AISSIST_DIR/context"
DESCRIPTION="$AISSIST_DIR/DESCRIPTION.md"

[ ! -d "$CONTEXT_DIR" ] && exit 0
[ ! -f "$DESCRIPTION" ] && exit 0

# Get documented categories from DESCRIPTION.md
DOCUMENTED=$(grep -oP '^\s*-\s+\K\w+(?=:)' "$DESCRIPTION" 2>/dev/null || true)

# Get actual context subdirectories
ACTUAL=$(ls -d "$CONTEXT_DIR"/*/ 2>/dev/null | xargs -I{} basename {} | sort)

# Find undocumented categories
UNDOCUMENTED=""
for dir in $ACTUAL; do
  if ! echo "$DOCUMENTED" | grep -qw "$dir"; then
    UNDOCUMENTED="$UNDOCUMENTED $dir"
  fi
done

if [ -n "$UNDOCUMENTED" ]; then
  echo "New context categories detected but not in DESCRIPTION.md:$UNDOCUMENTED"
  echo "Consider updating DESCRIPTION.md to document these categories."
fi
```

**Step 2: Update settings.json**

Add to the PostToolUse array in `aissist-plugin/settings.json`:

```json
{
  "matcher": "Write",
  "hooks": [
    {
      "type": "command",
      "command": "bash $CLAUDE_PROJECT_DIR/hooks/category-sync.sh"
    }
  ]
}
```

**Step 3: Make hook executable**

Run: `chmod +x ~/Development/aissist/aissist-plugin/hooks/category-sync.sh`

**Step 4: Commit**

```bash
cd ~/Development/aissist
git add aissist-plugin/hooks/category-sync.sh aissist-plugin/settings.json
git commit -m "feat(plugin): add category-sync hook for DESCRIPTION.md self-evolution"
```

---

### Task 9: Update plugin skill docs for entity context

**Files:**
- Modify: `aissist-plugin/skills/aissist-cli/storage-model.md`
- Modify: `aissist-plugin/skills/aissist-cli/command-reference.md`

**Step 1: Update storage-model.md**

Add a section documenting entity files in context:

```markdown
## Entity Files in Context

Context subcategories support two file patterns:

- **Date-based**: `context/{category}/YYYY-MM-DD.md` — timestamped log entries (multiple per file)
- **Entity**: `context/{category}/{slug}.md` — persistent records (one per file)

### Entity Frontmatter

Entity files use `kind:` to indicate their type plus type-specific fields:

- `kind: contact` — role, institution, email
- `kind: email` — direction, correspondent, date, project, thread
- `kind: trade` — status, result, coin, side, size, entry, exit, pnl, account, date_open, date_close
- `kind: diary` — date, project
- `kind: reference` — category, project

### Querying Entities

Use `aissist context query --kind <kind>` to filter by type.
Use `aissist context show <category> --entity <slug>` to view a specific entity.
```

**Step 2: Update command-reference.md**

Add `context query` and `context show --entity` documentation.

**Step 3: Commit**

```bash
cd ~/Development/aissist
git add aissist-plugin/skills/aissist-cli/storage-model.md aissist-plugin/skills/aissist-cli/command-reference.md
git commit -m "docs(plugin): update skill docs for entity context support"
```

---

### Task 10: Run migration and verify data integrity

**Step 1: Build aissist**

Run: `cd ~/Development/aissist && npm install && npm run build`

**Step 2: Initialize aissist storage**

Run: `cd ~/Development/aissist && npx aissist init --global`

**Step 3: Dry run migration**

Run: `cd ~/Development/aissist && npx tsx scripts/migrate-clarity.ts`
Expected: Report showing ~321 entries to be created across goals, todos, and context subdirectories

**Step 4: Review dry run report**

Check: counts match source data (7 areas, 5 projects, 27 tasks, 14 contacts, 154 emails, 30 trades, 6 diary, 8 references, 48 phd-archive, 4 daily notes)

**Step 5: Execute migration**

Run: `cd ~/Development/aissist && npx tsx scripts/migrate-clarity.ts --execute`

**Step 6: Verify data integrity**

Run verification checks:
```bash
# Count files per context category
ls ~/.aissist/context/people/ | wc -l     # Expected: 14
ls ~/.aissist/context/email/ | wc -l      # Expected: 154
ls ~/.aissist/context/trading/ | wc -l    # Expected: 36 (30 trades + 6 diary)
ls ~/.aissist/context/reference/ | wc -l  # Expected: 56 (8 refs + 48 PhD)

# Verify goals
ls ~/.aissist/goals/ | wc -l             # Expected: date files containing 12 entries (7 areas + 5 projects)

# Verify todos
ls ~/.aissist/todos/ | wc -l             # Expected: date files containing 27 entries

# Spot-check a contact
cat ~/.aissist/context/people/per-ola-kristensson.md  # Should have kind: contact, role, institution

# Spot-check an email
ls ~/.aissist/context/email/ | head -5    # Should show slug-named files

# Spot-check a trade
ls ~/.aissist/context/trading/ | head -5  # Should show trade files

# Verify no data truncation — compare body lengths
wc -c ~/clarity/3-resources/emails/*.md | tail -1
wc -c ~/.aissist/context/email/*.md | tail -1
```

**Step 7: Copy DESCRIPTION.md**

Run: `cp ~/Development/aissist/scripts/post-migrate-description.md ~/.aissist/DESCRIPTION.md`

**Step 8: Commit migration report**

```bash
cd ~/Development/aissist
git add -A
git commit -m "chore: migration verified - all clarity data successfully migrated"
```

---

### Task 11: Set up GitHub remote and install plugin

**Step 1: Create GitHub repo**

Run: `cd ~/Development/aissist && gh repo create qw246/aissist --private --source=. --remote=origin --push`

(Or if you want to keep upstream as a remote:)
```bash
cd ~/Development/aissist
git remote rename origin upstream
gh repo create qw246/aissist --private --source=. --remote=origin --push
```

**Step 2: Install plugin in Claude Code**

Run: `claude plugin install --from github:qw246/aissist/aissist-plugin`

(Or for local development:)
Run: `claude plugin marketplace add ~/Development/aissist/aissist-plugin && claude plugin install aissist`

**Step 3: Verify plugin works**

Test in a new Claude Code session:
- `/aissist:recall "PhD corrections"` — should find migrated data
- `/aissist:context "show me all contacts"` — should list people
- `aissist context query --kind contact` — should list 14 contacts

**Step 4: Commit any plugin config adjustments**

```bash
cd ~/Development/aissist
git add -A && git commit -m "chore: plugin installed and verified" && git push
```
