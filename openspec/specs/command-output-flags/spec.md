# command-output-flags Specification

## Purpose
TBD - created by archiving change beautify-markdown-output. Update Purpose after archive.
## Requirements
### Requirement: Raw Output Flag
Commands that produce Markdown output SHALL support a `--raw` flag for machine-readable output.

#### Scenario: Propose command with raw flag
- **WHEN** user runs `aissist propose --raw`
- **THEN** output is raw Markdown without terminal formatting

#### Scenario: Recall command with raw flag
- **WHEN** user runs `aissist recall "query" --raw`
- **THEN** output is raw Markdown without terminal formatting

#### Scenario: Raw flag in help text
- **WHEN** user runs `aissist propose --help`
- **THEN** help text documents `--raw` flag: "Output raw Markdown (for piping or AI consumption)"

#### Scenario: Default behavior without raw flag
- **WHEN** user runs command without `--raw`
- **THEN** output is beautifully formatted for terminal viewing

#### Scenario: Raw flag with other options
- **WHEN** user combines `--raw` with other flags (e.g., `--debug`, `--tag`)
- **THEN** all flags work together, with raw output format

### Requirement: Consistent Flag Naming
Output format flags SHALL use consistent naming across commands.

#### Scenario: Same flag name across commands
- **WHEN** implementing output flags
- **THEN** all commands use `--raw` (not `--plain`, `--document`, `--no-format`)

#### Scenario: Future format flags
- **WHEN** adding new output formats (JSON, etc.)
- **THEN** follow pattern: `--format <type>` or specific flags like `--raw`, `--json`

