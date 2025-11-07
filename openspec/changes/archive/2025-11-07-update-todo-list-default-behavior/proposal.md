# Update Todo List Default Behavior and Add Natural Language Date Support

## Why

The current `todo list` command defaults to showing todos for today's date only, which limits visibility of all active (incomplete) todos across different dates. Users need to manually specify dates to see their complete todo backlog. Additionally, the `--date` flag only accepts ISO format (YYYY-MM-DD), while other commands like `history` support natural language like "this week" or "yesterday", creating an inconsistent user experience.

## What Changes

- **Change default behavior**: `aissist todo list` (without flags) now shows ALL incomplete todos across all dates, sorted by priority
- **Preserve date filtering**: `aissist todo list --date <value>` continues to show todos for a specific date
- **Add natural language support**: The `--date` flag now accepts natural language expressions like "today", "yesterday", "this week", consistent with other commands
- **No breaking changes**: All existing functionality and options remain available

## Impact

- Affected specs: `todo-management`
- Affected code: `src/commands/todo.ts:95-163` (todo list command action)
- User experience improvement: Better visibility of all active todos by default
- Consistency improvement: Natural language date support matches `history` command behavior
- Migration: Existing scripts/workflows using `--date` with ISO dates continue to work
