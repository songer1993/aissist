# Add Backup and Restore Capabilities

## Why

Users need a reliable way to back up their aissist data to protect against accidental data loss, system failures, or when migrating to a new machine. Currently, there is no built-in mechanism to create portable backups or restore data from previous backups, leaving users vulnerable to data loss and making it difficult to transfer their aissist history between systems.

## What Changes

- Add `aissist backup` command to create ZIP archives of .aissist directories
- Add `aissist restore` command to restore data from backup archives
- Support three restore modes: replace (destructive), merge-overwrite (merge with overwrite on conflict), and merge-preserve (merge while preserving existing data)
- Store backups in `~/aissist-backups/` by default with configurable location via `--output` flag and config.json
- Include backup metadata (timestamp, aissist version, source path, file count, total size) in each archive
- Add backup integrity verification using checksums (SHA-256)
- Support automatic periodic backups on command execution (opt-in via config.json)
- Implement retention policy to automatically clean up old backups based on age/count limits (configurable)
- Add `aissist backup list` and `aissist backup clean` subcommands for management

## Impact

**Affected specs:**
- New capability: `backup-restore-system` (ADDED)
- `storage-system` (MODIFIED - add backup storage path resolution)
- `config-command` (MODIFIED - add backup configuration options)
- `cli-infrastructure` (MODIFIED - add backup/restore commands)

**Affected code:**
- `src/index.ts` - Register backup and restore commands
- `src/commands/backup.ts` - New backup command implementation
- `src/commands/restore.ts` - New restore command implementation
- `src/utils/storage.ts` - Add backup path resolution functions
- `src/utils/backup-helpers.ts` - New backup utilities (archive creation, verification)
- `src/utils/config.ts` or integrate into existing config - Add backup configuration schema
- `README.md` - Document backup and restore commands
- `CLAUDE.md` - Add backup/restore to architecture documentation

**Breaking changes:** None - This is a purely additive change
