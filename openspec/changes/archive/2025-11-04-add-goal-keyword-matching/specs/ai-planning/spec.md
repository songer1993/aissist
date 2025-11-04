# ai-planning Specification

## Purpose
Tracks modification to ai-planning (propose command) for keyword-based goal linking.

## ADDED Requirements

### Requirement: Link Proposals to Goals
The system SHALL allow users to optionally link AI-generated proposals to active goals through keyword matching or interactive selection.

#### Scenario: Generate proposals with goal keyword
- **WHEN** the user runs `aissist propose "this week" --goal "project"`
- **THEN** the system generates proposals for the specified timeframe
- **AND** performs keyword matching against active goals
- **AND** links the proposals to the matching goal if exactly one match is found
- **AND** prompts for selection if multiple or no matches are found

#### Scenario: Generate proposals with goal flag (no keyword)
- **WHEN** the user runs `aissist propose "today" --goal`
- **THEN** the system generates proposals for the specified timeframe
- **AND** displays an interactive prompt showing all active goals
- **AND** allows the user to select a goal or skip linking

#### Scenario: Store goal link when saving proposals as goals
- **WHEN** a user saves proposals as goals and a goal link was specified
- **THEN** the saved goal entries include metadata: `Goal: codename`
- **AND** the metadata indicates the parent/related goal
- **AND** helps track proposal-to-goal relationships

#### Scenario: Generate proposals without goal flag
- **WHEN** the user runs `aissist propose [timeframe]` without the `--goal` flag
- **THEN** the system generates proposals normally
- **AND** does not prompt for goal selection
- **AND** no goal metadata is added to saved proposals
