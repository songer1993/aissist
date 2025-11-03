# Enhance Goal Management with Codenames and Interactive Management

## Why

Currently, goals are stored as simple timestamped text entries without unique identifiers. Users cannot easily reference, complete, or manage individual goals programmatically. The system lacks functionality for:
- Removing specific goals
- Marking goals as completed with historical tracking
- Setting deadlines for goals
- Interactive goal management workflow

Adding unique codenames (kebab-case identifiers) and interactive management features will enable users to:
1. Uniquely identify and reference goals across commands and scripts
2. Track goal completion with dates in a separate finished file
3. Set and track deadlines
4. Manage goals interactively through a selection interface
5. Maintain goal history separate from active goals

This enhancement aligns with Aissist's philosophy of human-readable, Git-compatible storage while adding programmatic capabilities.

## What Changes

This proposal enhances the goal management system with the following capabilities:

- **Goal Codenames**: Automatically generate unique, meaningful kebab-case codenames (IDs) for each goal using Claude AI
- **Goal Removal**: Add `goal remove` command to delete goals by codename
- **Goal Completion**: Move completed goals to a finished file with completion dates
- **Deadline Management**: Allow setting and tracking deadlines for goals
- **Interactive Management**: Add interactive list interface with selection-based actions (complete, delete, set deadline)
- **Storage Format Update**: Store goals with metadata including codename, creation time, and optional deadline

The system will maintain backward compatibility with existing goal files while enriching new goals with metadata.

## Impact

### Affected Specs
- **MODIFIED**: goal-management (add codenames, remove, complete, deadline, interactive list)

### Affected Code
- `src/commands/goal.ts` - Add remove, complete, deadline commands and interactive list
- `src/utils/storage.ts` - May need helper for goal metadata parsing
- `src/llm/claude.ts` - Use existing Claude integration for codename generation

### Dependencies Added
None - uses existing dependencies (@inquirer/core for interactive prompts, @anthropic-ai/agent-sdk for codename generation)

### User Impact
- Users can now uniquely identify goals with memorable codenames
- Interactive goal list provides streamlined workflow for goal management
- Completed goals are preserved in finished files with completion dates
- Deadlines help users track time-sensitive goals
- Existing goals continue to work; new goals automatically get codenames
- All data remains human-readable and Git-compatible
