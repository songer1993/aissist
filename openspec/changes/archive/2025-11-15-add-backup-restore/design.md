# Backup and Restore System Design

## Architecture Overview

The backup and restore system is designed as a layered architecture that integrates seamlessly with aissist's existing storage abstraction:

```
┌─────────────────────────────────────────────────┐
│          CLI Commands Layer                      │
│  (backup.ts, restore.ts)                        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Service Layer                           │
│  (backup-helpers.ts, restore-helpers.ts)        │
│  - Archive creation/extraction                   │
│  - Metadata generation/validation                │
│  - Integrity verification                        │
│  - Merge strategies                              │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Storage Layer                           │
│  (storage.ts)                                    │
│  - Path resolution                               │
│  - Config management                             │
│  - File I/O                                      │
└──────────────────────────────────────────────────┘
```

## Technical Decisions

### 1. Archive Format: ZIP

**Decision:** Use ZIP format for backup archives.

**Rationale:**
- Universal support across all platforms (Windows, macOS, Linux)
- Can be opened with standard tools (no aissist required for inspection)
- Good compression ratio for text-heavy markdown files
- Well-supported in Node.js ecosystem (adm-zip, archiver)
- Allows inclusion of metadata file in the archive

**Alternatives considered:**
- Tarball (.tar.gz): Less familiar to non-technical users on Windows
- JSON export: Loses markdown formatting and human readability
- Plain directory: No compression, harder to distribute

**Implementation library:** `adm-zip` (lightweight) or `archiver` (streaming support for large archives)

### 2. Metadata Format: JSON

**Decision:** Include `.backup-metadata.json` file in the archive root.

**Structure:**
```json
{
  "version": "1.0",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "aissistVersion": "1.2.3",
  "sourcePath": "/Users/john/projects/myapp/.aissist",
  "storageType": "local",
  "description": "Before major refactor",
  "fileCount": 147,
  "totalSize": 524288,
  "manifest": [
    {
      "path": "goals/2025-01-15.md",
      "size": 1024,
      "checksum": "sha256:abc123..."
    }
  ]
}
```

**Rationale:**
- Human-readable and machine-parseable
- Enables verification without extracting the entire archive
- Allows future versioning of backup format
- Supports filtering and querying backup contents

### 3. Integrity Verification: SHA-256 Checksums

**Decision:** Use SHA-256 for file integrity checks.

**Rationale:**
- Cryptographically strong (collision-resistant)
- Fast enough for typical aissist data sizes (<1GB)
- Standard in Node.js crypto module
- Balance between security and performance

**Verification flow:**
1. During backup: Calculate checksum for each file, store in manifest
2. Post-backup: Verify all files in archive match stored checksums
3. Pre-restore: Verify archive integrity before extracting
4. Post-restore: Verify extracted files match checksums

### 4. Restore Modes: Three Strategies

**Decision:** Support three distinct restore modes to handle different use cases.

#### Mode: `replace` (Destructive)
- **Use case:** Fresh start, restoring to a clean state
- **Behavior:**
  1. Create safety backup of existing .aissist (timestamped)
  2. Delete existing .aissist
  3. Extract backup to .aissist
- **Confirmation:** Always requires user confirmation (unless --yes flag)

#### Mode: `merge-overwrite` (Default)
- **Use case:** Restoring recent changes, importing data from another machine
- **Behavior:**
  1. Extract backup files
  2. Overwrite existing files with same paths
  3. Keep existing files not in backup
- **Confirmation:** Optional confirmation

#### Mode: `merge-preserve` (Safest)
- **Use case:** Importing historical data without losing current work
- **Behavior:**
  1. Extract backup files
  2. Skip files that already exist (preserve existing)
  3. Only add new files from backup
- **Confirmation:** No confirmation needed (non-destructive)

**Trade-offs:**
- `replace`: Cleanest restore but risk of data loss (mitigated by safety backup)
- `merge-overwrite`: Most practical for typical restore scenarios
- `merge-preserve`: Safest but may result in inconsistent state if backup contains updates to existing files

### 5. Backup Storage Location

**Decision:** Default to `~/aissist-backups/`, configurable via config.json.

**Path resolution priority:**
1. `--output` flag (explicit path)
2. `config.backup.defaultPath` (user-configured)
3. `~/aissist-backups/` (default)

**Rationale:**
- Centralized location makes backups easy to find
- Outside .aissist directory to avoid backing up backups
- User home directory ensures backups survive project deletion
- Configurable for users with specific storage requirements (e.g., network drives)

### 6. Auto-Backup Strategy

**Decision:** Implement opt-in auto-backup triggered by data-modifying commands.

**Trigger mechanism:**
- Hook into existing command handlers (goal add, history log, todo add, etc.)
- Check `shouldAutoBackup()` before executing command logic
- Create backup asynchronously (non-blocking)
- Cache last backup timestamp to avoid redundant backups

**Configuration:**
```json
{
  "backup": {
    "autoBackup": {
      "enabled": false,  // Opt-in (default: false)
      "intervalHours": 24  // Minimum time between auto-backups
    }
  }
}
```

**Rationale:**
- Opt-in: Avoids surprising users with automatic file creation
- Interval-based: Prevents excessive backups on rapid command execution
- Non-blocking: Doesn't slow down user commands
- Data-modifying commands only: Read commands (list, show) don't trigger backups

**Edge cases:**
- Command fails: Auto-backup still created (captures pre-command state)
- Backup fails: Command proceeds normally (auto-backup is non-critical)
- Multiple concurrent commands: Last backup timestamp prevents duplicate backups

### 7. Retention Policy

**Decision:** Support age-based and count-based retention policies.

**Policy types:**
- `maxAgeDays`: Delete backups older than N days
- `maxCount`: Keep only the N most recent backups

**Cleanup triggers:**
1. After creating new backup (auto-cleanup)
2. Explicit `aissist backup clean` command
3. Manual cleanup with `--dry-run` preview

**Implementation:**
```typescript
interface RetentionPolicy {
  maxAgeDays?: number;
  maxCount?: number;
}

function getBackupsToDelete(
  backups: BackupInfo[],
  policy: RetentionPolicy
): BackupInfo[] {
  const toDelete: BackupInfo[] = [];

  // Age-based cleanup
  if (policy.maxAgeDays) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.maxAgeDays);
    toDelete.push(...backups.filter(b => b.timestamp < cutoffDate));
  }

  // Count-based cleanup
  if (policy.maxCount) {
    const sorted = backups.sort((a, b) => b.timestamp - a.timestamp);
    toDelete.push(...sorted.slice(policy.maxCount));
  }

  // Remove duplicates (union of both policies)
  return Array.from(new Set(toDelete));
}
```

**Rationale:**
- Age-based: Natural for "keep backups from last 30 days"
- Count-based: Natural for "keep last 10 backups"
- Combined: Allows flexible policies like "keep last 10 OR anything from last 30 days"

### 8. Error Handling and Recovery

**Decision:** Implement defensive error handling with automatic rollback.

**Error scenarios and handling:**

#### Backup failures:
- **Disk full:** Check available space before creating archive, fail early with clear message
- **Permission denied:** Catch error, suggest checking directory permissions
- **Verification failure:** Delete incomplete backup, report error

#### Restore failures:
- **Corrupted archive:** Detect during metadata read, fail before extraction
- **Disk space:** Check before extraction, fail early
- **Verification failure:** Rollback to safety backup (if replace mode)
- **Missing metadata:** Warn user, offer to proceed without verification

**Rollback mechanism:**
```typescript
async function restoreWithRollback(
  backupPath: string,
  options: RestoreOptions
): Promise<RestoreResult> {
  let safetyBackupPath: string | null = null;

  try {
    // Create safety backup for destructive operations
    if (options.mode === 'replace') {
      safetyBackupPath = await createSafetyBackup(storagePath);
    }

    // Perform restore
    const result = await extractAndMerge(backupPath, options);

    // Verify
    await verifyRestore(result);

    return result;
  } catch (error) {
    // Rollback on failure
    if (safetyBackupPath) {
      await restoreFromSafetyBackup(safetyBackupPath, storagePath);
    }
    throw error;
  } finally {
    // Cleanup safety backup on success
    if (safetyBackupPath) {
      await deleteSafetyBackup(safetyBackupPath);
    }
  }
}
```

### 9. Performance Considerations

**Large backup optimization:**
- Use streaming APIs (archiver) for archives >100MB
- Calculate checksums incrementally during file read (single pass)
- Compress in background thread (if available via worker_threads)

**Restore optimization:**
- Extract only necessary files for merge modes
- Skip checksum verification for known-good local files (merge-preserve)
- Batch file writes to reduce I/O operations

**Memory limits:**
- Avoid loading entire archive into memory
- Stream files directly from archive to disk during extraction
- Read metadata separately before extraction decision

### 10. Security Considerations

**Backup security:**
- Backups stored in user's home directory (same permissions as .aissist)
- No encryption implemented (out of scope - users can encrypt backup directory themselves)
- Checksums prevent tampering detection but not data confidentiality

**Restore security:**
- Verify backup source before restoring (user must explicitly provide path)
- Validate metadata schema version for forward compatibility
- Warn on metadata mismatch (e.g., backup from different aissist version)

**Future considerations:**
- Optional encryption support (AES-256-GCM)
- Signature verification for backup provenance
- Remote backup storage (S3, Google Drive)

## File Structure

```
src/
├── commands/
│   ├── backup.ts          # CLI command with subcommands
│   └── restore.ts         # CLI command with flags
├── utils/
│   ├── backup-helpers.ts  # Archive creation, metadata, verification
│   ├── restore-helpers.ts # Extraction, merging, rollback
│   ├── auto-backup.ts     # Auto-backup trigger logic
│   └── storage.ts         # Updated with backup path resolution
```

## Testing Strategy

**Unit tests:**
- Backup-helpers: Test archive creation, metadata generation, verification
- Restore-helpers: Test extraction, merge strategies, rollback
- Auto-backup: Test trigger conditions, interval checks

**E2E tests:**
- Full backup/restore workflows with real .aissist directories
- Test all restore modes with various data conflicts
- Test error scenarios (corrupted archives, disk full)
- Test auto-backup integration with data-modifying commands

**Performance tests:**
- Benchmark backup/restore with large datasets (1000+ files, 100MB+)
- Measure memory usage during streaming operations
- Verify no blocking on main thread during auto-backup

## Migration Path

**Existing users:**
- No migration required (purely additive feature)
- Backups are opt-in (manual commands or config)
- No changes to existing .aissist data structure

**Future compatibility:**
- Metadata includes `version` field for format versioning
- Metadata includes `aissistVersion` for schema compatibility checks
- Validation layer can handle multiple backup format versions

## Open Questions and Future Enhancements

**Resolved:**
- ✅ Backup format: ZIP
- ✅ Storage location: ~/aissist-backups/
- ✅ Restore modes: All three (replace, merge-overwrite, merge-preserve)
- ✅ Auto-backup: Opt-in via config
- ✅ Retention policy: Age and count-based

**Future enhancements (out of scope):**
- Incremental backups (delta compression)
- Remote backup storage (cloud sync)
- Encryption support
- Scheduled backups (cron-like)
- Backup compression levels (configurable)
- Backup tagging and search
- Restore preview (show what will change before restoring)
