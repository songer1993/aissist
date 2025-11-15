import AdmZip from 'adm-zip';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { getAissistVersion } from './version.js';

// TypeScript interfaces
export interface BackupFileManifest {
  path: string;
  size: number;
  checksum: string;
}

export interface BackupMetadata {
  version: string;
  timestamp: string;
  aissistVersion: string;
  sourcePath: string;
  storageType: 'local' | 'global';
  description?: string;
  fileCount: number;
  totalSize: number;
  manifest: BackupFileManifest[];
}

export interface BackupOptions {
  sourcePath: string;
  outputPath: string;
  description?: string;
  storageType?: 'local' | 'global';
}

export interface BackupResult {
  backupPath: string;
  metadata: BackupMetadata;
  success: boolean;
}

/**
 * Calculate SHA-256 checksum for a file
 */
export async function calculateChecksum(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Generate backup metadata by scanning source directory
 */
export async function generateBackupMetadata(
  sourcePath: string,
  storageType: 'local' | 'global',
  description?: string
): Promise<BackupMetadata> {
  const manifest: BackupFileManifest[] = [];
  let totalSize = 0;

  // Recursively scan directory
  async function scanDirectory(dir: string, relativePath: string = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        const checksum = await calculateChecksum(fullPath);

        manifest.push({
          path: relPath,
          size: stats.size,
          checksum: `sha256:${checksum}`,
        });

        totalSize += stats.size;
      }
    }
  }

  await scanDirectory(sourcePath);

  const metadata: BackupMetadata = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    aissistVersion: getAissistVersion(),
    sourcePath,
    storageType,
    description,
    fileCount: manifest.length,
    totalSize,
    manifest,
  };

  return metadata;
}

/**
 * Create a ZIP backup archive of the specified directory
 */
export async function createBackupArchive(
  options: BackupOptions
): Promise<BackupResult> {
  const { sourcePath, outputPath, description, storageType = 'local' } = options;

  // Validate source directory exists
  if (!(await fs.pathExists(sourcePath))) {
    throw new Error(`Source directory does not exist: ${sourcePath}`);
  }

  // Ensure output directory exists
  await fs.ensureDir(path.dirname(outputPath));

  // Generate metadata
  const metadata = await generateBackupMetadata(
    sourcePath,
    storageType,
    description
  );

  // Create ZIP archive
  const zip = new AdmZip();

  // Add all files from source directory
  for (const fileInfo of metadata.manifest) {
    const filePath = path.join(sourcePath, fileInfo.path);
    zip.addLocalFile(filePath, path.dirname(fileInfo.path));
  }

  // Add metadata file
  zip.addFile(
    '.backup-metadata.json',
    Buffer.from(JSON.stringify(metadata, null, 2))
  );

  // Write ZIP to disk
  await new Promise<void>((resolve, reject) => {
    try {
      zip.writeZip(outputPath);
      resolve();
    } catch (error) {
      reject(error);
    }
  });

  return {
    backupPath: outputPath,
    metadata,
    success: true,
  };
}

/**
 * Verify backup integrity by checking all files against stored checksums
 */
export async function verifyBackupIntegrity(
  backupPath: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Read ZIP archive
    const zip = new AdmZip(backupPath);
    const zipEntries = zip.getEntries();

    // Find and read metadata
    const metadataEntry = zipEntries.find(
      (entry) => entry.entryName === '.backup-metadata.json'
    );

    if (!metadataEntry) {
      errors.push('Missing backup metadata file');
      return { valid: false, errors };
    }

    const metadata: BackupMetadata = JSON.parse(
      metadataEntry.getData().toString('utf8')
    );

    // Verify each file in manifest
    for (const fileInfo of metadata.manifest) {
      const entry = zipEntries.find((e) => e.entryName === fileInfo.path);

      if (!entry) {
        errors.push(`Missing file in archive: ${fileInfo.path}`);
        continue;
      }

      // Calculate checksum of file in archive
      const fileBuffer = entry.getData();
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
  } catch (_error) {
    errors.push(`Failed to verify backup: ${(_error as Error).message}`);
    return { valid: false, errors };
  }
}

/**
 * Read backup metadata from archive without extracting
 */
export async function readBackupMetadata(
  backupPath: string
): Promise<BackupMetadata | null> {
  try {
    const zip = new AdmZip(backupPath);
    const metadataEntry = zip.getEntry('.backup-metadata.json');

    if (!metadataEntry) {
      return null;
    }

    const metadata: BackupMetadata = JSON.parse(
      metadataEntry.getData().toString('utf8')
    );
    return metadata;
  } catch (_error) {
    throw new Error(
      `Failed to read backup metadata: ${(_error as Error).message}`
    );
  }
}

/**
 * List all backup files in a directory
 */
export async function listBackups(
  backupDir: string
): Promise<Array<{ path: string; metadata: BackupMetadata | null }>> {
  if (!(await fs.pathExists(backupDir))) {
    return [];
  }

  const files = await fs.readdir(backupDir);
  const backups: Array<{ path: string; metadata: BackupMetadata | null }> = [];

  for (const file of files) {
    if (file.endsWith('.zip')) {
      const backupPath = path.join(backupDir, file);
      try {
        const metadata = await readBackupMetadata(backupPath);
        backups.push({ path: backupPath, metadata });
      } catch (_error) {
        backups.push({ path: backupPath, metadata: null });
      }
    }
  }

  // Sort by timestamp (newest first)
  backups.sort((a, b) => {
    if (!a.metadata || !b.metadata) return 0;
    return (
      new Date(b.metadata.timestamp).getTime() -
      new Date(a.metadata.timestamp).getTime()
    );
  });

  return backups;
}

/**
 * Generate backup filename with timestamp
 */
export function generateBackupFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now
    .toISOString()
    .slice(11, 19)
    .replace(/:/g, ''); // HHmmss
  return `aissist-backup-${dateStr}-${timeStr}.zip`;
}
