# Tasks: Add Context Injection Hook

## Configuration Tasks

- [x] Add `hooks.contextInjection` section to ConfigSchema in `src/utils/storage.ts`
- [x] Add `context-injection` subcommand to `src/commands/config.ts` with enable/disable/status

## Hook Implementation Tasks

- [x] Create `aissist-plugin/hooks/inject-context.sh` script
- [x] Script checks config via `aissist config context-injection` output
- [x] Script outputs active goals via `aissist goal list --plain`
- [x] Script outputs recent history via `aissist history show --date "3 days ago"`
- [x] Script exits silently when disabled or on error

## Plugin Configuration Tasks

- [x] Update `aissist-plugin/settings.json` to add SessionStart hook

## Documentation Tasks

- [x] Update `aissist-plugin/README.md` with context injection hook documentation

## Validation

- [x] Test hook with config disabled (should output nothing)
- [x] Test hook with config enabled (should output context)
- [x] Test CLI enable/disable commands
- [x] Verify cross-platform compatibility
