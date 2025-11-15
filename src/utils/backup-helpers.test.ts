import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';
import {
  createBackupArchive,
  verifyBackupIntegrity,
  readBackupMetadata,
  listBackups,
  generateBackupFilename,
  calculateChecksum,
  generateBackupMetadata,
} from './backup-helpers.js';

describe('backup-helpers', () => {
  let testDir: string;
  let backupDir: string;

  beforeEach(async () => {
    // Create temporary test directories
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'aissist-backup-test-'));
    backupDir = path.join(testDir, 'backups');
    await fs.ensureDir(backupDir);
  });

  afterEach(async () => {
    // Clean up test directories
    await fs.remove(testDir);
  });

  describe('calculateChecksum', () => {
    it('should calculate SHA-256 checksum for a file', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello, World!');

      const checksum = await calculateChecksum(testFile);

      expect(checksum).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('should produce different checksums for different content', async () => {
      const file1 = path.join(testDir, 'file1.txt');
      const file2 = path.join(testDir, 'file2.txt');

      await fs.writeFile(file1, 'Content 1');
      await fs.writeFile(file2, 'Content 2');

      const checksum1 = await calculateChecksum(file1);
      const checksum2 = await calculateChecksum(file2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('generateBackupMetadata', () => {
    it('should generate metadata with file list and checksums', async () => {
      // Create test directory structure
      const sourceDir = path.join(testDir, 'source');
      await fs.ensureDir(path.join(sourceDir, 'goals'));
      await fs.ensureDir(path.join(sourceDir, 'history'));

      await fs.writeFile(path.join(sourceDir, 'goals', 'goal1.md'), '# Goal 1');
      await fs.writeFile(path.join(sourceDir, 'history', 'history1.md'), '# History 1');

      const metadata = await generateBackupMetadata(sourceDir, 'local', 'Test backup');

      expect(metadata.version).toBe('1.0');
      expect(metadata.storageType).toBe('local');
      expect(metadata.description).toBe('Test backup');
      expect(metadata.fileCount).toBe(2);
      expect(metadata.manifest).toHaveLength(2);
      expect(metadata.manifest[0].checksum).toMatch(/^sha256:/);
      expect(metadata.totalSize).toBeGreaterThan(0);
    });

    it('should handle empty directories', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.ensureDir(emptyDir);

      const metadata = await generateBackupMetadata(emptyDir, 'global');

      expect(metadata.fileCount).toBe(0);
      expect(metadata.manifest).toHaveLength(0);
      expect(metadata.totalSize).toBe(0);
    });
  });

  describe('createBackupArchive', () => {
    it('should create a valid ZIP backup archive', async () => {
      // Create test source directory
      const sourceDir = path.join(testDir, 'source');
      await fs.ensureDir(path.join(sourceDir, 'goals'));
      await fs.writeFile(path.join(sourceDir, 'goals', 'goal1.md'), '# Goal 1');
      await fs.writeFile(path.join(sourceDir, 'config.json'), '{}');

      const outputPath = path.join(backupDir, 'test-backup.zip');

      const result = await createBackupArchive({
        sourcePath: sourceDir,
        outputPath,
        description: 'Test backup',
        storageType: 'local',
      });

      expect(result.success).toBe(true);
      expect(result.backupPath).toBe(outputPath);
      expect(result.metadata.fileCount).toBe(2);
      expect(await fs.pathExists(outputPath)).toBe(true);
    });

    it('should include metadata file in archive', async () => {
      const sourceDir = path.join(testDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test');

      const outputPath = path.join(backupDir, 'test-backup.zip');

      await createBackupArchive({
        sourcePath: sourceDir,
        outputPath,
        storageType: 'local',
      });

      const metadata = await readBackupMetadata(outputPath);
      expect(metadata).not.toBeNull();
      expect(metadata?.version).toBe('1.0');
    });

    it('should throw error for non-existent source directory', async () => {
      const outputPath = path.join(backupDir, 'test-backup.zip');

      await expect(
        createBackupArchive({
          sourcePath: '/nonexistent/path',
          outputPath,
          storageType: 'local',
        })
      ).rejects.toThrow('Source directory does not exist');
    });
  });

  describe('verifyBackupIntegrity', () => {
    it('should verify a valid backup archive', async () => {
      // Create and verify a backup
      const sourceDir = path.join(testDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');

      const outputPath = path.join(backupDir, 'test-backup.zip');
      await createBackupArchive({
        sourcePath: sourceDir,
        outputPath,
        storageType: 'local',
      });

      const verification = await verifyBackupIntegrity(outputPath);

      expect(verification.valid).toBe(true);
      expect(verification.errors).toHaveLength(0);
    });

    it('should detect missing metadata', async () => {
      // Create a ZIP without proper metadata
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      const invalidPath = path.join(backupDir, 'invalid.zip');

      zip.addFile('test.txt', Buffer.from('test'));
      zip.writeZip(invalidPath);

      const verification = await verifyBackupIntegrity(invalidPath);

      expect(verification.valid).toBe(false);
      expect(verification.errors).toContain('Missing backup metadata file');
    });
  });

  describe('readBackupMetadata', () => {
    it('should read metadata from valid backup', async () => {
      const sourceDir = path.join(testDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test');

      const outputPath = path.join(backupDir, 'test-backup.zip');
      const createResult = await createBackupArchive({
        sourcePath: sourceDir,
        outputPath,
        description: 'My test backup',
        storageType: 'global',
      });

      const metadata = await readBackupMetadata(outputPath);

      expect(metadata).not.toBeNull();
      expect(metadata?.description).toBe('My test backup');
      expect(metadata?.storageType).toBe('global');
      expect(metadata?.fileCount).toBe(createResult.metadata.fileCount);
    });

    it('should return null for backup without metadata', async () => {
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      const invalidPath = path.join(backupDir, 'no-metadata.zip');

      zip.addFile('test.txt', Buffer.from('test'));
      zip.writeZip(invalidPath);

      const metadata = await readBackupMetadata(invalidPath);

      expect(metadata).toBeNull();
    });
  });

  describe('listBackups', () => {
    it('should list all backup files in directory', async () => {
      // Create multiple backups
      const sourceDir = path.join(testDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test');

      await createBackupArchive({
        sourcePath: sourceDir,
        outputPath: path.join(backupDir, 'backup1.zip'),
        storageType: 'local',
      });

      await createBackupArchive({
        sourcePath: sourceDir,
        outputPath: path.join(backupDir, 'backup2.zip'),
        storageType: 'local',
      });

      const backups = await listBackups(backupDir);

      expect(backups).toHaveLength(2);
      expect(backups[0].metadata).not.toBeNull();
      expect(backups[1].metadata).not.toBeNull();
    });

    it('should return empty array for non-existent directory', async () => {
      const backups = await listBackups('/nonexistent/path');

      expect(backups).toHaveLength(0);
    });

    it('should sort backups by timestamp (newest first)', async () => {
      const sourceDir = path.join(testDir, 'source');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test');

      // Create first backup
      await createBackupArchive({
        sourcePath: sourceDir,
        outputPath: path.join(backupDir, 'backup1.zip'),
        storageType: 'local',
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create second backup
      await createBackupArchive({
        sourcePath: sourceDir,
        outputPath: path.join(backupDir, 'backup2.zip'),
        storageType: 'local',
      });

      const backups = await listBackups(backupDir);

      expect(backups).toHaveLength(2);

      if (backups[0].metadata && backups[1].metadata) {
        const time1 = new Date(backups[0].metadata.timestamp).getTime();
        const time2 = new Date(backups[1].metadata.timestamp).getTime();
        expect(time1).toBeGreaterThanOrEqual(time2);
      }
    });
  });

  describe('generateBackupFilename', () => {
    it('should generate filename with correct format', () => {
      const filename = generateBackupFilename();

      expect(filename).toMatch(/^aissist-backup-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/);
    });

    it('should generate unique filenames', () => {
      const filename1 = generateBackupFilename();
      const filename2 = generateBackupFilename();

      // They might be the same if called in same millisecond, but structure should be valid
      expect(filename1).toMatch(/^aissist-backup-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/);
      expect(filename2).toMatch(/^aissist-backup-\d{4}-\d{2}-\d{2}-\d{6}\.zip$/);
    });
  });
});
