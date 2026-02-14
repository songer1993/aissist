# Clarity → Aissist Migration & Enhancement Design

**Date:** 2026-02-14
**Status:** Approved
**Approach:** Context as Universal Store (Approach A)

## Background

Migrating from an Obsidian PARA vault (`~/clarity/`, ~321 notes) to aissist, a local-first CLI personal assistant. The goal is to combine aissist's simplicity and native Claude Code integration with the rich data accumulated in the Obsidian vault.

### Data Inventory (Source: ~/clarity/)

| Type | Count | Key Fields |
|------|-------|------------|
| Tasks (inbox) | 27 | status, priority, effort, due, project, area |
| Projects | 5 | status, timeframe, area |
| Areas | 7 | life-aspect |
| Emails | 154 | direction, correspondent, date, previous, project |
| Contacts | 14 | role, institution, email |
| Archived PhD tasks | 48 | status, priority, effort, chapter |
| Trade records | 30 | coin, side, size, entry, exit, pnl, account, dates |
| Trading diary | 6 | date, project |
| Daily notes | 4 | date |
| References | 8 | category, link, project |
| Templates | 11 | (Templater format) |
| Database views | 6 | (YAML base configs) |

## Design Principles

1. **Preserve aissist's native model** — goals, history, todos, context, reflections stay as-is
2. **Extend only context/** — allow entity files (`{name}.md`) alongside date-based files (`YYYY-MM-DD.md`)
3. **Full data preservation** — all original text migrated verbatim, no summaries or truncation
4. **Convention over configuration** — categories auto-create, schemas inferred from usage
5. **Grep is the index** — consistent frontmatter + small files = fast querying without a manifest
6. **Self-evolving system** — DESCRIPTION.md grows richer as usage patterns emerge
7. **Fork-friendly** — changes are minimal and upstreamable

## Architecture

### Storage Layout

```
~/.aissist/
├── config.json                      # Settings, hooks, context_types
├── DESCRIPTION.md                   # Living "brain config" — categories, priorities, identity
├── progress.json                    # Goal hierarchy + parent-child sync
│
├── goals/                           # STOCK AISSIST — unchanged
│   ├── YYYY-MM-DD.md               # Active goals (areas + projects mapped here)
│   └── finished/                   # Completed goals
│       └── YYYY-MM-DD.md
│
├── history/                         # STOCK AISSIST — unchanged
│   └── YYYY-MM-DD.md              # Timestamped activity logs
│
├── todos/                           # STOCK AISSIST — unchanged
│   └── YYYY-MM-DD.md              # Checkbox tasks with optional goal links
│
├── context/                         # EXTENDED — entity files + new subcategories
│   ├── email/                      # One file per email (entity)
│   │   └── {slug}.md
│   ├── people/                     # One file per contact (entity)
│   │   └── {slug}.md
│   ├── trading/                    # One file per trade or diary entry
│   │   └── {slug}.md
│   ├── reference/                  # Permanent knowledge (entity)
│   │   └── {slug}.md
│   └── work/                       # General work notes (date-based, stock aissist)
│       └── YYYY-MM-DD.md
│
└── reflections/                     # STOCK AISSIST — unchanged
    └── YYYY-MM-DD.md
```

### Core Change to Aissist

**Single change:** `context/` accepts both file patterns:
- `context/{category}/YYYY-MM-DD.md` — date-based entries (existing behavior)
- `context/{category}/{slug}.md` — named entity files (new)

The `context log`, `context list`, `context show` commands learn to handle both patterns. Detection is simple: if the filename matches `YYYY-MM-DD.md`, it's date-based; otherwise it's an entity.

### Context Categories

Categories are **user-defined and auto-discovered**:

1. Any string creates a subfolder on first use (`aissist context log --type cooking`)
2. `DESCRIPTION.md` documents categories in natural language for Claude
3. New categories auto-append to DESCRIPTION.md on first use
4. After 3-5 entries, Claude infers field patterns and enriches the description
5. Users can edit DESCRIPTION.md directly for full control

Example `DESCRIPTION.md`:
```markdown
# My Personal Assistant

I'm a PhD student at Cambridge working on thesis corrections,
attending IEEE VR 2026 in Korea, and trading crypto on the side.

## My Context Categories
- email: correspondence records (direction, correspondent, date, project, thread)
- people: contact directory (role, institution, email)
- trading: trade records and diary entries (coin, side, entry, exit, pnl, account)
- reference: permanent knowledge, guides, certificates
- work: general work notes and logs
```

### Frontmatter Schemas

All entity files use YAML frontmatter with `schema_version` and `kind` fields.

**Goal (Area)**
```yaml
schema_version: "1.0"
timestamp: "10:00"
codename: phd-academia
kind: area
status: active
```

**Goal (Project)**
```yaml
schema_version: "1.0"
timestamp: "14:30"
codename: phd-thesis-corrections
deadline: "2026-06-30"
parent_goal: phd-academia
kind: project
status: active
```

**Todo Entry**
```yaml
schema_version: "1.0"
timestamp: "14:30"
goal: phd-thesis-corrections
```
```
- [ ] Submit ethics amendment form #high #quick due::2026-03-01
- [ ] Revise Chapter 4 figures #medium #deep
```

**Context: Email**
```yaml
schema_version: "1.0"
kind: email
direction: from
correspondent: per-ola-kristensson
date: "2026-02-12"
thread: corrections-feb-2026
project: phd-thesis-corrections
```
```
(Full original email body preserved verbatim below frontmatter)
```

**Context: Contact**
```yaml
schema_version: "1.0"
kind: contact
role: PhD Supervisor
institution: Cambridge
email: pok21@cam.ac.uk
```

**Context: Trade**
```yaml
schema_version: "1.0"
kind: trade
status: closed
result: win
coin: BTC
side: short
size: 0.5
entry: 97200
exit: 95058
pnl: 2142
duration: 2d
account: hl-vault
date_open: "2026-02-10"
date_close: "2026-02-12"
project: trading-bot
```

**Context: Trading Diary**
```yaml
schema_version: "1.0"
kind: diary
date: "2026-02-10"
project: trading-bot
```

**Context: Reference**
```yaml
schema_version: "1.0"
kind: reference
category: phd-corrections
project: phd-thesis-corrections
```

## Retrieval Strategy

**Grep is the index.** With consistent frontmatter and predictable subcategory paths:

| Query | Method |
|-------|--------|
| "Emails from Per Ola" | `grep -r "correspondent: per-ola" context/email/` |
| "All trades this month" | `grep -r "date_close: 2026-02" context/trading/` |
| "Everything about PhD project" | `grep -r "project: phd-thesis-corrections" .` |
| "Contact info for Per Ola" | `cat context/people/per-ola-kristensson.md` |
| "Active goals" | `ls goals/ + grep -v finished` |
| "Open todos" | `grep -r "\- \[ \]" todos/` |

Claude's `recall` command already uses Grep/Glob/Read — it naturally works with this structure.

## Claude Code Integration

### Plugin Architecture

The aissist-plugin provides Claude Code integration. All capabilities live in the plugin (not CLAUDE.md):

**Slash Commands:**
| Command | Purpose |
|---------|---------|
| `/aissist:chat` | Conversational assistant (existing) |
| `/aissist:log` | Smart history logging (existing) |
| `/aissist:recall` | Semantic search (existing) |
| `/aissist:context` | Log context with auto-categorization (new) |
| `/aissist:report` | Generate reports (existing) |
| `/aissist:todo` | Extract todos from freeform text (existing) |

**Hooks:**
| Hook | Trigger | Purpose |
|------|---------|---------|
| `inject-context.sh` | SessionStart | Inject DESCRIPTION.md + active goals into context |
| `prompt-hints.sh` | UserPromptSubmit | Keyword detection + command suggestions |
| `post-edit.sh` | PostToolUse(Edit) | Remind to log work |
| `post-bash.sh` | PostToolUse(Bash) | Detect git commits, builds, deployments |
| `category-sync.sh` | PostToolUse(Write) | Auto-update DESCRIPTION.md when new categories emerge (new) |

**Auto-categorization flow:**
1. User says: "I got an email from Per Ola about corrections"
2. Claude reads DESCRIPTION.md → knows `email` category with fields
3. Creates `context/email/from-per-ola-corrections-2026-02-14.md`
4. Sets frontmatter: direction=from, correspondent=per-ola-kristensson, project=phd-thesis-corrections
5. Preserves full email body verbatim
6. Logs activity to history

### Self-Evolution Mechanism

`DESCRIPTION.md` is a living document that Claude can read AND write:

1. **On first use of new category:** CLI creates folder, plugin detects undocumented category, appends placeholder to DESCRIPTION.md
2. **Schema inference:** After 3-5 entries, Claude analyzes frontmatter patterns and enriches category description with discovered fields
3. **Periodic reflection:** `/aissist:reflect` can trigger meta-reflection — Claude scans categories, proposes DESCRIPTION.md updates for user approval
4. **Goal evolution:** When goals complete or new ones emerge, the intro paragraph can be refreshed

## Migration Strategy

### Principles
- **Full data preservation** — every original text migrated verbatim, no summaries
- **Idempotent** — script can re-run safely (skips existing files)
- **Source untouched** — ~/clarity/ is never modified
- **Dry-run first** — preview mode shows what would be created
- **Migration report** — logs source → destination mapping for audit

### Phase 1: Goals (Areas + Projects) — Priority

**Areas (7) → goals/**
- Each area → goal entry with `codename: {area-slug}`, `kind: area`
- Grouped into a single `goals/YYYY-MM-DD.md` file by creation date
- Full body content preserved (life-aspect description, linked projects)

**Projects (5) → goals/**
- Each project → goal entry with `codename: {project-slug}`, `kind: project`, `parent_goal: {area-codename}`
- `timeframe` → `deadline` (converted to end-of-quarter date)
- Full body preserved (objectives, key results, notes)
- Completed projects → `goals/finished/`

### Phase 2: Todos (Tasks)

**Inbox tasks (27) → todos/**
- Each task → checkbox entry in `todos/{created-date}.md`
- Frontmatter: `goal: {project-codename}` (from `project:` field)
- Priority/effort → inline tags: `#high`, `#quick`
- Due dates → `due::YYYY-MM-DD` inline
- Done tasks → `[x]` + logged to history
- Full task description preserved in body

### Phase 3: Context Migration

**Contacts (14) → context/people/**
- Each contact → `context/people/{slug}.md`
- Frontmatter: kind=contact, role, institution, email
- Full body preserved (active threads, notes)

**Emails (154) → context/email/**
- Each email → `context/email/{slug}.md`
- Frontmatter: kind=email, direction, correspondent (codename), date, project (codename)
- Wiki-link `previous:` → `thread:` codename grouping
- **Full original email body preserved verbatim**

**Trades (30) → context/trading/**
- Each trade → `context/trading/{slug}.md`
- All numeric fields preserved exactly (entry, exit, pnl, size)
- Frontmatter: kind=trade, all trade fields
- Full body preserved (fills, context notes)

**Trading diary (6) → context/trading/**
- Each entry → `context/trading/diary-{date}.md`
- Frontmatter: kind=diary, date, project
- Full body preserved (positions, account status, observations)

**References (8) → context/reference/**
- Each reference → `context/reference/{slug}.md`
- Full body preserved

**Archived PhD tasks (48) → context/reference/**
- Each correction task → `context/reference/{slug}.md`
- Full body preserved (correction details, approach taken)

### Phase 4: History + Reflections

**Daily notes (4) → history/ and/or reflections/**
- Parse sections (Morning, Afternoon, Notes, Trading)
- Activity-oriented content → `history/YYYY-MM-DD.md`
- Reflection-oriented content → `reflections/YYYY-MM-DD.md`
- Full content preserved

### Migration Script

TypeScript script (`scripts/migrate-clarity.ts`) that:
1. Reads each `~/clarity/**/*.md` file
2. Parses YAML frontmatter with `gray-matter`
3. Routes by `type:` field to correct aissist destination
4. Transforms frontmatter (Obsidian schema → aissist schema)
5. Converts `[[wiki-links]]` to codename references
6. Preserves full body content verbatim
7. Writes to `~/.aissist/` storage path
8. Generates `migration-report.json` (source path → dest path + any warnings)
9. Supports `--dry-run` flag for preview

### What Is NOT Migrated

| Item | Reason |
|------|--------|
| Templates (11) | Aissist has its own template system; not needed |
| Base configs (6) | Obsidian-specific database views; replaced by grep-based querying |
| `.obsidian/` config | App-specific settings |
| Dashboard.md | Replaced by aissist CLI commands |

## Development Workflow

1. Fork & clone: `~/Development/aissist/`
2. Develop locally (extend context system, write migration script, enhance plugin)
3. Push to personal GitHub remote
4. Install plugin in Claude Code from GitHub link
5. Run migration script
6. Verify data integrity
7. Cherry-pick upstreamable changes for PRs to original repo

## Aissist Core Changes (Summary)

| Change | Scope | Upstreamable? |
|--------|-------|---------------|
| Context entity files (`{name}.md`) | `src/utils/storage.ts`, `src/commands/context.ts` | Yes |
| `kind:` field in context frontmatter | `src/utils/yaml-helpers.ts` | Yes |
| `context query` command | `src/commands/context.ts` | Yes |
| DESCRIPTION.md auto-discovery | Plugin hook | Yes (plugin) |
| Migration script | `scripts/migrate-clarity.ts` | No (personal) |
| Custom context subcategories | Config only | N/A |
