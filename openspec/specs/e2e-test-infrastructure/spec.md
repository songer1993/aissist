# e2e-test-infrastructure Specification

## Purpose
TBD - created by archiving change add-e2e-testing. Update Purpose after archive.
## Requirements
### Requirement: CLI Test Harness
The system SHALL provide a reusable test harness for spawning and managing CLI subprocesses with isolated storage.

#### Scenario: Setup isolated test environment
- **WHEN** a test harness instance is created and setup() is called
- **THEN** it creates a temporary directory for test storage
- **AND** sets the AISSIST_HOME environment variable to the temporary path
- **AND** initializes storage with `aissist init`

#### Scenario: Teardown test environment
- **WHEN** teardown() is called after tests complete
- **THEN** the temporary storage directory is recursively deleted
- **AND** all file handles are properly closed

#### Scenario: Execute CLI command
- **WHEN** run(command, ...args) is called
- **THEN** it spawns `node dist/index.js <command> <args>` as a subprocess
- **AND** passes the isolated AISSIST_HOME environment variable
- **AND** returns an object with stdout, stderr, and exitCode

#### Scenario: Assert successful command execution
- **WHEN** expectSuccess(command, ...args) is called
- **THEN** it executes the command via run()
- **AND** asserts the exitCode is 0
- **AND** returns the result for further assertions

#### Scenario: Test harness with mock Claude CLI
- **WHEN** the test harness is configured with mockClaudeCli: true
- **THEN** it prepends the mock Claude CLI directory to PATH
- **AND** all CLI commands use the mock `claude` executable instead of the real one

### Requirement: Subprocess Management with execa
The system SHALL use the `execa` library for reliable subprocess execution.

#### Scenario: Execute CLI with execa
- **WHEN** the test harness runs a command
- **THEN** it uses execa() to spawn the subprocess
- **AND** captures stdout and stderr separately
- **AND** handles errors without throwing by default (reject: false)

#### Scenario: Handle command timeout
- **WHEN** a CLI command takes longer than the configured timeout (default 10s)
- **THEN** the subprocess is killed
- **AND** the test fails with a timeout error

#### Scenario: Capture command output
- **WHEN** a CLI command produces output
- **THEN** stdout and stderr are captured as strings
- **AND** available for assertions in tests

### Requirement: Test Isolation
The system SHALL ensure tests run in complete isolation without side effects.

#### Scenario: Parallel test execution
- **WHEN** multiple E2E tests run in parallel
- **THEN** each test has its own isolated temporary directory
- **AND** tests do not interfere with each other's storage

#### Scenario: Clean state for each test
- **WHEN** a test starts
- **THEN** it has an empty .aissist directory
- **AND** no pre-existing goals, history, or todos

#### Scenario: No global storage pollution
- **WHEN** tests run
- **THEN** they never write to the user's real ~/.aissist directory
- **AND** only write to temporary test directories

### Requirement: Test Utilities
The system SHALL provide helper functions for common test operations.

#### Scenario: Assert file exists
- **WHEN** assertFileExists(relativePath) is called
- **THEN** it checks if the file exists in the test storage directory
- **AND** throws an assertion error if not found

#### Scenario: Read test file
- **WHEN** readFile(relativePath) is called
- **THEN** it reads and returns the file contents from test storage
- **AND** handles missing files gracefully

#### Scenario: Assert file contains text
- **WHEN** assertFileContains(relativePath, text) is called
- **THEN** it reads the file and checks if it contains the expected text
- **AND** provides clear error messages on failure

### Requirement: CI Environment Support
The system SHALL detect and adapt to CI environments.

#### Scenario: Detect CI environment
- **WHEN** the CI environment variable is set to 'true'
- **THEN** tests disable animations and interactive prompts
- **AND** use non-TTY output modes

#### Scenario: CI-friendly timeouts
- **WHEN** running in CI (CI=true)
- **THEN** command timeouts are increased to 30 seconds (vs 10s locally)
- **AND** tests have more tolerance for slower environments

#### Scenario: CI error reporting
- **WHEN** a test fails in CI
- **THEN** it outputs the full stdout and stderr for debugging
- **AND** includes the exact command that was executed

### Requirement: Vitest Integration
The system SHALL integrate with the existing Vitest test framework.

#### Scenario: Run E2E tests separately
- **WHEN** `npm run test:e2e` is executed
- **THEN** it runs only E2E tests matching `**/*.e2e.test.ts`
- **AND** excludes unit tests

#### Scenario: Run all tests together
- **WHEN** `npm test` is executed
- **THEN** it runs both unit tests and E2E tests
- **AND** reports combined coverage

#### Scenario: E2E tests use beforeEach/afterEach hooks
- **WHEN** E2E test suites are written
- **THEN** they use Vitest's beforeEach to call harness.setup()
- **AND** use afterEach to call harness.teardown()
- **AND** ensure proper cleanup even on test failure

