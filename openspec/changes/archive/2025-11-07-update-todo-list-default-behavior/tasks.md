# Implementation Tasks

## 1. Add Natural Language Date Support

- [x] 1.1 Import `parseNaturalDate` from `../utils/date-parser.js` in `src/commands/todo.ts`
- [x] 1.2 Update `todo list` command to parse natural language dates when `--date` is provided
- [x] 1.3 Handle both ISO format (YYYY-MM-DD) and natural language (e.g., "yesterday", "this week")
- [x] 1.4 Show helpful error message for invalid date formats

## 2. Update Default List Behavior

- [x] 2.1 Create utility function to get all incomplete todos across all dates
- [x] 2.2 Update `todo list` (no flags) to show all incomplete todos from all dates
- [x] 2.3 Sort todos by priority (descending) then by date (ascending)
- [x] 2.4 Display date alongside each todo in the list view
- [x] 2.5 Preserve existing behavior when `--date` flag is provided
- [x] 2.6 Ensure `--plain` and `--goal` filters work with new default behavior

## 3. Update Interactive UI

- [x] 3.1 Update interactive list display to show dates for todos from different days
- [x] 3.2 Ensure todo selection and completion work across dates
- [x] 3.3 Update todo management interface to handle cross-date todos
- [x] 3.4 Preserve file path resolution for todos from different dates

## 4. Testing

- [x] 4.1 Manual test: `aissist todo list` shows all incomplete todos
- [x] 4.2 Manual test: `aissist todo list --date today` shows only today's todos
- [x] 4.3 Manual test: `aissist todo list --date yesterday` works with natural language
- [x] 4.4 Manual test: `aissist todo list --date "this week"` works with timeframes
- [x] 4.5 Manual test: Completing a todo from a previous date updates the correct file
- [x] 4.6 Run existing tests: `npm test` to ensure no regressions

## 5. Documentation

- [x] 5.1 Update command help text to reflect new default behavior
- [x] 5.2 Update plugin skill documentation with natural language date examples
- [x] 5.3 Update README examples if needed
