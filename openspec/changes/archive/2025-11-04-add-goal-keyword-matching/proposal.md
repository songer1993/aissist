# Proposal: Add Goal Keyword Matching

## Problem Statement

Currently, the `--goal` flag in the `history log` command only works as a boolean flag, which triggers an interactive prompt to select from active goals. However, users want a more streamlined experience where they can specify goal keywords directly, and the system will match them with existing goals. This enhancement should be implemented as a reusable pattern that can be applied across multiple commands (history, propose, reflect, etc.), excluding only infrastructure commands like `goal`, `path`, and `init`.

## Proposed Solution

Implement a factory pattern for goal-linking that:
1. Accepts an optional text value with the `--goal` flag (e.g., `--goal "project"`)
2. Performs keyword matching against active goals when text is provided
3. Falls back to interactive selection when the flag is provided without a value
4. Remains inactive when the flag is not provided

### Behavior

- `aissist history log "text"` → No goal linking (current behavior)
- `aissist history log "text" --goal` → Interactive selection (current behavior)
- `aissist history log "text" --goal "keyword"` → Keyword search, interactive if multiple/none match (NEW)

### Scope

**Commands to enhance:**
- `history log` (upgrade existing `--goal` flag)
- `propose` (add new `--goal` flag)
- `reflect` (add new `--goal` flag)
- `context add` (add new `--goal` flag)

**Commands to exclude:**
- `goal` (manages goals, not linked to them)
- `path` (utility command)
- `init` (initialization command)
- `recall` (query command, doesn't create tracked content)

## Success Criteria

1. Users can quickly link entries to goals by specifying keywords
2. The keyword matching is intuitive and handles partial matches
3. The factory pattern is reusable across commands
4. Interactive fallback ensures no loss of functionality
5. All existing tests pass with enhanced functionality

## Dependencies

- Depends on existing `goal-management` spec for goal structure
- Depends on `history-tracking` spec for goal-linking pattern
- Enhances `cli-infrastructure` with new command option pattern

## Risks & Considerations

- **Ambiguous matches**: Multiple goals may match the same keyword → Solution: Interactive selection from matches
- **No matches**: Keyword doesn't match any goal → Solution: Display message and allow interactive selection
- **Backward compatibility**: Existing `--goal` boolean flag behavior must be preserved → Solution: Support both syntaxes
- **Consistency**: Pattern should work uniformly across commands → Solution: Centralized factory function
