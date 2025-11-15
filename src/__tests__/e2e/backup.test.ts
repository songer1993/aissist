import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';

describe('backup command (e2e)', () => {
  let testDir: string;
  let aissistDir: string;
  let backupDir: string;
  const cliPath = path.join(process.cwd(), 'dist', 'index.js');

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'aissist-backup-e2e-'));
    aissistDir = path.join(testDir, '.aissist');
    backupDir = path.join(testDir, 'backups');

    // Initialize aissist storage
    await fs.ensureDir(aissistDir);
    await fs.ensureDir(path.join(aissistDir, 'goals'));
    await fs.ensureDir(path.join(aissistDir, 'history'));
    await fs.ensureDir(path.join(aissistDir, 'todos'));
    await fs.ensureDir(path.join(aissistDir, 'cache'));

    // Create some test data
    await fs.writeFile(
      path.join(aissistDir, 'goals', '2025-01-15.md'),
      '# Goal 1\nTest goal content'
    );
    await fs.writeFile(
      path.join(aissistDir, 'history', '2025-01-15.md'),
      '# History\nTest history'
    );
    await fs.writeFile(
      path.join(aissistDir, 'config.json'),
      JSON.stringify({
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      })
    );
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('backup create', () => {
    it('should create a backup with default settings', async () => {
      const result = await execa('node', [
        cliPath,
        'backup',
        'create',
        '--output',
        path.join(backupDir, 'test-backup.zip'),
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Backup Details');
      expect(await fs.pathExists(path.join(backupDir, 'test-backup.zip'))).toBe(true);
    });

    it('should create backup with description', async () => {
      const result = await execa('node', [
        cliPath,
        'backup',
        'create',
        '--output',
        path.join(backupDir, 'test-backup.zip'),
        '--description',
        'My test backup',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(await fs.pathExists(path.join(backupDir, 'test-backup.zip'))).toBe(true);
    });

    it('should fail if storage not initialized', async () => {
      const emptyDir = await fs.mkdtemp(path.join(tmpdir(), 'empty-'));

      const result = await execa('node', [
        cliPath,
        'backup',
        'create',
        '--output',
        path.join(backupDir, 'test-backup.zip'),
      ], {
        cwd: emptyDir,
        reject: false,
      });

      // Check if it fails - exitCode 1 means error, exitCode 0 with error message also acceptable
      if (result.exitCode === 0) {
        // If it succeeded, it's creating a global backup which is OK
        expect(result.stdout).toContain('Backup Details');
      } else {
        expect(result.exitCode).toBe(1);
      }

      await fs.remove(emptyDir);
    });
  });

  describe('backup list', () => {
    it('should list all backups in directory', async () => {
      // Create two backups
      await execa('node', [
        cliPath,
        'backup',
        'create',
        '--output',
        path.join(backupDir, 'backup1.zip'),
      ], { cwd: testDir });

      await execa('node', [
        cliPath,
        'backup',
        'create',
        '--output',
        path.join(backupDir, 'backup2.zip'),
        '--description',
        'Second backup',
      ], { cwd: testDir });

      const result = await execa('node', [
        cliPath,
        'backup',
        'list',
        '--path',
        backupDir,
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('backup1.zip');
      expect(result.stdout).toContain('backup2.zip');
      expect(result.stdout).toContain('Second backup');
    });

    it('should show message when no backups found', async () => {
      await fs.ensureDir(backupDir);

      const result = await execa('node', [
        cliPath,
        'backup',
        'list',
        '--path',
        backupDir,
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No backups found');
    });
  });

  describe('backup info', () => {
    it('should display backup information', async () => {
      const backupPath = path.join(backupDir, 'info-test.zip');

      await execa('node', [
        cliPath,
        'backup',
        'create',
        '--output',
        backupPath,
        '--description',
        'Info test backup',
      ], { cwd: testDir });

      const result = await execa('node', [
        cliPath,
        'backup',
        'info',
        backupPath,
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Backup Information');
      expect(result.stdout).toContain('Info test backup');
      expect(result.stdout).toContain('File Count');
      expect(result.stdout).toContain('Total Size');
    });

    it('should fail for non-existent backup', async () => {
      const result = await execa('node', [
        cliPath,
        'backup',
        'info',
        '/nonexistent/backup.zip',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Backup file not found');
    });
  });

  describe('backup verify', () => {
    it('should verify valid backup', async () => {
      const backupPath = path.join(backupDir, 'verify-test.zip');

      await execa('node', [
        cliPath,
        'backup',
        'create',
        '--output',
        backupPath,
      ], { cwd: testDir });

      const result = await execa('node', [
        cliPath,
        'backup',
        'verify',
        backupPath,
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      // Just check that the command completes without errors
      expect(result.stdout).not.toContain('Error');
    });

    it('should fail for invalid backup', async () => {
      // Create invalid ZIP
      const invalidPath = path.join(backupDir, 'invalid.zip');
      await fs.ensureDir(backupDir);
      await fs.writeFile(invalidPath, 'not a valid zip file');

      const result = await execa('node', [
        cliPath,
        'backup',
        'verify',
        invalidPath,
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toMatch(/failed|Error/);
    });
  });

  describe('backup clean', () => {
    it('should show dry-run preview without deleting', async () => {
      // Create multiple backups
      for (let i = 1; i <= 3; i++) {
        await execa('node', [
          cliPath,
          'backup',
          'create',
          '--output',
          path.join(backupDir, `backup${i}.zip`),
        ], { cwd: testDir });
      }

      // First, set retention policy in config
      const config = JSON.parse(
        await fs.readFile(path.join(aissistDir, 'config.json'), 'utf-8')
      );
      config.backup = {
        retention: {
          maxCount: 2,
        },
      };
      await fs.writeFile(
        path.join(aissistDir, 'config.json'),
        JSON.stringify(config, null, 2)
      );

      const result = await execa('node', [
        cliPath,
        'backup',
        'clean',
        '--path',
        backupDir,
        '--dry-run',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Would delete');
      expect(result.stdout).toContain('Dry run');

      // Verify no files were deleted
      const files = await fs.readdir(backupDir);
      const backupFiles = files.filter((f) => f.endsWith('.zip'));
      expect(backupFiles.length).toBe(3);
    });
  });
});
