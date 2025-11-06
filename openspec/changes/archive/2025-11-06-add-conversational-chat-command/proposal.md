# Add Conversational Chat Command

## Overview
Add a new `/aissist:chat` slash command to the Claude Code plugin that enables natural, conversational interaction with the aissist assistant. The command activates the existing `aissist-cli` skill to provide intelligent, context-aware responses using the full CLI capabilities. This creates a chat interface for discussing goals, reviewing progress, planning future work, and exploring user data through natural dialogue.

## Problem Statement
Currently, users interact with aissist through:
1. **Direct CLI commands** - Requires knowing exact command syntax
2. **Specific slash commands** - Each command has a single, narrow purpose (`/aissist:log`, `/aissist:todo`, etc.)
3. **Skill activation** - Happens automatically but requires specific trigger phrases

This fragmented interaction model has limitations:
- No way to have an open-ended conversation about goals and progress
- Users must know which command to use for their need
- No support for exploratory questions like "What should I focus on this week?"
- Cannot load and discuss context from storage in a conversational flow
- No ability to get advice or recommendations based on user data

## Proposed Solution
Create a `/aissist:chat` command that:
1. Activates the `aissist-cli` skill immediately for full CLI access
2. Accepts a conversational prompt as input
3. Intelligently selects and executes relevant CLI commands
4. Maintains conversational context across interactions
5. Provides thoughtful responses drawing from user's goals, history, and context
6. Can proactively load relevant data from storage to inform responses

## User Experience

### Basic Usage
```
/aissist:chat What should I focus on today based on my goals?
```

**Claude:**
- Loads active goals via `aissist goal list`
- Loads today's todos via `aissist todo list`
- Reviews recent history for context
- Provides personalized recommendations

### Progress Discussion
```
/aissist:chat How am I doing on my TypeScript learning goal?
```

**Claude:**
- Finds the TypeScript goal
- Searches history for related entries
- Summarizes progress and milestones
- Suggests next steps

### Planning Conversation
```
/aissist:chat I want to plan my week. What are my priorities?
```

**Claude:**
- Reviews all active goals with deadlines
- Checks pending todos
- Analyzes recent work patterns
- Proposes a prioritized plan

### Context Exploration
```
/aissist:chat Tell me about my work on authentication last month
```

**Claude:**
- Searches history with semantic recall
- Loads relevant context files
- Summarizes findings
- Answers follow-up questions

### Multi-turn Conversation
```
User: /aissist:chat What are my goals?
Claude: You have 5 active goals: [lists goals]

User: Tell me more about the API security goal
Claude: [loads goal details, related todos, history]

User: What should I work on next for this goal?
Claude: [analyzes data, makes recommendations]
```

## Benefits
1. **Natural Interaction**: Users can ask questions in plain language
2. **Intelligence**: Skill-powered responses use full CLI capabilities
3. **Context-Aware**: Accesses user data to provide informed responses
4. **Exploratory**: Supports open-ended questions and discussions
5. **Adaptive**: Intelligently selects relevant commands based on intent
6. **Seamless**: Integrates with existing skill architecture

## Scope
This change affects:
- **Plugin**: Add new `/aissist:chat` command file
- **Skill Integration**: Leverage existing `aissist-cli` skill
- **User Documentation**: Update plugin README with chat command

This does NOT require:
- Changes to aissist CLI (uses existing commands)
- New skill creation (uses existing `aissist-cli` skill)
- New storage mechanisms (uses existing data)
- Backend changes (all local-first)

## Key Design Decisions

### Why Not a New Skill?
The existing `aissist-cli` skill already provides:
- Full CLI access via `allowed-tools: Bash(aissist:*)`
- Comprehensive command reference documentation
- Workflow examples and storage model
- All necessary context for intelligent responses

Creating a new skill would duplicate this functionality. Instead, we explicitly activate the existing skill.

### Why a Slash Command?
1. **User Intent**: Signals "I want to chat" vs. triggering automatic skill activation
2. **Immediate Activation**: Ensures skill loads at conversation start
3. **Context Setting**: Establishes conversational mode upfront
4. **Consistent Pattern**: Matches other plugin commands

### Progressive Disclosure
Following Anthropic's agent skills pattern:
1. **Command loads skill** - Activates `aissist-cli` with full context
2. **Skill references docs** - Command reference, workflow examples load on-demand
3. **CLI execution** - Claude calls aissist commands as needed
4. **Context exploration** - Storage files read when relevant

## Success Criteria
1. Users can have natural conversations about goals and progress
2. Skill activates automatically with the command
3. Claude intelligently uses CLI commands to inform responses
4. Conversational context maintained across multi-turn dialogue
5. Can load and discuss user data from storage
6. Responses are helpful, accurate, and actionable
7. Documentation clearly explains the chat interface

## Related Work
- Leverages existing `aissist-cli` skill (aissist-cli-skill spec)
- Complements specific commands (`/aissist:log`, `/aissist:todo`, etc.)
- Uses Claude integration for conversational AI (claude-integration spec)
- Accesses semantic recall capability (semantic-recall spec)
- Follows agent skills pattern from Anthropic engineering
