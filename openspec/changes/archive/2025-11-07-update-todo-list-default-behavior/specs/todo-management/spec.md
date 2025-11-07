# todo-management Specification Delta

## MODIFIED Requirements

### Requirement: List Todos
The system SHALL allow users to view and interact with todos through a checkbox interface, defaulting to all incomplete todos across all dates when no date filter is specified, and supporting natural language date expressions.

**Changes**: Updated default behavior to show all incomplete todos (not just today's), and added natural language date support for the `--date` flag to match behavior of other commands like `history`.

#### Scenario: List all incomplete todos by default
- **WHEN** the user runs `aissist todo list` without any flags
- **THEN** the system displays all incomplete todos from all dates
- **AND** sorts todos by priority (descending) then by date (ascending)
- **AND** displays each todo with its date: `YYYY-MM-DD | Priority | Todo text`
- **AND** allows the user to select multiple todos to mark as complete
- **AND** updates the correct date-specific file when todos are completed

#### Scenario: List todos interactively
- **WHEN** the user runs `aissist todo list`
- **THEN** the system displays all incomplete todos across all dates with checkbox UI
- **AND** allows the user to select multiple todos to mark as complete
- **AND** updates the todo file for the correct date with checkmarks: `- [x] Task`
- **AND** logs each completed todo to `history/YYYY-MM-DD.md` with timestamp and context

#### Scenario: List todos in plain mode
- **WHEN** the user runs `aissist todo list --plain`
- **THEN** the system displays todos as plain text without interactive UI
- **AND** includes both complete and incomplete todos
- **AND** shows todos from all dates

#### Scenario: List todos for specific date (ISO format)
- **WHEN** the user runs `aissist todo list --date 2025-11-03`
- **THEN** the system displays todos from `todos/2025-11-03.md` only
- **AND** shows interactive or plain mode based on flags
- **AND** validates the ISO date format (YYYY-MM-DD)

#### Scenario: List todos for specific date (natural language)
- **WHEN** the user runs `aissist todo list --date yesterday`
- **THEN** the system parses "yesterday" to the appropriate date using `parseNaturalDate`
- **AND** displays todos from that specific date
- **AND** shows interactive or plain mode based on flags

#### Scenario: List todos for timeframe (natural language)
- **WHEN** the user runs `aissist todo list --date "this week"`
- **THEN** the system parses "this week" to a date range
- **AND** displays all incomplete todos within that date range
- **AND** sorts by priority then by date
- **AND** includes date labels for each todo

#### Scenario: Invalid date format
- **WHEN** the user provides an invalid date format (e.g., `--date "invalid"`)
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats: YYYY-MM-DD or natural language like "today", "yesterday", "this week"

#### Scenario: Filter todos by goal
- **WHEN** the user runs `aissist todo list --goal review-code-quality`
- **THEN** the system displays only todos linked to the specified goal
- **AND** filters by exact codename match
- **AND** shows todos from all dates by default

#### Scenario: No todos found
- **WHEN** no incomplete todos exist
- **THEN** the system displays: "No incomplete todos found"
- **OR** when filtering by date: "No todos found for YYYY-MM-DD"

## ADDED Requirements

### Requirement: Cross-Date Todo Operations
The system SHALL support todo operations (complete, edit, remove) on todos from any date when using the default all-dates view.

#### Scenario: Complete todo from previous date
- **WHEN** the user selects a todo from yesterday in the all-dates list
- **THEN** the system updates the correct date-specific file (e.g., `todos/2025-11-06.md`)
- **AND** marks the todo as complete with `[x]`
- **AND** logs to history with today's timestamp
- **AND** preserves the goal linkage

#### Scenario: Display todos with date context
- **WHEN** listing todos from multiple dates
- **THEN** each todo displays its date in the format: `YYYY-MM-DD | [Priority] | Todo text`
- **AND** the date is visually distinct (e.g., colored or separated)
- **AND** helps users identify when todos were created

### Requirement: Natural Language Date Parsing for Todos
The system SHALL parse natural language date expressions for the `--date` flag using the same `parseNaturalDate` utility as other commands.

#### Scenario: Common natural language dates
- **WHEN** the user uses dates like "today", "yesterday", "tomorrow"
- **THEN** the system resolves them to YYYY-MM-DD format
- **AND** displays todos for that specific date

#### Scenario: Relative timeframes
- **WHEN** the user uses timeframes like "this week", "last week", "this month"
- **THEN** the system resolves them to date ranges
- **AND** displays all todos within that range
- **AND** sorts by priority then date

#### Scenario: Fallback to ISO format
- **WHEN** natural language parsing fails
- **AND** the input matches ISO format (YYYY-MM-DD)
- **THEN** the system uses the ISO date
- **AND** displays todos for that date

#### Scenario: Both parsing methods fail
- **WHEN** neither natural language nor ISO format parsing succeeds
- **THEN** the system displays: "Invalid date format: [input]"
- **AND** suggests: "Use YYYY-MM-DD format or natural language like 'today', 'yesterday', 'this week'"
