# history-tracking Specification Delta

## MODIFIED Requirements

### Requirement: Log History Entries
The system SHALL allow users to log daily activities and events to dated Markdown files with optional goal linking and optional custom date specification for retroactive logging.

**Changes**: Added support for `--date` flag to enable retroactive/retrospective logging to past dates.

#### Scenario: Log history entry to current date (default)
- **WHEN** the user runs `aissist history log "Completed code review"`
- **THEN** the system appends the entry to history/YYYY-MM-DD.md for today's date with a timestamp
- **AND** supports optional goal linking via the `--goal` flag

#### Scenario: Log history entry to past date (ISO format)
- **WHEN** the user runs `aissist history log "Fixed bug" --date 2025-11-05`
- **THEN** the system appends the entry to history/2025-11-05.md with current timestamp
- **AND** creates the date file if it doesn't exist
- **AND** supports goal linking via the `--goal` flag

#### Scenario: Log history entry to past date (natural language)
- **WHEN** the user runs `aissist history log "Team meeting" --date "yesterday"`
- **THEN** the system parses "yesterday" to determine the target date
- **AND** appends the entry to the corresponding history file with current timestamp
- **AND** supports natural language like "yesterday", "last Monday", "last week"

#### Scenario: Invalid date format for retroactive logging
- **WHEN** the user provides an invalid date format via `--date`
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "yesterday", "last Monday", etc.)
- **AND** does not create a history entry

#### Scenario: Retroactive logging preserves current timestamp
- **WHEN** the user logs a history entry to a past date
- **THEN** the entry's timestamp (HH:MM) reflects the current time, not the target date's time
- **AND** the entry is appended to the target date's file chronologically

#### Scenario: Retroactive logging with multiline text
- **WHEN** the user logs a multiline history entry to a past date
- **THEN** the system preserves the multiline formatting
- **AND** logs to the specified date's file
- **AND** goal metadata (if present) appears after all entry text

#### Scenario: Multiple retroactive entries same date
- **WHEN** the user logs multiple entries to the same past date
- **THEN** each entry is appended chronologically with its own timestamp
- **AND** each entry can have its own independent goal link
