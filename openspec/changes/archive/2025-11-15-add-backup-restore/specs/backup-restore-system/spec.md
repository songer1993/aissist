# Backup and Restore System

## Overview

The backup and restore system provides users with reliable data protection by creating portable ZIP archives of their aissist data and enabling restoration from these backups. The system supports multiple restore strategies, automatic backups, integrity verification, and retention policies.

## ADDED Requirements

### Requirement: Backup Creation

The system SHALL provide a command to create ZIP archives of aissist data directories.

#### Scenario: Basic backup creation
- **GIVEN** user has an initialized .aissist directory with data
- **WHEN** user runs `aissist backup`
- **THEN** a ZIP archive is created in `~/aissist-backups/` with filename format `aissist-backup-YYYY-MM-DD-HHmmss.zip`
- **AND** the archive contains all files and subdirectories from the .aissist directory
- **AND** a success message displays showing the backup path and size

#### Scenario: Backup to custom location
- **GIVEN** user has an initialized .aissist directory
- **WHEN** user runs `aissist backup --output /path/to/custom/backup.zip`
- **THEN** the backup is created at the specified path
- **AND** parent directories are created if they don't exist

#### Scenario: Backup with description
- **GIVEN** user has an initialized .aissist directory
- **WHEN** user runs `aissist backup --description "Before major refactor"`
- **THEN** the description is included in the backup metadata
- **AND** the description appears in backup listings

### Requirement: Backup Metadata

The system SHALL include metadata in each backup archive to enable verification and identification.

#### Scenario: Metadata file creation
- **GIVEN** user creates a backup
- **WHEN** the backup archive is created
- **THEN** a `.backup-metadata.json` file is included in the archive root
- **AND** the metadata contains: timestamp (ISO 8601), aissist version, source storage path, file count, total uncompressed size, and optional description
- **AND** the metadata includes a manifest of all files with their SHA-256 checksums

### Requirement: Backup Integrity Verification

The system SHALL verify backup integrity using checksums to ensure data consistency.

#### Scenario: Verify backup after creation
- **GIVEN** user creates a backup
- **WHEN** the backup process completes
- **THEN** the system verifies all files in the archive match their checksums in the metadata
- **AND** displays "Backup verified successfully" on success
- **AND** exits with error if verification fails

#### Scenario: Verify existing backup
- **GIVEN** user has an existing backup archive
- **WHEN** user runs `aissist backup verify /path/to/backup.zip`
- **THEN** the system checks all file checksums against the metadata
- **AND** reports any corrupted or missing files
- **AND** exits with code 0 if valid, non-zero if invalid

### Requirement: Data Restoration

The system SHALL provide a command to restore data from backup archives with configurable merge behavior.

#### Scenario: Full replacement restore
- **GIVEN** user has a backup archive and an existing .aissist directory
- **WHEN** user runs `aissist restore /path/to/backup.zip --mode replace`
- **THEN** the system displays a warning about data loss and requests confirmation
- **AND** after confirmation, the existing .aissist directory is backed up to a timestamped backup
- **AND** the existing .aissist directory is deleted
- **AND** the backup archive contents are extracted to .aissist/
- **AND** a success message displays showing the restore path

#### Scenario: Merge with overwrite restore
- **GIVEN** user has a backup archive
- **WHEN** user runs `aissist restore /path/to/backup.zip --mode merge-overwrite`
- **THEN** files from the backup are extracted to .aissist/
- **AND** existing files with the same path are overwritten
- **AND** existing files not in the backup are preserved
- **AND** a summary shows files added, overwritten, and preserved

#### Scenario: Merge with preserve restore
- **GIVEN** user has a backup archive
- **WHEN** user runs `aissist restore /path/to/backup.zip --mode merge-preserve`
- **THEN** files from the backup are extracted to .aissist/
- **AND** existing files with the same path are preserved (not overwritten)
- **AND** only new files from the backup are added
- **AND** a summary shows files added and skipped

#### Scenario: Restore to global storage
- **GIVEN** user has a backup from global storage
- **WHEN** user runs `aissist restore /path/to/backup.zip --global`
- **THEN** the backup is restored to `~/.aissist/` instead of local storage
- **AND** the restore mode (replace/merge-overwrite/merge-preserve) is respected

#### Scenario: Restore verification
- **GIVEN** user restores a backup
- **WHEN** the restore process completes
- **THEN** the system verifies extracted files match their checksums from the metadata
- **AND** displays "Restore verified successfully" on success
- **AND** rolls back changes if verification fails

### Requirement: Automatic Backup

The system SHALL support automatic periodic backups triggered by command execution.

#### Scenario: Auto-backup on command execution
- **GIVEN** user has enabled auto-backups in config.json with `autoBackup.enabled: true` and `autoBackup.intervalHours: 24`
- **AND** the last backup was more than 24 hours ago
- **WHEN** user runs any aissist command that modifies data (goal add, history log, todo add, etc.)
- **THEN** an automatic backup is created in the background before the command executes
- **AND** the backup is stored in the configured backup directory
- **AND** the command execution proceeds normally without blocking
- **AND** a subtle notification displays: "Auto-backup created: backup-YYYY-MM-DD-HHmmss.zip"

#### Scenario: Skip auto-backup if recent backup exists
- **GIVEN** user has enabled auto-backups with a 24-hour interval
- **AND** a backup was created less than 24 hours ago
- **WHEN** user runs a command that modifies data
- **THEN** no automatic backup is created
- **AND** the command proceeds normally

#### Scenario: Disable auto-backup
- **GIVEN** user has disabled auto-backups in config.json with `autoBackup.enabled: false`
- **WHEN** user runs any command
- **THEN** no automatic backup is created

### Requirement: Backup Management

The system SHALL provide commands to list and manage existing backups.

#### Scenario: List all backups
- **GIVEN** user has multiple backups in the default backup directory
- **WHEN** user runs `aissist backup list`
- **THEN** the system displays a table of backups with: filename, creation date, size, description, and validity status
- **AND** backups are sorted by creation date (newest first)

#### Scenario: List backups from custom directory
- **GIVEN** user has backups in a custom location
- **WHEN** user runs `aissist backup list --path /custom/backup/dir`
- **THEN** backups from the specified directory are listed

#### Scenario: Show backup details
- **GIVEN** user has a backup archive
- **WHEN** user runs `aissist backup info /path/to/backup.zip`
- **THEN** detailed metadata is displayed: creation timestamp, aissist version, source path, file count, size, description, and file manifest with checksums

### Requirement: Backup Retention Policy

The system SHALL automatically clean up old backups based on configurable retention policies.

#### Scenario: Auto-cleanup by age
- **GIVEN** user has configured retention policy with `retention.maxAgeDays: 30`
- **AND** backup directory contains backups older than 30 days
- **WHEN** a new backup is created or user runs `aissist backup clean`
- **THEN** backups older than 30 days are deleted
- **AND** a summary displays: "Cleaned up 3 old backups (older than 30 days)"

#### Scenario: Auto-cleanup by count
- **GIVEN** user has configured retention policy with `retention.maxCount: 10`
- **AND** backup directory contains more than 10 backups
- **WHEN** a new backup is created or user runs `aissist backup clean`
- **THEN** oldest backups beyond the 10 most recent are deleted
- **AND** a summary displays: "Cleaned up 2 old backups (keeping 10 most recent)"

#### Scenario: Combined retention policy
- **GIVEN** user has configured both `retention.maxAgeDays: 30` and `retention.maxCount: 10`
- **WHEN** cleanup is triggered
- **THEN** backups are deleted if they are older than 30 days OR beyond the 10 most recent
- **AND** a summary displays counts for each deletion reason

#### Scenario: Manual cleanup
- **GIVEN** user has multiple backups
- **WHEN** user runs `aissist backup clean --dry-run`
- **THEN** the system lists which backups would be deleted without actually deleting them
- **AND** user can run `aissist backup clean` to confirm deletion

### Requirement: Backup Configuration

The system SHALL support backup configuration via config.json.

#### Scenario: Default configuration
- **GIVEN** user has not configured backup settings
- **WHEN** user creates a backup
- **THEN** the backup is stored in `~/aissist-backups/`
- **AND** auto-backup is disabled by default
- **AND** no retention policy is enforced

#### Scenario: Custom configuration
- **GIVEN** user has configured backup settings in config.json:
  ```json
  {
    "backup": {
      "defaultPath": "/custom/backup/directory",
      "autoBackup": {
        "enabled": true,
        "intervalHours": 24
      },
      "retention": {
        "maxAgeDays": 30,
        "maxCount": 10
      }
    }
  }
  ```
- **WHEN** user creates a backup without specifying --output
- **THEN** the backup is stored in `/custom/backup/directory`
- **AND** auto-backups are enabled with a 24-hour interval
- **AND** retention policy is enforced

### Requirement: Error Handling

The system SHALL handle backup and restore errors gracefully with clear error messages.

#### Scenario: Backup with no initialized storage
- **GIVEN** user has not initialized aissist (no .aissist directory)
- **WHEN** user runs `aissist backup`
- **THEN** the system displays error: "No aissist storage found. Run 'aissist init' first."
- **AND** exits with non-zero code

#### Scenario: Restore with invalid archive
- **GIVEN** user has a corrupted or invalid backup file
- **WHEN** user runs `aissist restore /path/to/corrupt-backup.zip`
- **THEN** the system displays error: "Invalid backup archive: unable to read ZIP file"
- **AND** exits with non-zero code
- **AND** no changes are made to existing data

#### Scenario: Restore with missing metadata
- **GIVEN** user has a ZIP file without backup metadata
- **WHEN** user runs `aissist restore /path/to/archive.zip`
- **THEN** the system displays warning: "Backup metadata not found. Cannot verify integrity."
- **AND** prompts user to confirm restore without verification
- **AND** proceeds with restore if user confirms

#### Scenario: Disk space check before restore
- **GIVEN** user attempts to restore a large backup
- **WHEN** there is insufficient disk space
- **THEN** the system displays error: "Insufficient disk space. Required: 500 MB, Available: 100 MB"
- **AND** exits without modifying data

### Requirement: Command Line Interface

The system SHALL provide intuitive CLI commands for backup and restore operations.

#### Scenario: Backup command structure
- **GIVEN** user wants to create a backup
- **THEN** the following commands are available:
  - `aissist backup` - Create backup with default settings
  - `aissist backup --output <path>` - Create backup at custom location
  - `aissist backup --description <text>` - Add description to backup
  - `aissist backup list` - List all backups
  - `aissist backup list --path <dir>` - List backups from custom directory
  - `aissist backup info <path>` - Show backup metadata
  - `aissist backup verify <path>` - Verify backup integrity
  - `aissist backup clean` - Clean up old backups per retention policy
  - `aissist backup clean --dry-run` - Preview cleanup without deleting

#### Scenario: Restore command structure
- **GIVEN** user wants to restore a backup
- **THEN** the following commands are available:
  - `aissist restore <path>` - Restore with default mode (merge-overwrite)
  - `aissist restore <path> --mode replace` - Replace all data
  - `aissist restore <path> --mode merge-overwrite` - Merge, overwriting conflicts
  - `aissist restore <path> --mode merge-preserve` - Merge, preserving existing
  - `aissist restore <path> --global` - Restore to global storage
  - `aissist restore <path> --yes` - Skip confirmation prompts

### Requirement: Cross-Storage Backup

The system SHALL support backing up and restoring both global and local storage.

#### Scenario: Backup local storage
- **GIVEN** user is in a project with local .aissist storage
- **WHEN** user runs `aissist backup`
- **THEN** the local .aissist directory is backed up
- **AND** the metadata includes source path as the project directory

#### Scenario: Backup global storage
- **GIVEN** user has global ~/.aissist storage
- **AND** no local .aissist in current directory
- **WHEN** user runs `aissist backup`
- **THEN** the global ~/.aissist directory is backed up
- **AND** the metadata includes source path as "global"

#### Scenario: Explicit global backup
- **GIVEN** user has both local and global storage
- **WHEN** user runs `aissist backup --global`
- **THEN** the global ~/.aissist directory is backed up (ignoring local storage)
- **AND** the metadata marks it as a global backup
