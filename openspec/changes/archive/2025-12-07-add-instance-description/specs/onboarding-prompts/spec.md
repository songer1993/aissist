# onboarding-prompts Specification Delta

## ADDED Requirements

### Requirement: Instance Description Prompt
After successful storage initialization, the system SHALL prompt the user to optionally provide a one-line description of the aissist instance's purpose.

#### Scenario: User provides instance description
- **GIVEN** the user runs `aissist init` or `aissist init --global`
- **AND** storage initialization completes successfully (newly created)
- **WHEN** the system displays "What is this aissist instance for? (optional, press Enter to skip)"
- **AND** the user enters "Project Apollo sprint tracking"
- **THEN** the system saves "Project Apollo sprint tracking" to `.aissist/DESCRIPTION.md`
- **AND** displays confirmation "Description saved"
- **AND** continues with the rest of the init flow

#### Scenario: User skips instance description
- **GIVEN** the user runs `aissist init`
- **AND** storage initialization completes successfully
- **WHEN** the system displays the description prompt
- **AND** the user presses Enter without typing anything
- **THEN** the system does NOT create `DESCRIPTION.md`
- **AND** continues with the rest of the init flow without confirmation

#### Scenario: User provides description via flag
- **GIVEN** the user runs `aissist init --description "Career development goals"`
- **WHEN** storage initialization completes successfully
- **THEN** the system saves "Career development goals" to `.aissist/DESCRIPTION.md`
- **AND** does NOT display the interactive description prompt
- **AND** displays confirmation "Description saved"

#### Scenario: Skip description prompt when storage already exists
- **GIVEN** the user runs `aissist init`
- **AND** storage already exists at the target path
- **WHEN** the system displays "Storage already exists" warning
- **THEN** the system does NOT display the description prompt

#### Scenario: Skip description prompt in non-TTY environment
- **GIVEN** the command is executed in a non-TTY environment
- **WHEN** `aissist init` completes storage initialization
- **THEN** the system does NOT display the description prompt
- **AND** completes with standard success messages only

#### Scenario: User cancels description prompt with Ctrl+C
- **GIVEN** the user runs `aissist init`
- **AND** storage initialization completes successfully
- **WHEN** the system displays the description prompt
- **AND** the user presses Ctrl+C
- **THEN** the system exits gracefully
- **AND** storage remains initialized (description step cancelled)
- **AND** `DESCRIPTION.md` is NOT created

## MODIFIED Requirements

### Requirement: Post-Initialization Goal Prompt
After successful storage initialization, the system SHALL prompt the user to create their first goal with an option to proceed or skip.

#### Scenario: Description prompt appears before goal prompt
- **GIVEN** the user runs `aissist init`
- **AND** storage initialization completes successfully
- **WHEN** the init flow proceeds
- **THEN** the description prompt appears first (if TTY)
- **AND** after description is handled (provided or skipped)
- **THEN** the hierarchy discovery prompt appears (if applicable)
- **THEN** the Claude Code integration prompt appears (if Claude Code is installed)
- **THEN** the first goal prompt appears
- **AND** maintains the logical flow: init -> description -> hierarchy -> Claude Code -> first goal -> first todo
