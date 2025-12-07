# datetime-context-hook Specification

## Purpose
TBD - created by archiving change add-datetime-context-hook. Update Purpose after archive.
## Requirements
### Requirement: Hook Configuration
The plugin MUST include a `settings.json` file that configures a `UserPromptSubmit` hook to execute a datetime injection script.

#### Scenario: Hook triggers on user prompt
- Given the aissist plugin is installed
- When a user submits any prompt in Claude Code
- Then the hook executes and injects the current datetime into context

#### Scenario: Hook configuration structure
- Given the plugin `settings.json` file exists
- Then it MUST contain a `hooks.UserPromptSubmit` array
- And the hook MUST match all prompts with `"*"` matcher
- And the hook command MUST reference the datetime script

### Requirement: DateTime Script
The plugin MUST include a shell script that outputs the current date and time in a human-readable format.

#### Scenario: Script outputs current datetime
- Given the datetime script is executed
- Then it MUST output the current date and time
- And the format MUST include year, month, day, hour, minute, second
- And the format MUST include the timezone

#### Scenario: Script is cross-platform compatible
- Given the datetime script is executed on macOS or Linux
- Then it MUST produce valid output using standard `date` command

### Requirement: Plugin Directory Structure
The hook files MUST be organized in a standard structure within the plugin.

#### Scenario: Settings file location
- Given the plugin is installed
- Then `settings.json` MUST exist at `aissist-plugin/settings.json`

#### Scenario: Hooks directory
- Given the plugin is installed
- Then a `hooks/` directory MUST exist at `aissist-plugin/hooks/`
- And the datetime script MUST exist at `aissist-plugin/hooks/add-datetime.sh`
- And the script MUST have executable permissions

### Requirement: Output Format
The datetime output MUST be formatted as a system reminder that Claude can interpret.

#### Scenario: Output message format
- Given the hook script executes successfully
- Then the output MUST start with "Current date and time:"
- And MUST include the datetime in ISO-like format (YYYY-MM-DD HH:MM:SS TZ)

