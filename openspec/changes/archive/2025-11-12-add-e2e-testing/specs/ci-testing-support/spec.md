# ci-testing-support Specification

## Purpose
Provides configuration and tooling to ensure E2E tests run reliably in Continuous Integration (CI) environments without external dependencies.

## ADDED Requirements

### Requirement: CI Environment Detection
The system SHALL detect when tests are running in CI environments and adjust behavior accordingly.

#### Scenario: Detect GitHub Actions
- **WHEN** tests run in GitHub Actions
- **THEN** the CI environment variable is set to 'true'
- **AND** the GITHUB_ACTIONS variable is also present
- **AND** tests adapt their behavior

#### Scenario: Detect other CI systems
- **WHEN** tests run in GitLab CI, CircleCI, Travis, or other CI systems
- **THEN** the CI variable is set to 'true'
- **AND** tests detect this consistently

#### Scenario: Local development without CI flag
- **WHEN** tests run locally without CI variable set
- **THEN** tests use developer-friendly settings
- **AND** may enable debug output or shorter timeouts

### Requirement: Non-Interactive Mode
The system SHALL disable all interactive prompts in CI environments.

#### Scenario: Commands with --no-interactive flag
- **WHEN** E2E tests run commands in CI
- **THEN** they append `--no-interactive` or equivalent flags
- **OR** set environment variables to disable prompts

#### Scenario: Fail on unexpected prompts
- **WHEN** a command tries to prompt for input in CI
- **THEN** it should fail with a clear error
- **AND** not hang indefinitely

### Requirement: CI-Specific Test Scripts
The system SHALL provide dedicated npm scripts for CI execution.

#### Scenario: Run E2E tests in CI
- **WHEN** `npm run test:e2e:ci` is executed
- **THEN** it sets CI=true environment variable
- **AND** runs all E2E tests with increased timeouts
- **AND** outputs verbose error details

#### Scenario: CI script includes build step
- **WHEN** `npm run test:e2e:ci` is executed
- **THEN** it first runs `npm run build` to ensure dist/ is up-to-date
- **AND** then executes E2E tests against the built output

#### Scenario: Fail fast in CI
- **WHEN** running tests in CI
- **THEN** Vitest is configured with bail: 1 to stop on first failure
- **OR** CI script uses --bail flag to exit early on errors

### Requirement: Environment Variable Configuration
The system SHALL use environment variables to control test behavior.

#### Scenario: AISSIST_HOME for test isolation
- **WHEN** E2E tests run
- **THEN** they set AISSIST_HOME to a temporary directory
- **AND** never use the default ~/.aissist path
- **AND** ensure test isolation

#### Scenario: MOCK_CLAUDE_CLI to enable mocking
- **WHEN** MOCK_CLAUDE_CLI=true is set
- **THEN** the test harness uses the mock Claude executable
- **AND** tests don't require real Claude Code installation

#### Scenario: DEBUG flag for verbose output
- **WHEN** DEBUG=aissist:* is set
- **THEN** tests output detailed logging
- **AND** help diagnose CI failures

### Requirement: Timeout Configuration
The system SHALL configure appropriate timeouts for CI environments.

#### Scenario: Increased command timeouts in CI
- **WHEN** running in CI (CI=true)
- **THEN** CLI command timeouts are 30 seconds (vs 10s locally)
- **AND** accounts for slower CI hardware

#### Scenario: Vitest test timeout in CI
- **WHEN** E2E tests run in CI
- **THEN** Vitest testTimeout is set to 60 seconds per test
- **AND** prevents premature test failures

#### Scenario: Overall test suite timeout
- **WHEN** the entire E2E test suite runs in CI
- **THEN** it has a maximum timeout of 10 minutes
- **AND** fails if exceeded to prevent hanging builds

### Requirement: CI Documentation
The system SHALL provide clear documentation for running tests in CI.

#### Scenario: README includes CI setup instructions
- **WHEN** a developer reads the testing documentation
- **THEN** it explains how to run E2E tests locally
- **AND** describes CI-specific configuration
- **AND** lists required environment variables

#### Scenario: Example GitHub Actions workflow
- **WHEN** developers set up CI
- **THEN** they can reference an example `.github/workflows/test.yml`
- **AND** it demonstrates proper E2E test execution
- **AND** includes all necessary setup steps

### Requirement: CI Debugging Support
The system SHALL provide tools for debugging test failures in CI.

#### Scenario: Capture CLI output on failure
- **WHEN** an E2E test fails in CI
- **THEN** the full stdout and stderr are printed
- **AND** the exact command that failed is shown
- **AND** makes debugging easier

#### Scenario: Store test artifacts in CI
- **WHEN** tests fail in CI
- **THEN** temporary test directories can be uploaded as artifacts
- **AND** developers can inspect the state post-failure

#### Scenario: Verbose logging in CI
- **WHEN** DEBUG mode is enabled in CI
- **THEN** all subprocess executions are logged
- **AND** environment variables are displayed (excluding secrets)
- **AND** test harness operations are traced

### Requirement: No External Dependencies in CI
The system SHALL ensure E2E tests run without external API calls or services.

#### Scenario: Mock Claude CLI is used by default
- **WHEN** E2E tests run in CI
- **THEN** MOCK_CLAUDE_CLI is automatically set to true
- **AND** no real Claude API calls are made

#### Scenario: Offline-compatible tests
- **WHEN** the CI environment has no internet access
- **THEN** all E2E tests still pass
- **AND** no network timeouts occur

#### Scenario: No rate limiting issues
- **WHEN** E2E tests run repeatedly in CI
- **THEN** there are no API rate limits to worry about
- **AND** tests are deterministic and fast
