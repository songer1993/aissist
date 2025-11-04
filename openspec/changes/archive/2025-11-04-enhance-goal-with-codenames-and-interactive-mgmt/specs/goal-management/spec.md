# goal-management Specification Delta

## MODIFIED Requirements

### Requirement: Add Goals
The system SHALL allow users to add goals with auto-generated unique codenames and store them with metadata.

#### Scenario: Add goal with text argument generates codename
- **WHEN** the user runs `aissist goal add "Complete project proposal"`
- **THEN** the system generates a unique kebab-case codename using Claude AI (e.g., "complete-project-proposal")
- **AND** appends the goal to goals/YYYY-MM-DD.md with timestamp, codename, and text
- **AND** displays the generated codename to the user

#### Scenario: Add goal with multiline text preserves formatting
- **WHEN** the user runs `aissist goal add` with multiline text in quotes
- **THEN** the system generates a unique codename
- **AND** preserves the multiline formatting in the Markdown file
- **AND** stores the codename in the goal metadata

#### Scenario: Add multiple goals same day with unique codenames
- **WHEN** the user adds multiple goals on the same day
- **THEN** each goal is appended with its own timestamp and unique codename
- **AND** Claude ensures codename uniqueness by checking existing goals for the day

#### Scenario: Codename generation handles conflicts
- **WHEN** a generated codename would conflict with an existing goal's codename
- **THEN** the system appends a numeric suffix (e.g., "project-proposal-2")
- **OR** generates a more specific codename to avoid conflicts

### Requirement: Goal File Format
The system SHALL store goals in a structured Markdown format with codenames, timestamps, and optional metadata.

#### Scenario: Format goal entry with codename
- **WHEN** a goal is added
- **THEN** the entry includes:
  - A timestamp (HH:MM format)
  - A unique kebab-case codename
  - The goal text
  - Optional deadline field
  - Markdown formatting for readability and parsing

#### Scenario: Example goal entry format
- **WHEN** a goal is stored
- **THEN** it follows this format:
```markdown
## 14:30 - complete-project-proposal

Complete project proposal

Deadline: 2025-11-10
```

### Requirement: Interactive Goal List
The system SHALL allow users to interactively view and manage goals through a selection interface.

#### Scenario: Interactive list displays goals with actions
- **WHEN** the user runs `aissist goal list` without options
- **THEN** the system displays all goals from today in an interactive list
- **AND** allows the user to select a goal
- **AND** presents action options: Complete, Delete, Set Deadline, Cancel

#### Scenario: Interactive list for specific date
- **WHEN** the user runs `aissist goal list --date YYYY-MM-DD`
- **THEN** the system displays goals from the specified date in an interactive list
- **AND** allows the same management actions

#### Scenario: No goals shows message
- **WHEN** no goals exist for the requested date
- **THEN** the system displays "No goals found for [date]"
- **AND** does not enter interactive mode

### Requirement: Complete Goals
The system SHALL allow users to mark goals as completed and move them to a finished file.

#### Scenario: Complete goal via interactive list
- **WHEN** the user selects a goal and chooses "Complete"
- **THEN** the system removes the goal from goals/YYYY-MM-DD.md
- **AND** appends the goal to goals/finished/YYYY-MM-DD.md with completion date
- **AND** displays success message with codename

#### Scenario: Complete goal via command
- **WHEN** the user runs `aissist goal complete <codename>`
- **THEN** the system finds the goal with matching codename
- **AND** moves it to the finished file with completion date
- **AND** displays success message

#### Scenario: Finished goal format
- **WHEN** a goal is completed
- **THEN** the finished entry includes:
  - Original timestamp
  - Codename
  - Goal text
  - Original deadline (if any)
  - Completion date

#### Scenario: Complete non-existent goal
- **WHEN** the user tries to complete a goal that doesn't exist
- **THEN** the system displays "Goal '[codename]' not found"

### Requirement: Remove Goals
The system SHALL allow users to remove goals without completing them.

#### Scenario: Remove goal via interactive list
- **WHEN** the user selects a goal and chooses "Delete"
- **THEN** the system removes the goal from goals/YYYY-MM-DD.md
- **AND** does not add it to finished file
- **AND** displays confirmation message

#### Scenario: Remove goal via command
- **WHEN** the user runs `aissist goal remove <codename>`
- **THEN** the system finds and removes the goal with matching codename
- **AND** displays success message

#### Scenario: Remove non-existent goal
- **WHEN** the user tries to remove a goal that doesn't exist
- **THEN** the system displays "Goal '[codename]' not found"

### Requirement: Deadline Management
The system SHALL allow users to set and update deadlines for goals.

#### Scenario: Set deadline during goal creation
- **WHEN** the user runs `aissist goal add "Complete proposal" --deadline 2025-11-10`
- **THEN** the system stores the goal with the specified deadline
- **AND** displays the goal with deadline information

#### Scenario: Set deadline via interactive list
- **WHEN** the user selects a goal and chooses "Set Deadline"
- **THEN** the system prompts for a date in YYYY-MM-DD format
- **AND** updates the goal with the new deadline
- **AND** displays success message

#### Scenario: Set deadline via command
- **WHEN** the user runs `aissist goal deadline <codename> <YYYY-MM-DD>`
- **THEN** the system updates the goal's deadline
- **AND** displays success message

#### Scenario: Invalid deadline format
- **WHEN** the user provides an invalid date format
- **THEN** the system displays "Invalid date format. Use YYYY-MM-DD."
- **AND** does not update the goal

## ADDED Requirements

### Requirement: Codename Generation
The system SHALL use Claude AI to generate meaningful, unique kebab-case codenames for goals.

#### Scenario: Generate codename from goal text
- **WHEN** a new goal is added
- **THEN** the system sends the goal text to Claude with instructions to generate a short, meaningful kebab-case identifier
- **AND** ensures the codename is unique within the day's goals
- **AND** stores the codename with the goal

#### Scenario: Codename length constraint
- **WHEN** generating a codename
- **THEN** the codename should be 1-4 words in kebab-case
- **AND** should capture the core meaning of the goal
- **AND** should be memorable and easy to type

#### Scenario: Codename uniqueness check
- **WHEN** generating a codename
- **THEN** the system checks existing goals in the day's file
- **AND** if the codename exists, instructs Claude to generate an alternative
- **OR** appends a numeric suffix

### Requirement: Goal Parsing and Search
The system SHALL parse goal entries to extract codenames and metadata for management operations.

#### Scenario: Parse goal entry
- **WHEN** reading a goal file
- **THEN** the system extracts timestamp, codename, text, and deadline from each entry
- **AND** makes them available for search and filtering

#### Scenario: Find goal by codename
- **WHEN** a command references a goal by codename
- **THEN** the system searches today's goals file
- **AND** returns the matching goal entry
- **OR** returns null if not found

#### Scenario: Search across dates for codename
- **WHEN** a goal is not found in today's file
- **THEN** the system optionally searches recent goal files
- **AND** informs the user of the goal's date if found elsewhere

### Requirement: Backward Compatibility
The system SHALL handle existing goal entries without codenames gracefully.

#### Scenario: Display legacy goals in list
- **WHEN** listing goals from files created before this change
- **THEN** the system displays goals without codenames
- **AND** marks them as "[no-codename]" in interactive list
- **AND** does not allow management actions on legacy goals

#### Scenario: Migrate legacy goal on interaction
- **WHEN** the user attempts to manage a legacy goal
- **THEN** the system offers to generate a codename for it
- **AND** updates the goal entry with the codename if user accepts
