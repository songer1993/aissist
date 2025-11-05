# Proposal: Intelligent Log Routing

## Problem

The current `/aissist:log` command (created in the `refactor-log-command` change) provides AI enhancement and multimodal support, but always creates a single history entry regardless of input complexity. This leads to two key issues:

1. **Lost granularity**: When users describe multiple distinct accomplishments in one input (e.g., "Today I fixed the auth bug, refactored the database layer, and added user profile tests"), the system creates only one combined history entry instead of properly tracking each individual accomplishment.

2. **Misclassified content**: The command always routes to `aissist history log`, even when input is informational/contextual rather than task-oriented (e.g., "Team meeting notes: decided to use PostgreSQL" or "Important: API rate limit is 1000 req/min"). This informational content should go to `aissist context log` instead.

These limitations reduce the effectiveness of semantic recall, goal tracking, and reflection features since:
- Multi-part work is not properly decomposed into searchable units
- Informational content clutters history instead of being organized in context
- Users must manually decide whether to use history vs context commands

## Solution

Enhance the `/aissist:log` command with intelligent routing capabilities that analyze user input and automatically:

1. **Multi-log splitting**: Identify distinct accomplishments/tasks within the input and create multiple separate `aissist history log` calls when appropriate. The AI should maximize the number of logs created while maintaining logical grouping.

2. **History vs Context routing**: Distinguish between task-oriented content (accomplishments, work done) and informational content (notes, decisions, reference material):
   - **History**: Tasks completed, bugs fixed, features built, milestones reached
   - **Context**: Meeting notes, technical decisions, documentation, reference information, constraints, requirements

3. **Context name inference**: When routing to context, intelligently determine the appropriate context name based on content (e.g., "work", "meeting", "project-notes", "technical-decisions").

### Example Transformations

**Input 1: Multi-part work**
```
/aissist:log Today I fixed the authentication bug in the login flow, refactored the database connection pooling, and added comprehensive unit tests for the user service
```

**Output:**
```bash
aissist history log "Resolved authentication bug in login flow" --goal <if-matched>
aissist history log "Refactored database connection pooling for improved performance" --goal <if-matched>
aissist history log "Added comprehensive unit test coverage for user service" --goal <if-matched>
```

**Input 2: Informational content**
```
/aissist:log Team standup: Sarah is working on the API, John is blocked on deployment credentials, we decided to use JWT for authentication
```

**Output:**
```bash
aissist context log work "Team standup notes: Sarah working on API implementation, John blocked on deployment credentials. Decision: Using JWT for authentication across all services"
```

**Input 3: Mixed content**
```
/aissist:log Fixed the payment gateway timeout issue. Note: Stripe API has a 30-second timeout limit that we need to account for in future work
```

**Output:**
```bash
aissist history log "Resolved payment gateway timeout issue" --goal <if-matched>
aissist context log technical "Stripe API constraint: 30-second timeout limit must be accounted for in payment processing"
```

## Benefits

1. **Better semantic recall**: More granular history entries improve search and recall accuracy
2. **Cleaner organization**: Informational content properly separated from accomplishment tracking
3. **Reduced cognitive load**: Users don't need to decide between history/context or whether to split input
4. **Enhanced goal tracking**: Multiple related accomplishments can be linked to the same goal
5. **Improved reflection quality**: Clearer distinction between what was done vs what was learned/noted

## Implementation Approach

The enhancement will be implemented entirely within the `/aissist:log` command file (aissist-plugin/commands/log.md):

1. Add analysis step after AI enhancement to identify:
   - Multiple distinct accomplishments (count and describe each)
   - Content type (task-oriented vs informational)
   - Appropriate routing (history vs context)

2. For multi-log scenarios:
   - Split enhanced text into logical units
   - Perform goal matching for each unit independently
   - Execute multiple `aissist history log` calls

3. For context routing:
   - Infer appropriate context name from content
   - Format as contextual note rather than accomplishment
   - Execute `aissist context log <name> "<content>"`

4. Support mixed scenarios where some content goes to history and some to context

## Non-Goals

- This change does NOT modify the CLI commands (`aissist history log`, `aissist context log`)
- This change does NOT affect the `/aissist:log-github` command
- This change does NOT add new CLI flags or options
- Users can still use CLI commands directly for precise control
