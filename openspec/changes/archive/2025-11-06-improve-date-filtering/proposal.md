# Proposal: improve-date-filtering

## Why

Currently, the date filtering for goals and history has usability issues:

1. **Goal `--date` is meaningless**: Filtering goals by creation date doesn't help users track urgent work. What matters is the **deadline**, not when a goal was created.

2. **History `--date` only shows one day**: Users want to see history "from last week onwards" or "since the beginning of the month", not just entries from a single date.

3. **Natural language not supported**: The history command can't parse phrases like "last week", "last month", or "last quarter" even though the codebase has `parseNaturalDate()` available.

These limitations make it harder for users to answer common questions:
- "What goals are due soon?" (can't filter by deadline)
- "What have I accomplished this month?" (can't get history since a date)
- "Show me last quarter's progress" (natural language not supported)

## What Changes

### Goals: Replace `--date` with `--deadline`

**Before**:
```bash
aissist goal list --date 2025-11-06  # Shows goals created on this date (not useful)
```

**After**:
```bash
aissist goal list --deadline 2025-12-01  # Shows goals with deadline before/on this date
aissist goal list --deadline "next week" # Natural language support
```

The default behavior (all active goals sorted by deadline) remains unchanged.

### History: Change `--date` to mean "since this date"

**Before**:
```bash
aissist history show --date 2025-11-01  # Shows ONLY entries from Nov 1
```

**After**:
```bash
aissist history show --date 2025-11-01       # Shows entries FROM Nov 1 to today
aissist history show --date "last week"      # Natural language: since start of last week
aissist history show --date "last month"     # Natural language: since start of last month
aissist history show --date "last quarter"   # Natural language: since start of last quarter
```

The default behavior (all history) remains unchanged.

## Specs Affected

- `goal-management`: Update "Goal Visibility" requirement
- `history-tracking`: Update "History Retrieval" requirement

## Implementation Approach

### Goals
1. Replace `--date` option with `--deadline` in goal list command
2. Parse deadline using `parseNaturalDate()` if not ISO format
3. Filter goals where `goal.deadline <= parsedDate`
4. Keep existing deadline sorting (earliest first)

### History
1. Change `--date` to accept both ISO dates and natural language
2. Parse using `parseNaturalDate()` to get date range
3. Filter history entries where `entry.date >= range.from`
4. Keep existing chronological sorting (newest first)

## User Benefits

- **Find urgent goals**: Quickly see what's due soon with `--deadline "next week"`
- **Track progress**: Review accomplishments with `--date "last month"`
- **Natural language**: Use familiar phrases instead of calculating exact dates
- **Consistent behavior**: Both commands now accept natural language timeframes

## Backward Compatibility

### Breaking Change: `goal list --date`
- **Impact**: Users using `--date` to filter goals by creation date
- **Mitigation**:
  - This flag was just introduced and likely has minimal usage
  - The new `--deadline` flag is more useful and intuitive
  - Update all documentation to reflect the change

### Non-Breaking: `history show --date`
- **Impact**: Behavioral change but same flag name
- **Mitigation**:
  - The new behavior is more useful (range vs single day)
  - Still supports ISO dates for specific dates
  - Default behavior (all history) unchanged
