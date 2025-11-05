# Add Aissist CLI Skill

## Why

Currently, the aissist Claude Code plugin provides slash commands (`/aissist:goal`, `/aissist:log`, `/aissist:recall`) but lacks a comprehensive skill that teaches Claude how to effectively use the aissist CLI tool directly. This creates several limitations:

1. **Limited Discoverability**: Claude doesn't automatically know when to suggest using aissist for task tracking, goal management, or history logging
2. **Manual Command Construction**: Users must explicitly remember and type slash commands instead of Claude proactively offering aissist functionality
3. **No Progressive Disclosure**: There's no reference documentation for Claude to consult about command parameters, workflows, or best practices
4. **Missed Automation Opportunities**: Claude can't suggest aissist workflows when users mention goals, todos, or want to track their work

According to Claude Code skills best practices:
- **Skills are model-invoked**: Claude autonomously decides when to use them based on user context
- **Progressive Disclosure**: Supporting files provide deep reference without cluttering the main prompt
- **Focused Scope**: Each skill should address one clear capability with specific trigger keywords

By adding a comprehensive aissist CLI skill, Claude will be able to:
- Automatically suggest using aissist when users mention goals, todos, history tracking, or reflections
- Construct correct commands with proper parameters
- Guide users through aissist workflows efficiently
- Leverage progressive disclosure with reference documentation for complex scenarios

## What Changes

### Skill Structure
Create `aissist-plugin/skills/aissist-cli/` with:
- `SKILL.md` - Main skill file with clear description and core workflows
- `command-reference.md` - Comprehensive command documentation
- `workflow-examples.md` - Common usage patterns and multi-step workflows
- `storage-model.md` - Explanation of global vs local storage

### Skill Description
The skill description will include trigger keywords: "goals", "todos", "task tracking", "history", "reflection", "personal assistant", "progress tracking", "context management"

### Core Capabilities Documented
1. **Initialization**: When and how to initialize storage (global vs local)
2. **Goal Management**: Adding, listing, completing goals with deadlines
3. **Todo Management**: Daily task tracking with interactive management
4. **History Logging**: Recording activities and linking to goals
5. **Context Management**: Organizing information by context (work, diet, fitness, etc.)
6. **Reflection**: Guided reflection sessions
7. **Semantic Recall**: AI-powered search across all data
8. **Proposal Generation**: AI-generated action proposals based on goals and history

### Tool Restrictions
Use `allowed-tools: Bash(aissist:*)` to restrict the skill to only aissist CLI commands for safety and focus

## Impact

### User Experience
- **Proactive Assistance**: Claude automatically suggests aissist when relevant
- **Easier Onboarding**: New users discover aissist capabilities naturally through conversation
- **Efficient Workflows**: Claude constructs correct commands without users needing to remember syntax
- **Better Integration**: Seamless workflow integration with Claude Code assistant sessions

### Developer Experience
- **Maintainable Documentation**: Skill files serve as up-to-date CLI documentation
- **Progressive Disclosure**: Complex details available without overwhelming initial interactions
- **Versioned with Plugin**: Skill documentation stays in sync with CLI capabilities

## Alternatives Considered

1. **Expand Slash Commands**: Would require users to remember and type commands explicitly
2. **Inline Documentation Only**: Doesn't enable autonomous Claude suggestions
3. **Multiple Focused Skills**: Could split into separate skills per command group, but aissist is a cohesive tool suite better served by one comprehensive skill with progressive disclosure
