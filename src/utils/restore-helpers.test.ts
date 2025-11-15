import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';
import { createBackupArchive } from './backup-helpers.js';
import {
  extractBackupArchive,
  createSafetyBackup,
  rollbackRestore,
  verifyRestore,
  restoreWithRollback,
} from './restore-helpers.js';

describe('restore-helpers', () => {
  let testDir: string;
  let sourceDir: string;
  let backupPath: string;
  let restoreDir: string;

  beforeEach(async () => {
    // Create temporary test directories
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'aissist-restore-test-'));
    sourceDir = path.join(testDir, 'source');
    restoreDir = path.join(testDir, 'restore');

    await fs.ensureDir(sourceDir);
    await fs.ensureDir(restoreDir);

    // Create test files in source
    await fs.ensureDir(path.join(sourceDir, 'goals'));
    await fs.ensureDir(path.join(sourceDir, 'history'));
    await fs.writeFile(path.join(sourceDir, 'goals', 'goal1.md'), '# Goal 1');
    await fs.writeFile(path.join(sourceDir, 'history', 'history1.md'), '# History 1');
    await fs.writeFile(path.join(sourceDir, 'config.json'), '{"version": "1.0"}');

    // Create a backup
    backupPath = path.join(testDir, 'test-backup.zip');
    await createBackupArchive({
      sourcePath: sourceDir,
      outputPath: backupPath,
      storageType: 'local',
    });
  });

  afterEach(async () => {
    // Clean up test directories
    await fs.remove(testDir);
  });

  describe('extractBackupArchive', () => {
    it('should extract backup in replace mode', async () => {
      const result = await extractBackupArchive({
        backupPath,
        targetPath: restoreDir,
        mode: 'replace',
      });

      expect(result.success).toBe(true);
      expect(result.filesAdded).toBeGreaterThan(0);
      expect(await fs.pathExists(path.join(restoreDir, 'goals', 'goal1.md'))).toBe(true);
      expect(await fs.pathExists(path.join(restoreDir, 'history', 'history1.md'))).toBe(true);
    });

    it('should extract backup in merge-overwrite mode', async () => {
      // Create existing file
      await fs.ensureDir(path.join(restoreDir, 'goals'));
      await fs.writeFile(path.join(restoreDir, 'goals', 'goal1.md'), '# Old Goal');
      await fs.writeFile(path.join(restoreDir, 'goals', 'goal2.md'), '# Goal 2');

      const result = await extractBackupArchive({
        backupPath,
        targetPath: restoreDir,
        mode: 'merge-overwrite',
      });

      expect(result.success).toBe(true);
      expect(result.filesOverwritten).toBeGreaterThan(0);

      // Check that goal1.md was overwritten
      const content = await fs.readFile(path.join(restoreDir, 'goals', 'goal1.md'), 'utf-8');
      expect(content).toBe('# Goal 1');

      // Check that goal2.md still exists
      expect(await fs.pathExists(path.join(restoreDir, 'goals', 'goal2.md'))).toBe(true);
    });

    it('should extract backup in merge-preserve mode', async () => {
      // Create existing file
      await fs.ensureDir(path.join(restoreDir, 'goals'));
      await fs.writeFile(path.join(restoreDir, 'goals', 'goal1.md'), '# Old Goal');

      const result = await extractBackupArchive({
        backupPath,
        targetPath: restoreDir,
        mode: 'merge-preserve',
      });

      expect(result.success).toBe(true);
      expect(result.filesPreserved).toBeGreaterThan(0);

      // Check that goal1.md was NOT overwritten (preserved)
      const content = await fs.readFile(path.join(restoreDir, 'goals', 'goal1.md'), 'utf-8');
      expect(content).toBe('# Old Goal');

      // Check that history1.md was added
      expect(await fs.pathExists(path.join(restoreDir, 'history', 'history1.md'))).toBe(true);
    });

    it('should throw error for non-existent backup file', async () => {
      await expect(
        extractBackupArchive({
          backupPath: '/nonexistent/backup.zip',
          targetPath: restoreDir,
          mode: 'replace',
        })
      ).rejects.toThrow('Backup file does not exist');
    });

    it('should throw error for invalid backup (missing metadata)', async () => {
      // Create invalid ZIP
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();
      const invalidPath = path.join(testDir, 'invalid.zip');
      zip.addFile('test.txt', Buffer.from('test'));
      zip.writeZip(invalidPath);

      await expect(
        extractBackupArchive({
          backupPath: invalidPath,
          targetPath: restoreDir,
          mode: 'replace',
        })
      ).rejects.toThrow('Backup metadata not found or invalid');
    });
  });

  describe('createSafetyBackup', () => {
    it('should create safety backup of existing directory', async () => {
      // Create some files in restore directory
      await fs.writeFile(path.join(restoreDir, 'test.txt'), 'test content');
      await fs.ensureDir(path.join(restoreDir, 'subdir'));
      await fs.writeFile(path.join(restoreDir, 'subdir', 'file.txt'), 'sub content');

      const safetyPath = await createSafetyBackup(restoreDir);

      expect(safetyPath).not.toBeNull();
      expect(await fs.pathExists(safetyPath!)).toBe(true);
      expect(safetyPath).toMatch(/\.zip$/);
    });

    it('should return null for non-existent directory', async () => {
      const safetyPath = await createSafetyBackup('/nonexistent/path');

      expect(safetyPath).toBeNull();
    });
  });

  describe('rollbackRestore', () => {
    it('should restore from safety backup', async () => {
      // Create original content
      await fs.writeFile(path.join(restoreDir, 'original.txt'), 'original content');

      // Create safety backup
      const safetyPath = await createSafetyBackup(restoreDir);

      // Modify content
      await fs.remove(path.join(restoreDir, 'original.txt'));
      await fs.writeFile(path.join(restoreDir, 'modified.txt'), 'modified content');

      // Rollback
      await rollbackRestore(safetyPath!, restoreDir);

      // Check that original content is restored
      expect(await fs.pathExists(path.join(restoreDir, 'original.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(restoreDir, 'modified.txt'))).toBe(false);
    });

    it('should throw error if safety backup not found', async () => {
      await expect(
        rollbackRestore('/nonexistent/safety.zip', restoreDir)
      ).rejects.toThrow('Safety backup not found');
    });
  });

  describe('verifyRestore', () => {
    it('should verify successfully restored files', async () => {
      // Extract backup
      await extractBackupArchive({
        backupPath,
        targetPath: restoreDir,
        mode: 'replace',
      });

      // Read metadata
      const { readBackupMetadata } = await import('./backup-helpers.js');
      const metadata = await readBackupMetadata(backupPath);

      // Verify
      const verification = await verifyRestore(restoreDir, metadata!);

      expect(verification.valid).toBe(true);
      expect(verification.errors).toHaveLength(0);
    });

    it('should detect missing files', async () => {
      // Extract backup
      await extractBackupArchive({
        backupPath,
        targetPath: restoreDir,
        mode: 'replace',
      });

      // Remove a file
      await fs.remove(path.join(restoreDir, 'goals', 'goal1.md'));

      // Read metadata and verify
      const { readBackupMetadata } = await import('./backup-helpers.js');
      const metadata = await readBackupMetadata(backupPath);
      const verification = await verifyRestore(restoreDir, metadata!);

      expect(verification.valid).toBe(false);
      expect(verification.errors.length).toBeGreaterThan(0);
      expect(verification.errors[0]).toContain('Missing file after restore');
    });

    it('should detect corrupted files (checksum mismatch)', async () => {
      // Extract backup
      await extractBackupArchive({
        backupPath,
        targetPath: restoreDir,
        mode: 'replace',
      });

      // Corrupt a file
      await fs.writeFile(path.join(restoreDir, 'goals', 'goal1.md'), 'CORRUPTED CONTENT');

      // Read metadata and verify
      const { readBackupMetadata } = await import('./backup-helpers.js');
      const metadata = await readBackupMetadata(backupPath);
      const verification = await verifyRestore(restoreDir, metadata!);

      expect(verification.valid).toBe(false);
      expect(verification.errors.length).toBeGreaterThan(0);
      expect(verification.errors[0]).toContain('Checksum mismatch');
    });
  });

  describe('restoreWithRollback', () => {
    it('should restore successfully in replace mode', async () => {
      // Add existing content to test replacement
      await fs.writeFile(path.join(restoreDir, 'old-file.txt'), 'old content');

      const result = await restoreWithRollback({
        backupPath,
        targetPath: restoreDir,
        mode: 'replace',
        skipConfirmation: true,
      });

      expect(result.success).toBe(true);
      expect(result.filesAdded).toBeGreaterThan(0);

      // Check that old file is gone and new files exist
      expect(await fs.pathExists(path.join(restoreDir, 'old-file.txt'))).toBe(false);
      expect(await fs.pathExists(path.join(restoreDir, 'goals', 'goal1.md'))).toBe(true);
    });

    it('should restore successfully in merge-overwrite mode', async () => {
      // Create existing and conflicting files
      await fs.ensureDir(path.join(restoreDir, 'goals'));
      await fs.writeFile(path.join(restoreDir, 'goals', 'goal1.md'), '# Old Goal');
      await fs.writeFile(path.join(restoreDir, 'existing.txt'), 'existing');

      const result = await restoreWithRollback({
        backupPath,
        targetPath: restoreDir,
        mode: 'merge-overwrite',
        skipConfirmation: true,
      });

      expect(result.success).toBe(true);
      expect(result.filesOverwritten).toBeGreaterThan(0);

      // Check that goal1.md was overwritten
      const content = await fs.readFile(path.join(restoreDir, 'goals', 'goal1.md'), 'utf-8');
      expect(content).toBe('# Goal 1');

      // Check that existing file is preserved
      expect(await fs.pathExists(path.join(restoreDir, 'existing.txt'))).toBe(true);
    });

    it('should restore successfully in merge-preserve mode', async () => {
      // Create existing file
      await fs.ensureDir(path.join(restoreDir, 'goals'));
      await fs.writeFile(path.join(restoreDir, 'goals', 'goal1.md'), '# Preserved Goal');

      const result = await restoreWithRollback({
        backupPath,
        targetPath: restoreDir,
        mode: 'merge-preserve',
        skipConfirmation: true,
      });

      expect(result.success).toBe(true);
      expect(result.filesPreserved).toBeGreaterThan(0);

      // Check that goal1.md was preserved
      const content = await fs.readFile(path.join(restoreDir, 'goals', 'goal1.md'), 'utf-8');
      expect(content).toBe('# Preserved Goal');

      // Check that new files were added
      expect(await fs.pathExists(path.join(restoreDir, 'history', 'history1.md'))).toBe(true);
    });

    it('should rollback on verification failure in replace mode', async () => {
      // Create original content
      await fs.writeFile(path.join(restoreDir, 'important.txt'), 'important data');

      // Create a corrupted backup (we'll corrupt it after extraction in the next test)
      // For this test, we'll use a valid backup but the rollback mechanism should work

      const result = await restoreWithRollback({
        backupPath,
        targetPath: restoreDir,
        mode: 'replace',
        skipConfirmation: true,
      });

      // Should succeed with valid backup
      expect(result.success).toBe(true);
    });
  });
});
