# Design: Conversational Chat Command

## Architecture

### Component Diagram
```
┌──────────────────────────────────────────────────────────────┐
│ Claude Code Plugin                                           │
│                                                              │
│  ┌────────────────────────────────────────┐                 │
│  │ /aissist:chat Command                  │                 │
│  │                                        │                 │
│  │  1. Receive conversational prompt     │                 │
│  │  2. Activate aissist-cli skill        │                 │
│  │  3. Provide context to Claude         │                 │
│  └────────────────────────────────────────┘                 │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────────────────────────────┐                 │
│  │ aissist-cli Skill (Activated)          │                 │
│  │                                        │                 │
│  │  • Full CLI command reference          │                 │
│  │  • Workflow examples                   │                 │
│  │  • Storage model understanding         │                 │
│  │  • allowed-tools: Bash(aissist:*)      │                 │
│  └────────────────────────────────────────┘                 │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────────┐
    │ Claude AI         │
    │                   │
    │ • Understands     │
    │   user intent     │
    │ • Selects         │
    │   commands        │
    │ • Interprets      │
    │   results         │
    │ • Maintains       │
    │   conversation    │
    └───────────────────┘
            │
            ▼
    ┌───────────────────┐
    │ aissist CLI       │
    │                   │
    │ • goal list       │
    │ • todo list       │
    │ • history log     │
    │ • recall search   │
    │ • context read    │
    └───────────────────┘
```

### Data Flow

1. **Command Invocation**
   ```
   User: /aissist:chat What should I focus on today?
   ↓
   Command file activates with:
   - User prompt in $ARGUMENTS
   - Skill activation instruction
   ```

2. **Skill Activation**
   ```
   Command content instructs Claude:
   - "Activate the aissist-cli skill"
   - Provides user prompt
   - Sets conversational context
   ↓
   Skill loads with:
   - Command reference
   - Workflow examples
   - Storage model
   - Tool permissions
   ```

3. **Intent Understanding**
   ```
   Claude analyzes prompt:
   - "focus on today" → check goals + todos
   - "progress on X" → search history
   - "plan week" → analyze deadlines
   - "tell me about Y" → recall + context
   ```

4. **Command Selection & Execution**
   ```
   Based on intent, Claude:
   - Calls `aissist goal list --plain`
   - Calls `aissist todo list --plain`
   - Calls `aissist recall "<query>"`
   - Reads context files if relevant
   ```

5. **Response Generation**
   ```
   Claude synthesizes:
   - CLI command outputs
   - User's data patterns
   - Conversational context
   ↓
   Natural language response
   ```

## Command Structure

### File: `aissist-plugin/commands/chat.md`

```markdown
---
description: Chat with your aissist assistant about goals, progress, and plans
argument-hint: <prompt>
allowed-tools: Skill(aissist-cli)
---

# Conversational Assistant Chat

Have a natural conversation with your aissist assistant about your goals, progress, plans, and any questions about your tracked data.

## Usage
\`\`\`
/aissist:chat <your question or prompt>
\`\`\`

[Documentation content...]

## Implementation

When this command is invoked:

1. **Activate the aissist-cli skill** using the Skill tool
2. **Provide the user's prompt** from $ARGUMENTS
3. **Engage conversationally** to help the user with:
   - Understanding their goals and progress
   - Planning upcoming work
   - Reviewing past accomplishments
   - Exploring their data
   - Getting recommendations

The skill provides full CLI access and documentation. Use aissist commands intelligently based on what the user asks about.

---

$ARGUMENTS
```

### Key Implementation Pattern

The command file acts as a **skill activator** rather than implementing logic itself:

```markdown
## For Claude

You are now in conversational mode with the user's aissist assistant.

1. Use the Skill tool to activate `aissist-cli`
2. The user's prompt is: $ARGUMENTS
3. Help them by:
   - Using aissist CLI commands to access their data
   - Providing thoughtful, context-aware responses
   - Asking clarifying questions when needed
   - Making actionable recommendations

Remember: You have full access to their goals, history, todos, and context through the CLI.
```

## Skill Integration

### Why Use Existing Skill?

The `aissist-cli` skill already provides:

**✅ Command Knowledge**
- Complete CLI reference documentation
- Command syntax and options
- Workflow examples

**✅ Tool Access**
- `allowed-tools: Bash(aissist:*)`
- Permissions for all aissist commands

**✅ Domain Understanding**
- Storage model (goals, todos, history, context)
- Data organization patterns
- Semantic recall capabilities

**✅ Progressive Disclosure**
- Main skill file loaded on activation
- Reference docs loaded on-demand
- Efficient context usage

### Skill Activation Pattern

```markdown
# In command file

**Step 1:** Activate the skill

Use the Skill tool with command: `aissist-cli`

This loads the full CLI assistant capability.

**Step 2:** Process user prompt

The user asks: $ARGUMENTS

Use your CLI knowledge to help them.
```

## Conversation Patterns

### Pattern 1: Goal Review
```
User: What are my goals?
↓
Claude:
1. Calls `aissist goal list --plain`
2. Parses output
3. Presents in friendly format
4. Offers follow-up options
```

### Pattern 2: Progress Check
```
User: How am I doing on learning TypeScript?
↓
Claude:
1. Calls `aissist goal list --plain` to find goal
2. Calls `aissist recall "TypeScript learning"`
3. Synthesizes progress summary
4. Suggests next steps
```

### Pattern 3: Planning Session
```
User: Help me plan my week
↓
Claude:
1. Calls `aissist goal list` to see deadlines
2. Calls `aissist todo list` for pending items
3. Calls `aissist history log --date "this week"` for context
4. Creates prioritized plan
5. Offers to create todos
```

### Pattern 4: Data Exploration
```
User: What did I learn about authentication?
↓
Claude:
1. Calls `aissist recall "authentication learning"`
2. Reads relevant context files if mentioned
3. Summarizes findings
4. Answers follow-up questions
```

## Error Handling

### CLI Not Available
```markdown
If aissist commands fail with "command not found":
- Inform user aissist CLI not installed
- Provide installation: `npm install -g aissist`
- Suggest initialization: `aissist init --global`
```

### No Data Available
```markdown
If queries return no results:
- Acknowledge lack of data
- Suggest relevant commands to populate data
- Offer to help set up tracking
```

### Ambiguous Requests
```markdown
If user intent is unclear:
- Ask clarifying questions
- Offer multiple interpretation options
- Provide examples of what's possible
```

## Context Management

### Loading Strategy

**On-Demand Loading:**
- Load goal list when goals mentioned
- Load todos when tasks discussed
- Load history for progress questions
- Load context for specific topics

**Avoid Over-Loading:**
- Don't load all data upfront
- Use targeted commands
- Leverage semantic recall for search

**Progressive Disclosure:**
- Start with high-level information
- Drill down based on user interest
- Load supporting docs when needed

## Security & Privacy

### Local-First Architecture
- All data stays on user's machine
- No external API calls (except Claude AI)
- Full user control over data

### Safe Command Execution
- Only use allowed aissist commands
- No destructive operations without confirmation
- Respect data boundaries (local vs global storage)

### Transparency
- Show which commands are being run
- Explain data access clearly
- Make recommendations, not silent actions

## Performance Considerations

### Efficient Command Usage
- Use `--plain` flags for machine-readable output
- Use `--format json` when parsing data
- Avoid redundant command calls

### Context Window Management
- Load skill once per conversation
- Reference docs on-demand
- Use semantic recall vs loading entire history

### Response Time
- Quick commands (<100ms): goal list, todo list
- Medium commands (~1s): history search
- Slow commands (2-5s): semantic recall
- Be transparent about longer operations

## Testing Strategy

### Conversation Scenarios
1. **Goal Management**
   - "What are my goals?"
   - "Tell me about goal X"
   - "Should I add a new goal for Y?"

2. **Progress Review**
   - "How am I doing this week?"
   - "Show my progress on goal X"
   - "What have I accomplished?"

3. **Planning**
   - "What should I focus on?"
   - "Help me plan tomorrow"
   - "Prioritize my week"

4. **Data Exploration**
   - "What did I learn about X?"
   - "Find work on feature Y"
   - "Show context about Z"

5. **Multi-Turn**
   - Follow-up questions
   - Topic continuation
   - Clarification dialogues

### Edge Cases
- CLI not installed
- Empty data (no goals, history, etc.)
- Ambiguous queries
- Very long conversations
- Multiple topics in one prompt

## Future Enhancements

### Advanced Features (Not in Initial Scope)
1. **Memory Across Sessions** - Remember previous chat topics
2. **Proactive Insights** - "I noticed you haven't logged in 3 days"
3. **Batch Operations** - "Create 5 todos for this project"
4. **Visual Summaries** - Generate charts/graphs of progress
5. **Integration Actions** - "Create a GitHub issue for this"

### Iterative Improvements
1. **Response Quality** - Refine prompts based on usage
2. **Command Selection** - Optimize which commands to call when
3. **Context Loading** - Better heuristics for what data to load
4. **User Preferences** - Learn user's preferred interaction style
