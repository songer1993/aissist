import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { confirm } from '@inquirer/prompts';
import {
  createBackupArchive,
  verifyBackupIntegrity,
  readBackupMetadata,
  listBackups,
  generateBackupFilename,
} from '../utils/backup-helpers.js';
import {
  getStoragePath,
  isGlobalStorage,
  getBackupDirectory,
  getBackupConfig,
  setLastBackupTime,
} from '../utils/storage.js';

// Backup subcommands
const backupCommand = new Command('backup')
  .description('Create and manage backups of your aissist data');

// ============================================================================
// BACKUP CREATE
// ============================================================================

backupCommand
  .command('create')
  .alias('c')
  .description('Create a backup of your aissist data')
  .option('-o, --output <path>', 'Custom backup output path')
  .option('-d, --description <text>', 'Backup description')
  .option('--global', 'Backup global storage instead of local')
  .action(async (options) => {
    const spinner = ora('Creating backup...').start();

    try {
      // Determine storage path
      let storagePath: string;
      if (options.global) {
        storagePath = path.join(require('os').homedir(), '.aissist');
      } else {
        storagePath = await getStoragePath();
      }

      // Check if storage exists
      if (!(await fs.pathExists(storagePath))) {
        spinner.fail('Storage directory not found');
        console.log(
          chalk.yellow(
            `\nRun ${chalk.bold('aissist init')} to initialize storage first.`
          )
        );
        process.exit(1);
      }

      // Determine output path
      let outputPath: string;
      if (options.output) {
        outputPath = path.resolve(options.output);
      } else {
        const backupDir = await getBackupDirectory(storagePath);
        await fs.ensureDir(backupDir);
        outputPath = path.join(backupDir, generateBackupFilename());
      }

      // Determine storage type
      const storageType = (await isGlobalStorage()) ? 'global' : 'local';

      // Create backup
      spinner.text = 'Creating ZIP archive...';
      const result = await createBackupArchive({
        sourcePath: storagePath,
        outputPath,
        description: options.description,
        storageType,
      });

      // Verify backup integrity
      spinner.text = 'Verifying backup integrity...';
      const verification = await verifyBackupIntegrity(result.backupPath);

      if (!verification.valid) {
        spinner.fail('Backup verification failed');
        console.log(chalk.red('\nErrors:'));
        verification.errors.forEach((err) => console.log(chalk.red(`  ${err}`)));

        // Delete invalid backup
        await fs.remove(result.backupPath);
        process.exit(1);
      }

      // Update last backup timestamp
      await setLastBackupTime(storagePath);

      spinner.succeed('Backup created successfully');

      // Display summary
      console.log(chalk.bold('\nBackup Details:'));
      console.log(`  Location: ${chalk.cyan(result.backupPath)}`);
      console.log(`  Files: ${chalk.cyan(result.metadata.fileCount)}`);
      console.log(
        `  Size: ${chalk.cyan(formatBytes(result.metadata.totalSize))}`
      );
      console.log(`  Storage: ${chalk.cyan(storageType)}`);
      if (result.metadata.description) {
        console.log(`  Description: ${result.metadata.description}`);
      }
    } catch (error) {
      spinner.fail('Backup failed');
      console.log(chalk.red(`\nError: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Make create the default action
backupCommand.action(async (_options, command: Command) => {
  // If no subcommand is provided, execute create
  if (command.args.length === 0) {
    await command.commands.find((cmd) => cmd.name() === 'create')?.parseAsync([
      process.argv[0],
      process.argv[1],
      'create',
      ...process.argv.slice(3),
    ]);
  }
});

// ============================================================================
// BACKUP LIST
// ============================================================================

backupCommand
  .command('list')
  .alias('ls')
  .description('List all available backups')
  .option('-p, --path <dir>', 'Custom backup directory to list from')
  .action(async (options) => {
    try {
      // Determine backup directory
      let backupDir: string;
      if (options.path) {
        backupDir = path.resolve(options.path);
      } else {
        const storagePath = await getStoragePath();
        backupDir = await getBackupDirectory(storagePath);
      }

      // List backups
      const backups = await listBackups(backupDir);

      if (backups.length === 0) {
        console.log(chalk.yellow('No backups found'));
        console.log(chalk.dim(`\nBackup directory: ${backupDir}`));
        return;
      }

      console.log(chalk.bold(`\nBackups in ${backupDir}:\n`));

      // Display table
      backups.forEach((backup, index) => {
        const filename = path.basename(backup.path);
        const valid = backup.metadata ? chalk.green('✓') : chalk.red('✗');

        console.log(
          `${chalk.cyan((index + 1).toString().padStart(2))}. ${valid} ${chalk.bold(filename)}`
        );

        if (backup.metadata) {
          const date = new Date(backup.metadata.timestamp).toLocaleString();
          const size = formatBytes(backup.metadata.totalSize);

          console.log(`    ${chalk.dim('Date:')} ${date}`);
          console.log(
            `    ${chalk.dim('Files:')} ${backup.metadata.fileCount} (${size})`
          );
          console.log(
            `    ${chalk.dim('Storage:')} ${backup.metadata.storageType}`
          );

          if (backup.metadata.description) {
            console.log(
              `    ${chalk.dim('Description:')} ${backup.metadata.description}`
            );
          }
        } else {
          console.log(chalk.red('    Invalid backup (missing metadata)'));
        }

        console.log(); // Empty line between backups
      });
    } catch (error) {
      console.log(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// ============================================================================
// BACKUP INFO
// ============================================================================

backupCommand
  .command('info <backup-file>')
  .description('Display detailed information about a backup')
  .action(async (backupFile: string) => {
    try {
      const backupPath = path.resolve(backupFile);

      if (!(await fs.pathExists(backupPath))) {
        console.log(chalk.red(`Backup file not found: ${backupPath}`));
        process.exit(1);
      }

      const metadata = await readBackupMetadata(backupPath);

      if (!metadata) {
        console.log(chalk.red('Invalid backup: missing metadata'));
        process.exit(1);
      }

      // Display detailed information
      console.log(chalk.bold('\nBackup Information:\n'));
      console.log(
        `  ${chalk.dim('File:')} ${chalk.cyan(path.basename(backupPath))}`
      );
      console.log(
        `  ${chalk.dim('Version:')} ${chalk.cyan(metadata.version)}`
      );
      console.log(
        `  ${chalk.dim('Date:')} ${chalk.cyan(new Date(metadata.timestamp).toLocaleString())}`
      );
      console.log(
        `  ${chalk.dim('Aissist Version:')} ${chalk.cyan(metadata.aissistVersion)}`
      );
      console.log(
        `  ${chalk.dim('Source Path:')} ${chalk.cyan(metadata.sourcePath)}`
      );
      console.log(
        `  ${chalk.dim('Storage Type:')} ${chalk.cyan(metadata.storageType)}`
      );
      console.log(
        `  ${chalk.dim('File Count:')} ${chalk.cyan(metadata.fileCount)}`
      );
      console.log(
        `  ${chalk.dim('Total Size:')} ${chalk.cyan(formatBytes(metadata.totalSize))}`
      );

      if (metadata.description) {
        console.log(
          `  ${chalk.dim('Description:')} ${metadata.description}`
        );
      }

      // Display file manifest (truncated if too long)
      console.log(chalk.bold('\nFiles:'));
      const displayLimit = 20;
      const filesToShow = metadata.manifest.slice(0, displayLimit);

      filesToShow.forEach((file) => {
        console.log(
          `  ${chalk.dim(file.path)} ${chalk.gray(`(${formatBytes(file.size)})`)}`
        );
      });

      if (metadata.manifest.length > displayLimit) {
        console.log(
          chalk.dim(
            `  ... and ${metadata.manifest.length - displayLimit} more files`
          )
        );
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// ============================================================================
// BACKUP VERIFY
// ============================================================================

backupCommand
  .command('verify <backup-file>')
  .description('Verify backup integrity')
  .action(async (backupFile: string) => {
    const backupPath = path.resolve(backupFile);
    const spinner = ora('Verifying backup...').start();

    try {
      if (!(await fs.pathExists(backupPath))) {
        spinner.fail('Backup file not found');
        console.log(chalk.red(`\nPath: ${backupPath}`));
        process.exit(1);
      }

      const verification = await verifyBackupIntegrity(backupPath);

      if (verification.valid) {
        spinner.succeed('Backup is valid');
        process.exit(0);
      } else {
        spinner.fail('Backup verification failed');
        console.log(chalk.red('\nErrors:'));
        verification.errors.forEach((err) => console.log(chalk.red(`  ${err}`)));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Verification failed');
      console.log(chalk.red(`\nError: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// ============================================================================
// BACKUP CLEAN
// ============================================================================

backupCommand
  .command('clean')
  .description('Clean up old backups based on retention policy')
  .option('--dry-run', 'Preview backups to be deleted without deleting')
  .option('-p, --path <dir>', 'Custom backup directory')
  .action(async (options) => {
    try {
      // Determine backup directory
      let backupDir: string;
      if (options.path) {
        backupDir = path.resolve(options.path);
      } else {
        const storagePath = await getStoragePath();
        backupDir = await getBackupDirectory(storagePath);
      }

      // Load retention policy
      const storagePath = await getStoragePath();
      const config = await getBackupConfig(storagePath);
      const { retention } = config;

      if (!retention.maxAgeDays && !retention.maxCount) {
        console.log(
          chalk.yellow(
            'No retention policy configured. Use config.backup.retention to set policies.'
          )
        );
        return;
      }

      // List backups
      const backups = await listBackups(backupDir);

      if (backups.length === 0) {
        console.log(chalk.yellow('No backups found to clean'));
        return;
      }

      // Determine backups to delete
      const toDelete: typeof backups = [];

      // Age-based cleanup
      if (retention.maxAgeDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retention.maxAgeDays);

        for (const backup of backups) {
          if (
            backup.metadata &&
            new Date(backup.metadata.timestamp) < cutoffDate
          ) {
            if (!toDelete.find((b) => b.path === backup.path)) {
              toDelete.push(backup);
            }
          }
        }
      }

      // Count-based cleanup
      if (retention.maxCount && backups.length > retention.maxCount) {
        const sorted = [...backups].sort((a, b) => {
          const timeA = a.metadata
            ? new Date(a.metadata.timestamp).getTime()
            : 0;
          const timeB = b.metadata
            ? new Date(b.metadata.timestamp).getTime()
            : 0;
          return timeB - timeA; // Newest first
        });

        const toDeleteByCount = sorted.slice(retention.maxCount);
        for (const backup of toDeleteByCount) {
          if (!toDelete.find((b) => b.path === backup.path)) {
            toDelete.push(backup);
          }
        }
      }

      if (toDelete.length === 0) {
        console.log(chalk.green('No backups need to be cleaned up'));
        return;
      }

      // Display backups to delete
      console.log(
        chalk.bold(
          `\n${options.dryRun ? 'Would delete' : 'Deleting'} ${toDelete.length} backup(s):\n`
        )
      );

      for (const backup of toDelete) {
        const filename = path.basename(backup.path);
        const date = backup.metadata
          ? new Date(backup.metadata.timestamp).toLocaleString()
          : 'Unknown date';

        console.log(`  ${chalk.yellow('•')} ${filename} (${chalk.dim(date)})`);
      }

      if (options.dryRun) {
        console.log(chalk.dim('\nDry run - no backups were deleted'));
        return;
      }

      // Confirm deletion
      const confirmed = await confirm({
        message: 'Delete these backups?',
        default: false,
      });

      if (!confirmed) {
        console.log(chalk.yellow('\nCancelled'));
        return;
      }

      // Delete backups
      const spinner = ora('Deleting backups...').start();

      for (const backup of toDelete) {
        await fs.remove(backup.path);
      }

      spinner.succeed(`Deleted ${toDelete.length} backup(s)`);
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

export { backupCommand };
