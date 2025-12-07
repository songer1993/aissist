# Tasks: Add Instance Description

## Implementation Tasks

- [x] **Add description prompt to onboarding** - Create `promptForDescription()` in `src/utils/onboarding.ts` that asks "What is this aissist instance for? (optional, press Enter to skip)"
- [x] **Update init command** - Call the description prompt after storage initialization, before hierarchy discovery
- [x] **Add storage function** - Create `saveDescription(basePath, description)` and `loadDescription(basePath)` in `src/utils/storage.ts`
- [x] **Create DESCRIPTION.md** - Save user input as `.aissist/DESCRIPTION.md` with simple markdown format
- [x] **Add --description flag** - Support `aissist init --description "text"` for non-interactive use
- [x] **Skip in non-TTY** - Ensure prompt is skipped when `isTTY()` returns false

## Testing Tasks

- [x] **Unit test onboarding prompt** - Test `promptForDescription()` returns user input or empty string
- [x] **E2E test init with description** - Verify `DESCRIPTION.md` is created with correct content
- [x] **E2E test init skip description** - Verify init completes without description when skipped
- [x] **E2E test --description flag** - Verify flag bypasses interactive prompt

## Documentation Tasks

- [x] **Update README** - Document the description prompt in the init section
- [x] **Update onboarding-prompts spec** - Add new requirement for description prompt
