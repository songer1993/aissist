import path from 'path';
import chalk from 'chalk';
import {
  createBackupArchive,
  generateBackupFilename,
} from './backup-helpers.js';
import {
  shouldAutoBackup,
  setLastBackupTime,
  getBackupDirectory,
  isGlobalStorage,
} from './storage.js';

/**
 * Check if auto-backup is due and perform backup if needed
 * This is a non-blocking operation that runs in the background
 */
export async function checkAndPerformAutoBackup(
  storagePath: string
): Promise<void> {
  try {
    // Check if auto-backup is enabled and due
    const shouldBackup = await shouldAutoBackup(storagePath);

    if (!shouldBackup) {
      return; // Auto-backup not enabled or not due yet
    }

    // Perform backup asynchronously (non-blocking)
    performAutoBackup(storagePath).catch((error) => {
      // Silently fail - auto-backup is non-critical
      // Optionally log to a file or debug output
      if (process.env.DEBUG) {
        console.error(chalk.dim(`Auto-backup failed: ${error.message}`));
      }
    });
  } catch (error) {
    // Silently fail - auto-backup failures should not block command execution
    if (process.env.DEBUG) {
      console.error(
        chalk.dim(`Auto-backup check failed: ${(error as Error).message}`)
      );
    }
  }
}

/**
 * Perform auto-backup (internal function)
 */
async function performAutoBackup(storagePath: string): Promise<void> {
  // Determine storage type
  const storageType = (await isGlobalStorage()) ? 'global' : 'local';

  // Get backup directory
  const backupDir = await getBackupDirectory(storagePath);

  // Generate output path
  const outputPath = path.join(backupDir, generateBackupFilename());

  // Create backup
  await createBackupArchive({
    sourcePath: storagePath,
    outputPath,
    description: 'Auto-backup',
    storageType,
  });

  // Update last backup timestamp
  await setLastBackupTime(storagePath);

  // Display subtle notification
  if (process.env.DEBUG) {
    console.log(chalk.dim(`✓ Auto-backup created: ${outputPath}`));
  }
}
