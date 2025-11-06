# Spec Delta: aissist-cli-skill

This delta extends the aissist-cli-skill capability to support conversational chat interactions via a plugin slash command.

## ADDED Requirements

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

## Notes

- This change leverages the existing aissist-cli skill rather than creating new functionality
- The slash command acts as a skill activator and context provider
- Follows Anthropic's agent skills pattern for progressive disclosure
- No changes required to the skill itself - only adds a new entry point
- Command structure similar to existing plugin commands (log, todo, recall, report)
- The skill already has all necessary capabilities; this just makes them conversationally accessible
