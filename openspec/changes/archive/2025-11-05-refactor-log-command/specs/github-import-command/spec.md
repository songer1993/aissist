# github-import-command Specification

## Purpose
Provide a dedicated Claude Code plugin command for importing GitHub activity (commits and pull requests) as aissist history entries. This capability maintains the existing GitHub integration functionality under a clearer, more descriptive command name.

## ADDED Requirements

### Requirement: GitHub Activity Import Command
The system SHALL provide `/aissist:log-github [timeframe]` command (renamed from `/aissist:log`) to import GitHub commits and pull requests as history entries.

#### Scenario: Import today's GitHub activity
- **GIVEN** the user has authenticated with GitHub via `gh` CLI
- **AND** the user has commits or PRs from today
- **WHEN** the user runs `/aissist:log-github today`
- **THEN** the system fetches commits and PRs from today
- **AND** semantically groups related changes
- **AND** logs summarized entries via `aissist history log`
- **AND** links entries to relevant goals when matches are found

#### Scenario: Import activity from custom timeframe
- **GIVEN** the user is authenticated with GitHub
- **WHEN** the user runs `/aissist:log-github "this week"`
- **THEN** the system parses "this week" into a date range
- **AND** fetches all commits and PRs within that range
- **AND** summarizes and logs the activity

#### Scenario: Default timeframe when not specified
- **GIVEN** the user is authenticated with GitHub
- **WHEN** the user runs `/aissist:log-github` without a timeframe argument
- **THEN** the system prompts for timeframe with default "today"
- **AND** proceeds with the specified or default timeframe

#### Scenario: Command naming clarity
- **GIVEN** the command has been renamed from `/aissist:log` to `/aissist:log-github`
- **WHEN** users see the command in documentation or autocomplete
- **THEN** the name clearly indicates it imports from GitHub
- **AND** reduces confusion with the general-purpose `/aissist:log` command

### Requirement: Command File Location
The GitHub import command SHALL be defined in `aissist-plugin/commands/log-github.md` (moved from `log.md`).

#### Scenario: Command file renamed and moved
- **GIVEN** the command was previously at `aissist-plugin/commands/log.md`
- **WHEN** the refactoring is complete
- **THEN** the command definition exists at `aissist-plugin/commands/log-github.md`
- **AND** the frontmatter, description, and implementation remain unchanged
- **AND** only the file name and command name are updated

#### Scenario: Documentation references updated
- **GIVEN** documentation previously referenced `/aissist:log` for GitHub import
- **WHEN** the refactoring is complete
- **THEN** all documentation is updated to reference `/aissist:log-github`
- **AND** the skill SKILL.md reflects the new command name
- **AND** workflow examples use the updated command

### Requirement: Backward Compatibility Note
The system documentation SHALL note the command rename for users familiar with the old command.

#### Scenario: Migration guide for existing users
- **GIVEN** users previously used `/aissist:log [timeframe]` for GitHub import
- **WHEN** they consult the documentation after upgrade
- **THEN** a migration note explains the rename to `/aissist:log-github`
- **AND** clarifies that `/aissist:log` now serves a different purpose
- **AND** provides examples of both commands side-by-side
