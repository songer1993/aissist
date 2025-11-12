# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

Aissist is a local-first, AI-powered CLI personal assistant that helps users track goals, todos, history, and context—all stored as human-readable Markdown files. The project integrates with Claude Code for AI-powered semantic search and action planning.

**Key characteristics:**
- Local-first: All data stored in `.aissist/` directories (global `~/.aissist/` or project-specific)
- Markdown-first: Everything is human-readable and Git-compatible
- Hierarchical storage: Supports reading from parent directories while writing locally (for monorepos)
- Claude integration: Uses Claude Code CLI for semantic recall and AI-powered proposals

## Development Commands

### Build and Run
```bash
npm run build              # Compile TypeScript to dist/
npm run dev                # Watch mode for development
node dist/index.js [cmd]   # Run locally after build
```

### Testing
```bash
npm test                   # Run all tests in watch mode
npm run test:unit          # Unit tests only (excludes e2e)
npm run test:e2e           # E2E tests only
npm run test:e2e:ci        # E2E tests in CI mode (builds first)
npm run test:all           # All tests (unit + e2e)
npm run test:ui            # Vitest UI mode
```

### Quality
```bash
npm run lint               # ESLint check
npm run format             # Prettier format
```

### Release
```bash
npm run release            # Version bump and publish workflow
```

## Architecture

### Directory Structure

```
src/
├── index.ts              # CLI entry point, command registration
├── commands/             # Command handlers (goal, history, todo, etc.)
│   ├── goal.ts          # Goal tracking with codenames
│   ├── history.ts       # Activity logging
│   ├── todo.ts          # Task management with goal linking
│   ├── context.ts       # Context-specific notes
│   ├── reflect.ts       # Guided reflection
│   ├── propose.ts       # AI-powered planning via Claude
│   ├── recall.ts        # Semantic search via Claude
│   └── config.ts        # Configuration management
├── utils/               # Shared utilities
│   ├── storage.ts       # Core storage abstraction layer
│   ├── yaml-helpers.ts  # YAML front matter parsing/serialization
│   ├── goal-helpers.ts  # Goal-specific logic (codenames, deadlines)
│   ├── todo-helpers.ts  # Todo-specific logic (checkboxes, linking)
│   ├── data-aggregator.ts  # Multi-file data aggregation
│   ├── timeframe-parser.ts # Natural language date parsing
│   ├── search.ts        # Keyword search utilities
│   └── markdown.ts      # Markdown rendering for terminal
├── llm/
│   └── claude.ts        # Claude Code CLI integration
└── __tests__/
    ├── e2e/             # End-to-end subprocess tests
    └── *.test.ts        # Unit tests co-located with source

openspec/                # OpenSpec workflow for change proposals
├── AGENTS.md           # Instructions for AI assistants
├── project.md          # Project conventions
├── specs/              # Current specifications (what IS built)
└── changes/            # Active proposals (what SHOULD change)
```

### Layered Architecture

1. **CLI Layer** (`src/commands/*`): Command handlers using `commander`
2. **Service Layer** (`src/utils/*-helpers.ts`): Business logic and domain operations
3. **Storage Layer** (`src/utils/storage.ts`): File I/O, path resolution, YAML handling
4. **LLM Layer** (`src/llm/claude.ts`): Claude Code CLI integration for AI features

### Key Architectural Patterns

**Storage Abstraction**
- `getStoragePath()`: Resolves global vs local storage automatically
- `findStoragePath()`: Walks up directory tree to find `.aissist/`
- `discoverHierarchy()`: Finds all parent `.aissist/` directories for hierarchical reads
- All file operations go through `storage.ts` functions

**YAML Front Matter Format**
- All entries use YAML front matter for metadata (schema version, timestamps, codenames, etc.)
- `yaml-helpers.ts` provides parsing and serialization
- Schema version: `1.0` (current)
- Example:
  ```markdown
  ---
  schema_version: "1.0"
  timestamp: "14:30"
  codename: complete-mvp
  deadline: "2025-12-01"
  ---

  Entry content here
  ```

**Date-Based File Organization**
- All entries stored in `YYYY-MM-DD.md` files
- Multiple entries per file separated by `---`
- Completed goals moved to `goals/finished/` with completion date

**Hierarchical Configuration**
- Opt-in via `config.json`: `readPaths: [...]`
- Reads from parents, writes locally only
- Useful for monorepos and nested projects

**Claude Integration**
- Uses `claude` CLI (spawned subprocess) for AI features
- Security: Restricted to read-only tools (`--allowedTools ''` for prompts, file analysis tools for recall)
- Recall: Uses Claude's Grep/Read/Glob tools for semantic file analysis
- Propose: Generates action plans based on goals/history/todos

## Data Formats

### Goals
- Stored in `goals/YYYY-MM-DD.md`
- Each goal has a unique codename (kebab-case)
- Optional deadline field
- Completed goals moved to `goals/finished/`

### Todos
- Stored in `todos/YYYY-MM-DD.md`
- Checkbox format: `- [ ] Task text`
- Optional `goal` field links to goal codename
- Completed todos logged to history

### History
- Stored in `history/YYYY-MM-DD.md`
- Simple timestamped entries
- Supports retroactive logging via `--date`

### Context
- Stored in `context/[name]/YYYY-MM-DD.md`
- Arbitrary context names (work, diet, fitness, etc.)
- Supports file ingestion

### Reflections
- Stored in `reflections/YYYY-MM-DD.md`
- Guided prompts for self-reflection

## Testing Strategy

**Unit Tests**
- Co-located with source files (`*.test.ts`)
- Test utilities, helpers, and pure functions
- Mock file I/O when needed

**E2E Tests**
- Located in `src/__tests__/e2e/`
- Test full CLI commands via subprocess execution
- Use temporary `.aissist/` directories
- Longer timeouts (60s) for subprocess operations

**Running a Single Test**
```bash
npx vitest run path/to/test.test.ts          # Specific file
npx vitest run -t "test name pattern"        # By name pattern
```

## Important Implementation Details

**Goal Codenames**
- Auto-generated from goal text (kebab-case)
- Used for cross-references (todos → goals)
- Ensures stable references even if goal text changes

**Interactive Deadline Prompts**
- Default: "Tomorrow" when adding goals
- Natural language: "next week", "this month", "2026 Q1"
- Can skip or use `--deadline` flag to bypass prompt

**Natural Language Date Parsing**
- `timeframe-parser.ts` handles relative dates
- Supports: "yesterday", "last week", "next month", "this quarter"
- Falls back to ISO date parsing

**Completion Animations**
- Optional terminal animations for todo/goal completion
- Configurable in `config.json`: `animations.enabled`
- Uses `ora` for spinners and visual feedback

**Migration Strategy**
- `needsMigration()` checks for legacy format (no YAML front matter)
- `writeFileAtomic()` ensures atomic writes for data integrity
- Backward compatible with goals without codenames

## Synchronization Requirements

When making changes that affect the CLI:
1. **Update documentation**: Modify `README.md` to reflect CLI changes
2. **Update plugin**: Keep `aissist-plugin/README.md` in sync with CLI changes
3. **Teach the skill**: Update plugin skill definitions for new commands/options

## Common Patterns

**Adding a New Command**
1. Create `src/commands/[name].ts` with command builder
2. Import and register in `src/index.ts`
3. Add storage helpers to `src/utils/storage.ts` if needed
4. Write tests in `src/commands/[name].test.ts` or `src/__tests__/e2e/`
5. Update README.md with command documentation

**Adding YAML Metadata Fields**
1. Update type definitions in relevant `*-helpers.ts` file
2. Modify `parseYamlFrontMatter()` usage to extract new fields
3. Update `serializeYamlFrontMatter()` calls to include new fields
4. Ensure backward compatibility (optional fields, defaults)

**Modifying Storage Structure**
1. Check `openspec/AGENTS.md` - may require proposal for breaking changes
2. Update `storage.ts` functions
3. Consider migration path for existing data
4. Add migration logic in `utils/migration.ts` if needed

## Dependencies and Integrations

**Claude Code CLI**
- Required for `recall` and `propose` commands
- Check availability: `which claude`
- Authentication: `claude login`
- Spawned as subprocess, no SDK/API key needed

**External APIs**
- GitHub: Optional via `src/utils/github.ts` for work log imports
- No other external dependencies

## OpenSpec Workflow

This project uses OpenSpec for spec-driven development:
- **Before major changes**: Create proposal in `openspec/changes/`
- **During implementation**: Follow `tasks.md` checklist
- **After deployment**: Archive to `openspec/changes/archive/`
- **Always validate**: `openspec validate --strict`

See `openspec/AGENTS.md` for detailed workflow.
