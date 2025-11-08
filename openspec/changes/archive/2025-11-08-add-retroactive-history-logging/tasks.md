# Tasks: Add Retroactive History and Context Logging

## Implementation Tasks

### 1. Update history log command interface
- [x] Add `--date` flag to `history log` command in src/commands/history.ts
- [x] Update command description to mention retroactive logging support
- [x] Ensure flag accepts both ISO dates and natural language

### 2. Update context log command interface
- [x] Add `--date` flag to `context log` command in src/commands/context.ts
- [x] Update command description to mention retroactive logging support
- [x] Ensure flag accepts both ISO dates and natural language

### 3. Implement date parsing logic for history
- [x] Parse `--date` flag value using existing `parseDate` and `parseNaturalDate` utilities
- [x] Default to current date when flag is not provided
- [x] Handle invalid date formats with clear error messages

### 4. Implement date parsing logic for context
- [x] Parse `--date` flag value using existing `parseDate` and `parseNaturalDate` utilities
- [x] Default to current date when flag is not provided
- [x] Handle invalid date formats with clear error messages

### 5. Update history entry creation logic
- [x] Modify history entry creation to use parsed date instead of always using `getDate()`
- [x] Ensure timestamp (HH:MM) still uses current time for retroactive entries
- [x] Preserve all existing functionality (goal linking, multiline support)

### 6. Update context entry creation logic
- [x] Modify context entry creation to use parsed date instead of always using `getCurrentDate()`
- [x] Ensure timestamp (HH:MM) still uses current time for retroactive entries
- [x] Preserve all existing functionality (goal linking, file input support)

### 7. Update documentation
- [x] Update README.md history command section with `--date` flag examples
- [x] Update README.md context command section with `--date` flag examples
- [x] Add examples for retroactive logging (yesterday, specific dates) for both commands
- [x] Update plugin documentation (aissist-plugin/README.md) if needed
- [x] Update command reference in aissist-plugin/skills/aissist-cli/command-reference.md

### 8. Testing and validation
- [x] Test history logging to past dates with ISO format
- [x] Test history logging with natural language dates ("yesterday", "last Monday")
- [x] Test context logging to past dates with ISO format
- [x] Test context logging with natural language dates ("yesterday", "last Monday")
- [x] Verify default behavior (no flag) still logs to today for both commands
- [x] Test with goal linking to ensure compatibility for both commands
- [x] Test context logging with file input for retroactive dates
- [x] Test error handling for invalid dates in both commands

## Validation Checklist
- [x] `openspec validate add-retroactive-history-logging --strict` passes
- [x] All spec scenarios have implementation
- [x] Documentation updated
- [x] No breaking changes to existing behavior
