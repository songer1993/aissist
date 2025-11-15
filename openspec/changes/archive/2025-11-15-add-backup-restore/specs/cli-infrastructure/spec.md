# CLI Infrastructure - Delta Changes

## ADDED Requirements

### Requirement: Backup Command Registration

The system SHALL register the backup command in the CLI.

#### Scenario: Register backup command
- **GIVEN** the CLI is initialized
- **WHEN** commands are registered
- **THEN** `aissist backup` command is available
- **AND** all backup subcommands are accessible

### Requirement: Restore Command Registration

The system SHALL register the restore command in the CLI.

#### Scenario: Register restore command
- **GIVEN** the CLI is initialized
- **WHEN** commands are registered
- **THEN** `aissist restore` command is available
- **AND** all restore options are accessible

### Requirement: Command Help Text

The system SHALL provide descriptive help text for backup and restore commands.

#### Scenario: View backup help
- **GIVEN** user runs `aissist backup --help`
- **THEN** help text displays all subcommands: (create), list, info, verify, clean
- **AND** help text displays all flags: --output, --description, --global, --path, --dry-run
- **AND** help text includes usage examples

#### Scenario: View restore help
- **GIVEN** user runs `aissist restore --help`
- **THEN** help text displays all flags: --mode, --global, --yes
- **AND** help text describes restore modes: replace, merge-overwrite, merge-preserve
- **AND** help text includes usage examples
