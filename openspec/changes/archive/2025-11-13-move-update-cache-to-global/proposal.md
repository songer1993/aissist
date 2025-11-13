# Move Update Cache to Global Storage

## Why
The update checker currently saves its cache file to `.aissist/cache/update-check.json` within the project directory. This causes the cache file to be tracked by version control (if `.aissist/` is not properly gitignored) and creates project-specific caches when the update check should be user-specific and global across all projects.

Update check caching should be stored in the user's home directory (~/.aissist/cache/) because:
- Update availability is user-specific, not project-specific
- Cache files should not be committed to version control
- Users should see the same update notification regardless of which project they're in
- Aligns with the tool's existing global storage pattern for user-level data

## What Changes
- Move update check cache from project-local `.aissist/cache/update-check.json` to global `~/.aissist/cache/update-check.json`
- Update `checkForUpdates()` to use a dedicated global cache path instead of the project storage path
- Ensure cache directory is created in the user's home directory during update check
- Remove the storagePath parameter dependency from update check logic where possible

## Impact
- Affected specs: `cli-infrastructure`
- Affected code:
  - `src/utils/update-checker.ts` - Update cache path logic to use global storage
  - `src/index.ts` - Update `performUpdateCheck()` to not pass project storage path
  - Tests: Update unit tests to verify global cache path usage
- User impact: Existing local cache files will be ignored; users will see one fresh update check after the change
