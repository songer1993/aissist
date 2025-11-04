# context-management Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Context-Specific Logging
The system SHALL allow users to log information organized by context (e.g., work, diet, fitness).

#### Scenario: Log text to context
- **WHEN** the user runs `aissist context log work "Sprint planning meeting notes"`
- **THEN** the system appends the entry to context/work/YYYY-MM-DD.md with a timestamp

#### Scenario: Log file contents to context
- **WHEN** the user runs `aissist context log diet ./meal-plan.txt`
- **THEN** the system reads the file contents and stores them in context/diet/YYYY-MM-DD.md

#### Scenario: Create new context directory
- **WHEN** the user logs to a context that doesn't exist yet
- **THEN** the system creates the context directory (e.g., context/work/) automatically

### Requirement: Context Isolation
The system SHALL maintain separate directories for each context to prevent data mixing.

#### Scenario: Isolated context storage
- **WHEN** entries are logged to different contexts
- **THEN** each context's data is stored in its own subdirectory under context/

#### Scenario: List available contexts
- **WHEN** the user runs `aissist context list`
- **THEN** the system displays all context directories that have been created

### Requirement: File Input Support
The system SHALL support reading file contents for context logging.

#### Scenario: Read file successfully
- **WHEN** the user provides a valid file path
- **THEN** the system reads the file contents and stores them in the context log

#### Scenario: Handle missing file
- **WHEN** the user provides a file path that doesn't exist
- **THEN** the system displays an error message indicating the file was not found

#### Scenario: Handle unreadable file
- **WHEN** the user provides a file path without read permissions
- **THEN** the system displays an error message explaining the permission issue

### Requirement: Context Entry Format
The system SHALL store context entries in a structured Markdown format with timestamps.

#### Scenario: Format context entry
- **WHEN** a context entry is logged
- **THEN** the entry includes:
  - A timestamp (HH:MM format)
  - The source indicator (text or file path)
  - The entry content
  - Proper Markdown formatting

### Requirement: Context Retrieval
The system SHALL allow users to view entries from specific contexts.

#### Scenario: View context entries for today
- **WHEN** the user runs `aissist context show work`
- **THEN** the system displays all work context entries from today

#### Scenario: View context entries for specific date
- **WHEN** the user runs `aissist context show work --date YYYY-MM-DD`
- **THEN** the system displays all work context entries from the specified date

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

