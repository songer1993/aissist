# Aissist CLI Command Reference

Complete documentation of all aissist commands, options, and parameters.

## Table of Contents
- [init](#init)
- [goal](#goal)
- [todo](#todo)
- [history](#history)
- [context](#context)
- [reflect](#reflect)
- [propose](#propose)
- [recall](#recall)
- [config](#config)
- [clear](#clear)
- [path](#path)

---

## init

Initialize aissist storage structure.

**Syntax:**
```bash
aissist init [options]
```

**Options:**
- `-g, --global` - Initialize global storage in `~/.aissist/` instead of local `./.aissist/`

**Examples:**
```bash
# Initialize local storage for current project
aissist init

# Initialize global storage for personal use
aissist init --global
```

**Storage Created:**
- `goals/` - Goal tracking files
- `history/` - Daily activity logs (YYYY-MM-DD.md)
- `contexts/` - Context-specific information
- `reflections/` - Guided reflection entries
- `todos/` - Todo list management
- `proposals/` - AI-generated proposal documents
- `config.json` - Configuration settings

---

## goal

Manage goals with AI-generated codenames, deadlines, and progress tracking.

### goal add

Add a new goal.

**Syntax:**
```bash
aissist goal add [options] <text>
```

**Options:**
- `-d, --deadline <date>` - Set deadline (natural language or ISO date)
- `-p, --priority <level>` - Set priority (high, normal, low)

**Examples:**
```bash
aissist goal add "Learn TypeScript fundamentals"
aissist goal add "Complete project proposal" --deadline "next Friday"
aissist goal add "Master React hooks" --deadline "2024-12-31" --priority high
```

**Behavior:**
- Generates unique kebab-case codename (e.g., "learn-typescript-fundamentals")
- Parses natural language deadlines ("next week", "end of month")
- Creates goal in `goals/YYYY-MM-DD.md`

### goal list

List all goals.

**Syntax:**
```bash
aissist goal list [options]
```

**Options:**
- `-p, --plain` - Display in plain text instead of interactive mode
- `-s, --status <status>` - Filter by status (active, completed, all)

**Examples:**
```bash
aissist goal list  # Interactive checkbox UI
aissist goal list --plain  # Plain text output
aissist goal list --status completed  # Show only completed goals
```

**Interactive Mode Features:**
- Checkbox UI for easy selection
- Shows codename, description, deadline, priority
- Navigate with arrow keys, select with space

### goal remove

Remove a goal by codename.

**Syntax:**
```bash
aissist goal remove <codename>
```

**Examples:**
```bash
aissist goal remove learn-typescript-fundamentals
```

### goal complete

Mark a goal as completed.

**Syntax:**
```bash
aissist goal complete <codename>
```

**Examples:**
```bash
aissist goal complete learn-typescript-fundamentals
```

**Behavior:**
- Archives goal with completion timestamp
- Can be viewed with `goal list --status completed`

### goal deadline

Set or update goal deadline.

**Syntax:**
```bash
aissist goal deadline <codename> <date>
```

**Examples:**
```bash
aissist goal deadline learn-typescript-fundamentals "2024-12-31"
aissist goal deadline complete-project "next Friday"
```

---

## todo

Manage daily todos with priorities, goal linking, and automatic history logging.

### todo add

Add a new todo.

**Syntax:**
```bash
aissist todo add [options] <text>
```

**Options:**
- `-p, --priority <level>` - Set priority (high, normal, low)
- `-g, --goal <codename>` - Link to a goal

**Examples:**
```bash
aissist todo add "Review PR #123"
aissist todo add "Fix critical bug" --priority high
aissist todo add "Read TypeScript docs" --goal learn-typescript-fundamentals
```

### todo list

List todos.

**Syntax:**
```bash
aissist todo list [options]
```

**Options:**
- `-p, --plain` - Display in plain text instead of interactive mode
- `--priority <level>` - Filter by priority
- `--goal <codename>` - Show only todos linked to specific goal

**Examples:**
```bash
aissist todo list  # Interactive checkbox UI
aissist todo list --plain  # Plain text
aissist todo list --priority high  # High priority only
aissist todo list --goal learn-typescript-fundamentals  # Goal-specific todos
```

### todo done

Mark todo as completed and log to history.

**Syntax:**
```bash
aissist todo done <indexOrText>
```

**Examples:**
```bash
aissist todo done 1  # By index
aissist todo done "Review PR"  # By text match
```

**Behavior:**
- Marks todo as complete
- Automatically logs to history with timestamp
- If todo is linked to goal, history entry includes goal reference

### todo remove

Remove a todo without logging to history.

**Syntax:**
```bash
aissist todo remove <indexOrText>
```

**Examples:**
```bash
aissist todo remove 2
aissist todo remove "outdated task"
```

### todo edit

Edit a todo's text.

**Syntax:**
```bash
aissist todo edit <indexOrText>
```

**Examples:**
```bash
aissist todo edit 1
aissist todo edit "old description"
```

**Behavior:**
- Opens interactive prompt to edit todo text
- Preserves priority and goal links

### todo manage

Interactive management with full CRUD operations.

**Syntax:**
```bash
aissist todo manage [options]
```

**Options:**
- `--goal <codename>` - Manage todos for specific goal

**Examples:**
```bash
aissist todo manage  # Manage all todos
aissist todo manage --goal learn-typescript-fundamentals  # Goal-specific management
```

**Features:**
- Add, edit, remove, complete todos
- Change priorities
- Update goal links
- Reorder todos

---

## history

Log and review daily activities and accomplishments.

### history log

Log a history entry with support for retroactive logging.

**Syntax:**
```bash
aissist history log [options] [text]
```

**Options:**
- `-d, --date <date>` - Log to a specific date (ISO YYYY-MM-DD or natural language like "yesterday")
- `-g, --goal <codename>` - Link entry to a goal
- `-f, --from <source>` - Import from source (github)

**Examples:**
```bash
# Log to today (default)
aissist history log "Completed code review for authentication feature"

# Retroactive logging with ISO date
aissist history log "Design meeting notes" --date 2025-11-05

# Retroactive logging with natural language
aissist history log "Team standup" --date yesterday
aissist history log "Sprint planning" --date "last Monday"

# With goal linking
aissist history log "Finished tutorial chapter 3" --goal learn-typescript-fundamentals --date yesterday

# GitHub import
aissist history log --from github  # Import from GitHub (requires gh CLI)
```

**Retroactive Logging:**
- Supports ISO dates (YYYY-MM-DD) and natural language ("yesterday", "last Monday")
- Timestamp (HH:MM) reflects current time, not the retroactive date
- Default behavior (no --date flag) logs to today

**GitHub Import:**
- Requires GitHub CLI (`gh`) installed and authenticated
- Prompts for timeframe
- Imports commits and PRs as history entries
- Groups related changes semantically

### history show

Show history entries.

**Syntax:**
```bash
aissist history show [options]
```

**Options:**
- `-f, --from <timeframe>` - Show entries from timeframe (natural language or date)
- `-g, --goal <codename>` - Filter by goal

**Examples:**
```bash
aissist history show  # Recent entries
aissist history show --from "last week"
aissist history show --from "2024-01-01"
aissist history show --goal learn-typescript-fundamentals
```

**Timeframe Parsing:**
- "today", "yesterday"
- "this week", "last week"
- "this month", "last month"
- ISO dates: "2024-01-15"

---

## context

Organize context-specific information (work, diet, fitness, projects, etc.).

### context log

Log context-specific information with support for retroactive logging.

**Syntax:**
```bash
aissist context log [options] <context> <input>
```

**Options:**
- `-d, --date <date>` - Log to a specific date (ISO YYYY-MM-DD or natural language like "yesterday")
- `-g, --goal <codename>` - Link entry to a goal

**Examples:**
```bash
# Log to today (default)
aissist context log work "Sprint planning: focus on authentication module"
aissist context log diet "Meal prep for the week: chicken, rice, vegetables"
aissist context log fitness "Workout: 5k run in 28 minutes"

# Retroactive logging with ISO date
aissist context log work "Design review notes" --date 2025-11-05

# Retroactive logging with natural language
aissist context log fitness "Morning run" --date yesterday
aissist context log work "Team meeting" --date "last Monday"

# With goal linking
aissist context log work "MVP planning" --goal launch-mvp --date yesterday
```

**Behavior:**
- Creates/appends to `contexts/<context>/YYYY-MM-DD.md`
- Timestamps each entry (HH:MM reflects current time even for retroactive dates)
- Supports any context name (lowercase recommended)
- Default behavior (no --date flag) logs to today

### context list

List all available contexts.

**Syntax:**
```bash
aissist context list
```

**Examples:**
```bash
aissist context list
```

**Output:**
- Shows all context directories
- Displays entry count per context

### context show

Show entries for a context.

**Syntax:**
```bash
aissist context show [options] <context>
```

**Options:**
- `-f, --from <timeframe>` - Show entries from timeframe
- `-n, --limit <number>` - Limit number of entries

**Examples:**
```bash
aissist context show work
aissist context show work --from "this week"
aissist context show diet --limit 5
```

### context ingest

Bulk import files into a context.

**Syntax:**
```bash
aissist context ingest <context> <directory>
```

**Examples:**
```bash
aissist context ingest work ./meeting-notes/
aissist context ingest research ~/Documents/papers/
```

**Behavior:**
- Imports all text files from directory
- Preserves file names as entry titles
- Timestamps imports
- Supports: .txt, .md, .markdown

---

## reflect

Start a guided reflection session.

**Syntax:**
```bash
aissist reflect [options]
```

**Options:**
- `-f, --from <timeframe>` - Reflect on specific timeframe

**Examples:**
```bash
aissist reflect  # Reflect on today
aissist reflect --from "this week"
```

**Reflection Prompts:**
1. What did you accomplish?
2. What challenges did you face?
3. What did you learn?
4. What are you grateful for?
5. What will you focus on next?

**Behavior:**
- Interactive prompts for each question
- Saves to `reflections/YYYY-MM-DD.md`
- Pulls relevant history and goals for context

---

## propose

Generate AI-powered action proposals based on goals and history.

**Syntax:**
```bash
aissist propose [options] [timeframe]
```

**Options:**
- `-g, --goal [keyword]` - Focus proposals on specific goal (optional keyword for matching). When used without explicit timeframe, automatically uses goal deadline or comprehensive planning.
- `--reflect` - Prompt for a quick reflection before generating proposals
- `--tag <tag>` - Filter by specific tag
- `--context` - Include context files in the analysis
- `--debug` - Display debug information (prompt, data summary)
- `--raw` - Output raw Markdown without terminal formatting (for AI consumption)

**Examples:**
```bash
aissist propose now  # Get exactly 1 immediate action (1-2 hours)
aissist propose  # Propose based on all data
aissist propose "this week"  # Proposals for the week
aissist propose --goal learn-typescript  # Goal-focused with smart timeframe (uses goal deadline)
aissist propose "this week" --goal learn-typescript  # Goal-focused for specific timeframe
aissist propose "next quarter" --tag work  # Tagged proposals
```

**Goal-Focused Planning:**

When using `--goal` without an explicit timeframe:
- **If goal has deadline:** Plans from now until the deadline (e.g., "Now until December 31, 2025")
- **If goal has no deadline:** Uses comprehensive strategic planning (milestone-based, no time pressure)
- **With explicit timeframe:** Combines timeframe + goal focus (e.g., `propose "this week" --goal X`)

**Timeframe Options:**

- `now` - Returns exactly 1 immediate action item (completable in 1-2 hours)
- `today`, `tomorrow` - Daily planning
- `this week`, `next week` - Weekly planning
- `this month`, `next month` - Monthly planning
- `this quarter`, `next quarter`, `2026 Q1` - Quarterly planning
- `next N days` (e.g., `next 7 days`) - Custom day ranges
- `YYYY-MM-DD` - Specific date

**Post-Proposal Actions:**

After generating proposals, you can:

1. **Create TODOs (recommended)** - Convert proposal items into actionable todos
2. **Save as goals** - Save proposals as new goal entries
3. **Save as Markdown** - Export the full proposal to `proposals/YYYY-MM-DD.md` with metadata
4. **Skip** - Don't save the proposals

**Saved Proposal Format:**

When saved as Markdown, proposals are stored in `proposals/YYYY-MM-DD.md` with:
- Timestamp header
- Metadata (timeframe, tag filters, goal links)
- Full proposal text from Claude
- Separator for multiple proposals on the same day

**Requirements:**
- Claude API key configured (`claude login`)
- Sufficient history data for meaningful proposals

**Behavior:**
- Analyzes goals, history, and todos
- Generates prioritized action items
- Suggests concrete next steps
- Considers deadlines and priorities

---

## recall

AI-powered semantic search across all aissist data.

**Syntax:**
```bash
aissist recall <query> [--raw]
```

**Options:**
- `--raw` - Output raw Markdown without terminal formatting (recommended when using within Claude Code)

**Examples:**
```bash
aissist recall "what did I learn about TypeScript?" --raw
aissist recall "show my progress on fitness goals" --raw
aissist recall "when did I start the authentication project?" --raw
```

**Requirements:**
- Claude API key configured (`claude login`)

**Behavior:**
- Searches goals, history, contexts, reflections, todos
- Uses semantic understanding (not just keyword matching)
- Summarizes findings with relevant excerpts
- Provides source references (file paths and dates)

**Search Capabilities:**
- Natural language queries
- Time-based queries ("last month", "this year")
- Topic-based queries ("TypeScript", "fitness")
- Progress queries ("progress on X", "how far have I come")

---

## config

Manage aissist configuration settings.

### config hierarchy

Manage hierarchical configuration for monorepo/nested project access.

**Syntax:**
```bash
aissist config hierarchy [enable|disable|status]
```

**Examples:**
```bash
# Enable hierarchical read access to parent directories
aissist config hierarchy enable

# Check current hierarchy status
aissist config hierarchy status

# Disable hierarchical read access (sandbox mode)
aissist config hierarchy disable
```

**Behavior:**
- **enable**: Discovers parent `.aissist/` directories and enables read access
- **disable**: Restricts read/write to local directory only (sandbox mode)
- **status**: Shows current hierarchy configuration and read paths
- **Read**: Can access goals/history/todos from parent directories
- **Write**: All changes saved to local directory only (no pollution of parent configs)

### config hints

Manage contextual hints that appear after commands.

**Syntax:**
```bash
aissist config hints [enable|disable|status]
aissist config hints strategy <type>
```

**Options:**
- `enable` - Turn on contextual hints
- `disable` - Turn off contextual hints
- `status` - Show current hints configuration
- `strategy <type>` - Set strategy: `ai` (AI-generated) or `static` (predefined)

**Examples:**
```bash
# Enable hints
aissist config hints enable

# Check hints status
aissist config hints status

# Set hints strategy to AI-generated
aissist config hints strategy ai

# Disable hints
aissist config hints disable
```

**Behavior:**
- Hints appear after commands to suggest related actions
- AI strategy provides context-aware suggestions
- Static strategy shows predefined helpful tips

### config update-check

Manage automatic update checks on startup.

**Syntax:**
```bash
aissist config update-check [enable|disable|status]
```

**Examples:**
```bash
# Enable update checks
aissist config update-check enable

# Check current status
aissist config update-check status

# Disable update checks
aissist config update-check disable
```

**Behavior:**
- When enabled, checks npm registry for new versions on startup
- Shows notification if newer version is available
- Does not auto-update, just notifies

### config context-injection

Manage the Claude Code session hook that injects active goals and recent history.

**Syntax:**
```bash
aissist config context-injection [enable|disable|status]
```

**Examples:**
```bash
# Enable context injection hook
aissist config context-injection enable

# Check if context injection is enabled
aissist config context-injection status

# Disable context injection hook
aissist config context-injection disable
```

**Behavior:**
- When enabled, injects active goals and recent history at Claude Code session start
- Provides Claude with immediate awareness of your current priorities
- Includes:
  - All active goals with codenames and deadlines
  - Recent history entries (last 3 days)
- Disabled by default to avoid session noise
- Useful for maintaining continuity between Claude Code sessions

**Requirements:**
- Aissist plugin installed in Claude Code
- Only works within Claude Code sessions (not standalone CLI)

---

## clear

Clear storage data.

**Syntax:**
```bash
aissist clear [options]
```

**Options:**
- `--goals` - Clear only goals
- `--history` - Clear only history
- `--contexts` - Clear only contexts
- `--reflections` - Clear only reflections
- `--todos` - Clear only todos
- `--all` - Clear all data (prompts for confirmation)

**Examples:**
```bash
aissist clear --todos  # Clear only todos
aissist clear --history  # Clear history
aissist clear --all  # Clear everything (with confirmation)
```

**Safety:**
- Always prompts for confirmation
- Shows what will be cleared
- Preserves config.json

---

## path

Show current storage path.

**Syntax:**
```bash
aissist path
```

**Examples:**
```bash
aissist path
```

**Output:**
- Displays absolute path to current storage directory
- Shows whether global or local storage is active
- Useful for verifying storage location or debugging

---

## Global Options

These options work with any command:

- `-h, --help` - Display help for command
- `-V, --version` - Display version number

**Examples:**
```bash
aissist --version
aissist goal --help
aissist todo add --help
```
