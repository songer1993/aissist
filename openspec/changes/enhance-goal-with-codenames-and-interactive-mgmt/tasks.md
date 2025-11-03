# Implementation Tasks

## Phase 1: Codename Generation

- [x] Add codename generation function in `src/llm/claude.ts`
  - Function: `generateGoalCodename(goalText: string, existingCodenames: string[]): Promise<string>`
  - Use Claude with prompt to generate short kebab-case codename
  - Check uniqueness against existing codenames
  - Handle conflicts with numeric suffixes

- [x] Update goal add command to generate and store codenames
  - Modify `src/commands/goal.ts` goal add action
  - Read existing goals for the day to get existing codenames
  - Call codename generation function
  - Update goal entry format to include codename
  - Display generated codename in success message

- [x] Add unit tests for codename generation
  - Test codename format (kebab-case)
  - Test uniqueness handling
  - Test conflict resolution
  - Mock Claude responses

## Phase 2: Goal Storage Format Update

- [x] Update goal entry format in storage
  - Modify goal add to use new format with codename and metadata
  - Format: `## HH:MM - codename\n\nGoal text\n\nDeadline: YYYY-MM-DD` (if deadline set)

- [x] Add goal parsing utilities
  - Create `parseGoalEntry(content: string)` function in `src/utils/storage.ts`
  - Extract: timestamp, codename, text, deadline from goal entries
  - Handle both new format (with codename) and legacy format (without)

- [x] Add goal search function
  - Create `findGoalByCodename(filePath: string, codename: string)` in `src/utils/storage.ts`
  - Parse goal file and find matching codename
  - Return goal entry or null

## Phase 3: Goal Removal

- [x] Add `goal remove` command
  - Add new command: `goalCommand.command('remove').argument('<codename>')`
  - Find goal by codename in today's file
  - Remove goal entry from file
  - Display success or error message

- [x] Add goal removal helper
  - Create `removeGoalEntry(filePath: string, codename: string)` in `src/utils/storage.ts`
  - Parse file, remove matching entry, rewrite file
  - Handle case where goal not found

## Phase 4: Goal Completion

- [x] Create finished goals directory structure
  - Update `initializeStorage()` to create `goals/finished/` directory

- [x] Add `goal complete` command
  - Add new command: `goalCommand.command('complete').argument('<codename>')`
  - Find goal by codename
  - Move goal to finished file with completion date
  - Display success message

- [x] Add goal completion helper
  - Create `completeGoalEntry(sourcePath: string, destPath: string, codename: string)` in `src/utils/storage.ts`
  - Read and parse source file
  - Find goal entry
  - Append to finished file with completion date
  - Remove from source file

## Phase 5: Deadline Management

- [x] Add `--deadline` option to goal add command
  - Modify goal add command to accept `--deadline <YYYY-MM-DD>` option
  - Validate date format
  - Include deadline in goal entry format

- [x] Add `goal deadline` command
  - Add new command: `goalCommand.command('deadline').argument('<codename>').argument('<date>')`
  - Find goal by codename
  - Update goal entry with new deadline
  - Display success message

- [x] Add deadline update helper
  - Create `updateGoalDeadline(filePath: string, codename: string, deadline: string)` in `src/utils/storage.ts`
  - Parse file, find goal, update deadline field, rewrite file

## Phase 6: Interactive Goal List

- [x] Add interactive mode to goal list command
  - Modify existing `goal list` command
  - Use `@inquirer/select` for goal selection
  - Display goals with codenames and deadlines
  - Show action menu: Complete, Delete, Set Deadline, Cancel

- [x] Implement action handlers in interactive mode
  - Complete: Call complete command logic
  - Delete: Call remove command logic
  - Set Deadline: Prompt for date, call deadline command logic
  - Cancel: Exit interactive mode

- [x] Format interactive list display
  - Show: timestamp, codename, goal text (truncated), deadline (if set)
  - Use colors (via chalk) for better readability
  - Highlight overdue deadlines

## Phase 7: Backward Compatibility

- [x] Handle legacy goals in parsing
  - Update `parseGoalEntry()` to detect legacy format
  - Return special marker for legacy goals (e.g., codename: null)

- [x] Display legacy goals in interactive list
  - Show "[no-codename]" for legacy goals
  - Optionally disable management actions or prompt for migration

- [x] Add optional migration prompt
  - When user tries to manage legacy goal, offer to generate codename
  - If accepted, regenerate goal entry with codename

## Phase 8: Testing and Documentation

- [x] Write unit tests
  - Test goal parsing with new format
  - Test codename uniqueness
  - Test remove, complete, deadline operations
  - Test interactive list flow (integration test)

- [x] Update README.md
  - Document new commands: remove, complete, deadline
  - Document interactive list usage
  - Document goal format with codenames
  - Add examples

- [x] Manual testing
  - Test full workflow: add → list → set deadline → complete
  - Test remove workflow
  - Test interactive list with multiple goals
  - Test backward compatibility with legacy goal files
  - Test conflict resolution in codename generation

## Phase 9: Polish

- [x] Add helpful error messages
  - Goal not found errors
  - Invalid date format errors
  - Claude API errors (graceful fallback)

- [x] Add success feedback
  - Show generated codename after add
  - Confirm actions in interactive mode
  - Show completion dates when finishing goals

- [x] Consider edge cases
  - Empty goal files
  - Multiple goals with similar names
  - Very long goal texts
  - Special characters in goal text
