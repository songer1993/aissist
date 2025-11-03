import { mkdir, access, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { z } from 'zod';

// Config schema
export const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  createdAt: z.string(),
  lastModified: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Find .aissist directory by searching up from current directory
 */
export async function findStoragePath(startPath: string = process.cwd()): Promise<string | null> {
  let currentPath = startPath;

  while (true) {
    const aissistPath = join(currentPath, '.aissist');
    try {
      await access(aissistPath);
      return aissistPath;
    } catch {
      // Directory doesn't exist, continue up
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) {
      // Reached root, not found
      return null;
    }
    currentPath = parentPath;
  }
}

/**
 * Get storage path with global/local fallback
 */
export async function getStoragePath(): Promise<string> {
  const localPath = await findStoragePath();
  if (localPath) {
    return localPath;
  }

  // Fallback to global storage
  return join(homedir(), '.aissist');
}

/**
 * Check if storage path is global
 */
export async function isGlobalStorage(): Promise<boolean> {
  const storagePath = await getStoragePath();
  const globalPath = join(homedir(), '.aissist');
  return storagePath === globalPath;
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Initialize storage structure
 */
export async function initializeStorage(basePath: string): Promise<void> {
  await ensureDirectory(basePath);
  await ensureDirectory(join(basePath, 'goals'));
  await ensureDirectory(join(basePath, 'goals', 'finished'));
  await ensureDirectory(join(basePath, 'history'));
  await ensureDirectory(join(basePath, 'context'));
  await ensureDirectory(join(basePath, 'reflections'));
  await ensureDirectory(join(basePath, 'slash-commands'));

  // Create default config if it doesn't exist
  const configPath = join(basePath, 'config.json');
  try {
    await access(configPath);
  } catch {
    const now = new Date().toISOString();
    const config: Config = {
      version: '1.0.0',
      createdAt: now,
      lastModified: now,
    };
    await saveConfig(basePath, config);
  }

  // Create Claude Code slash command manifest
  const slashCommandPath = join(basePath, 'slash-commands', 'aissist.json');
  try {
    await access(slashCommandPath);
  } catch {
    const slashCommand = {
      command: "aissist",
      description: "Query your personal assistant memories",
      prompt: "Use the aissist recall command to search the user's personal memories and answer their question"
    };
    await writeFile(slashCommandPath, JSON.stringify(slashCommand, null, 2));
  }
}

/**
 * Load config from storage
 */
export async function loadConfig(basePath: string): Promise<Config> {
  const configPath = join(basePath, 'config.json');
  try {
    const content = await readFile(configPath, 'utf-8');
    const data = JSON.parse(content);
    return ConfigSchema.parse(data);
  } catch (error) {
    throw new Error(`Failed to load config: ${(error as Error).message}`);
  }
}

/**
 * Save config to storage
 */
export async function saveConfig(basePath: string, config: Config): Promise<void> {
  const configPath = join(basePath, 'config.json');
  const updatedConfig = {
    ...config,
    lastModified: new Date().toISOString(),
  };
  await writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
}

/**
 * Append content to a markdown file
 */
export async function appendToMarkdown(
  filePath: string,
  content: string,
  createIfMissing: boolean = true
): Promise<void> {
  if (createIfMissing) {
    await ensureDirectory(dirname(filePath));
  }

  try {
    await access(filePath);
    // File exists, read and append
    const existing = await readFile(filePath, 'utf-8');
    const separator = existing.trim() ? '\n\n' : '';
    await writeFile(filePath, existing + separator + content);
  } catch {
    // File doesn't exist, create
    await writeFile(filePath, content);
  }
}

/**
 * Read markdown file content
 */
export async function readMarkdown(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Goal entry interface
export interface GoalEntry {
  timestamp: string;
  codename: string | null;
  text: string;
  deadline: string | null;
  rawEntry: string;
}

/**
 * Parse a goal entry from markdown format
 * Supports both new format (with codename) and legacy format (without)
 *
 * New format: ## HH:MM - codename\n\nGoal text\n\nDeadline: YYYY-MM-DD
 * Legacy format: ## HH:MM\n\nGoal text
 */
export function parseGoalEntry(entry: string): GoalEntry | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;

  // Match header: ## HH:MM or ## HH:MM - codename
  const headerMatch = trimmed.match(/^##\s+(\d{2}:\d{2})(?:\s+-\s+([a-z0-9-]+))?/);
  if (!headerMatch) return null;

  const timestamp = headerMatch[1];
  const codename = headerMatch[2] || null;

  // Extract text (everything after header until deadline or end)
  const afterHeader = trimmed.substring(headerMatch[0].length).trim();
  const deadlineMatch = afterHeader.match(/\n\nDeadline:\s+(\d{4}-\d{2}-\d{2})\s*$/);

  let text: string;
  let deadline: string | null = null;

  if (deadlineMatch) {
    deadline = deadlineMatch[1];
    text = afterHeader.substring(0, deadlineMatch.index).trim();
  } else {
    text = afterHeader;
  }

  return {
    timestamp,
    codename,
    text,
    deadline,
    rawEntry: trimmed,
  };
}

/**
 * Parse all goal entries from a markdown file content
 */
export function parseGoalEntries(content: string): GoalEntry[] {
  if (!content) return [];

  // Split by ## headers
  const entries = content.split(/(?=^## )/gm).filter(e => e.trim());
  return entries.map(parseGoalEntry).filter((e): e is GoalEntry => e !== null);
}

/**
 * Find a goal by codename in a file
 */
export async function findGoalByCodename(filePath: string, codename: string): Promise<GoalEntry | null> {
  const content = await readMarkdown(filePath);
  if (!content) return null;

  const entries = parseGoalEntries(content);
  return entries.find(e => e.codename === codename) || null;
}

/**
 * Extract existing codenames from a markdown file
 */
export async function getExistingCodenames(filePath: string): Promise<string[]> {
  const content = await readMarkdown(filePath);
  if (!content) return [];

  const entries = parseGoalEntries(content);
  return entries
    .map(e => e.codename)
    .filter((c): c is string => c !== null);
}

/**
 * Remove a goal entry from a file by codename
 */
export async function removeGoalEntry(filePath: string, codename: string): Promise<boolean> {
  const content = await readMarkdown(filePath);
  if (!content) return false;

  const entries = parseGoalEntries(content);
  const filtered = entries.filter(e => e.codename !== codename);

  if (filtered.length === entries.length) {
    return false; // Goal not found
  }

  // Rebuild file content
  const newContent = filtered.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);
  return true;
}

/**
 * Complete a goal entry (move from source to finished file)
 */
export async function completeGoalEntry(
  sourcePath: string,
  destPath: string,
  codename: string
): Promise<boolean> {
  const goal = await findGoalByCodename(sourcePath, codename);
  if (!goal) return false;

  // Add completion date to finished entry
  const completionDate = new Date().toISOString().split('T')[0];
  const finishedEntry = `${goal.rawEntry}\n\nCompleted: ${completionDate}`;

  // Append to finished file
  await appendToMarkdown(destPath, finishedEntry);

  // Remove from source file
  await removeGoalEntry(sourcePath, codename);

  return true;
}

/**
 * Update a goal's deadline
 */
export async function updateGoalDeadline(
  filePath: string,
  codename: string,
  deadline: string
): Promise<boolean> {
  const content = await readMarkdown(filePath);
  if (!content) return false;

  const entries = parseGoalEntries(content);
  const goalIndex = entries.findIndex(e => e.codename === codename);

  if (goalIndex === -1) return false;

  const goal = entries[goalIndex];

  // Rebuild goal entry with new deadline
  let newEntry = `## ${goal.timestamp}`;
  if (goal.codename) {
    newEntry += ` - ${goal.codename}`;
  }
  newEntry += `\n\n${goal.text}\n\nDeadline: ${deadline}`;

  entries[goalIndex] = {
    ...goal,
    deadline,
    rawEntry: newEntry,
  };

  // Rebuild file content
  const newContent = entries.map(e => e.rawEntry).join('\n\n');
  await writeFile(filePath, newContent);
  return true;
}
