# ai-enhanced-logging Specification Delta

## ADDED Requirements

### Requirement: Multi-Log Splitting
The system SHALL analyze enhanced input and create multiple separate history entries when distinct accomplishments or tasks are identified.

#### Scenario: Split multi-part work into separate logs
- **GIVEN** the user provides input describing multiple distinct accomplishments
- **WHEN** the user runs `/aissist:log Fixed auth bug, refactored database layer, added user profile tests`
- **THEN** Claude analyzes and identifies three distinct accomplishments
- **AND** enhances each into a structured format
- **AND** calls `aissist history log` three times:
  1. `"Resolved authentication bug in login flow"` with goal matching
  2. `"Refactored database layer for improved maintainability"` with goal matching
  3. `"Added comprehensive unit tests for user profile component"` with goal matching
- **AND** displays success confirmation showing all three entries created

#### Scenario: Keep related work as single log
- **GIVEN** the user describes closely related work that forms one coherent unit
- **WHEN** the user runs `/aissist:log Spent 4 hours debugging and fixing the memory leak in the background worker`
- **THEN** Claude identifies this as a single cohesive accomplishment
- **AND** creates one history entry: `"Resolved memory leak in background worker (4 hours)"`
- **AND** does NOT split into multiple logs

#### Scenario: Split with shared goal linking
- **GIVEN** the user has a goal with codename "improve-authentication"
- **WHEN** the user runs `/aissist:log Fixed login bug, added OAuth support, updated auth docs`
- **THEN** Claude creates three separate history entries
- **AND** all three are linked to the same goal "improve-authentication"
- **AND** displays confirmation showing goal linkage for each entry

#### Scenario: Maximize log granularity appropriately
- **GIVEN** the user provides detailed input with multiple sub-tasks
- **WHEN** the user runs `/aissist:log Today: updated user model, added validation, wrote tests, fixed edge cases, deployed to staging`
- **THEN** Claude creates separate logs for each distinct task
- **AND** maximizes the number of entries while maintaining logical grouping
- **AND** ensures each entry is meaningful and searchable independently

### Requirement: History vs Context Routing
The system SHALL distinguish between task-oriented content and informational content, routing to appropriate commands.

#### Scenario: Route informational content to context
- **GIVEN** the user provides meeting notes or reference information
- **WHEN** the user runs `/aissist:log Team standup: Sarah working on API, John blocked on deployment, decided to use JWT`
- **THEN** Claude identifies this as informational context rather than accomplishment
- **AND** calls `aissist context log work "Team standup notes: Sarah working on API, John blocked on deployment. Decision: Using JWT for authentication"`
- **AND** does NOT call `aissist history log`
- **AND** displays confirmation showing context entry created

#### Scenario: Route task content to history
- **GIVEN** the user describes work completed or tasks finished
- **WHEN** the user runs `/aissist:log Completed the user authentication module with OAuth integration`
- **THEN** Claude identifies this as an accomplishment
- **AND** calls `aissist history log "Completed user authentication module with OAuth integration"` with goal matching
- **AND** does NOT call `aissist context log`

#### Scenario: Handle mixed content with split routing
- **GIVEN** the user provides both task completion and informational notes
- **WHEN** the user runs `/aissist:log Fixed payment timeout bug. Note: Stripe has 30-second timeout limit`
- **THEN** Claude identifies two distinct pieces:
  1. Task accomplishment: fixing the bug
  2. Informational note: API constraint
- **AND** calls `aissist history log "Resolved payment gateway timeout issue"` with goal matching
- **AND** calls `aissist context log technical "Stripe API constraint: 30-second timeout limit for payment processing"`
- **AND** displays confirmation showing both entries created

#### Scenario: Infer appropriate context names
- **GIVEN** the user provides informational content
- **WHEN** Claude routes to context
- **THEN** appropriate context names are inferred based on content type:
  - Meeting notes → "work" or "meeting"
  - Technical decisions → "technical" or "architecture"
  - Project documentation → "project-notes" or "documentation"
  - Requirements/constraints → "requirements" or "technical"
  - Personal notes → "notes" or "personal"
- **AND** uses the most semantically appropriate context name

#### Scenario: Handle purely contextual input with images
- **GIVEN** the user attaches a diagram or reference screenshot
- **WHEN** the user runs `/aissist:log [architecture diagram] Current system architecture for reference`
- **THEN** Claude analyzes the image and extracts information
- **AND** routes to context with appropriate name: `aissist context log architecture "System architecture: <description based on diagram>"`
- **AND** does NOT create history entry since no task was completed

### Requirement: Decision Logic Transparency
The system SHALL provide clear feedback about routing decisions made.

#### Scenario: Show split decision reasoning
- **GIVEN** Claude splits input into multiple logs
- **WHEN** the routing is complete
- **THEN** the confirmation message indicates how many entries were created
- **AND** shows whether they went to history or context
- **AND** displays which goals were linked (if any)
- **EXAMPLE**: "Created 3 history entries (2 linked to improve-auth goal)"

#### Scenario: Show routing decision for context
- **GIVEN** Claude routes to context instead of history
- **WHEN** the routing is complete
- **THEN** the confirmation message indicates content was saved to context
- **AND** shows the context name used
- **EXAMPLE**: "Saved to context (work): Team standup notes"

#### Scenario: Show mixed routing decisions
- **GIVEN** Claude creates both history and context entries
- **WHEN** the routing is complete
- **THEN** the confirmation message indicates both actions
- **EXAMPLE**: "Created 1 history entry (linked to fix-payments goal) and 1 context entry (technical)"
