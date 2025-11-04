# reflection-system Specification

## Purpose
Tracks modification to reflection-system for keyword-based goal linking.

## ADDED Requirements

### Requirement: Link Reflections to Goals
The system SHALL allow users to optionally link reflection entries to active goals through keyword matching or interactive selection.

#### Scenario: Start reflection with goal keyword
- **WHEN** the user runs `aissist reflect --goal "fitness"`
- **THEN** the system performs keyword matching against active goals
- **AND** links to the matching goal if exactly one match is found
- **AND** prompts for selection if multiple or no matches are found
- **AND** stores the linked goal as metadata in the reflection entry

#### Scenario: Start reflection with goal flag (no keyword)
- **WHEN** the user runs `aissist reflect --goal`
- **THEN** the system displays an interactive prompt showing all active goals
- **AND** allows the user to select a goal or skip linking
- **AND** stores the linked goal as metadata if a goal is selected

#### Scenario: Store goal link in reflection entry
- **WHEN** a user selects a goal to link during reflection
- **THEN** the reflection entry includes a metadata line: `Goal: codename`
- **AND** the metadata line appears after the reflection content
- **AND** follows the same format pattern as history entries

#### Scenario: Reflect without goal flag
- **WHEN** the user runs `aissist reflect` without the `--goal` flag
- **THEN** the system proceeds with the normal reflection flow
- **AND** does not prompt for goal selection
- **AND** no goal metadata is added
