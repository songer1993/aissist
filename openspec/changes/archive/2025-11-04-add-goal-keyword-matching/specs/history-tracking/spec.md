# history-tracking Specification

## Purpose
Tracks modification to history-tracking for keyword-based goal linking.

## MODIFIED Requirements

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
