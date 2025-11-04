# Design: Goal Keyword Matching Factory

## Architecture

### Component Structure

```
src/utils/
  goal-matcher.ts         # New: Keyword matching and interactive selection logic
  storage.ts              # Modified: Export types needed by goal-matcher

src/commands/
  history.ts              # Modified: Upgrade --goal flag
  propose.ts              # Modified: Add --goal flag
  reflect.ts              # Modified: Add --goal flag
  context.ts              # Modified: Add --goal flag
```

### Key Components

#### 1. Goal Matcher Factory (`src/utils/goal-matcher.ts`)

**Purpose**: Centralize goal-linking logic with keyword matching and interactive fallback.

**Interface**:
```typescript
export interface GoalLinkingOptions {
  goalKeyword?: string | boolean;  // Value from --goal flag
  storagePath: string;             // Storage path for loading goals
}

export interface GoalLinkingResult {
  codename: string | null;         // Selected goal codename or null
  message: string;                 // Status message for user feedback
}

export async function linkToGoal(options: GoalLinkingOptions): Promise<GoalLinkingResult>
```

**Matching Algorithm**:
1. Load active goals from storage
2. If `goalKeyword` is boolean `true`: Show interactive prompt (current behavior)
3. If `goalKeyword` is string:
   a. Perform case-insensitive substring match on goal text and codename
   b. If exactly 1 match: Return immediately
   c. If multiple matches: Show interactive prompt filtered to matches
   d. If no matches: Show message and offer full interactive prompt
4. Return selected codename or null

**Error Handling**:
- Empty active goals → Return early with message
- User cancels prompt → Return null with cancellation message
- Storage errors → Propagate to caller

#### 2. Commander Option Pattern

Each command will use:
```typescript
.option('-g, --goal [keyword]', 'Link to a goal (optional keyword for matching)')
```

The `[keyword]` syntax makes the value optional, allowing both:
- `--goal` (boolean true → interactive)
- `--goal "text"` (string → keyword matching)

#### 3. Command Integration Pattern

```typescript
// In command action handler
const goalLinkResult = await linkToGoal({
  goalKeyword: options.goal,
  storagePath,
});

if (goalLinkResult.codename) {
  entry += `\n\nGoal: ${goalLinkResult.codename}`;
  success(`Entry logged and linked to goal: ${goalLinkResult.codename}`);
} else {
  info(goalLinkResult.message); // Display why no goal was linked
  success(`Entry logged without goal link`);
}
```

## Data Flow

```
User command with --goal flag
         ↓
Commander parses option
  (boolean | string | undefined)
         ↓
Command handler invokes linkToGoal()
         ↓
Goal Matcher loads active goals
         ↓
    ┌─────────────┴──────────────┐
    │                            │
Boolean true               String keyword
    │                            │
    ↓                            ↓
Interactive prompt       Keyword matching
    │                            │
    ↓                     ┌──────┴──────┐
User selects         1 match  0/multi match
    │                   │          │
    └───────────────────┴──────────┘
                  ↓
         Return codename + message
                  ↓
    Command formats entry with goal
                  ↓
         Save to Markdown file
```

## Testing Strategy

### Unit Tests

**`src/utils/goal-matcher.test.ts`**:
- Test keyword matching with various inputs
- Test exact matches, partial matches, case-insensitivity
- Test no matches and multiple matches
- Test empty goal list
- Mock interactive prompts

### Integration Tests

**Updated command tests**:
- Test `history log --goal "keyword"` with matches
- Test `propose --goal "keyword"` with matches
- Test `reflect --goal "keyword"` with matches
- Test backward compatibility with `--goal` boolean
- Test no active goals scenario

## Migration Strategy

**Backward Compatibility**:
- Existing `--goal` boolean flag usage continues to work
- No breaking changes to command syntax
- Gradual rollout: Users can adopt keyword matching at their own pace

**No Data Migration**:
- No changes to Markdown file format
- Goal metadata format remains: `Goal: codename`
- Existing linked entries are unaffected

## Performance Considerations

- **Goal Loading**: Cache active goals per command invocation (already happens via `getActiveGoals`)
- **Keyword Matching**: O(n) where n = number of active goals (typically < 50)
- **Interactive Prompts**: User-bound operation, no performance impact

## Future Enhancements

1. **Fuzzy Matching**: Use Levenshtein distance for typo tolerance
2. **MRU (Most Recently Used)**: Suggest recently linked goals first
3. **Tag-Based Matching**: Match goals by tags if present
4. **Multi-Goal Linking**: Allow linking entries to multiple goals
