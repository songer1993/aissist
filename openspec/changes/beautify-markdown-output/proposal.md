# Proposal: Beautify Markdown Output

## Summary
Add beautiful terminal rendering for Markdown output in `propose` and `recall` commands using `marked-terminal`, while providing `--raw` flag for machine-readable output needed by AI agents and automation.

## Why
The `propose` and `recall` commands currently output raw Markdown that looks plain and hard to read in the terminal. Users expect:
- **Readable output**: Headers, lists, code blocks, and emphasis should be visually distinct
- **Professional appearance**: Terminal output should match the quality of the tool
- **Context-appropriate formatting**: Human-readable for interactive use, raw for machine consumption

Without proper rendering:
- Important information (headers, lists) blends together
- Code blocks are indistinguishable from regular text
- The overall experience feels unpolished
- Users may miss key information due to poor visual hierarchy

## What Changes

**New Dependencies:**
- `marked` - Fast markdown parser (already widely used)
- `marked-terminal` - Terminal renderer for marked

**New Utility:**
- `src/utils/markdown.ts` - Markdown rendering utilities

**Modified Commands:**
- `src/commands/propose.ts` - Render output with markdown formatter, add `--raw` flag
- `src/commands/recall.ts` - Render output with markdown formatter, add `--raw` flag

**New Specification:**
- `markdown-rendering` - Markdown terminal rendering system

**Modified Specifications:**
- `ai-planning` (propose command) - Added markdown rendering and `--raw` flag
- `semantic-recall` (recall command) - Added markdown rendering and `--raw` flag

**Key Features:**
- Beautiful terminal rendering with syntax highlighting
- `--raw` flag for machine-readable output
- Consistent rendering across commands
- Support for headings, lists, code blocks, tables, links, emphasis

## Motivation

### User Story 1: Readable Proposals
**As a user**, when I run `aissist propose`, I want the action proposals to be beautifully formatted with clear headings, bullet points, and emphasis, so I can quickly scan and understand the suggestions.

**Before:**
```
## Action Proposals for Today

Based on your goals and recent activity:

1. **Review codebase** - Spend 30 minutes...
2. **Update documentation** - Add examples...
```

**After** (with colors and styling):
```
╔══ Action Proposals for Today ═══════════════════════════╗

Based on your goals and recent activity:

  1. Review codebase - Spend 30 minutes...
  2. Update documentation - Add examples...
```

### User Story 2: Machine-Readable Output
**As a developer**, when I pipe `aissist recall` output to another tool or Claude Code agent, I want the raw Markdown without terminal formatting, so it can be properly parsed and processed.

```bash
# For humans (default):
aissist propose

# For machines/AI agents:
aissist propose --raw
aissist recall "my goals" --raw | process-with-ai
```

### User Story 3: Consistent Experience
**As a user**, I want all Markdown output across aissist commands to have consistent, beautiful formatting, so the tool feels cohesive and professional.

## Scope

### In Scope
- Terminal markdown rendering for `propose` and `recall` commands
- `--raw` flag for both commands
- Markdown utility module (`src/utils/markdown.ts`)
- Support for common markdown elements (headings, lists, code, emphasis, links)
- Respect terminal width and color capabilities

### Out of Scope
- Rendering markdown in other commands (can be added later if needed)
- Interactive markdown navigation
- Custom themes beyond default marked-terminal styling
- HTML rendering
- Markdown input parsing (only output rendering)

## Dependencies
- `marked` (npm package) - Markdown parser
- `marked-terminal` (npm package) - Terminal renderer
- Modifies: `propose` command (`ai-planning` spec)
- Modifies: `recall` command (`semantic-recall` spec)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Library adds significant bundle size | Low | Both libraries are lightweight (~100KB combined) |
| Terminal compatibility issues | Medium | marked-terminal handles graceful degradation for non-color terminals |
| Breaking changes for scripts using output | High | Provide `--raw` flag (documented) for backward compatibility |
| Performance overhead for large output | Low | Rendering is fast, negligible for typical output sizes |

## Success Metrics
- Markdown output is visually enhanced in terminal
- `--raw` flag provides original markdown
- No breaking changes for existing workflows (with `--raw`)
- User feedback on improved readability

## Open Questions
1. Should we make markdown rendering opt-in or opt-out?
   - **Proposed Answer**: Opt-out (default on, use `--raw` to disable). Better UX by default.

2. Should we support custom themes or styling?
   - **Proposed Answer**: Not initially. Use marked-terminal defaults. Can add later if requested.

3. Should other commands (like `reflect`) also render markdown?
   - **Proposed Answer**: Start with `propose` and `recall`. Expand based on user feedback.

4. What about `--document` flag mentioned by user?
   - **Proposed Answer**: Use `--raw` as the flag name (more intuitive). "document" mode is same as "raw" mode.
