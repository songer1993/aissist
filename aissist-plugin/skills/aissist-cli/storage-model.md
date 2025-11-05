# Aissist Storage Model

Understanding how aissist organizes and stores your data.

## Table of Contents
- [Storage Locations](#storage-locations)
- [Directory Structure](#directory-structure)
- [File Formats](#file-formats)
- [AI-Generated Codenames](#ai-generated-codenames)
- [Git Compatibility](#git-compatibility)
- [Manual Editing](#manual-editing)
- [Semantic Recall](#semantic-recall)

---

## Storage Locations

Aissist supports two storage modes:

### Local Storage

**Location:** `./.aissist/` in current directory

**Best for:**
- Project-specific goals and todos
- Work within a specific codebase
- Team-shared progress tracking (via git)
- Context that relates to a specific project

**Initialize:**
```bash
aissist init
```

**Example use cases:**
- Software project: Track features, bugs, development tasks
- Writing project: Track chapters, research, editing tasks
- Course project: Track assignments, readings, deadlines

### Global Storage

**Location:** `~/.aissist/` in home directory

**Best for:**
- Personal life goals
- General daily todos not tied to projects
- Personal reflections and journaling
- Fitness, health, and lifestyle tracking
- Learning goals across multiple projects

**Initialize:**
```bash
aissist init --global
```

**Example use cases:**
- Personal development goals
- Fitness and health tracking
- Daily todo lists
- General life reflections

### Checking Current Storage

```bash
aissist path
```

**Output example:**
```
Current storage: /Users/username/.aissist/ (global)
```

or

```
Current storage: /Users/username/projects/my-app/.aissist/ (local)
```

---

## Directory Structure

Once initialized, aissist creates the following structure:

```
.aissist/ (or ~/.aissist/)
├── config.json                 # Configuration settings
├── goals/                      # Goal tracking
│   ├── 2024-01-15.md          # Goals created on Jan 15, 2024
│   ├── 2024-01-20.md
│   └── ...
├── history/                    # Daily activity logs
│   ├── 2024-01-15.md          # History for Jan 15, 2024
│   ├── 2024-01-16.md
│   └── ...
├── contexts/                   # Context-specific information
│   ├── work/
│   │   ├── 2024-01-15.md
│   │   └── 2024-01-16.md
│   ├── diet/
│   ├── fitness/
│   └── ...
├── reflections/                # Guided reflection entries
│   ├── 2024-01-15.md
│   └── ...
└── todos/                      # Todo management
    └── 2024-01-15.md
```

### Directory Purposes

**goals/**
- Stores all goals with metadata
- One file per day goals are created
- Includes codenames, descriptions, deadlines, status

**history/**
- Daily activity logs
- Timestamped entries
- Links to goals when relevant
- One file per day (YYYY-MM-DD.md)

**contexts/**
- Organized by context name (work, diet, fitness, etc.)
- Each context is a subdirectory
- Daily files within each context
- Supports any context name

**reflections/**
- Guided reflection sessions
- Prompted questions with responses
- Weekly/monthly reflection patterns
- One file per reflection session

**todos/**
- Current and completed todos
- Priority tracking
- Goal linkage
- Automatic history logging on completion

**config.json**
- Storage version
- Creation date
- Settings (e.g., animations enabled)
- User preferences

---

## File Formats

All data is stored in **human-readable Markdown** format.

### Goals File Format

`goals/2024-01-15.md`:
```markdown
## learn-typescript-fundamentals

**Status:** active
**Created:** 2024-01-15T10:30:00Z
**Deadline:** 2024-12-31
**Priority:** high
**Description:** Learn TypeScript fundamentals

---

## build-portfolio-website

**Status:** completed
**Created:** 2024-01-15T14:00:00Z
**Completed:** 2024-02-10T16:00:00Z
**Description:** Build portfolio website with Next.js

---
```

### History File Format

`history/2024-01-15.md`:
```markdown
# History - January 15, 2024

## 10:30 AM

Completed code review for PR #123

---

## 2:45 PM

Fixed critical authentication bug

**Goal:** build-user-authentication

---

## 4:15 PM

Helped Sarah debug deployment issue

---
```

### Context File Format

`contexts/work/2024-01-15.md`:
```markdown
# Work Context - January 15, 2024

## 9:00 AM

Team standup: Discussed sprint priorities for authentication module

---

## 11:30 AM

Sprint planning: Decided to use JWT for token management

---

## 3:00 PM

Code review meeting: Reviewed security best practices

---
```

### Todo File Format

`todos/2024-01-15.md`:
```markdown
# Todos

- [ ] Review PR #156 (priority: high)
- [ ] Update documentation (goal: improve-docs)
- [x] Fix critical bug (completed: 2024-01-15T14:30:00Z)
- [ ] Team standup at 10am
```

### Reflection File Format

`reflections/2024-01-15.md`:
```markdown
# Reflection - January 15, 2024

## What did you accomplish?

Completed authentication module, fixed 3 bugs, helped 2 team members

## What challenges did you face?

JWT token expiration logic was tricky to get right

## What did you learn?

Learned about secure token management and refresh token patterns

## What are you grateful for?

Grateful for patient team members who helped debug issues

## What will you focus on next?

Will focus on user profile functionality and testing
```

---

## AI-Generated Codenames

Goals automatically receive AI-generated codenames for easy reference.

### Codename Format

- **Pattern:** lowercase-kebab-case
- **Example:** "learn-typescript-fundamentals"
- **Purpose:** Easy to type, memorable, unique

### How Codenames Are Generated

When you create a goal:
```bash
aissist goal add "Learn TypeScript fundamentals"
```

Aissist generates a codename by:
1. Converting to lowercase
2. Removing special characters
3. Replacing spaces with hyphens
4. Ensuring uniqueness

**Result:** `learn-typescript-fundamentals`

### Using Codenames

Codenames are used throughout aissist:
```bash
# Link todo to goal
aissist todo add "Read TS handbook" --goal learn-typescript-fundamentals

# Link history to goal
aissist history log "Completed chapter 3" --goal learn-typescript-fundamentals

# Filter by goal
aissist history show --goal learn-typescript-fundamentals

# Complete goal
aissist goal complete learn-typescript-fundamentals
```

### Finding Codenames

If you forget a codename:
```bash
# View all goals with codenames
aissist goal list --plain

# Use recall to find it
aissist recall "what's the codename for my TypeScript goal?"
```

---

## Git Compatibility

All aissist data is **git-friendly** by design.

### Why Git Compatibility Matters

- **Version control** for your life's progress
- **Backup** to remote repositories
- **Team sharing** for project-specific goals/todos
- **History** of your personal growth
- **Sync** across multiple machines

### Recommended Git Setup

```bash
# Navigate to storage directory
cd ~/.aissist  # or cd ./.aissist

# Initialize git
git init

# Create .gitignore
echo "config.json" > .gitignore  # Keep config private

# Optional: Ignore sensitive contexts
echo "contexts/personal/" >> .gitignore
echo "contexts/health/" >> .gitignore

# Commit your data
git add .
git commit -m "Initial aissist data"

# Push to remote (optional)
git remote add origin <your-repo-url>
git push -u origin main
```

### Git Ignore Patterns

**Recommended .gitignore:**
```
# Keep config private
config.json

# Ignore sensitive contexts
contexts/personal/
contexts/health/
contexts/finance/

# Optionally keep reflections private
reflections/
```

### Team Collaboration

For project-local storage (`./.aissist/`):

```bash
# Team member 1
cd my-project
aissist init
git add .aissist/
git commit -m "Initialize project goals and todos"
git push

# Team member 2
git pull
# Now has shared goals and todos

# Both can contribute
aissist goal list --plain
aissist todo add "Implement feature X"
git add .aissist/
git commit -m "Add todo for feature X"
git push
```

### Merge Conflicts

Since files are dated Markdown, conflicts are rare. If they occur:

1. Both versions are usually additive
2. Manually merge entries
3. Keep all unique content
4. Resolve timestamp conflicts by keeping most recent

---

## Manual Editing

All files can be manually edited - they're just Markdown!

### When to Manually Edit

- Bulk operations (rename multiple goals)
- Fix typos in historical entries
- Reorganize or clean up old data
- Export data for other tools
- Custom formatting or annotations

### Safe Editing Practices

1. **Backup first:**
   ```bash
   cp -r ~/.aissist ~/.aissist.backup
   ```

2. **Follow format conventions:**
   - Maintain heading levels
   - Keep timestamp format consistent
   - Preserve goal codenames exactly
   - Don't break YAML frontmatter (if any)

3. **Test after editing:**
   ```bash
   aissist goal list  # Verify goals still work
   aissist history show  # Verify history displays
   ```

### Example: Bulk Rename Goals

If you need to rename multiple goals:

```bash
# 1. Backup
cp -r ~/.aissist ~/.aissist.backup

# 2. Edit files
vim ~/.aissist/goals/2024-01-15.md
# Change codenames consistently

# 3. Update references in history
find ~/.aissist/history -type f -exec sed -i '' 's/old-codename/new-codename/g' {} +

# 4. Update references in todos
find ~/.aissist/todos -type f -exec sed -i '' 's/old-codename/new-codename/g' {} +

# 5. Verify
aissist goal list
```

### Exporting Data

**Export to JSON:**
```bash
# Manual parsing (example with jq)
cat ~/.aissist/goals/*.md | grep "## " | sed 's/## //' > goals.txt
```

**Export to CSV:**
```bash
# Extract goals to CSV (custom script)
for file in ~/.aissist/goals/*.md; do
  grep -A 5 "^## " "$file"
done | your-parser > goals.csv
```

---

## Semantic Recall

How aissist's AI-powered search works across your data.

### What Gets Searched

Semantic recall searches **all** aissist data:
- Goals (descriptions, codenames, status)
- History entries (all logged activities)
- Context notes (across all contexts)
- Reflections (all responses)
- Todos (current and completed)

### Search Process

When you run:
```bash
aissist recall "what did I learn about TypeScript?"
```

Aissist:
1. **Reads** all Markdown files
2. **Extracts** relevant text chunks
3. **Sends** to Claude AI with your query
4. **Returns** semantically relevant results with sources

### Semantic vs Keyword Search

**Keyword search** (basic grep):
```bash
# Only finds exact matches
grep "TypeScript" ~/.aissist/**/*.md
```

**Semantic search** (aissist recall):
```bash
# Finds:
# - "Learned TS fundamentals"
# - "TypeScript tutorial"
# - "Completed typed JavaScript course"
# - Related concepts even without exact keyword
aissist recall "what did I learn about TypeScript?"
```

### Example Queries

**Progress queries:**
```bash
aissist recall "show my progress on fitness goals"
aissist recall "how far have I come with React?"
```

**Time-based queries:**
```bash
aissist recall "what did I do last month?"
aissist recall "my work this week"
```

**Topic queries:**
```bash
aissist recall "everything about authentication"
aissist recall "meal planning ideas"
```

**Learning queries:**
```bash
aissist recall "what have I learned about Docker?"
aissist recall "key insights from my reflections"
```

### Recall Performance

**Requirements:**
- Claude API key configured: `claude login`
- Network connection for API calls

**Tips for better results:**
- Be specific in queries
- Use natural language
- Ask questions conversationally
- Reference time periods when relevant

### Privacy Note

- Recall sends data to Claude API (Anthropic)
- Data is **not** stored by Claude beyond the request
- Keep sensitive information in git-ignored contexts if concerned
- Alternatively, don't use recall for highly sensitive data

---

## Best Practices Summary

1. **Choose storage wisely** - Use local for projects, global for personal
2. **Commit regularly to git** - Version control your progress
3. **Use gitignore** - Keep private contexts out of version control
4. **Manual edits are safe** - But backup first
5. **Trust semantic recall** - It's smarter than keyword search
6. **Organize with contexts** - Separate work, personal, health, etc.
7. **Keep codenames consistent** - They're used for linking throughout
