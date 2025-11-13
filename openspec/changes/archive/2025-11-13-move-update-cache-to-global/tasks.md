# Implementation Tasks

## 1. Update Update Checker Utility
- [x] 1.1 Modify `checkForUpdates()` in `src/utils/update-checker.ts` to compute global cache path internally
- [x] 1.2 Remove `storagePath` parameter from `checkForUpdates()` signature
- [x] 1.3 Use `join(homedir(), '.aissist', 'cache', 'update-check.json')` for cache path
- [x] 1.4 Import `homedir` from `os` module in `update-checker.ts`
- [x] 1.5 Ensure cache directory creation logic uses the global path

## 2. Update Startup Integration
- [x] 2.1 Update `performUpdateCheck()` in `src/index.ts` to call `checkForUpdates()` without storagePath parameter
- [x] 2.2 Update cache directory creation to use global path `join(homedir(), '.aissist', 'cache')`
- [x] 2.3 Import `homedir` from `os` module in `src/index.ts`
- [x] 2.4 Remove dependency on project storage path for update check

## 3. Update Tests
- [x] 3.1 Update unit tests in `src/utils/update-checker.test.ts` to verify global cache path usage
- [x] 3.2 Update test mocks to use global path instead of project storage path
- [x] 3.3 Add test case to verify cache location is `~/.aissist/cache/update-check.json`
- [x] 3.4 Verify all tests pass with the updated signature

## 4. Clean Up
- [x] 4.1 Remove any remaining references to project-local update cache path
- [x] 4.2 Verify `.gitignore` correctly excludes `.aissist/` (already present)
- [x] 4.3 Test in both global and local storage contexts to ensure consistent behavior
