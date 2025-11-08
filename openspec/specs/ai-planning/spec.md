# ai-planning Specification

## Purpose
TBD - created by archiving change add-ai-propose-command. Update Purpose after archive.
## Requirements
### Requirement: Timeframe Parsing
The system SHALL parse natural language timeframe expressions into date ranges for proposal scoping.

#### Scenario: Parse "now" expression (ADDED)
- **WHEN** the user runs `aissist propose now`
- **THEN** the system recognizes "now" as a special immediate-action timeframe
- **AND** returns a timeframe spanning the current moment to 2 hours ahead
- **AND** sets the label to "Right Now"

### Requirement: Data Aggregation for Proposals
The system SHALL load and aggregate relevant data from storage based on the specified timeframe.

#### Scenario: Load all goals
- **WHEN** building a proposal
- **THEN** the system loads all goal files from `.aissist/goals/*.md`

#### Scenario: Load recent history logs
- **WHEN** building a proposal for a future timeframe
- **THEN** the system loads history logs from the past 30 days (or configurable lookback period)

#### Scenario: Load available reflections
- **WHEN** building a proposal
- **THEN** the system attempts to load reflection files from `.aissist/reflections/` for the past 30 days

#### Scenario: Include context files optionally
- **WHEN** the user passes `--context` flag
- **THEN** the system includes relevant context files from `.aissist/context/`

#### Scenario: Filter by tag
- **WHEN** the user passes `--tag <focus>`
- **THEN** the system filters loaded goals and data to entries matching the specified tag

#### Scenario: No data available
- **WHEN** no goals, history, or reflections exist
- **THEN** the system displays a message suggesting to use `aissist goal add`, `aissist history add`, or `aissist reflect` first

### Requirement: Claude-Powered Proposal Generation
The system SHALL use Claude Code CLI to generate intelligent, context-aware action proposals based on user data, AND support goal-focused generation.

#### Scenario: Build goal-focused prompt
- **WHEN** building a prompt with goal information
- **THEN** the prompt includes a "Goal Focus" section
- **AND** states the goal codename, text, and description (if available)
- **AND** mentions the goal deadline (if available)
- **AND** instructs Claude to "prioritize proposals that directly advance this goal"
- **AND** adapts instructions based on timeframe type (deadline-based, timeless, or regular)

### Requirement: Interactive Proposal Follow-up
The system SHALL offer interactive actions after displaying the proposal.

#### Scenario: Offer post-proposal actions (MODIFIED)
- **WHEN** a proposal is successfully generated
- **THEN** the system prompts: "What would you like to do with these proposals?"
- **AND** offers the following options:
  - "Create TODOs (recommended)" [default]
  - "Save as goals"
  - "Save as Markdown" [NEW]
  - "Skip"

#### Scenario: User accepts goal saving
- **WHEN** the user confirms goal saving
- **THEN** the system parses proposed items and creates dated goal entries using `aissist goal add` logic

#### Scenario: User declines or skips
- **WHEN** the user selects "Skip" or cancels
- **THEN** the system exits without modifying storage

### Requirement: Structured Proposal Output
The system SHALL format proposal output in a clear, actionable structure.

#### Scenario: Display proposal header (MODIFIED)
- **WHEN** outputting a proposal
- **THEN** the system displays a header: `🎯 Proposed Plan for <timeframe>:`
- **AND** for "now" timeframe, the header uses the label "Right Now"

#### Scenario: Display single action for "now" timeframe (ADDED)
- **WHEN** Claude generates a proposal for "now" timeframe
- **THEN** the system displays exactly one action item
- **AND** the action is formatted as: "▶️ [action description]"
- **AND** includes brief context on why this is the most urgent/important immediate action

### Requirement: Optional Reflection Integration
The system SHALL support optional reflection prompts before generating proposals.

#### Scenario: Reflect before proposing
- **WHEN** the user passes `--reflect` flag
- **THEN** the system prompts the user for a quick reflection input before loading data

#### Scenario: Save reflection with timestamp
- **WHEN** the user provides reflection input
- **THEN** the system saves it to `.aissist/reflections/YYYY-MM-DD.md` with a timestamp before continuing

### Requirement: Debug Mode
The system SHALL support debug output for prompt inspection.

#### Scenario: Display raw prompt
- **WHEN** the user passes `--debug` flag
- **THEN** the system prints the constructed Claude prompt before invoking Claude Code

#### Scenario: Display data summary
- **WHEN** `--debug` is enabled
- **THEN** the system prints the count and file paths of loaded goals, history, and reflections

### Requirement: Link Proposals to Goals
The system SHALL allow users to optionally link AI-generated proposals to active goals through keyword matching or interactive selection, AND generate goal-focused proposals when a goal is specified.

#### Scenario: Generate goal-focused proposals without explicit timeframe
- **WHEN** the user runs `aissist propose --goal "project"` (no timeframe argument)
- **THEN** the system performs keyword matching to select a goal
- **AND** loads the full goal details (text, description, deadline)
- **AND** if goal has a deadline: calculates timeframe from now until deadline
- **AND** if goal has NO deadline: uses timeless planning mode
- **AND** builds a goal-focused prompt including goal context
- **AND** instructs Claude to generate proposals specifically to advance that goal

#### Scenario: Generate goal-focused proposals with explicit timeframe
- **WHEN** the user runs `aissist propose "this week" --goal "project"`
- **THEN** the system uses the explicit timeframe ("this week")
- **AND** performs keyword matching to select a goal
- **AND** loads the full goal details (text, description, deadline)
- **AND** builds a goal-focused prompt including goal context
- **AND** instructs Claude to generate proposals for that timeframe that advance the goal
- **AND** goal deadline is informational context (not the planning timeframe)

#### Scenario: Goal with deadline auto-timeframe calculation
- **WHEN** a goal has deadline "2025-12-31" and user runs `aissist propose --goal <codename>`
- **THEN** the system calculates timeframe from current date until 2025-12-31
- **AND** creates label like "Now until December 31, 2025"
- **AND** prompt emphasizes working backward from deadline

#### Scenario: Goal without deadline timeless planning
- **WHEN** a goal has no deadline and user runs `aissist propose --goal <codename>`
- **THEN** the system uses timeless planning mode
- **AND** creates label like "Comprehensive Plan"
- **AND** prompt emphasizes creating a strategic plan regardless of time constraints
- **AND** Claude generates milestone-based plan without time pressure

#### Scenario: Distinguish explicit vs default timeframe with goal
- **WHEN** user runs `aissist propose --goal X` (timeframe defaults to 'today')
- **THEN** the system treats this as "no explicit timeframe" and applies smart timeframe
- **WHEN** user runs `aissist propose today --goal X` (explicitly says 'today')
- **THEN** the system uses 'today' as the timeframe and adds goal focus

### Requirement: Save Proposals as Markdown Files
The system SHALL allow users to save AI-generated proposals as Markdown files in a dedicated proposals folder.

#### Scenario: Offer Markdown save option in interactive menu
- **WHEN** a proposal is successfully generated
- **THEN** the system displays an interactive menu with options:
  - "Create TODOs (recommended)"
  - "Save as goals"
  - "Save as Markdown"
  - "Skip"

#### Scenario: User selects "Save as Markdown"
- **WHEN** the user selects "Save as Markdown" from the post-proposal menu
- **THEN** the system saves the full proposal response to `.aissist/proposals/YYYY-MM-DD.md`
- **AND** the file includes a metadata header with:
  - Proposal generation timestamp
  - Timeframe (e.g., "today", "Q1 2026")
  - Any applied filters (tag, goal link)
- **AND** the file contains the complete proposal text from Claude
- **AND** the system displays a success message: "Proposal saved to proposals/YYYY-MM-DD.md"

#### Scenario: Multiple proposals saved on the same day
- **WHEN** a user generates multiple proposals on the same day
- **THEN** the system appends each proposal to the existing `YYYY-MM-DD.md` file
- **AND** separates proposals with a horizontal rule (`---`)
- **AND** each proposal has its own timestamp header

#### Scenario: User cancels Markdown save
- **WHEN** the user is prompted to save as Markdown but cancels (Ctrl+C)
- **THEN** the system displays "Cancelled" and exits without saving
- **AND** no proposal file is created or modified

#### Scenario: Proposals folder doesn't exist
- **WHEN** saving a proposal as Markdown for the first time
- **THEN** the system creates the `.aissist/proposals/` directory if it doesn't exist
- **AND** saves the proposal file normally

### Requirement: Todo Extraction from Context
The system SHALL provide a Claude Code plugin slash command that extracts actionable tasks from freeform context using AI analysis.

#### Scenario: Extract tasks from text context
- **WHEN** the user runs `/aissist:todo "Review API endpoints for security, update docs, and write tests"`
- **THEN** Claude AI analyzes the context and identifies distinct actionable tasks
- **AND** each task is created via `aissist todo add "<task-text>"`
- **AND** tasks are automatically linked to relevant goals using semantic matching
- **AND** a summary is displayed showing goals and added todos grouped by goal

#### Scenario: Extract tasks from multimodal context
- **WHEN** the user runs `/aissist:todo [attach image] "Implement these UI changes"`
- **THEN** Claude AI uses vision capabilities to analyze the attached image
- **AND** extracts actionable tasks from the visual context combined with the text
- **AND** creates todos for each identified task with appropriate goal links
- **AND** displays a summary of created todos

#### Scenario: Handle context with no actionable tasks
- **WHEN** the user provides context that contains no actionable tasks (e.g., "Just some notes about the meeting")
- **THEN** Claude AI identifies that no tasks can be extracted
- **AND** the system displays a message: "No actionable tasks found in the provided context"
- **AND** no todos are created

#### Scenario: Semantic goal matching for extracted tasks
- **WHEN** Claude AI extracts tasks from context
- **THEN** for each task, the system fetches active goals via `aissist goal list`
- **AND** performs semantic matching between task text and goal descriptions
- **AND** links the task to the best-matching goal using `aissist todo add --goal <codename>`
- **AND** if no good match exists, creates the todo without a goal link

#### Scenario: Summary output with goal grouping
- **WHEN** todos are successfully created from extracted tasks
- **THEN** the system displays a summary including:
  - List of goals with todo counts (e.g., "improve-api-security (2 todos)")
  - All added todos grouped by goal
  - Unlinked todos (if any)
  - Total count (e.g., "Created 5 todos linked to 3 goals")
- **AND** the summary clearly shows which todos were linked to which goals

#### Scenario: Priority inference from context
- **WHEN** the context includes priority indicators (e.g., "urgent", "critical", "low priority")
- **THEN** Claude AI infers appropriate priority levels (0-10 scale)
- **AND** creates todos with priority using `aissist todo add --priority N`
- **AND** the summary indicates which todos were created with priority

### Requirement: Plugin Command Integration
The Claude Code plugin SHALL provide a `/aissist:todo` slash command that integrates with the aissist CLI.

#### Scenario: Command accepts freeform arguments
- **WHEN** the user invokes `/aissist:todo` with arguments
- **THEN** the command receives the full argument string via `$ARGUMENTS`
- **AND** Claude has access to any attached images through the message context
- **AND** the command processes both text and visual input

#### Scenario: Command uses allowed tools
- **WHEN** executing `/aissist:todo`
- **THEN** the command has access to `Bash(aissist todo add:*)` for creating todos
- **AND** has access to `Bash(aissist goal list:*)` for fetching goals
- **AND** follows the same security model as other plugin commands

#### Scenario: Error handling for CLI unavailable
- **WHEN** the aissist CLI is not installed or not initialized
- **THEN** the command displays a clear error message
- **AND** provides instructions: "Run: npm install -g aissist && aissist init --global"
- **AND** does not attempt to create any todos

### Requirement: Parse "now" Timeframe
The system SHALL recognize "now" as a special timeframe for immediate action planning.

#### Scenario: User provides "now" timeframe
- **WHEN** the user runs `aissist propose now`
- **THEN** the system parses "now" as a timeframe with:
  - Start: current timestamp
  - End: 2 hours from current timestamp
  - Label: "Right Now"

#### Scenario: "now" timeframe in proposal prompt
- **WHEN** building a proposal prompt with "now" timeframe
- **THEN** the system adjusts the prompt to:
  - Request exactly 1 actionable proposal (not 3-5)
  - Emphasize immediate action (completable within 1-2 hours)
  - Prioritize by urgency and feasibility for short-duration tasks
  - Focus on single next step rather than comprehensive planning

#### Scenario: Invalid timeframe still shows "now" option
- **WHEN** the user provides an invalid timeframe
- **THEN** the error message includes "now" in the supported formats list:
  - "- now (single immediate action)"

### Requirement: Goal Details Loading
The system SHALL load full goal details by codename for goal-focused proposal generation.

#### Scenario: Load goal by codename
- **WHEN** the system needs to load goal details for proposal generation
- **THEN** it uses the goal codename from the linkToGoal result
- **AND** searches goal markdown files for matching codename
- **AND** returns goal entry with codename, text, description, and deadline
- **AND** returns null if goal with that codename does not exist

#### Scenario: Handle missing goal gracefully
- **WHEN** a goal codename is selected but the goal cannot be found
- **THEN** the system displays a warning
- **AND** falls back to generating proposals without goal focus
- **AND** does not crash or error fatally

### Requirement: Deadline-Based Timeframe Calculation
The system SHALL calculate proposal timeframes based on goal deadlines when appropriate.

#### Scenario: Create timeframe from deadline date
- **WHEN** creating a timeframe for a goal with deadline "2025-12-31"
- **THEN** the system sets start date to current date
- **AND** sets end date to the goal deadline
- **AND** creates a descriptive label like "Now until December 31, 2025"
- **AND** returns a valid TimeframeResult

#### Scenario: Handle past deadlines
- **WHEN** a goal deadline is in the past
- **THEN** the system still creates the timeframe (for retrospective analysis)
- **AND** optionally warns the user that the deadline has passed

#### Scenario: Handle same-day deadlines
- **WHEN** a goal deadline is today
- **THEN** the system creates a same-day timeframe
- **AND** generates urgent, immediate action proposals

