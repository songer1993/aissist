# context-management Specification Delta

## MODIFIED Requirements

### Requirement: Context-Specific Logging
The system SHALL allow users to log information organized by context (e.g., work, diet, fitness) with optional custom date specification for retroactive logging.

**Changes**: Added support for `--date` flag to enable retroactive/retrospective logging to past dates.

#### Scenario: Log text to context for current date (default)
- **WHEN** the user runs `aissist context log work "Sprint planning meeting notes"`
- **THEN** the system appends the entry to context/work/YYYY-MM-DD.md for today's date with a timestamp
- **AND** supports optional goal linking via the `--goal` flag

#### Scenario: Log text to context for past date (ISO format)
- **WHEN** the user runs `aissist context log work "Meeting notes" --date 2025-11-05`
- **THEN** the system appends the entry to context/work/2025-11-05.md with current timestamp
- **AND** creates the date file if it doesn't exist
- **AND** supports goal linking via the `--goal` flag

#### Scenario: Log text to context for past date (natural language)
- **WHEN** the user runs `aissist context log diet "Meal log" --date "yesterday"`
- **THEN** the system parses "yesterday" to determine the target date
- **AND** appends the entry to the corresponding context file with current timestamp
- **AND** supports natural language like "yesterday", "last Monday", "last week"

#### Scenario: Log file contents to context for past date
- **WHEN** the user runs `aissist context log diet ./meal-plan.txt --date 2025-11-05`
- **THEN** the system reads the file contents and stores them in context/diet/2025-11-05.md
- **AND** includes the file path as the source indicator
- **AND** uses current timestamp for the entry

#### Scenario: Invalid date format for retroactive context logging
- **WHEN** the user provides an invalid date format via `--date`
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "yesterday", "last Monday", etc.)
- **AND** does not create a context entry

#### Scenario: Retroactive context logging preserves current timestamp
- **WHEN** the user logs a context entry to a past date
- **THEN** the entry's timestamp (HH:MM) reflects the current time, not the target date's time
- **AND** the entry is appended to the target date's file chronologically

#### Scenario: Retroactive context logging with goal linking
- **WHEN** the user logs a context entry to a past date with `--goal` flag
- **THEN** the system performs goal linking as usual
- **AND** the goal metadata is included in the retroactive entry
- **AND** the entry is logged to the specified past date's file
