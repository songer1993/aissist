# goal-management Specification Delta

## MODIFIED Requirements

### Requirement: Goal Visibility
The system SHALL allow users to view their stored goals, defaulting to all active goals, with optional deadline-based filtering using natural language or ISO dates.

**Changes**: Replaced `--date` flag (filter by creation date) with `--deadline` flag (filter by deadline). Added natural language support for deadline filtering.

#### Scenario: List all active goals by default
- **WHEN** the user runs `aissist goal list`
- **THEN** the system displays all active (unfinished) goals from all dates
- **AND** sorts goals by deadline (earliest first, no deadline goes last)
- **AND** includes goals with codenames across all goal files

#### Scenario: Filter goals by deadline (ISO date)
- **WHEN** the user runs `aissist goal list --deadline 2025-12-01`
- **THEN** the system displays only goals with deadlines on or before 2025-12-01
- **AND** excludes goals without deadlines
- **AND** sorts by deadline (earliest first)

#### Scenario: Filter goals by deadline (natural language)
- **WHEN** the user runs `aissist goal list --deadline "next week"`
- **THEN** the system parses "next week" to determine the end date
- **AND** displays goals with deadlines on or before that date
- **AND** excludes goals without deadlines

#### Scenario: Invalid deadline format
- **WHEN** the user provides an invalid deadline format
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "next week", "tomorrow", etc.)

#### Scenario: No goals match deadline filter
- **WHEN** no active goals have deadlines matching the filter
- **THEN** the system displays a message indicating no goals were found
- **AND** suggests viewing all goals with `aissist goal list`
