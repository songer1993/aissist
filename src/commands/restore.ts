import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { confirm } from '@inquirer/prompts';
import { readBackupMetadata } from '../utils/backup-helpers.js';
import {
  restoreWithRollback,
  RestoreMode,
  checkDiskSpace,
} from '../utils/restore-helpers.js';
import { getStoragePath } from '../utils/storage.js';

const restoreCommand = new Command('restore')
  .description('Restore data from a backup')
  .argument('<backup-file>', 'Path to backup file to restore')
  .option(
    '-m, --mode <mode>',
    'Restore mode: replace, merge-overwrite, or merge-preserve',
    'merge-overwrite'
  )
  .option('--global', 'Restore to global storage')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (backupFile: string, options) => {
    const backupPath = path.resolve(backupFile);

    try {
      // Validate backup file exists
      if (!(await fs.pathExists(backupPath))) {
        console.log(chalk.red(`Backup file not found: ${backupPath}`));
        process.exit(1);
      }

      // Validate restore mode
      const mode = options.mode as RestoreMode;
      if (!['replace', 'merge-overwrite', 'merge-preserve'].includes(mode)) {
        console.log(
          chalk.red(
            'Invalid restore mode. Must be: replace, merge-overwrite, or merge-preserve'
          )
        );
        process.exit(1);
      }

      // Read and validate backup metadata
      const spinner = ora('Reading backup metadata...').start();

      const metadata = await readBackupMetadata(backupPath);

      if (!metadata) {
        spinner.fail('Invalid backup: missing metadata');
        process.exit(1);
      }

      spinner.succeed('Backup metadata loaded');

      // Display backup information
      console.log(chalk.bold('\nBackup Information:'));
      console.log(
        `  Date: ${chalk.cyan(new Date(metadata.timestamp).toLocaleString())}`
      );
      console.log(
        `  Aissist Version: ${chalk.cyan(metadata.aissistVersion)}`
      );
      console.log(`  Source: ${chalk.cyan(metadata.sourcePath)}`);
      console.log(`  Storage Type: ${chalk.cyan(metadata.storageType)}`);
      console.log(`  Files: ${chalk.cyan(metadata.fileCount)}`);
      console.log(
        `  Size: ${chalk.cyan(formatBytes(metadata.totalSize))}`
      );

      if (metadata.description) {
        console.log(`  Description: ${metadata.description}`);
      }

      // Determine target path
      let targetPath: string;
      if (options.global) {
        targetPath = path.join(require('os').homedir(), '.aissist');
      } else {
        targetPath = await getStoragePath();
      }

      // Check disk space
      const diskCheck = await checkDiskSpace(targetPath, metadata.totalSize);
      if (!diskCheck.available) {
        console.log(
          chalk.red(
            `\nInsufficient disk space. Required: ${formatBytes(metadata.totalSize)}`
          )
        );
        process.exit(1);
      }

      // Display restore plan
      console.log(chalk.bold('\nRestore Plan:'));
      console.log(`  Target: ${chalk.cyan(targetPath)}`);
      console.log(`  Mode: ${chalk.cyan(mode)}`);

      // Mode-specific warnings
      if (mode === 'replace') {
        console.log(
          chalk.yellow(
            '\n  ⚠️  WARNING: Replace mode will DELETE all existing data!'
          )
        );
        console.log(
          chalk.yellow(
            '  A safety backup will be created before proceeding.'
          )
        );
      } else if (mode === 'merge-overwrite') {
        console.log(
          chalk.yellow(
            '\n  ⚠️  Merge-overwrite will overwrite conflicting files.'
          )
        );
      } else if (mode === 'merge-preserve') {
        console.log(
          chalk.green(
            '\n  ✓ Merge-preserve will keep existing files on conflict.'
          )
        );
      }

      // Confirmation prompt (skip for merge-preserve or if --yes flag)
      if (mode === 'replace' || mode === 'merge-overwrite') {
        if (!options.yes) {
          const confirmed = await confirm({
            message: 'Proceed with restore?',
            default: false,
          });

          if (!confirmed) {
            console.log(chalk.yellow('\nRestore cancelled'));
            process.exit(0);
          }
        }
      }

      // Perform restore
      const restoreSpinner = ora('Restoring backup...').start();

      try {
        const result = await restoreWithRollback({
          backupPath,
          targetPath,
          mode,
          skipConfirmation: options.yes,
        });

        restoreSpinner.succeed('Restore completed successfully');

        // Display restore summary
        console.log(chalk.bold('\nRestore Summary:'));

        if (result.filesAdded > 0) {
          console.log(`  ${chalk.green('Added:')} ${result.filesAdded} files`);
        }
        if (result.filesOverwritten > 0) {
          console.log(
            `  ${chalk.yellow('Overwritten:')} ${result.filesOverwritten} files`
          );
        }
        if (result.filesPreserved > 0) {
          console.log(
            `  ${chalk.cyan('Preserved:')} ${result.filesPreserved} files`
          );
        }
        if (result.filesSkipped > 0) {
          console.log(
            `  ${chalk.gray('Skipped:')} ${result.filesSkipped} files`
          );
        }

        if (result.safetyBackupPath) {
          console.log(
            chalk.dim(`\nSafety backup created at: ${result.safetyBackupPath}`)
          );
        }
      } catch (restoreError) {
        restoreSpinner.fail('Restore failed');
        console.log(chalk.red(`\nError: ${(restoreError as Error).message}`));

        if (mode === 'replace') {
          console.log(
            chalk.yellow(
              '\nYour data has been restored from the safety backup.'
            )
          );
        }

        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export { restoreCommand };
