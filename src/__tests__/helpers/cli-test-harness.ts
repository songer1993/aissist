/**
 * CLI Test Harness for E2E Testing
 *
 * Provides utilities for testing the aissist CLI in an isolated environment:
 * - Temporary .aissist storage directory for each test
 * - Mock Claude CLI integration
 * - Subprocess execution of CLI commands
 * - File system assertion helpers
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execa, type Options as ExecaOptions } from 'execa';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CliTestHarnessOptions {
  /**
   * Use mock Claude CLI instead of real one
   * Default: true (to avoid external dependencies in tests)
   */
  mockClaudeCli?: boolean;

  /**
   * Custom timeout for CLI commands (in ms)
   * Default: 30000 (30s), increased to 60000 in CI
   */
  timeout?: number;

  /**
   * Enable verbose output for debugging
   * Default: false, set to true in CI
   */
  verbose?: boolean;
}

export interface CliCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  failed: boolean;
}

/**
 * Test harness for running CLI commands in isolated environments
 */
export class CliTestHarness {
  private tempDir: string | null = null;
  private storagePath: string | null = null;
  private mockClaudePath: string | null = null;
  private originalPath: string;
  private options: Required<CliTestHarnessOptions>;

  constructor(options: CliTestHarnessOptions = {}) {
    this.originalPath = process.env.PATH || '';

    // Detect CI environment
    const isCI = process.env.CI === 'true';

    this.options = {
      mockClaudeCli: options.mockClaudeCli ?? true,
      timeout: options.timeout ?? (isCI ? 60000 : 30000),
      verbose: options.verbose ?? isCI,
    };
  }

  /**
   * Set up the test environment
   * - Create temporary .aissist directory
   * - Set up mock Claude CLI in PATH if enabled
   */
  async setup(): Promise<void> {
    // Create temporary directory for this test
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aissist-e2e-'));

    // Create .aissist storage directory
    this.storagePath = path.join(this.tempDir, '.aissist');
    fs.mkdirSync(this.storagePath, { recursive: true });

    if (this.options.verbose) {
      console.log(`[Test Harness] Created temp directory: ${this.tempDir}`);
      console.log(`[Test Harness] Storage path: ${this.storagePath}`);
    }

    // Set up mock Claude CLI if enabled
    if (this.options.mockClaudeCli) {
      await this.setupMockClaudeCli();
    }
  }

  /**
   * Set up mock Claude CLI in PATH
   */
  private async setupMockClaudeCli(): Promise<void> {
    // Create a bin directory in temp
    const binDir = path.join(this.tempDir!, 'bin');
    fs.mkdirSync(binDir, { recursive: true });

    // Create a wrapper script that calls our mock with tsx
    const mockSource = path.resolve(__dirname, '../mocks/mock-claude-cli.ts');
    const wrapperPath = path.join(binDir, 'claude');

    // Create a shell wrapper that invokes the mock via npx tsx
    const wrapperScript = `#!/bin/bash
npx tsx "${mockSource}" "$@"
`;

    fs.writeFileSync(wrapperPath, wrapperScript);
    fs.chmodSync(wrapperPath, 0o755);

    this.mockClaudePath = binDir;

    if (this.options.verbose) {
      console.log(`[Test Harness] Mock Claude CLI created at: ${wrapperPath}`);
    }
  }

  /**
   * Tear down the test environment
   * - Remove temporary directory
   * - Restore PATH
   */
  async teardown(): Promise<void> {
    if (this.tempDir && fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });

      if (this.options.verbose) {
        console.log(`[Test Harness] Cleaned up temp directory: ${this.tempDir}`);
      }
    }

    this.tempDir = null;
    this.storagePath = null;
    this.mockClaudePath = null;
  }

  /**
   * Run an aissist CLI command
   */
  async run(args: string[]): Promise<CliCommandResult> {
    if (!this.storagePath) {
      throw new Error('Test harness not set up. Call setup() first.');
    }

    // Build PATH with mock Claude CLI if enabled
    const env: Record<string, string> = {
      ...process.env,
      AISSIST_HOME: this.storagePath,
      NODE_ENV: 'test',
    };

    if (this.mockClaudePath) {
      env.PATH = `${this.mockClaudePath}:${this.originalPath}`;
    }

    // Get the path to the CLI entry point
    const cliPath = path.resolve(__dirname, '../../../dist/index.js');

    if (!fs.existsSync(cliPath)) {
      throw new Error(
        `CLI not built. Run 'npm run build' first. Looking for: ${cliPath}`
      );
    }

    const execaOptions: ExecaOptions = {
      env,
      cwd: this.tempDir!, // Run from temp directory so .aissist is found
      timeout: this.options.timeout,
      reject: false, // Don't throw on non-zero exit
      all: true, // Combine stdout and stderr
    };

    if (this.options.verbose) {
      console.log(`[Test Harness] Running: node ${cliPath} ${args.join(' ')}`);
      console.log(`[Test Harness] Environment: AISSIST_HOME=${this.storagePath}`);
    }

    try {
      const result = await execa('node', [cliPath, ...args], execaOptions);

      if (this.options.verbose && result.failed) {
        console.log(`[Test Harness] Command failed with exit code: ${result.exitCode}`);
        console.log(`[Test Harness] stdout: ${result.stdout}`);
        console.log(`[Test Harness] stderr: ${result.stderr}`);
      }

      return {
        stdout: String(result.stdout ?? ''),
        stderr: String(result.stderr ?? ''),
        exitCode: result.exitCode ?? 0,
        failed: result.failed,
      };
    } catch (error) {
      // Handle timeout or other errors
      if (this.options.verbose) {
        console.error('[Test Harness] Command error:', error);
      }
      throw error;
    }
  }

  /**
   * Assert that a command succeeded (exit code 0)
   */
  expectSuccess(result: CliCommandResult): void {
    if (result.failed) {
      throw new Error(
        `Command failed with exit code ${result.exitCode}\n` +
        `stdout: ${result.stdout}\n` +
        `stderr: ${result.stderr}`
      );
    }
  }

  /**
   * Get the storage path for this test
   */
  getStoragePath(): string {
    if (!this.storagePath) {
      throw new Error('Test harness not set up. Call setup() first.');
    }
    return this.storagePath;
  }

  /**
   * Get the temporary directory for this test
   */
  getTempDir(): string {
    if (!this.tempDir) {
      throw new Error('Test harness not set up. Call setup() first.');
    }
    return this.tempDir;
  }

  /**
   * Assert that a file exists in the storage directory
   */
  assertFileExists(relativePath: string): void {
    const fullPath = path.join(this.getStoragePath(), relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Expected file to exist: ${relativePath}`);
    }
  }

  /**
   * Read a file from the storage directory
   */
  readFile(relativePath: string): string {
    const fullPath = path.join(this.getStoragePath(), relativePath);
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * Assert that a file contains specific text
   */
  assertFileContains(relativePath: string, expectedText: string): void {
    const content = this.readFile(relativePath);
    if (!content.includes(expectedText)) {
      throw new Error(
        `Expected file ${relativePath} to contain: ${expectedText}\n` +
        `Actual content:\n${content}`
      );
    }
  }

  /**
   * List files in a directory within the storage
   */
  listFiles(relativePath: string = ''): string[] {
    const fullPath = path.join(this.getStoragePath(), relativePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }
    return fs.readdirSync(fullPath);
  }

  /**
   * Check if a file exists
   */
  fileExists(relativePath: string): boolean {
    const fullPath = path.join(this.getStoragePath(), relativePath);
    return fs.existsSync(fullPath);
  }
}
