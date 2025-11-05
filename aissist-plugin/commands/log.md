---
description: Log history entry with AI enhancement and multimodal support
argument-hint: <text>
allowed-tools: Bash(aissist history log:*), Bash(aissist context log:*), Bash(aissist goal list:*), Bash(aissist:*)
---

# AI-Enhanced Intelligent Logging

Quickly log work with AI-powered enhancement, intelligent routing, and automatic goal linking. Claude analyzes your input and automatically decides whether to create history entries (accomplishments) or context notes (information), and whether to split multi-part work into separate logs. Supports multimodal input including images and screenshots.

## Usage

```
/aissist:log <text>
```

Or with images:

```
/aissist:log [attach image(s)] <text>
```

## Arguments

- `text` (required): Freeform description of what you worked on or accomplished. Can be rough notes - Claude will enhance and structure it.

## Examples

### Simple Text Logging

```
/aissist:log Fixed auth bug, took 3 hours
```

Claude enhances → `"Resolved authentication bug in login flow (3 hours)"`

```
/aissist:log Refactored database layer, added repository pattern, updated tests
```

Claude structures → `"Refactored database layer: implemented repository pattern for common queries and updated test coverage"`

### Multi-line Detailed Description

```
/aissist:log Today I worked on improving the API performance.
I optimized the database queries and added caching.
Response time went from 500ms to 120ms.
```

Claude condenses → `"Optimized API performance: improved database queries and implemented caching, reducing response time from 500ms to 120ms"`

### Logging with Images/Screenshots

```
/aissist:log [attach dashboard screenshot] Updated the dashboard design
```

Claude analyzes image → `"Updated dashboard: redesigned metrics cards with improved data visualization, added responsive layout and dark mode support"`

```
/aissist:log [attach performance graph] Performance improvements after optimization
```

Claude extracts metrics → `"Performance optimization: Reduced memory usage by 40% and improved throughput from 1000 to 1500 req/s (based on metrics)"`

### Before/After Comparisons

```
/aissist:log [before.png, after.png] Redesigned the login page
```

Claude compares → `"Redesigned login page: modernized UI with cleaner layout, improved accessibility, and streamlined authentication flow"`

## What it does

This command leverages Claude's AI capabilities to intelligently route and structure your input:

1. **Accept input**: Receives your text description and any attached images/screenshots

2. **Analyze images** (if provided): Uses Claude's vision capabilities to:
   - Describe UI changes and visual improvements
   - Extract metrics from graphs and performance charts
   - Identify key details from screenshots or diagrams
   - Compare before/after images to summarize changes

3. **Enhance text**: Rephrases and structures your input into clear, professional entries:
   - Preserves exact metrics, numbers, and time estimates
   - Converts rough notes into polished descriptions
   - Maintains technical accuracy while improving clarity

4. **Analyze content type and structure**: Examines the enhanced content to determine:
   - **Multi-part detection**: Are there multiple distinct accomplishments or tasks?
   - **Content classification**: Is this task-oriented (accomplishment) or informational (notes/context)?
   - **Routing decision**: Should this go to history, context, or both?

5. **Check goals**: Runs `aissist goal list` to see your active goals (for history entries)

6. **Route intelligently** based on content analysis:

   **For task-oriented content (accomplishments):**
   - Split into multiple logs if multiple distinct tasks identified
   - For each task, perform semantic goal matching independently
   - Execute `aissist history log "<enhanced-text>"` with optional `--goal <codename>`
   - Maximize granularity while maintaining logical grouping

   **For informational content (notes/context):**
   - Infer appropriate context name from content:
     - Meeting notes → "work" or "meeting"
     - Technical decisions → "technical" or "architecture"
     - Documentation → "project-notes" or "documentation"
     - Requirements/constraints → "requirements" or "technical"
   - Execute `aissist context log <name> "<content>"`

   **For mixed content:**
   - Split task accomplishments and informational notes
   - Route tasks to history (with goal linking)
   - Route notes to context (with name inference)
   - Execute both commands as needed

7. **Confirm with transparency**: Shows you what was created:
   - Number of history entries and which goals they're linked to
   - Number of context entries and their context names
   - Clear summary of all routing decisions made

### AI Enhancement Examples

**Input**: `fixed the authentication bug took me like 3 hours`
**Enhanced**: `"Resolved authentication bug in login flow (3 hours)"`

**Input**: `worked on refactoring the database stuff`
**Enhanced**: `"Refactored database layer: improved code organization and query structure"`

**Input**: `Improved performance from 500ms to 120ms by optimizing queries and adding cache`
**Enhanced**: `"Optimized API performance: improved database queries and implemented caching, reducing response time from 500ms to 120ms"`

### Goal Linking

If the content matches an existing goal, Claude automatically links it:

```
# You have a goal: "improve-api-performance"
/aissist:log Optimized database queries, API is 50% faster now

# Claude calls:
aissist history log "Optimized database queries: achieved 50% performance improvement" --goal improve-api-performance
```

## Intelligent Routing Examples

### Multi-Log Splitting (Multiple Accomplishments)

**Input**:
```
/aissist:log Today I fixed the authentication bug in the login flow, refactored the database connection pooling, and added comprehensive unit tests for the user service
```

**Claude's Analysis**:
- Identifies 3 distinct accomplishments
- Enhances each separately
- Performs goal matching for each

**Executes**:
```bash
aissist history log "Resolved authentication bug in login flow" --goal improve-auth
aissist history log "Refactored database connection pooling for improved performance"
aissist history log "Added comprehensive unit test coverage for user service" --goal testing-improvements
```

**Feedback**: `Created 3 history entries (2 linked to goals: improve-auth, testing-improvements)`

---

**Input**:
```
/aissist:log Fixed payment bug, updated docs, deployed to staging
```

**Executes**:
```bash
aissist history log "Resolved payment processing bug"
aissist history log "Updated payment system documentation"
aissist history log "Deployed payment changes to staging environment"
```

**Feedback**: `Created 3 history entries`

---

### Single Log (Cohesive Work)

**Input**:
```
/aissist:log Spent 4 hours debugging and fixing the memory leak in the background worker
```

**Claude's Analysis**:
- Identifies single cohesive accomplishment
- Keeps as one entry

**Executes**:
```bash
aissist history log "Resolved memory leak in background worker (4 hours)"
```

**Feedback**: `Created 1 history entry`

---

### Context Routing (Informational Content)

**Input**:
```
/aissist:log Team standup: Sarah is working on the API, John is blocked on deployment credentials, we decided to use JWT for authentication
```

**Claude's Analysis**:
- Identifies as meeting notes (informational, not accomplishment)
- Infers context name: "work" or "meeting"

**Executes**:
```bash
aissist context log work "Team standup notes: Sarah working on API implementation, John blocked on deployment credentials. Decision: Using JWT for authentication across all services"
```

**Feedback**: `Saved to context (work): Team standup notes`

---

**Input**:
```
/aissist:log Important: Stripe API has a 30-second timeout limit. Need to account for this in all payment processing
```

**Claude's Analysis**:
- Identifies as technical constraint (informational)
- Infers context name: "technical"

**Executes**:
```bash
aissist context log technical "Stripe API constraint: 30-second timeout limit must be accounted for in payment processing"
```

**Feedback**: `Saved to context (technical): Stripe API constraint`

---

**Input**:
```
/aissist:log Architecture decision: Moving to microservices for better scalability. Will split monolith into user service, payment service, and notification service
```

**Claude's Analysis**:
- Identifies as architectural decision (informational)
- Infers context name: "architecture"

**Executes**:
```bash
aissist context log architecture "Architecture decision: Transitioning to microservices architecture - splitting monolith into user service, payment service, and notification service for improved scalability"
```

**Feedback**: `Saved to context (architecture): Architecture decision`

---

### Mixed Content (Task + Information)

**Input**:
```
/aissist:log Fixed the payment gateway timeout issue. Note: Stripe API has a 30-second timeout limit that we need to account for in future work
```

**Claude's Analysis**:
- Identifies task accomplishment: fixing the bug
- Identifies informational note: API constraint
- Splits into separate entries

**Executes**:
```bash
aissist history log "Resolved payment gateway timeout issue" --goal fix-payments
aissist context log technical "Stripe API constraint: 30-second timeout limit must be accounted for in payment processing"
```

**Feedback**: `Created 1 history entry (linked to fix-payments) and 1 context entry (technical)`

---

**Input**:
```
/aissist:log Completed the user authentication module. Team decided we'll use OAuth 2.0 with refresh tokens. Also finished writing integration tests
```

**Claude's Analysis**:
- Identifies 2 task accomplishments + 1 decision note
- Routes tasks to history, decision to context

**Executes**:
```bash
aissist history log "Completed user authentication module" --goal build-auth
aissist history log "Finished writing integration tests for authentication" --goal build-auth
aissist context log technical "Authentication decision: Using OAuth 2.0 with refresh token implementation"
```

**Feedback**: `Created 2 history entries (linked to build-auth) and 1 context entry (technical)`

---

### Image with Contextual Information

**Input**:
```
/aissist:log [attach architecture diagram] Current system architecture for reference
```

**Claude's Analysis**:
- Analyzes diagram using vision
- Identifies as reference material (no task completed)
- Routes to context

**Executes**:
```bash
aissist context log architecture "System architecture: Microservices with API gateway, three core services (user, payment, notification), PostgreSQL database, Redis cache, deployed on AWS with load balancing"
```

**Feedback**: `Saved to context (architecture): System architecture diagram`

---

## Decision Criteria

### Task-Oriented (Routes to History)
- Completed work or accomplishments
- Bugs fixed
- Features implemented
- Code refactored
- Tests written
- Deployments executed
- Problems solved
- Milestones reached

### Informational (Routes to Context)
- Meeting notes
- Team discussions
- Technical decisions
- Architecture choices
- API documentation
- Constraints or limitations
- Requirements gathered
- Reference information
- Learnings or insights (without associated task)

### When to Split into Multiple Logs
- Multiple distinct accomplishments mentioned
- Separate, unrelated tasks completed
- Different areas of work (e.g., frontend + backend + testing)
- Each part could independently answer "What did I accomplish?"
- Maximize granularity while maintaining meaning

### When to Keep as Single Log
- Closely related work forming one cohesive unit
- Sub-tasks of a larger accomplishment
- Debugging process leading to one fix
- All work toward one specific outcome

## Requirements

- aissist initialized (run `aissist init` first)
- Active Claude Code session for AI enhancement
- For image logging: Images/screenshots attached to the message

## Tips

- **Be concise or detailed - both work**: You can provide rough notes or detailed descriptions - Claude will handle enhancement and routing
- **Include metrics**: Specific numbers, percentages, or time estimates are preserved exactly
- **Attach images**: Screenshots of UI changes, performance graphs, or error messages provide valuable context
- **Trust the AI**: Claude will intelligently decide whether to:
  - Split into multiple logs or keep as one
  - Route to history (accomplishments) or context (information)
  - Link to relevant goals automatically
- **Don't overthink it**: Just describe what you worked on or learned - the routing will be handled intelligently

## See Also

- `/aissist:log-github` - Import GitHub activity as history entries
- `/aissist:recall` - Search your history with semantic queries
- `/aissist:report` - Generate accomplishment reports from your history

---

$ARGUMENTS
