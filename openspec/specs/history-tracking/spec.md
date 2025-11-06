# history-tracking Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Log History Entries
The system SHALL allow users to log daily activities and events to dated Markdown files with optional goal linking.

#### Scenario: Log history entry
- **WHEN** the user runs `aissist history log "Completed code review"`
- **THEN** the system appends the entry to history/YYYY-MM-DD.md with a timestamp
- **AND** supports optional goal linking via the `--goal` flag

#### Scenario: Log multiline entry
- **WHEN** the user logs a history entry with multiline text
- **THEN** the system preserves the multiline formatting in the Markdown file
- **AND** goal metadata (if present) appears after all entry text

#### Scenario: Multiple entries same day
- **WHEN** the user logs multiple entries on the same day
- **THEN** each entry is appended chronologically with its own timestamp
- **AND** each entry can have its own independent goal link or no link

### Requirement: History File Format
The system SHALL store history entries in a structured Markdown format with timestamps.

#### Scenario: Format history entry
- **WHEN** a history entry is logged
- **THEN** the entry includes:
  - A timestamp (HH:MM format)
  - The entry text
  - Proper Markdown formatting

### Requirement: History Retrieval
The system SHALL allow users to view their history logs, defaulting to all history entries, with optional date range filtering using natural language or ISO dates.

**Changes**: Changed `--date` flag behavior from "show specific date" to "show since this date". Added natural language support for date filtering.

#### Scenario: View all history by default
- **WHEN** the user runs `aissist history show`
- **THEN** the system displays all history entries from all dates
- **AND** sorts entries chronologically (newest first)
- **AND** includes date separators for readability (e.g., "## 2025-11-06")

#### Scenario: View history since specific date (ISO format)
- **WHEN** the user runs `aissist history show --date 2025-11-01`
- **THEN** the system displays history entries from 2025-11-01 onwards (inclusive)
- **AND** sorts entries chronologically (newest first)
- **AND** includes date separators

#### Scenario: View history since date (natural language)
- **WHEN** the user runs `aissist history show --date "last week"`
- **THEN** the system parses "last week" to determine the start date
- **AND** displays history entries from that date onwards (inclusive)
- **AND** sorts entries chronologically (newest first)

#### Scenario: Natural language timeframe examples
- **WHEN** the user provides natural language timeframes
- **THEN** the system supports:
  - "last week" - entries since start of last week
  - "last month" - entries since start of last month
  - "last quarter" - entries since start of last quarter
  - "this week" - entries since start of this week
  - "this month" - entries since start of this month

#### Scenario: Invalid date format
- **WHEN** the user provides an invalid date format
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "last week", "last month", etc.)

#### Scenario: No history found since date
- **WHEN** no history exists since the specified date
- **THEN** the system displays a message indicating no history was found
- **AND** suggests logging history with `aissist history log`

### Requirement: Link History Entries to Goals
The system SHALL allow users to link history entries to active goals using keyword matching or interactive selection.

#### Scenario: Log history with goal keyword
- **WHEN** the user runs `aissist history log "Completed code review" --goal "review"`
- **THEN** the system performs keyword matching against active goals
- **AND** links to the matching goal if exactly one match is found
- **AND** prompts for selection if multiple or no matches are found
- **AND** stores the linked goal as metadata in the history entry

#### Scenario: Log history with goal flag (no keyword)
- **WHEN** the user runs `aissist history log "Completed code review" --goal`
- **THEN** the system displays an interactive prompt showing all active goals
- **AND** allows the user to select a goal or skip linking
- **AND** stores the linked goal as metadata if a goal is selected

#### Scenario: Partial keyword match
- **WHEN** the user provides a keyword that partially matches a goal
- **THEN** the system includes the goal in the match results
- **AND** performs case-insensitive substring matching

#### Scenario: Keyword matches goal codename
- **WHEN** the user provides a keyword that matches a goal's codename
- **THEN** the system includes the goal in the match results
- **AND** treats codename matches the same as text matches

