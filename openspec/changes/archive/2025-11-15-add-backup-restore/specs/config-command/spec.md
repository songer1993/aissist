# Config Command - Delta Changes

## MODIFIED Requirements

### Requirement: Configuration Schema

The system SHALL support backup-related configuration options in config.json.

**Previous state:** Config schema included version, createdAt, lastModified, animations, hints, updateCheck, and readPaths.

**New state:** Config schema includes all previous fields PLUS a new `backup` section:

```typescript
backup: {
  defaultPath?: string;  // Custom backup directory path
  autoBackup: {
    enabled: boolean;        // Default: false
    intervalHours: number;   // Default: 24
  };
  retention: {
    maxAgeDays?: number;    // Delete backups older than N days
    maxCount?: number;      // Keep only N most recent backups
  };
}
```

#### Scenario: Load default backup configuration
- **GIVEN** user has not configured backup settings in config.json
- **WHEN** the config is loaded
- **THEN** backup defaults are applied:
  - `defaultPath`: undefined (uses `~/aissist-backups/`)
  - `autoBackup.enabled`: false
  - `autoBackup.intervalHours`: 24
  - `retention.maxAgeDays`: undefined (no age-based cleanup)
  - `retention.maxCount`: undefined (no count-based cleanup)

#### Scenario: Load custom backup configuration
- **GIVEN** user has configured backup settings in config.json
- **WHEN** the config is loaded
- **THEN** custom backup configuration is applied
- **AND** all backup commands respect the configured settings

#### Scenario: Validate backup configuration
- **GIVEN** user edits config.json manually
- **WHEN** the config is loaded
- **THEN** the backup section is validated using Zod schema
- **AND** invalid configurations are rejected with clear error messages
- **AND** `autoBackup.intervalHours` must be a positive number
- **AND** `retention.maxAgeDays` and `retention.maxCount` must be positive numbers if provided
