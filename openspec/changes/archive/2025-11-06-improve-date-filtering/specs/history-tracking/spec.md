# history-tracking Specification Delta

## MODIFIED Requirements

### Requirement: History Retrieval
The system SHALL allow users to view their history logs, defaulting to all history entries, with optional date range filtering using natural language or ISO dates.

**Changes**: Changed `--date` flag behavior from "show specific date" to "show since this date". Added natural language support for date filtering.

#### Scenario: View all history by default
- **WHEN** the user runs `aissist history show`
- **THEN** the system displays all history entries from all dates
- **AND** sorts entries chronologically (newest first)
- **AND** includes date separators for readability (e.g., "## 2025-11-06")

#### Scenario: View history since specific date (ISO format)
- **WHEN** the user runs `aissist history show --date 2025-11-01`
- **THEN** the system displays history entries from 2025-11-01 onwards (inclusive)
- **AND** sorts entries chronologically (newest first)
- **AND** includes date separators

#### Scenario: View history since date (natural language)
- **WHEN** the user runs `aissist history show --date "last week"`
- **THEN** the system parses "last week" to determine the start date
- **AND** displays history entries from that date onwards (inclusive)
- **AND** sorts entries chronologically (newest first)

#### Scenario: Natural language timeframe examples
- **WHEN** the user provides natural language timeframes
- **THEN** the system supports:
  - "last week" - entries since start of last week
  - "last month" - entries since start of last month
  - "last quarter" - entries since start of last quarter
  - "this week" - entries since start of this week
  - "this month" - entries since start of this month

#### Scenario: Invalid date format
- **WHEN** the user provides an invalid date format
- **THEN** the system displays an error message explaining the format
- **AND** suggests valid formats (YYYY-MM-DD, "last week", "last month", etc.)

#### Scenario: No history found since date
- **WHEN** no history exists since the specified date
- **THEN** the system displays a message indicating no history was found
- **AND** suggests logging history with `aissist history log`
