import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';

describe('restore command (e2e)', () => {
  let testDir: string;
  let aissistDir: string;
  let backupPath: string;
  const cliPath = path.join(process.cwd(), 'dist', 'index.js');

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'aissist-restore-e2e-'));
    aissistDir = path.join(testDir, '.aissist');

    // Initialize aissist storage
    await fs.ensureDir(aissistDir);
    await fs.ensureDir(path.join(aissistDir, 'goals'));
    await fs.ensureDir(path.join(aissistDir, 'history'));
    await fs.ensureDir(path.join(aissistDir, 'todos'));
    await fs.ensureDir(path.join(aissistDir, 'cache'));

    // Create test data
    await fs.writeFile(
      path.join(aissistDir, 'goals', '2025-01-15.md'),
      '# Original Goal\nOriginal content'
    );
    await fs.writeFile(
      path.join(aissistDir, 'history', '2025-01-15.md'),
      '# Original History'
    );
    await fs.writeFile(
      path.join(aissistDir, 'config.json'),
      JSON.stringify({
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      })
    );

    // Create a backup
    backupPath = path.join(testDir, 'test-backup.zip');
    await execa('node', [
      cliPath,
      'backup',
      'create',
      '--output',
      backupPath,
      '--description',
      'Test backup for restore',
    ], { cwd: testDir });
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('restore with replace mode', () => {
    it('should restore backup in replace mode with confirmation', async () => {
      // Modify existing data
      await fs.writeFile(
        path.join(aissistDir, 'goals', '2025-01-15.md'),
        '# Modified Goal\nModified content'
      );
      await fs.writeFile(
        path.join(aissistDir, 'new-file.txt'),
        'This file should be deleted'
      );

      // Restore with --yes flag to skip confirmation
      const result = await execa('node', [
        cliPath,
        'restore',
        backupPath,
        '--mode',
        'replace',
        '--yes',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Restore completed|Restore Summary/);

      // Check that original content is restored
      const goalContent = await fs.readFile(
        path.join(aissistDir, 'goals', '2025-01-15.md'),
        'utf-8'
      );
      expect(goalContent).toContain('Original Goal');

      // Check that new file was deleted (replace mode)
      expect(await fs.pathExists(path.join(aissistDir, 'new-file.txt'))).toBe(false);
    });
  });

  describe('restore with merge-overwrite mode', () => {
    it('should restore backup in merge-overwrite mode', { timeout: 120000 }, async () => {
      // Modify existing file
      await fs.writeFile(
        path.join(aissistDir, 'goals', '2025-01-15.md'),
        '# Modified Goal\nThis should be overwritten'
      );

      // Add new file that shouldn't be deleted
      await fs.writeFile(
        path.join(aissistDir, 'extra-file.txt'),
        'This should remain'
      );

      const result = await execa('node', [
        cliPath,
        'restore',
        backupPath,
        '--mode',
        'merge-overwrite',
        '--yes',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Restore completed|Restore Summary/);

      // Check that conflicting file was overwritten
      const goalContent = await fs.readFile(
        path.join(aissistDir, 'goals', '2025-01-15.md'),
        'utf-8'
      );
      expect(goalContent).toContain('Original Goal');

      // Check that extra file remains
      expect(await fs.pathExists(path.join(aissistDir, 'extra-file.txt'))).toBe(true);
    });
  });

  describe('restore with merge-preserve mode', () => {
    it('should restore backup in merge-preserve mode', async () => {
      // Modify existing file
      await fs.writeFile(
        path.join(aissistDir, 'goals', '2025-01-15.md'),
        '# Preserved Goal\nThis should be preserved'
      );

      // Delete a file to test adding it back
      await fs.remove(path.join(aissistDir, 'history', '2025-01-15.md'));

      const result = await execa('node', [
        cliPath,
        'restore',
        backupPath,
        '--mode',
        'merge-preserve',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Restore completed|Restore Summary/);

      // Check that existing file was preserved
      const goalContent = await fs.readFile(
        path.join(aissistDir, 'goals', '2025-01-15.md'),
        'utf-8'
      );
      expect(goalContent).toContain('Preserved Goal');

      // Check that missing file was restored
      expect(await fs.pathExists(path.join(aissistDir, 'history', '2025-01-15.md'))).toBe(true);
    });
  });

  describe('restore error handling', () => {
    it('should fail for non-existent backup file', async () => {
      const result = await execa('node', [
        cliPath,
        'restore',
        '/nonexistent/backup.zip',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Backup file not found');
    });

    it('should fail for invalid restore mode', async () => {
      const result = await execa('node', [
        cliPath,
        'restore',
        backupPath,
        '--mode',
        'invalid-mode',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('Invalid restore mode');
    });

    it('should display restore summary with statistics', { timeout: 120000 }, async () => {
      // Modify some files for overwrite scenario
      await fs.writeFile(
        path.join(aissistDir, 'goals', '2025-01-15.md'),
        '# Modified'
      );

      const result = await execa('node', [
        cliPath,
        'restore',
        backupPath,
        '--mode',
        'merge-overwrite',
        '--yes',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Restore Summary');
      expect(result.stdout).toMatch(/(Added|Overwritten)/);
    });
  });

  describe('backup information display', () => {
    it('should display backup information before restore', async () => {
      const result = await execa('node', [
        cliPath,
        'restore',
        backupPath,
        '--mode',
        'merge-preserve',
      ], {
        cwd: testDir,
        reject: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Backup Information');
      expect(result.stdout).toContain('Test backup for restore');
      expect(result.stdout).toContain('Files:');
    });
  });
});
