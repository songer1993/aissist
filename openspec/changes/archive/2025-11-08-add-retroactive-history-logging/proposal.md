# Proposal: Add Retroactive History and Context Logging

## Problem

Users cannot log history or context entries for past events—all entries are logged with the current date and time. This limitation prevents users from:

- Backfilling history or context when they forgot to log something earlier
- Recording events that happened on specific dates in the past
- Maintaining accurate historical records during retrospectives or reviews

This is inconsistent with the `todo add` command that already supports `--date` flags for specifying custom dates.

## Solution

Add a `--date` flag to both `aissist history log` and `aissist context log` commands to allow users to specify when an event occurred, enabling retroactive or retrospective logging.

## User Impact

- **Positive**: Users can maintain complete, accurate historical records and context notes even when logging retrospectively
- **Backward Compatible**: Existing behavior (logging to today) remains the default
- **Consistent**: Aligns with date flag behavior in `todo` command

## Implementation Scope

- Modify `history log` command to accept optional `--date` flag
- Modify `context log` command to accept optional `--date` flag
- Support both ISO dates (YYYY-MM-DD) and natural language ("yesterday", "last week") for both commands
- Update command help text and documentation
- Add validation for date formats

## Success Criteria

- Users can log history and context entries to any past date
- Natural language date parsing works for both commands (e.g., "yesterday", "last Monday")
- Default behavior (no flag = today) remains unchanged for both commands
- Error messages guide users on valid date formats

## Related Work

- Aligns with existing `--date` flag patterns in `todo add` (src/commands/todo.ts:35)
- Uses existing date parsing utilities (`parseDate`, `parseNaturalDate`)
