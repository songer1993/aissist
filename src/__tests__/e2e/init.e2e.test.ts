/**
 * E2E Tests for Init with Description
 *
 * Tests the initialization flow with the optional description feature:
 * - Adding description via --description flag
 * - Verifying DESCRIPTION.md is created
 * - Skipping description when not provided
 *
 * Note: These tests run in non-TTY mode by piping input to prevent
 * interactive prompts (Claude Code integration, goal creation) from hanging.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execa } from 'execa';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Init with Description E2E', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aissist-init-e2e-'));
    // Path to the built CLI
    cliPath = path.join(__dirname, '..', '..', '..', 'dist', 'index.js');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should create DESCRIPTION.md when --description flag is provided', async () => {
    const description = 'Project Apollo sprint tracking';

    // Use input: '' to close stdin immediately, making it non-TTY and skipping interactive prompts
    const result = await execa('node', [cliPath, 'init', '--description', description], {
      cwd: tempDir,
      reject: false,
      input: '',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Description saved');

    // Verify DESCRIPTION.md was created
    const descriptionPath = path.join(tempDir, '.aissist', 'DESCRIPTION.md');
    expect(fs.existsSync(descriptionPath)).toBe(true);

    const content = fs.readFileSync(descriptionPath, 'utf-8');
    expect(content).toBe(description);
  });

  it('should not create DESCRIPTION.md when --description flag is not provided (non-TTY)', async () => {
    // Use input: '' to close stdin immediately, making it non-TTY
    const result = await execa('node', [cliPath, 'init'], {
      cwd: tempDir,
      reject: false,
      input: '',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Initialized aissist storage');

    // Verify DESCRIPTION.md was NOT created
    const descriptionPath = path.join(tempDir, '.aissist', 'DESCRIPTION.md');
    expect(fs.existsSync(descriptionPath)).toBe(false);
  });

  it('should initialize storage even with empty description flag', async () => {
    // Using empty string should still save an empty file (which loadDescription treats as null)
    const result = await execa('node', [cliPath, 'init', '--description', ''], {
      cwd: tempDir,
      reject: false,
      input: '',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Initialized aissist storage');

    // Storage should be created
    const storagePath = path.join(tempDir, '.aissist');
    expect(fs.existsSync(storagePath)).toBe(true);
    expect(fs.existsSync(path.join(storagePath, 'goals'))).toBe(true);
    expect(fs.existsSync(path.join(storagePath, 'history'))).toBe(true);
  });

  it('should handle description with special characters', async () => {
    const description = 'Q4 2025: Career goals & milestones (updated)';

    const result = await execa('node', [cliPath, 'init', '--description', description], {
      cwd: tempDir,
      reject: false,
      input: '',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    expect(result.exitCode).toBe(0);

    const descriptionPath = path.join(tempDir, '.aissist', 'DESCRIPTION.md');
    const content = fs.readFileSync(descriptionPath, 'utf-8');
    expect(content).toBe(description);
  });

  it('should not show description prompt when storage already exists', async () => {
    // First init
    await execa('node', [cliPath, 'init', '--description', 'First description'], {
      cwd: tempDir,
      reject: false,
      input: '',
    });

    // Second init attempt
    const result = await execa('node', [cliPath, 'init'], {
      cwd: tempDir,
      reject: false,
      input: '',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Storage already exists');
    expect(result.stdout).not.toContain('Description saved');

    // Original description should remain unchanged
    const descriptionPath = path.join(tempDir, '.aissist', 'DESCRIPTION.md');
    const content = fs.readFileSync(descriptionPath, 'utf-8');
    expect(content).toBe('First description');
  });
});
