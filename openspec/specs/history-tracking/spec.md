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
The system SHALL allow users to view their history logs.

#### Scenario: View today's history
- **WHEN** the user runs `aissist history show`
- **THEN** the system displays all history entries from today

#### Scenario: View history for specific date
- **WHEN** the user runs `aissist history show --date YYYY-MM-DD`
- **THEN** the system displays all history entries from the specified date

#### Scenario: No history found
- **WHEN** no history exists for the requested date
- **THEN** the system displays a message indicating no history was found

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

