# Storage System - Delta Changes

## ADDED Requirements

### Requirement: Backup Path Resolution

The system SHALL provide functions to resolve backup storage locations.

#### Scenario: Get default backup directory
- **GIVEN** user has not configured a custom backup path
- **WHEN** system needs to resolve backup directory
- **THEN** the default path `~/aissist-backups/` is returned
- **AND** the directory is created if it doesn't exist

#### Scenario: Get configured backup directory
- **GIVEN** user has configured `backup.defaultPath` in config.json
- **WHEN** system needs to resolve backup directory
- **THEN** the configured path is returned
- **AND** the directory is created if it doesn't exist

### Requirement: Storage Type Detection

The system SHALL provide a function to identify whether a storage path is global or local.

#### Scenario: Identify global storage
- **GIVEN** user has a storage path of `~/.aissist/`
- **WHEN** system checks storage type
- **THEN** the storage is identified as "global"

#### Scenario: Identify local storage
- **GIVEN** user has a storage path in a project directory
- **WHEN** system checks storage type
- **THEN** the storage is identified as "local"
- **AND** the project path is included in the metadata
