# Tasks: improve-date-filtering

## Implementation Order

### Phase 1: Goal Deadline Filtering
- [x] 1. **Replace --date with --deadline in goal list command**
   - Remove `-d, --date` option
   - Add `-d, --deadline <date>` option with updated description
   - Update help text to explain deadline filtering
   - **Validation**: Run `aissist goal list --help` and verify new option text

- [x] 2. **Implement deadline filtering with natural language support**
   - Import `parseNaturalDate` from date-parser
   - Try parsing input with `parseNaturalDate()` first for natural language
   - Fall back to `parseDate()` for ISO dates
   - Filter goals where `goal.deadline !== null && goal.deadline <= targetDate`
   - **Validation**: Manual test with various inputs (ISO dates, "next week", "tomorrow")

- [x] 3. **Handle edge cases for deadline filtering**
   - Goals with no deadline should not appear in filtered results
   - Invalid date formats should show helpful error message
   - Natural language parsing failures should fall back gracefully
   - **Validation**: Test with edge cases (no deadline, invalid input, etc.)

### Phase 2: History Date Range Filtering
- [x] 4. **Update history show --date to support natural language**
   - Import `parseNaturalDate` from date-parser
   - Try parsing with `parseNaturalDate()` first
   - Fall back to `parseDate()` for ISO dates
   - Extract `from` date from the parsed range
   - **Validation**: Test parsing "last week", "last month", ISO dates

- [x] 5. **Implement "since date" filtering for history**
   - Modify `getAllHistory()` to accept optional `sinceDate` parameter
   - Filter history entries where `entry.date >= sinceDate`
   - Keep chronological sorting (newest first)
   - **Validation**: Manual test showing history since specific dates

- [x] 6. **Update history command to use filtered history**
   - When `--date` provided, parse to get `sinceDate`
   - Call `getAllHistory(storagePath, sinceDate)`
   - Display filtered results with date separators
   - **Validation**: Test with various timeframes ("last week", "2025-01-01")

### Phase 3: Spec Updates
- [x] 7. **Update goal-management spec**
   - Modify "Goal Visibility" requirement scenarios
   - Replace "view goals for specific date" with "filter by deadline"
   - Add natural language support scenario
   - **Validation**: openspec validate

- [x] 8. **Update history-tracking spec**
   - Modify "History Retrieval" requirement scenarios
   - Change "view history for specific date" to "since date"
   - Add natural language timeframe scenarios
   - **Validation**: openspec validate

### Phase 4: Documentation
- [x] 9. **Update CLI help text**
   - Goal list: "Filter goals by deadline (supports natural language)"
   - History show: "Show history since date (supports natural language like 'last week')"
   - **Validation**: Run both --help commands

- [x] 10. **Update README examples**
   - Replace goal --date examples with --deadline examples
   - Update history --date examples to show "since" behavior
   - Add natural language examples for both
   - **Validation**: Manual review

- [x] 11. **Update CLI skill documentation**
   - Update aissist-plugin/skills/aissist-cli/SKILL.md
   - Replace outdated examples with new flag usage
   - Add natural language examples
   - **Validation**: Manual review

- [x] 12. **Update plugin README**
   - Sync changes to aissist-plugin/README.md
   - Ensure examples match CLI changes
   - **Validation**: Manual review (no changes needed)

## Dependencies
- Tasks 1-3 are sequential (goal deadline filtering)
- Tasks 4-6 are sequential (history date filtering)
- Tasks 7-8 can be done in parallel after implementation
- Tasks 9-12 can be done in parallel after spec updates

## User-Visible Milestones
- **Milestone 1**: After task 3 - `goal list --deadline` works with natural language
- **Milestone 2**: After task 6 - `history show --date` shows ranges with natural language
- **Milestone 3**: After task 12 - Complete documentation updated
