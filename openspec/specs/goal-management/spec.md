# goal-management Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
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

### Requirement: Goal Visibility
The system SHALL allow users to view their stored goals.

#### Scenario: List today's goals
- **WHEN** the user runs `aissist goal list`
- **THEN** the system displays all goals from today's date

#### Scenario: List goals for specific date
- **WHEN** the user runs `aissist goal list --date YYYY-MM-DD`
- **THEN** the system displays all goals from the specified date

#### Scenario: No goals found
- **WHEN** no goals exist for the requested date
- **THEN** the system displays a message indicating no goals were found

### Requirement: Interactive Deadline Entry During Goal Creation
The system SHALL prompt users to enter a deadline when adding a goal, with natural language support and "Tomorrow" as the default.

#### Scenario: User accepts default deadline
- **WHEN** the user runs `aissist goal add "Complete project proposal"`
- **AND** the system prompts for a deadline with default "Tomorrow"
- **AND** the user presses Enter without typing anything
- **THEN** the system sets the deadline to tomorrow's date in YYYY-MM-DD format
- **AND** displays the goal confirmation with the deadline

#### Scenario: User enters natural language deadline
- **WHEN** the user runs `aissist goal add "Review quarterly goals"`
- **AND** the system prompts for a deadline
- **AND** the user enters a natural language timeframe like "next week"
- **THEN** the system parses the input to a date in YYYY-MM-DD format
- **AND** stores the deadline with the goal

#### Scenario: User enters ISO date deadline
- **WHEN** the user runs `aissist goal add "Submit report"`
- **AND** the system prompts for a deadline
- **AND** the user enters an ISO date like "2025-12-31"
- **THEN** the system accepts the date and stores it as the deadline

#### Scenario: User skips deadline with empty input
- **WHEN** the user runs `aissist goal add "Explore new ideas"`
- **AND** the system prompts for a deadline
- **AND** the user enters an empty string or "skip"
- **THEN** the system adds the goal without a deadline

#### Scenario: User provides deadline via -d flag
- **WHEN** the user runs `aissist goal add "Finish coding" -d 2025-11-10`
- **THEN** the system does NOT prompt for a deadline interactively
- **AND** uses the provided flag value as the deadline

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

