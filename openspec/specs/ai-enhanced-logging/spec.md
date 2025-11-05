# ai-enhanced-logging Specification

## Purpose
Enable quick, AI-enhanced intelligent logging directly from Claude Code with support for multimodal input (text, images, screenshots). This capability provides intelligent rephrasing, image analysis, automatic goal linking, intelligent routing (history vs context), and multi-log splitting to create well-structured entries from rough user input. The system automatically determines whether content represents accomplishments (routed to history) or information (routed to context), and splits multi-part work into separate trackable entries for better granularity and semantic recall.
## Requirements
### Requirement: AI-Enhanced Text Logging
The system SHALL accept freeform text input via `/aissist:log` command and use Claude AI to rephrase it into a well-structured history entry before logging.

#### Scenario: User logs simple activity text
- **GIVEN** the user is in a Claude Code conversation
- **WHEN** the user runs `/aissist:log Fixed auth bug, took 3 hours`
- **THEN** Claude analyzes and rephrases the input into a structured format
- **AND** generates enhanced text like "Resolved authentication bug in login flow (3 hours)"
- **AND** calls `aissist history log "Resolved authentication bug in login flow (3 hours)"`
- **AND** displays success confirmation to the user

#### Scenario: User logs detailed work description
- **GIVEN** the user is in a Claude Code conversation
- **WHEN** the user runs `/aissist:log Today I worked on refactoring the database layer, extracted common queries into a new repository pattern, updated tests`
- **THEN** Claude structures the input into a concise summary
- **AND** generates text like "Refactored database layer: implemented repository pattern for common queries and updated test coverage"
- **AND** logs the enhanced entry via `aissist history log`

#### Scenario: AI enhancement preserves key details
- **GIVEN** the user provides input with specific metrics or timestamps
- **WHEN** the user runs `/aissist:log Improved API response time from 500ms to 120ms`
- **THEN** Claude preserves the exact metrics in the enhanced text
- **AND** generates "Optimized API performance: reduced response time from 500ms to 120ms"
- **AND** ensures no critical information is lost during rephrasing

#### Scenario: Empty or invalid input handling
- **GIVEN** the user runs the command without sufficient input
- **WHEN** the user runs `/aissist:log` with no arguments or only whitespace
- **THEN** Claude prompts the user to provide description of what they want to log
- **AND** waits for user input before proceeding
- **AND** does NOT call `aissist history log` with empty text

### Requirement: Multimodal Image Logging
The system SHALL accept images and screenshots as input, analyze them using Claude's vision capabilities, and include descriptive text in the history entry.

#### Scenario: User logs activity with screenshot
- **GIVEN** the user is in a Claude Code conversation
- **AND** the user has a screenshot showing UI changes
- **WHEN** the user runs `/aissist:log [attaches screenshot]` with text "Updated the dashboard"
- **THEN** Claude analyzes the screenshot using vision capabilities
- **AND** generates description like "Updated dashboard: redesigned metrics cards with improved data visualization and responsive layout (see screenshot analysis)"
- **AND** logs the enhanced text with image insights via `aissist history log`

#### Scenario: User logs performance metrics from image
- **GIVEN** the user attaches an image showing performance graphs
- **WHEN** the user runs `/aissist:log [attaches performance graph]` with text "Performance improvements"
- **THEN** Claude analyzes the graph and extracts key metrics
- **AND** generates text like "Performance optimization: Reduced memory usage by 40% and improved throughput from 1000 to 1500 req/s"
- **AND** logs the data-rich entry based on image analysis

#### Scenario: Multiple images with text description
- **GIVEN** the user attaches multiple images (before/after screenshots)
- **WHEN** the user runs `/aissist:log [before.png, after.png] Redesigned login page`
- **THEN** Claude analyzes both images and compares them
- **AND** generates comprehensive description of changes observed
- **AND** logs structured entry describing the transformation

#### Scenario: Image-only input without text
- **GIVEN** the user provides only an image without accompanying text
- **WHEN** the user runs `/aissist:log [screenshot.png]`
- **THEN** Claude analyzes the image and infers the activity
- **AND** generates descriptive text based solely on image content
- **AND** logs the inferred activity as history entry

### Requirement: Automatic Goal Linking
The system SHALL analyze log entry content and automatically link to relevant goals when semantic matches are found.

#### Scenario: Content matches existing goal
- **GIVEN** the user has a goal with codename "improve-performance"
- **WHEN** the user runs `/aissist:log Optimized database queries, 50% faster now`
- **THEN** Claude analyzes the content and identifies performance-related work
- **AND** calls `aissist history log "Optimized database queries: achieved 50% performance improvement" --goal improve-performance`
- **AND** displays confirmation showing the goal link

#### Scenario: No matching goal found
- **GIVEN** the user has goals but none match the log content
- **WHEN** the user runs `/aissist:log Fixed typo in README`
- **THEN** Claude determines no relevant goal exists
- **AND** calls `aissist history log` without --goal flag
- **AND** logs the entry without goal linkage

#### Scenario: Multiple potential goal matches
- **GIVEN** the user has multiple goals that could match the content
- **WHEN** the user runs `/aissist:log Worked on user authentication and authorization`
- **THEN** Claude identifies the most relevant goal based on semantic similarity
- **AND** links to the best matching goal
- **AND** may ask user for confirmation if ambiguity is high

### Requirement: Command Parameter Handling
The `/aissist:log` command SHALL accept text as a required parameter and support natural argument passing from Claude Code.

#### Scenario: Single line text parameter
- **GIVEN** the user wants to log a simple entry
- **WHEN** the command is invoked as `/aissist:log Completed user onboarding feature`
- **THEN** the parameter "Completed user onboarding feature" is passed to the command
- **AND** Claude processes it as the log entry content

#### Scenario: Multi-line text parameter
- **GIVEN** the user wants to log detailed work
- **WHEN** the command is invoked with multi-line text after `/aissist:log`
- **THEN** all provided text is captured as the parameter
- **AND** Claude preserves line breaks and formatting in analysis

#### Scenario: Text with images as attachments
- **GIVEN** the user provides text and images
- **WHEN** the command receives both text parameter and image attachments
- **THEN** Claude processes both text and images together
- **AND** combines insights from both sources in the final entry

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

