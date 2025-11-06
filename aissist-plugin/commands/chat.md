---
description: Chat with your aissist assistant about goals, progress, and plans
argument-hint: <prompt>
allowed-tools: Skill(aissist-cli)
---

# Conversational Assistant Chat

Have a natural conversation with your aissist assistant about your goals, progress, plans, and any questions about your tracked data. This command activates the full aissist CLI skill for intelligent, context-aware responses.

## Usage

```
/aissist:chat <your question or prompt>
```

## What It Does

This command enables conversational interaction with your aissist assistant by:
1. **Activating the aissist-cli skill** - Provides full CLI access and documentation
2. **Understanding your intent** - Analyzes what you're asking about
3. **Accessing your data** - Loads goals, history, todos, and context as needed
4. **Providing informed responses** - Uses your actual data to give personalized answers
5. **Maintaining context** - Remembers the conversation for follow-up questions

## Examples

### Goal Review

**Input:**
```
/aissist:chat What are my current goals?
```

**Response:**
Lists your active goals with descriptions, deadlines, and progress indicators.

---

**Input:**
```
/aissist:chat Tell me about my TypeScript learning goal
```

**Response:**
Finds the goal, searches your history for related work, summarizes progress, and suggests next steps.

### Progress Check

**Input:**
```
/aissist:chat How am I doing this week?
```

**Response:**
Reviews your history and accomplishments for the week, highlights key achievements, and shows progress toward goals.

---

**Input:**
```
/aissist:chat What have I accomplished on the API project?
```

**Response:**
Searches your history for API-related work, summarizes accomplishments, and shows related goals and todos.

### Planning and Priorities

**Input:**
```
/aissist:chat What should I focus on today?
```

**Response:**
Checks your goals, reviews pending todos, considers deadlines, and provides prioritized recommendations.

---

**Input:**
```
/aissist:chat Help me plan my week. What are my priorities?
```

**Response:**
Analyzes goals with deadlines, pending todos, and recent work patterns to create a prioritized weekly plan.

### Data Exploration

**Input:**
```
/aissist:chat What did I learn about authentication?
```

**Response:**
Uses semantic recall to search your history and context for authentication-related entries, then summarizes findings.

---

**Input:**
```
/aissist:chat Show me my work on the payment system last month
```

**Response:**
Searches history for the timeframe and topic, provides a chronological summary of your work.

### Multi-Turn Conversations

**First message:**
```
/aissist:chat What are my goals?
```

**Response:** Lists your 5 active goals

**Follow-up (in same conversation):**
```
Tell me more about the security improvements goal
```

**Response:** Loads goal details, related todos, and history for that specific goal

**Another follow-up:**
```
What should I work on next for this goal?
```

**Response:** Analyzes data and provides specific recommendations

## Use Cases

### 🎯 Goal Management
- "What are my goals?"
- "Am I on track with my goals?"
- "Should I add a goal for learning Rust?"
- "Which goals have approaching deadlines?"

### 📊 Progress Review
- "How am I doing this week/month?"
- "Show my progress on goal X"
- "What have I accomplished lately?"
- "How much time have I spent on Y?"

### 📅 Planning
- "What should I focus on today?"
- "Help me plan my week"
- "Prioritize my todos"
- "What's urgent right now?"

### 🔍 Data Exploration
- "What did I learn about X?"
- "Find my work on feature Y"
- "Show context about project Z"
- "When did I last work on this?"

### 💡 Advice & Recommendations
- "What should I work on next?"
- "Am I spending time effectively?"
- "What's the most important thing right now?"
- "Should I adjust my goals?"

## How It Works

### Skill Activation

When you use this command, it immediately activates the `aissist-cli` skill, which provides:
- Full access to aissist CLI commands
- Complete command reference documentation
- Workflow examples and best practices
- Understanding of your data model

### Intelligent Command Selection

Based on your question, the assistant intelligently selects relevant commands:

- **"goals", "objectives"** → `aissist goal list`
- **"progress", "accomplished"** → `aissist history` + semantic recall
- **"plan", "focus", "priorities"** → checks goals, todos, and history
- **"learn", "about", "find"** → `aissist recall "<query>"`
- **"today", "this week"** → date-filtered commands

### Progressive Data Loading

Data is loaded on-demand, not all at once:
- Loads goal list when goals are discussed
- Loads todos when tasks are mentioned
- Searches history for progress questions
- Accesses context files for specific topics
- Uses semantic recall for exploratory queries

### Conversational Context

The assistant maintains context across your conversation:
- Remembers what you've asked about
- Can reference previous responses
- Understands follow-up questions
- Tracks the current topic

## Error Handling

### CLI Not Installed
If aissist CLI is not available:
```
Error: aissist CLI not found

To get started:
1. Install: npm install -g aissist
2. Initialize: aissist init --global
3. Try the chat command again
```

### No Data Available
If you haven't tracked any data yet:
```
You don't have any goals yet! Would you like to create your first goal?

You can also start by:
- Adding todos: aissist todo add "task"
- Logging work: aissist history log "what you did"
- Creating a goal: aissist goal add "Learn TypeScript"
```

### Ambiguous Questions
If your question is unclear:
```
I'm not quite sure what you're asking about. Could you clarify?

For example:
- "What are my goals?" - to see all goals
- "Show my progress on TypeScript" - for specific goal
- "What should I focus on?" - for recommendations
```

## Tips

1. **Be conversational** - Ask questions naturally, as you would to a person
2. **Start broad, then narrow** - Begin with "What are my goals?" then drill into specifics
3. **Ask follow-ups** - The assistant remembers context within the conversation
4. **Explore your data** - Use semantic search: "What did I learn about X?"
5. **Get recommendations** - Ask for advice: "What should I focus on?"
6. **Use natural timeframes** - "this week", "last month", "yesterday" all work

## Comparison to Other Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/aissist:chat` | Conversational interaction | When you want to discuss goals, get advice, or explore your data |
| `/aissist:log` | Log completed work | After you finish work to record accomplishments |
| `/aissist:todo` | Extract tasks from context | When you have context containing multiple tasks |
| `/aissist:recall` | Semantic search | When you want just search results without conversation |
| `aissist goal add` | Create a goal directly | When you know exactly what goal to add |

## Requirements

- **aissist CLI** installed and initialized (`aissist init --global`)
- **Active Claude Code session** for conversational AI
- **Some tracked data** (goals, history, todos) for meaningful conversations (optional but recommended)

## Privacy & Security

- All conversations and data stay on your local machine
- No external API calls except Claude AI for conversation
- Full user control over data access
- Assistant only reads data, doesn't modify without your explicit request

---

## Implementation Instructions

When this command is invoked, follow these steps:

### Step 1: Activate the Skill

Use the Skill tool to activate `aissist-cli`:
```
Skill tool with command: "aissist-cli"
```

This loads the full aissist CLI skill with command reference, workflow examples, and storage model documentation.

### Step 2: Understand the User's Intent

The user's prompt is in $ARGUMENTS. Analyze what they're asking about:

- **Goal-related** - List, review, or discuss goals
- **Progress** - Check accomplishments and history
- **Planning** - Prioritize work and suggest focus areas
- **Exploration** - Search for specific information
- **Advice** - Provide recommendations based on data

### Step 3: Select Relevant Commands

Based on intent, intelligently use aissist commands:

**For goals:**
```bash
aissist goal list --plain
```

**For progress:**
```bash
aissist history log --date "this week"
aissist recall "<topic>"
```

**For planning:**
```bash
aissist goal list    # Check deadlines
aissist todo list    # Check pending tasks
aissist history log  # Review recent work
```

**For exploration:**
```bash
aissist recall "<search query>"
aissist context show <context-name>
```

### Step 4: Provide Conversational Responses

Synthesize command outputs into natural language:
- Answer the user's question directly
- Provide relevant context and insights
- Make actionable recommendations
- Ask clarifying questions if needed
- Offer follow-up options

### Step 5: Handle Errors Gracefully

**CLI not found:**
- Explain aissist needs to be installed
- Provide installation instructions
- Suggest initialization steps

**No data available:**
- Acknowledge the lack of data
- Suggest how to start tracking
- Offer to help set up their first goal/todo

**Ambiguous queries:**
- Ask clarifying questions
- Provide example questions
- Offer multiple interpretation options

### Command Selection Heuristics

Use these patterns to select commands based on user intent:

| User mentions... | Load... |
|-----------------|---------|
| "goals", "objectives" | `aissist goal list` |
| "progress", "accomplished", "done" | `aissist history` + recall |
| "plan", "focus", "priority" | goals + todos + history |
| "today", "this week", "recently" | date-filtered commands |
| "learn", "about", "find", "show" | `aissist recall` |
| specific goal name | goal details + related todos/history |
| "todo", "task", "work on" | `aissist todo list` |

### Context Loading Strategy

Load data progressively:
1. **Don't load everything at once** - Use targeted commands
2. **Start with overviews** - `goal list`, `todo list`
3. **Drill down on request** - Load details when user asks
4. **Use semantic search** - `recall` for exploratory questions
5. **Read context files sparingly** - Only for specific topics

### Conversational Best Practices

1. **Be helpful and personal** - Use the user's actual data
2. **Stay factual** - Base responses on their tracked information
3. **Make it actionable** - Suggest concrete next steps
4. **Ask questions** - Clarify when intent is unclear
5. **Maintain context** - Remember the conversation thread
6. **Be transparent** - Explain what commands you're running

---

$ARGUMENTS
