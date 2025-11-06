# aissist-cli-skill Specification

## Purpose
TBD - created by archiving change add-aissist-cli-skill. Update Purpose after archive.
## Requirements
### Requirement: Skill Directory Structure
The plugin SHALL include a skills directory with the aissist CLI skill and supporting documentation files.

The skill MUST be located at `aissist-plugin/skills/aissist-cli/` and SHALL contain:
- `SKILL.md` - Main skill file with frontmatter and core instructions
- `command-reference.md` - Comprehensive command documentation
- `workflow-examples.md` - Common usage patterns
- `storage-model.md` - Storage concepts and best practices

#### Scenario: Skill Files Are Discoverable
**Given** the aissist plugin is installed
**When** Claude encounters a user request about goals, todos, or progress tracking
**Then** Claude can access the aissist CLI skill
**And** load supporting documentation as needed for progressive disclosure

---

### Requirement: Skill Frontmatter Configuration
The SKILL.md file MUST include proper YAML frontmatter with name, description, and tool restrictions.

The frontmatter SHALL include:
- `name: aissist-cli` (lowercase, hyphenated)
- `description` field (max 1024 chars) with trigger keywords: goals, todos, task tracking, history, reflection, personal assistant, progress tracking, context management
- `allowed-tools: Bash(aissist:*)` to restrict to aissist CLI commands only

#### Scenario: Skill Is Properly Named
**Given** the skill frontmatter is configured
**When** validating the skill name
**Then** the name is "aissist-cli" in lowercase with hyphen separator

#### Scenario: Skill Has Actionable Description
**Given** the skill description is written
**When** a user mentions "track my goals" or "add a todo"
**Then** the description contains relevant trigger keywords
**And** Claude can match the user intent to this skill

#### Scenario: Tool Usage Is Restricted
**Given** the skill is active
**When** Claude uses the skill
**Then** Claude can only execute `aissist` CLI commands via Bash
**And** no other tools are permitted without user permission

---

### Requirement: Core Skill Instructions
The SKILL.md SHALL provide clear instructions for using aissist CLI commands and workflows.

The skill MUST cover:
- Initialization (global vs local storage)
- Goal management (add, list, complete, deadlines)
- Todo management (add, list, done, manage)
- History logging (with goal linking)
- Context management (log, show, list)
- Reflection sessions
- Semantic recall with Claude API
- AI-powered proposal generation

#### Scenario: Initialize Storage
**Given** a user wants to start tracking goals
**When** Claude suggests using aissist
**Then** Claude recommends running `aissist init` or `aissist init --global`
**And** explains the difference between local and global storage

#### Scenario: Add Goal with Deadline
**Given** a user says "I want to learn TypeScript by end of month"
**When** Claude uses the aissist skill
**Then** Claude constructs: `aissist goal add "Learn TypeScript" --deadline "end of month"`
**And** explains the command will generate an AI codename

#### Scenario: Manage Todos Interactively
**Given** a user has multiple todos to manage
**When** Claude suggests todo management
**Then** Claude recommends `aissist todo manage` for interactive CRUD operations
**And** mentions `aissist todo list` for checkbox UI

#### Scenario: Link History to Goals
**Given** a user completed work toward a goal
**When** logging history
**Then** Claude constructs: `aissist history log "Completed task" --goal <codename>`
**And** retrieves the goal codename from prior context or suggests using `aissist goal list`

---

### Requirement: Command Reference Documentation
The command-reference.md file SHALL document all aissist CLI commands with parameters and examples.

The reference MUST include:
- Command syntax and aliases
- All available options and flags
- Parameter descriptions
- Return behavior
- Example commands for each use case

#### Scenario: Reference Includes All Commands
**Given** command-reference.md exists
**When** Claude needs detailed parameter information
**Then** the reference documents: init, goal, history, context, reflect, propose, todo, clear, recall, path
**And** includes all subcommands and options

#### Scenario: Examples Are Actionable
**Given** a command is documented
**When** Claude reads the examples
**Then** each example shows correct syntax
**And** includes explanatory context for when to use it

---

### Requirement: Workflow Examples
The workflow-examples.md file SHALL provide multi-step workflows and common patterns.

The file MUST demonstrate:
- Daily workflow (morning: todos, evening: history logging)
- Goal-driven workflow (set goal → track progress → complete)
- Context-specific workflows (work sprints, fitness tracking, meal planning)
- Reflection and planning workflow (reflect → propose → prioritize)
- GitHub integration workflow (import commits as history)

#### Scenario: Daily Workflow Is Clear
**Given** a user wants to establish a daily routine with aissist
**When** Claude references workflow-examples.md
**Then** Claude can guide the user through morning todo planning and evening history review

#### Scenario: Goal-Driven Workflow Links Components
**Given** a user sets a new goal
**When** following the goal-driven workflow
**Then** Claude shows how to link todos and history entries to the goal
**And** demonstrates using `aissist recall` to review progress

---

### Requirement: Storage Model Documentation
The storage-model.md file SHALL explain aissist's storage concepts and file organization.

The documentation MUST cover:
- Global storage (`~/.aissist/`) vs local storage (`./.aissist/`)
- Directory structure (goals/, history/, contexts/, reflections/, todos/)
- Markdown file format and naming conventions
- Git compatibility and version control practices
- How to manually edit files if needed

#### Scenario: Storage Location Is Clear
**Given** a user asks where their data is stored
**When** Claude references storage-model.md
**Then** Claude explains the difference between global and local storage
**And** provides the exact file paths for the user's mode

#### Scenario: Git Integration Is Documented
**Given** a user wants to version control their aissist data
**When** Claude references storage-model.md
**Then** Claude explains that all files are human-readable Markdown
**And** suggests gitignore patterns for sensitive contexts

---

### Requirement: Skill Activation Triggers
The skill description MUST enable Claude to recognize when to use aissist CLI.

Trigger scenarios SHALL include mentions of:
- Personal goals or objectives
- Todo lists or daily tasks
- Progress tracking or journaling
- Work history or activity logging
- Context-specific information (work notes, meal planning, fitness)
- Reflection or self-review
- Searching past activities or goals

#### Scenario: Goal Mention Triggers Skill
**Given** a user says "I want to set a goal to learn Rust"
**When** Claude processes the request
**Then** Claude activates the aissist CLI skill
**And** suggests using `aissist goal add "Learn Rust"`

#### Scenario: Todo Mention Triggers Skill
**Given** a user says "I need to track my daily tasks"
**When** Claude processes the request
**Then** Claude activates the aissist CLI skill
**And** suggests initializing aissist and using todo commands

#### Scenario: History Query Triggers Skill
**Given** a user asks "What did I work on last week?"
**When** Claude processes the request
**Then** Claude activates the aissist CLI skill
**And** suggests using `aissist recall "work from last week"` or `aissist history show --from "last week"`

### Requirement: Conversational Chat Command
The plugin SHALL provide a `/aissist:chat` slash command that enables natural conversational interaction with the aissist assistant by activating the aissist-cli skill.

#### Scenario: Chat command activates skill
- **WHEN** the user runs `/aissist:chat What should I focus on today?`
- **THEN** the command file instructs Claude to activate the `aissist-cli` skill
- **AND** the skill loads with full CLI access and documentation
- **AND** Claude receives the user's prompt from `$ARGUMENTS`
- **AND** Claude responds conversationally using aissist CLI commands

#### Scenario: Multi-turn conversation maintains context
- **WHEN** the user has a multi-turn conversation via `/aissist:chat`
- **THEN** Claude maintains conversational context across messages
- **AND** can reference previous exchanges in the session
- **AND** continues to use the activated skill for CLI access
- **AND** progressively loads data as needed

#### Scenario: Intelligent command selection
- **WHEN** the user asks "How am I doing on my TypeScript goal?"
- **THEN** Claude understands the intent requires goal lookup and history search
- **AND** executes `aissist goal list` to find the goal
- **AND** executes `aissist recall "TypeScript"` for related history
- **AND** synthesizes findings into a natural response

#### Scenario: Handles requests for planning
- **WHEN** the user asks "Help me plan my week"
- **THEN** Claude loads goals with `aissist goal list`
- **AND** loads pending todos with `aissist todo list`
- **AND** reviews recent history for context
- **AND** provides a prioritized plan with recommendations

#### Scenario: Explores context data
- **WHEN** the user asks "What did I document about the API?"
- **THEN** Claude uses semantic recall: `aissist recall "API documentation"`
- **AND** may load context files if relevant
- **AND** summarizes findings in conversational format

#### Scenario: Handles missing CLI gracefully
- **WHEN** the user runs `/aissist:chat` but aissist CLI is not installed
- **THEN** Claude attempts a command and receives "command not found"
- **AND** informs the user with clear error message
- **AND** provides installation instructions: `npm install -g aissist`
- **AND** suggests initialization: `aissist init --global`

#### Scenario: Handles empty data
- **WHEN** the user asks about goals but has none
- **THEN** Claude runs `aissist goal list` and receives "No goals found"
- **AND** acknowledges the lack of data conversationally
- **AND** suggests: "Would you like to create your first goal?"
- **AND** offers to help with goal creation

### Requirement: Skill Activation Pattern
The chat command SHALL use the Skill tool to explicitly activate the aissist-cli skill for conversational access.

#### Scenario: Command uses Skill tool
- **WHEN** the `/aissist:chat` command is invoked
- **THEN** the command file's allowed-tools includes `Skill(aissist-cli)`
- **AND** implementation instructions direct Claude to use the Skill tool
- **AND** the tool is called with command: `aissist-cli`

#### Scenario: Skill provides CLI access
- **WHEN** the aissist-cli skill activates
- **THEN** Claude has access to `allowed-tools: Bash(aissist:*)`
- **AND** can execute any aissist CLI command
- **AND** can load supporting documentation on-demand

#### Scenario: Progressive disclosure of documentation
- **WHEN** Claude needs specific command syntax
- **THEN** the skill references `command-reference.md` for details
- **AND** when workflow guidance is needed, references `workflow-examples.md`
- **AND** when storage concepts are needed, references `storage-model.md`
- **AND** these files load only when accessed

