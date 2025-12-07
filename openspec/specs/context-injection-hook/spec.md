# context-injection-hook Specification

## Purpose
TBD - created by archiving change add-context-injection-hook. Update Purpose after archive.
## Requirements
### Requirement: Configuration Flag
The CLI MUST support a `hooks.contextInjection` configuration section with an `enabled` boolean flag.

#### Scenario: Default configuration
- Given a fresh aissist installation
- When the config is loaded
- Then `hooks.contextInjection.enabled` MUST default to `false`

#### Scenario: Config schema includes hooks section
- Given the ConfigSchema in storage.ts
- Then it MUST include a `hooks` object
- And the `hooks` object MUST contain `contextInjection` with an `enabled` boolean

### Requirement: CLI Commands
The CLI MUST provide commands to enable and disable context injection.

#### Scenario: Enable context injection
- Given context injection is disabled
- When the user runs `aissist config context-injection enable`
- Then `hooks.contextInjection.enabled` MUST be set to `true`
- And a success message MUST be displayed

#### Scenario: Disable context injection
- Given context injection is enabled
- When the user runs `aissist config context-injection disable`
- Then `hooks.contextInjection.enabled` MUST be set to `false`
- And a success message MUST be displayed

#### Scenario: Show context injection status
- When the user runs `aissist config context-injection`
- Then the current enabled status MUST be displayed

### Requirement: Hook Script
The plugin MUST include a shell script that checks the config and outputs context when enabled.

#### Scenario: Hook respects disabled flag
- Given `hooks.contextInjection.enabled` is `false`
- When the SessionStart hook executes
- Then it MUST exit silently without output

#### Scenario: Hook outputs context when enabled
- Given `hooks.contextInjection.enabled` is `true`
- When the SessionStart hook executes
- Then it MUST output active goals summary
- And it MUST output recent history summary (last 3-5 entries)

#### Scenario: Hook handles missing config gracefully
- Given no aissist config file exists
- When the SessionStart hook executes
- Then it MUST exit silently without error

### Requirement: Plugin Settings
The plugin settings.json MUST include the SessionStart hook configuration.

#### Scenario: SessionStart hook configuration
- Given the plugin settings.json file
- Then it MUST contain a `hooks.SessionStart` array
- And the hook MUST reference the context injection script

### Requirement: Output Format
The context output MUST be formatted clearly for Claude to interpret.

#### Scenario: Output structure
- Given the hook executes with enabled flag
- Then the output MUST include a header like "Active context:"
- And goals MUST be listed with codenames and deadlines
- And recent history MUST include timestamps and summaries

