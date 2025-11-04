# goal-linking-factory Specification

## Purpose
TBD - created by archiving change add-goal-keyword-matching. Update Purpose after archive.
## Requirements
### Requirement: Keyword Matching for Goal Selection
The system SHALL provide a centralized function that matches goal keywords against active goals and returns a selected codename or null.

#### Scenario: Match single goal by keyword
- **WHEN** the user provides a goal keyword that matches exactly one active goal
- **AND** the keyword appears in either the goal text or codename (case-insensitive)
- **THEN** the system returns the matching goal's codename immediately
- **AND** does not show an interactive prompt

#### Scenario: Match multiple goals by keyword
- **WHEN** the user provides a goal keyword that matches multiple active goals
- **THEN** the system displays an interactive prompt filtered to matching goals
- **AND** allows the user to select from the filtered list
- **AND** includes a "None" option to skip linking

#### Scenario: No matches for keyword
- **WHEN** the user provides a goal keyword that matches zero active goals
- **THEN** the system displays a message indicating no matches were found
- **AND** offers to show all active goals in an interactive prompt
- **AND** allows the user to select from all goals or skip

#### Scenario: Boolean flag triggers interactive mode
- **WHEN** the user provides the goal flag without a keyword (boolean true)
- **THEN** the system displays an interactive prompt with all active goals
- **AND** allows the user to select any goal or skip linking

#### Scenario: No active goals available
- **WHEN** the goal linking function is invoked but no active goals exist
- **THEN** the system returns null with a message "No active goals found"
- **AND** does not show an interactive prompt

### Requirement: Case-Insensitive Substring Matching
The system SHALL perform case-insensitive substring matching on both goal text and codename fields.

#### Scenario: Match on goal text
- **WHEN** a keyword matches a substring in the goal's text field
- **THEN** the goal is included in the match results
- **AND** matching is case-insensitive

#### Scenario: Match on codename
- **WHEN** a keyword matches a substring in the goal's codename field
- **THEN** the goal is included in the match results
- **AND** matching is case-insensitive

#### Scenario: Multiple field matches
- **WHEN** a keyword matches both the text and codename of a goal
- **THEN** the goal appears only once in the match results
- **AND** is treated as a single match

### Requirement: Consistent Return Interface
The system SHALL return a standardized result object from the goal-linking function.

#### Scenario: Return structure on successful link
- **WHEN** a goal is successfully linked
- **THEN** the function returns an object with:
  - `codename` (string): The selected goal's codename
  - `message` (string): A success status message

#### Scenario: Return structure on no link
- **WHEN** no goal is linked (user skipped or cancelled)
- **THEN** the function returns an object with:
  - `codename` (null): Indicating no goal was selected
  - `message` (string): An explanation of why no goal was linked

### Requirement: Interactive Prompt Formatting
The system SHALL display goal options in a consistent, readable format during interactive selection.

#### Scenario: Display goal choices
- **WHEN** showing the interactive goal selection prompt
- **THEN** each goal is displayed with the format: `codename | goal text`
- **AND** long goal text is truncated to 60 characters with "..." ellipsis
- **AND** the full goal text is shown in the description field

#### Scenario: Include skip option
- **WHEN** showing the interactive goal selection prompt
- **THEN** a "None - Don't link to a goal" option is always included
- **AND** selecting it returns null as the codename

