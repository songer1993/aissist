# claude-code-mocking Specification

## Purpose
TBD - created by archiving change add-e2e-testing. Update Purpose after archive.
## Requirements
### Requirement: Mock Claude CLI Executable
The system SHALL provide a fake `claude` CLI executable for testing purposes.

#### Scenario: Mock Claude CLI responds to recall queries
- **WHEN** the mock Claude CLI receives a recall prompt via stdin
- **THEN** it analyzes the prompt and returns a realistic summary response
- **AND** the response includes Markdown-formatted text

#### Scenario: Mock Claude CLI respects --allowedTools flag
- **WHEN** invoked with `--allowedTools 'Grep,Read,Glob'`
- **THEN** it acknowledges the tool restriction in its response
- **AND** simulates using those tools (e.g., mentions "searching files...")

#### Scenario: Mock Claude CLI for proposal generation
- **WHEN** the mock receives a proposal prompt
- **THEN** it returns 3-5 actionable items in Markdown list format
- **AND** items reference data from the prompt context

#### Scenario: Mock Claude CLI authentication check
- **WHEN** the real CLI checks for Claude Code with `checkClaudeCodeSession()`
- **THEN** it finds the mock `claude` executable in PATH
- **AND** reports available: true, authenticated: true

### Requirement: Mock Response Patterns
The system SHALL generate realistic responses based on prompt content.

#### Scenario: Recall response includes context
- **WHEN** a recall prompt contains "fitness goals"
- **THEN** the mock response references fitness-related activities
- **AND** uses natural language summarization

#### Scenario: Proposal response is actionable
- **WHEN** a proposal prompt requests "today" actions
- **THEN** the mock response includes time-bound suggestions
- **AND** references goals or history from the prompt

#### Scenario: Error simulation for testing
- **WHEN** the mock is invoked with `--force-error` flag
- **THEN** it exits with code 1
- **AND** writes an error message to stderr

### Requirement: PATH Manipulation for Mock
The system SHALL enable tests to use the mock Claude CLI instead of the real one.

#### Scenario: Test harness injects mock into PATH
- **WHEN** the test harness is configured with mockClaudeCli: true
- **THEN** it creates a temporary bin directory with the mock executable
- **AND** prepends this directory to the PATH environment variable
- **AND** all CLI commands find the mock `claude` first

#### Scenario: Mock executable is cross-platform
- **WHEN** tests run on different operating systems (Linux, macOS, Windows)
- **THEN** the mock executable works correctly
- **AND** uses a Node.js shebang for cross-platform compatibility

#### Scenario: Mock cleanup after tests
- **WHEN** the test harness teardown() is called
- **THEN** the temporary mock bin directory is removed
- **AND** PATH is restored (though not strictly necessary in isolated processes)

### Requirement: Mock Implementation Details
The system SHALL implement the mock as a simple Node.js script.

#### Scenario: Mock reads stdin for prompt
- **WHEN** the mock is invoked
- **THEN** it reads the full prompt from stdin
- **AND** processes it before generating a response

#### Scenario: Mock supports timeout testing
- **WHEN** invoked with `--delay <milliseconds>` flag
- **THEN** it waits the specified time before responding
- **AND** enables testing timeout handling

#### Scenario: Mock logs to debug file
- **WHEN** the MOCK_CLAUDE_DEBUG environment variable is set
- **THEN** the mock writes received prompts and responses to a debug file
- **AND** aids in troubleshooting test failures

### Requirement: Fallback Testing
The system SHALL enable testing of Claude Code unavailability scenarios.

#### Scenario: Test with Claude Code absent
- **WHEN** the test harness is configured with mockClaudeCli: false
- **THEN** the `claude` command is not found in PATH
- **AND** tests can verify fallback to keyword search

#### Scenario: Test authentication failure
- **WHEN** the mock is configured to simulate auth failure
- **THEN** it exits with code 1 and writes "not authenticated" to stderr
- **AND** tests can verify the "run claude login" message

#### Scenario: Test Claude Code timeout
- **WHEN** the mock is configured with a long delay
- **THEN** tests can verify timeout handling kicks in
- **AND** error messages are appropriate

### Requirement: Realistic Mock Behavior
The system SHALL ensure the mock behaves like the real Claude Code CLI.

#### Scenario: Mock output format matches real CLI
- **WHEN** the mock returns responses
- **THEN** it outputs plain text to stdout (not JSON)
- **AND** matches the format expected by recall/propose commands

#### Scenario: Mock handles multiple invocations
- **WHEN** a test runs multiple commands that use Claude
- **THEN** each invocation gets a fresh response
- **AND** responses can vary based on prompt content

#### Scenario: Mock supports model selection
- **WHEN** invoked with `--model haiku` flag
- **THEN** the mock acknowledges the model (for completeness)
- **AND** returns appropriate responses (faster/shorter for haiku simulation)

