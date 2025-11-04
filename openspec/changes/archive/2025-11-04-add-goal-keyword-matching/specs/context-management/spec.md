# context-management Specification

## Purpose
Tracks modification to context-management for keyword-based goal linking.

## ADDED Requirements

### Requirement: Link Context Entries to Goals
The system SHALL allow users to optionally link context notes to active goals through keyword matching or interactive selection.

#### Scenario: Add context with goal keyword
- **WHEN** the user runs `aissist context add "project notes" --goal "sprint"`
- **THEN** the system performs keyword matching against active goals
- **AND** links to the matching goal if exactly one match is found
- **AND** prompts for selection if multiple or no matches are found
- **AND** stores the linked goal as metadata in the context entry

#### Scenario: Add context with goal flag (no keyword)
- **WHEN** the user runs `aissist context add "meeting notes" --goal`
- **THEN** the system displays an interactive prompt showing all active goals
- **AND** allows the user to select a goal or skip linking
- **AND** stores the linked goal as metadata if a goal is selected

#### Scenario: Store goal link in context entry
- **WHEN** a user selects a goal to link when adding context
- **THEN** the context entry includes a metadata line: `Goal: codename`
- **AND** the metadata line appears after the context content
- **AND** follows the same format pattern as history and reflection entries

#### Scenario: Add context without goal flag
- **WHEN** the user runs `aissist context add [text]` without the `--goal` flag
- **THEN** the system adds the context entry normally
- **AND** does not prompt for goal selection
- **AND** no goal metadata is added
