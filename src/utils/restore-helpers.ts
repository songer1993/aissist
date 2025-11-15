import AdmZip from 'adm-zip';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import {
  BackupMetadata,
  readBackupMetadata,
  generateBackupFilename,
} from './backup-helpers.js';

export type RestoreMode = 'replace' | 'merge-overwrite' | 'merge-preserve';

export interface RestoreOptions {
  backupPath: string;
  targetPath: string;
  mode: RestoreMode;
  skipConfirmation?: boolean;
}

export interface RestoreResult {
  success: boolean;
  filesAdded: number;
  filesOverwritten: number;
  filesSkipped: number;
  filesPreserved: number;
  safetyBackupPath?: string;
}

/**
 * Extract backup archive to target directory based on restore mode
 */
export async function extractBackupArchive(
  options: RestoreOptions
): Promise<RestoreResult> {
  const { backupPath, targetPath, mode } = options;

  // Validate backup exists
  if (!(await fs.pathExists(backupPath))) {
    throw new Error(`Backup file does not exist: ${backupPath}`);
  }

  // Read metadata
  const metadata = await readBackupMetadata(backupPath);
  if (!metadata) {
    throw new Error('Backup metadata not found or invalid');
  }

  // Create target directory if it doesn't exist
  await fs.ensureDir(targetPath);

  // Open ZIP archive
  const zip = new AdmZip(backupPath);
  const zipEntries = zip.getEntries();

  // Track statistics
  let filesAdded = 0;
  let filesOverwritten = 0;
  let filesSkipped = 0;
  let filesPreserved = 0;

  // Process each file based on restore mode
  for (const entry of zipEntries) {
    // Skip metadata file
    if (entry.entryName === '.backup-metadata.json') {
      continue;
    }

    const targetFilePath = path.join(targetPath, entry.entryName);
    const fileExists = await fs.pathExists(targetFilePath);

    if (mode === 'replace') {
      // Replace mode: always extract (directory will be cleared beforehand)
      zip.extractEntryTo(entry, path.dirname(targetFilePath), false, true);
      filesAdded++;
    } else if (mode === 'merge-overwrite') {
      // Merge-overwrite: extract and overwrite existing files
      await fs.ensureDir(path.dirname(targetFilePath));
      zip.extractEntryTo(entry, path.dirname(targetFilePath), false, true);
      if (fileExists) {
        filesOverwritten++;
      } else {
        filesAdded++;
      }
    } else if (mode === 'merge-preserve') {
      // Merge-preserve: only extract if file doesn't exist
      if (!fileExists) {
        await fs.ensureDir(path.dirname(targetFilePath));
        zip.extractEntryTo(entry, path.dirname(targetFilePath), false, true);
        filesAdded++;
      } else {
        filesPreserved++;
      }
    }
  }

  return {
    success: true,
    filesAdded,
    filesOverwritten,
    filesSkipped,
    filesPreserved,
  };
}

/**
 * Create a safety backup of existing directory before destructive operations
 */
export async function createSafetyBackup(
  sourcePath: string
): Promise<string | null> {
  if (!(await fs.pathExists(sourcePath))) {
    return null;
  }

  // Create safety backup in system temp directory
  const tmpDir = await fs.mkdtemp(
    path.join((await import('os')).tmpdir(), 'aissist-safety-')
  );
  const safetyBackupPath = path.join(tmpDir, generateBackupFilename());

  // Create ZIP of existing directory
  const zip = new AdmZip();
  zip.addLocalFolder(sourcePath);
  zip.writeZip(safetyBackupPath);

  return safetyBackupPath;
}

/**
 * Restore from safety backup (rollback on failure)
 */
export async function rollbackRestore(
  safetyBackupPath: string,
  targetPath: string
): Promise<void> {
  if (!(await fs.pathExists(safetyBackupPath))) {
    throw new Error('Safety backup not found, cannot rollback');
  }

  // Clear target directory
  await fs.emptyDir(targetPath);

  // Extract safety backup
  const zip = new AdmZip(safetyBackupPath);
  zip.extractAllTo(targetPath, true);
}

/**
 * Verify restored files match checksums from backup metadata
 */
export async function verifyRestore(
  targetPath: string,
  metadata: BackupMetadata
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const fileInfo of metadata.manifest) {
    const filePath = path.join(targetPath, fileInfo.path);

    if (!(await fs.pathExists(filePath))) {
      errors.push(`Missing file after restore: ${fileInfo.path}`);
      continue;
    }

    // Calculate checksum
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const calculatedChecksum = `sha256:${hashSum.digest('hex')}`;

    if (calculatedChecksum !== fileInfo.checksum) {
      errors.push(
        `Checksum mismatch for ${fileInfo.path}: expected ${fileInfo.checksum}, got ${calculatedChecksum}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Perform restore with automatic rollback on failure
 */
export async function restoreWithRollback(
  options: RestoreOptions
): Promise<RestoreResult> {
  const { backupPath, targetPath, mode } = options;
  let safetyBackupPath: string | null = null;

  try {
    // Create safety backup for destructive operations
    if (mode === 'replace') {
      safetyBackupPath = await createSafetyBackup(targetPath);

      // Clear target directory
      await fs.emptyDir(targetPath);
    }

    // Perform restore
    const result = await extractBackupArchive(options);

    // Verify restore (skip verification in merge-preserve mode as existing files won't match)
    if (mode !== 'merge-preserve') {
      const metadata = await readBackupMetadata(backupPath);
      if (metadata) {
        const verification = await verifyRestore(targetPath, metadata);
        if (!verification.valid) {
          throw new Error(
            `Restore verification failed:\n${verification.errors.join('\n')}`
          );
        }
      }
    }

    // Cleanup safety backup on success
    if (safetyBackupPath) {
      await fs.remove(path.dirname(safetyBackupPath));
    }

    return {
      ...result,
      safetyBackupPath: safetyBackupPath || undefined,
    };
  } catch (error) {
    // Rollback on failure
    if (safetyBackupPath && mode === 'replace') {
      try {
        await rollbackRestore(safetyBackupPath, targetPath);
      } catch (rollbackError) {
        throw new Error(
          `Restore failed and rollback also failed: ${(error as Error).message}. Rollback error: ${(rollbackError as Error).message}`
        );
      }
    }

    throw error;
  }
}

/**
 * Check available disk space
 */
export async function checkDiskSpace(
  targetPath: string,
  _requiredBytes: number
): Promise<{ available: boolean; availableSpace: number }> {
  try {
    // This is a simplified check - in production you might want to use a library
    // like 'check-disk-space' for accurate cross-platform disk space checking
    await fs.stat(path.dirname(targetPath));

    // For now, we'll return a placeholder
    // In a real implementation, you'd use a proper disk space checking library
    return {
      available: true,
      availableSpace: Number.MAX_SAFE_INTEGER,
    };
  } catch (_error) {
    return {
      available: false,
      availableSpace: 0,
    };
  }
}
