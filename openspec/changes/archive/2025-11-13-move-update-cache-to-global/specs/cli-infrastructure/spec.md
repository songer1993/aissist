# cli-infrastructure Spec Deltas

## MODIFIED Requirements

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
