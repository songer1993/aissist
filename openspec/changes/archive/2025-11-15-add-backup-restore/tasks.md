# Implementation Tasks

## 1. Core Backup Infrastructure

- [x] 1.1 Create `src/utils/backup-helpers.ts` with core backup utilities
  - [x] 1.1.1 Implement `createBackupArchive()` to create ZIP archives using `adm-zip` or `archiver`
  - [x] 1.1.2 Implement `generateBackupMetadata()` to create metadata JSON with timestamp, version, file list, and checksums
  - [x] 1.1.3 Implement `calculateChecksum()` helper for SHA-256 file hashing
  - [x] 1.1.4 Implement `verifyBackupIntegrity()` to validate archive contents against checksums
  - [x] 1.1.5 Add TypeScript interfaces: `BackupMetadata`, `BackupFileManifest`, `BackupOptions`

- [x] 1.2 Create `src/utils/restore-helpers.ts` with restore utilities
  - [x] 1.2.1 Implement `extractBackupArchive()` to extract ZIP archives
  - [x] 1.2.2 Implement `readBackupMetadata()` to parse metadata from archive
  - [x] 1.2.3 Implement `mergeDirectories()` with support for replace, merge-overwrite, and merge-preserve modes
  - [x] 1.2.4 Implement `createSafetyBackup()` to backup existing data before destructive operations
  - [x] 1.2.5 Implement `rollbackRestore()` for restore failure recovery
  - [x] 1.2.6 Add TypeScript interfaces: `RestoreOptions`, `RestoreMode`, `RestoreResult`

- [x] 1.3 Update `src/utils/storage.ts` with backup path resolution
  - [x] 1.3.1 Add `getBackupPath()` function to resolve backup storage location
  - [x] 1.3.2 Add `getBackupDirectory()` to return default or configured backup directory
  - [x] 1.3.3 Add `resolveStorageForBackup()` to determine whether to backup global or local storage

## 2. Configuration Schema

- [x] 2.1 Update `src/utils/storage.ts` ConfigSchema
  - [x] 2.1.1 Add `backup` config section with Zod schema
  - [x] 2.1.2 Add `backup.defaultPath` field (string, optional)
  - [x] 2.1.3 Add `backup.autoBackup.enabled` field (boolean, default: false)
  - [x] 2.1.4 Add `backup.autoBackup.intervalHours` field (number, default: 24)
  - [x] 2.1.5 Add `backup.retention.maxAgeDays` field (number, optional)
  - [x] 2.1.6 Add `backup.retention.maxCount` field (number, optional)

- [x] 2.2 Create backup configuration helpers
  - [x] 2.2.1 Add `getBackupConfig()` helper to load backup config with defaults
  - [x] 2.2.2 Add `shouldAutoBackup()` helper to check if auto-backup is due
  - [x] 2.2.3 Add `getLastBackupTime()` helper to read last backup timestamp from cache

## 3. Backup Command Implementation

- [x] 3.1 Create `src/commands/backup.ts`
  - [x] 3.1.1 Create main `backupCommand` using commander with subcommands
  - [x] 3.1.2 Implement `backup create` subcommand (default action)
    - [x] 3.1.2.1 Add `--output <path>` flag for custom backup location
    - [x] 3.1.2.2 Add `--description <text>` flag for backup description
    - [x] 3.1.2.3 Add `--global` flag to backup global storage
    - [x] 3.1.2.4 Resolve storage path (local vs global)
    - [x] 3.1.2.5 Generate backup filename: `aissist-backup-YYYY-MM-DD-HHmmss.zip`
    - [x] 3.1.2.6 Create ZIP archive with all .aissist contents
    - [x] 3.1.2.7 Generate and include `.backup-metadata.json`
    - [x] 3.1.2.8 Verify backup integrity post-creation
    - [x] 3.1.2.9 Update last backup timestamp in cache
    - [x] 3.1.2.10 Display success message with backup path and size

- [x] 3.2 Implement `backup list` subcommand
  - [x] 3.2.1 Add `--path <dir>` flag to list from custom directory
  - [x] 3.2.2 Scan backup directory for .zip files
  - [x] 3.2.3 Read metadata from each backup
  - [x] 3.2.4 Display table with: filename, date, size, description, validity
  - [x] 3.2.5 Sort by creation date (newest first)

- [x] 3.3 Implement `backup info` subcommand
  - [x] 3.3.1 Accept backup file path as argument
  - [x] 3.3.2 Extract and display metadata: timestamp, version, source path, file count, size, description
  - [x] 3.3.3 Display file manifest with checksums (truncated if long)

- [x] 3.4 Implement `backup verify` subcommand
  - [x] 3.4.1 Accept backup file path as argument
  - [x] 3.4.2 Verify all files in archive match metadata checksums
  - [x] 3.4.3 Report corrupted or missing files
  - [x] 3.4.4 Exit with code 0 if valid, non-zero if invalid

- [x] 3.5 Implement `backup clean` subcommand
  - [x] 3.5.1 Add `--dry-run` flag to preview without deleting
  - [x] 3.5.2 Load retention policy from config
  - [x] 3.5.3 Identify backups to delete based on age and count policies
  - [x] 3.5.4 Delete old backups (if not dry-run)
  - [x] 3.5.5 Display cleanup summary

## 4. Restore Command Implementation

- [x] 4.1 Create `src/commands/restore.ts`
  - [x] 4.1.1 Create `restoreCommand` using commander
  - [x] 4.1.2 Accept backup file path as required argument
  - [x] 4.1.3 Add `--mode <replace|merge-overwrite|merge-preserve>` flag (default: merge-overwrite)
  - [x] 4.1.4 Add `--global` flag to restore to global storage
  - [x] 4.1.5 Add `--yes` flag to skip confirmation prompts
  - [x] 4.1.6 Verify backup file exists and is readable
  - [x] 4.1.7 Read and validate backup metadata
  - [x] 4.1.8 Check disk space availability
  - [x] 4.1.9 Display warning and request confirmation (if mode is 'replace' and not --yes)
  - [x] 4.1.10 Create safety backup of existing data (if mode is 'replace')
  - [x] 4.1.11 Extract backup archive based on restore mode
  - [x] 4.1.12 Verify restored files match checksums
  - [x] 4.1.13 Rollback on verification failure
  - [x] 4.1.14 Display restore summary (files added, overwritten, skipped, preserved)

## 5. Auto-Backup Integration

- [x] 5.1 Create `src/utils/auto-backup.ts`
  - [x] 5.1.1 Implement `checkAndPerformAutoBackup()` function
  - [x] 5.1.2 Check if auto-backup is enabled in config
  - [x] 5.1.3 Check if backup is due based on intervalHours
  - [x] 5.1.4 Trigger background backup asynchronously
  - [x] 5.1.5 Update last backup timestamp on success
  - [x] 5.1.6 Display subtle notification on auto-backup creation
  - [x] 5.1.7 Silently fail if auto-backup encounters errors (non-critical)

- [ ] 5.2 Integrate auto-backup into data-modifying commands
  - [ ] 5.2.1 Import `checkAndPerformAutoBackup()` in commands: goal, history, todo, context, reflect
  - [ ] 5.2.2 Call auto-backup check at the start of each command handler (before modifying data)
  - [ ] 5.2.3 Ensure auto-backup runs asynchronously without blocking command execution

## 6. CLI Registration

- [x] 6.1 Update `src/index.ts`
  - [x] 6.1.1 Import `backupCommand` and `restoreCommand`
  - [x] 6.1.2 Register commands: `program.addCommand(backupCommand)` and `program.addCommand(restoreCommand)`

## 7. Error Handling

- [x] 7.1 Add comprehensive error handling in backup-helpers.ts
  - [x] 7.1.1 Handle ZIP creation failures (disk full, permission denied)
  - [x] 7.1.2 Handle checksum calculation errors
  - [x] 7.1.3 Handle verification failures with clear error messages

- [x] 7.2 Add comprehensive error handling in restore-helpers.ts
  - [x] 7.2.1 Handle ZIP extraction failures (corrupted archive, permission denied)
  - [x] 7.2.2 Handle invalid or missing metadata gracefully
  - [x] 7.2.3 Handle disk space check failures
  - [x] 7.2.4 Handle merge conflicts and rollback scenarios

- [x] 7.3 Add validation in backup and restore commands
  - [x] 7.3.1 Validate backup file paths exist before restore
  - [x] 7.3.2 Validate storage is initialized before backup
  - [x] 7.3.3 Display user-friendly error messages for all failure cases

## 8. Testing

- [x] 8.1 Unit tests for backup-helpers.ts
  - [x] 8.1.1 Test `createBackupArchive()` with various directory structures
  - [x] 8.1.2 Test `generateBackupMetadata()` produces valid JSON
  - [x] 8.1.3 Test `verifyBackupIntegrity()` detects corrupted files
  - [x] 8.1.4 Test checksum calculation correctness

- [x] 8.2 Unit tests for restore-helpers.ts
  - [x] 8.2.1 Test `extractBackupArchive()` with valid archives
  - [x] 8.2.2 Test `mergeDirectories()` for all three modes (replace, merge-overwrite, merge-preserve)
  - [x] 8.2.3 Test rollback scenarios

- [x] 8.3 E2E tests for backup command
  - [x] 8.3.1 Test backup creation with default settings
  - [x] 8.3.2 Test backup with custom output path
  - [x] 8.3.3 Test backup with description
  - [x] 8.3.4 Test backup list command
  - [x] 8.3.5 Test backup info command
  - [x] 8.3.6 Test backup verify command
  - [x] 8.3.7 Test backup clean command with retention policies

- [x] 8.4 E2E tests for restore command
  - [x] 8.4.1 Test restore with replace mode
  - [x] 8.4.2 Test restore with merge-overwrite mode (fixed --yes flag issue)
  - [x] 8.4.3 Test restore with merge-preserve mode
  - [x] 8.4.4 Test restore to global storage
  - [x] 8.4.5 Test restore with invalid archive
  - [x] 8.4.6 Test restore verification and rollback

- [ ] 8.5 E2E tests for auto-backup
  - [ ] 8.5.1 Test auto-backup triggers after interval
  - [ ] 8.5.2 Test auto-backup skips when recent backup exists
  - [ ] 8.5.3 Test auto-backup respects enabled/disabled config

- [ ] 8.6 Integration tests for retention policy
  - [ ] 8.6.1 Test cleanup by maxAgeDays
  - [ ] 8.6.2 Test cleanup by maxCount
  - [ ] 8.6.3 Test combined retention policies

## 9. Documentation

- [ ] 9.1 Update README.md
  - [ ] 9.1.1 Add "Backup and Restore" section to features list
  - [ ] 9.1.2 Add `aissist backup` command documentation with all subcommands
  - [ ] 9.1.3 Add `aissist restore` command documentation with all flags
  - [ ] 9.1.4 Add examples for common backup/restore workflows
  - [ ] 9.1.5 Add section on auto-backup configuration
  - [ ] 9.1.6 Add section on retention policy configuration

- [ ] 9.2 Update CLAUDE.md
  - [ ] 9.2.1 Add backup-restore system to architecture overview
  - [ ] 9.2.2 Document backup file format and metadata structure
  - [ ] 9.2.3 Document restore modes and when to use each
  - [ ] 9.2.4 Add notes on backup storage location resolution

- [ ] 9.3 Update CONTRIBUTING.md (if applicable)
  - [ ] 9.3.1 Add guidance on testing backup/restore functionality during development

## 10. Dependencies

- [x] 10.1 Add npm dependencies
  - [x] 10.1.1 Add `adm-zip` or `archiver` for ZIP archive creation and extraction
  - [x] 10.1.2 Add type definitions: `@types/adm-zip` or `@types/archiver`
  - [x] 10.1.3 Verify no conflicting dependencies

## 11. Validation and Polish

- [ ] 11.1 Run `openspec validate add-backup-restore --strict` and fix any issues
- [ ] 11.2 Run all tests: `npm run test:all`
- [ ] 11.3 Run linter: `npm run lint` and fix any issues
- [ ] 11.4 Manual testing of all backup and restore scenarios
- [ ] 11.5 Test with both global and local storage configurations
- [ ] 11.6 Test backup/restore with large datasets (>100MB)
- [ ] 11.7 Test error scenarios (disk full, permission denied, corrupted archives)
- [ ] 11.8 Verify auto-backup works across all data-modifying commands
- [ ] 11.9 Verify retention policy cleanup works as expected
