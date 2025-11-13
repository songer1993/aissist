# cli-infrastructure Specification

## Purpose
TBD - created by archiving change add-aissist-mvp. Update Purpose after archive.
## Requirements
### Requirement: Command-Line Interface
The system SHALL provide a command-line interface using the commander framework with support for subcommands, options, and flags, including the `propose` command for AI-powered action planning.

#### Scenario: Display help information
- **WHEN** the user runs `aissist --help` or `aissist -h`
- **THEN** the system displays a list of all available commands with descriptions

#### Scenario: Display version information
- **WHEN** the user runs `aissist --version` or `aissist -V`
- **THEN** the system displays the current version number

#### Scenario: Execute subcommand
- **WHEN** the user runs `aissist <command>` with a valid command name
- **THEN** the system executes the specified command handler

#### Scenario: Execute propose command
- **WHEN** the user runs `aissist propose [<timeframe>]`
- **THEN** the system invokes the propose command handler with optional timeframe argument

### Requirement: Interactive Prompts
The system SHALL provide interactive command-line prompts using @inquirer/core for user input.

#### Scenario: Collect user input
- **WHEN** a command requires user input
- **THEN** the system displays an interactive prompt and waits for user response

#### Scenario: Handle prompt cancellation
- **WHEN** the user cancels a prompt (Ctrl+C)
- **THEN** the system exits gracefully without error

### Requirement: Visual Feedback
The system SHALL provide visual feedback using chalk for colored output and ora for loading indicators.

#### Scenario: Display success message
- **WHEN** a command completes successfully
- **THEN** the system displays a success message in green

#### Scenario: Display error message
- **WHEN** a command encounters an error
- **THEN** the system displays an error message in red

#### Scenario: Display loading indicator
- **WHEN** a command performs a long-running operation
- **THEN** the system displays a spinner with a descriptive message

### Requirement: Binary Executable
The system SHALL provide an executable binary that can be invoked globally after installation.

#### Scenario: Global installation
- **WHEN** the user installs the package globally with `npm install -g aissist`
- **THEN** the `aissist` command becomes available in their PATH

#### Scenario: Local execution
- **WHEN** the user runs `npx aissist` without global installation
- **THEN** the system executes the CLI tool directly

### Requirement: Path Command Enhancements
The system SHALL provide a `path` command to display current storage paths with support for hierarchical configuration.

#### Scenario: Display write path
- **WHEN** the user runs `aissist path`
- **THEN** the system displays the local `.aissist` directory path
- **AND** indicates it is the write path
- **AND** displays "Storage path (writes): /home/user/project/.aissist"

#### Scenario: Display read hierarchy
- **GIVEN** hierarchical configuration is enabled with 2 parent paths
- **WHEN** the user runs `aissist path --hierarchy` or `aissist path -v`
- **THEN** the system displays the write path
- **AND** lists all configured read paths with relative depth indicators
- **AND** shows:
  ```
  Storage path (writes): /home/user/project/.aissist

  Read hierarchy:
    • /home/user/project/.aissist (local)
    • /home/user/monorepo/.aissist (2 levels up)
    • /home/user/.aissist (global)
  ```

#### Scenario: Display path in isolated mode
- **GIVEN** hierarchical configuration is NOT enabled
- **WHEN** the user runs `aissist path --hierarchy`
- **THEN** the system displays only the local path
- **AND** indicates "No hierarchical configuration (isolated mode)"

### Requirement: Spinner Utility for Async Operations
The system SHALL provide a reusable spinner utility for displaying loading indicators during asynchronous operations.

#### Scenario: Wrap async operation with spinner
- **WHEN** a command performs a long-running async operation
- **THEN** the system can wrap the operation with a spinner utility
- **AND** display a configurable message during the operation
- **AND** automatically stop the spinner when the operation completes
- **AND** return the operation result transparently

#### Scenario: Spinner respects animation config
- **WHEN** animations are disabled in user config (`animations.enabled = false`)
- **THEN** the spinner utility skips visual animation
- **AND** the wrapped operation still executes normally
- **AND** provides minimal or no visual feedback

#### Scenario: Spinner handles operation errors
- **WHEN** a wrapped async operation throws an error
- **THEN** the spinner stops immediately
- **AND** the error is propagated to the caller
- **AND** the CLI displays appropriate error messaging

#### Scenario: Spinner uses existing ora library
- **WHEN** the spinner utility is implemented
- **THEN** it uses the already-installed `ora` library for consistency
- **AND** follows the same patterns as `playCompletionAnimation` in `src/utils/animations.ts`
- **AND** maintains the Aissist brand aesthetic (cyan colors, minimal frames)

### Requirement: Automatic Version Update Check
The system SHALL check for new versions of the CLI tool on startup and notify users when updates are available, without blocking or significantly delaying command execution. **The update check cache SHALL be stored in the global user directory (~/.aissist/cache/) regardless of whether the user is in a project-local or global storage context.**

#### Scenario: Check for updates on startup
- **WHEN** the user runs any `aissist` command
- **THEN** the system checks the npm registry for the latest published version asynchronously
- **AND** does not block or delay the primary command execution
- **AND** caches the result for 24 hours to avoid excessive network requests
- **AND** stores the cache in `~/.aissist/cache/update-check.json` (global user directory)

#### Scenario: Notify user of available update
- **WHEN** a newer version is available on npm
- **THEN** the system displays a non-intrusive notification after the command completes
- **AND** shows the current version and the latest available version
- **AND** provides instructions on how to update (e.g., `npm install -g aissist@latest`)

#### Scenario: Skip check when recently checked
- **WHEN** a version check was performed within the last 24 hours
- **THEN** the system skips the npm registry check
- **AND** uses the cached result from `~/.aissist/cache/update-check.json` if an update was previously detected
- **AND** still displays the update notification if applicable

#### Scenario: Handle network failures gracefully
- **WHEN** the npm registry is unreachable or the request times out
- **THEN** the system silently skips the update check
- **AND** does not display any error or warning to the user
- **AND** allows the primary command to execute normally

#### Scenario: Respect update check configuration
- **WHEN** the user has disabled update checks in their configuration (`updateCheck.enabled = false`)
- **THEN** the system skips the version check entirely
- **AND** does not display any update notifications

#### Scenario: Force update check
- **WHEN** the user runs `aissist config check-updates` or similar command
- **THEN** the system performs an immediate version check regardless of cache
- **AND** displays the result (update available or up-to-date)
- **AND** updates the cache with the new check timestamp in `~/.aissist/cache/update-check.json`

#### Scenario: Cache location is consistent across projects
- **WHEN** the user runs `aissist` commands from different projects
- **THEN** the system uses the same global cache file `~/.aissist/cache/update-check.json`
- **AND** does not create project-specific cache files
- **AND** ensures the cache directory exists before writing

### Requirement: Update Check Configuration
The system SHALL allow users to configure update check behavior through the config command.

#### Scenario: Disable update checks
- **WHEN** the user runs `aissist config set updateCheck.enabled false`
- **THEN** the system saves the setting to the configuration file
- **AND** future CLI invocations skip the automatic update check

#### Scenario: Enable update checks
- **WHEN** the user runs `aissist config set updateCheck.enabled true`
- **THEN** the system saves the setting to the configuration file
- **AND** future CLI invocations perform the automatic update check

#### Scenario: View current update check setting
- **WHEN** the user runs `aissist config get updateCheck.enabled`
- **THEN** the system displays the current value (true or false)
- **AND** defaults to true if not explicitly configured

