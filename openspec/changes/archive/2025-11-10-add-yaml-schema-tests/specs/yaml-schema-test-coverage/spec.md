# yaml-schema-test-coverage Specification

## Purpose
Define comprehensive test coverage requirements for YAML schema version implementation to ensure data integrity, backward compatibility, and correct serialization/parsing across all entry types (goals, todos, history, context, reflections).

## ADDED Requirements

### Requirement: YAML Utility Function Testing
The test suite SHALL verify core YAML parsing and serialization utilities in `yaml-helpers.ts`.

#### Scenario: Parse valid YAML front matter
- **GIVEN** a string with YAML front matter between `---` delimiters
- **WHEN** `parseYamlFrontMatter()` is called
- **THEN** it returns a tuple of [metadata object, body string]
- **AND** metadata contains all fields from YAML block
- **AND** body contains content after second `---`

#### Scenario: Reject invalid YAML
- **GIVEN** a string with malformed YAML syntax
- **WHEN** `parseYamlFrontMatter()` is called
- **THEN** it returns null
- **AND** does not throw an exception

#### Scenario: Reject content without front matter
- **GIVEN** a string starting with `##` (inline format)
- **WHEN** `parseYamlFrontMatter()` is called
- **THEN** it returns null

#### Scenario: Serialize YAML front matter with schema version
- **GIVEN** metadata object with `schema_version: "1.0"`
- **WHEN** `serializeYamlFrontMatter()` is called
- **THEN** output starts with `---`
- **AND** output contains `schema_version: "1.0"`
- **AND** output ends with `---` before body
- **AND** body content appears after second `---`

#### Scenario: Omit null and undefined values from YAML
- **GIVEN** metadata with `{ deadline: null, description: undefined }`
- **WHEN** `serializeYamlFrontMatter()` is called
- **THEN** output does not contain "deadline"
- **AND** output does not contain "description"

#### Scenario: Detect YAML format
- **GIVEN** content starting with `---`
- **WHEN** `detectFormat()` is called
- **THEN** it returns "yaml"

#### Scenario: Detect inline format
- **GIVEN** content starting with `##`
- **WHEN** `detectFormat()` is called
- **THEN** it returns "inline"

#### Scenario: Normalize missing schema version
- **GIVEN** `undefined` schema version
- **WHEN** `normalizeSchemaVersion()` is called
- **THEN** it returns "1.0"

#### Scenario: Accept known schema version
- **GIVEN** schema version "1.0"
- **WHEN** `normalizeSchemaVersion()` is called
- **THEN** it returns "1.0"

#### Scenario: Warn on unknown schema version
- **GIVEN** schema version "2.5"
- **WHEN** `normalizeSchemaVersion()` is called
- **THEN** it logs a warning to console
- **AND** returns "1.0" (fallback)

#### Scenario: Split YAML entries correctly
- **GIVEN** content with multiple YAML entries separated by `---` blocks
- **WHEN** `splitEntries()` is called
- **THEN** it returns array of individual entries
- **AND** each entry contains complete `---` ... `---` block with body

#### Scenario: Split inline entries correctly
- **GIVEN** content with multiple inline entries starting with `##`
- **WHEN** `splitEntries()` is called
- **THEN** it returns array of individual entries
- **AND** each entry starts with `##` header

### Requirement: Goal YAML Serialization Testing
The test suite SHALL verify goal entry serialization and parsing with YAML format.

#### Scenario: Serialize goal with all fields and schema version
- **GIVEN** `GoalEntry` with timestamp, codename, text, deadline, description
- **WHEN** `serializeGoalEntryYaml()` is called
- **THEN** output contains `schema_version: "1.0"`
- **AND** output contains all provided fields
- **AND** output is valid YAML front matter format

#### Scenario: Serialize goal without optional fields
- **GIVEN** `GoalEntry` with null deadline and description
- **WHEN** `serializeGoalEntryYaml()` is called
- **THEN** output contains `schema_version: "1.0"`
- **AND** output omits deadline field
- **AND** output omits description field

#### Scenario: Parse YAML goal entry
- **GIVEN** valid YAML goal entry with all fields
- **WHEN** `parseGoalEntryYaml()` is called
- **THEN** it returns `GoalEntry` object
- **AND** all fields match input
- **AND** schema version is normalized

#### Scenario: Parse YAML goal with missing schema version
- **GIVEN** YAML goal entry without `schema_version` field
- **WHEN** `parseGoalEntryYaml()` is called
- **THEN** it returns `GoalEntry` object
- **AND** normalizes schema version to "1.0"

#### Scenario: Parse inline goal format (backward compatibility)
- **GIVEN** inline format goal entry `## HH:MM - codename`
- **WHEN** `parseGoalEntryAuto()` is called
- **THEN** it detects inline format
- **AND** parses using `parseGoalEntry()`
- **AND** returns valid `GoalEntry` object

#### Scenario: Auto-detect goal format
- **GIVEN** YAML format goal entry
- **WHEN** `parseGoalEntryAuto()` is called
- **THEN** it detects YAML format
- **AND** parses using `parseGoalEntryYaml()`

#### Scenario: Round-trip goal serialization
- **GIVEN** `GoalEntry` with all fields populated
- **WHEN** serialized with `serializeGoalEntryYaml()` and parsed with `parseGoalEntryYaml()`
- **THEN** parsed entry matches original entry
- **AND** no data loss occurs

### Requirement: History YAML Serialization Testing
The test suite SHALL verify history entry serialization and parsing with YAML format.

#### Scenario: Serialize history with schema version
- **GIVEN** `HistoryItemEntry` with timestamp, text, goal
- **WHEN** `serializeHistoryItemEntryYaml()` is called
- **THEN** output contains `schema_version: "1.0"`
- **AND** output contains all provided fields

#### Scenario: Serialize history with goal link
- **GIVEN** `HistoryItemEntry` with goal codename
- **WHEN** `serializeHistoryItemEntryYaml()` is called
- **THEN** output contains `goal: codename` in metadata

#### Scenario: Parse YAML history entry
- **GIVEN** valid YAML history entry
- **WHEN** `parseHistoryItemEntryYaml()` is called
- **THEN** it returns `HistoryItemEntry` object
- **AND** all fields match input

#### Scenario: Parse inline history format (backward compatibility)
- **GIVEN** inline format history entry `## HH:MM`
- **WHEN** `parseHistoryItemEntryAuto()` is called
- **THEN** it detects inline format
- **AND** parses using `parseHistoryItemEntry()`

#### Scenario: Round-trip history serialization
- **GIVEN** `HistoryItemEntry` with all fields
- **WHEN** serialized and parsed
- **THEN** parsed entry matches original

### Requirement: Todo YAML Serialization Testing
The test suite SHALL verify todo entry serialization and parsing with YAML format.

#### Scenario: Serialize todo with schema version
- **GIVEN** `TodoEntry` with timestamp, text, priority, goal
- **WHEN** `serializeTodoEntryYaml()` is called
- **THEN** output contains `schema_version: "1.0"`
- **AND** output contains priority field
- **AND** output contains goal field if present

#### Scenario: Serialize completed vs uncompleted todos
- **GIVEN** `TodoEntry` with `completed: true`
- **WHEN** `serializeTodoEntryYaml()` is called
- **THEN** output checkbox is `[x]`
- **GIVEN** `TodoEntry` with `completed: false`
- **THEN** output checkbox is `[ ]`

#### Scenario: Parse YAML todo entry
- **GIVEN** valid YAML todo entry
- **WHEN** `parseTodoEntryYaml()` is called
- **THEN** it returns `TodoEntry` object
- **AND** priority is parsed correctly
- **AND** completed status is parsed correctly

#### Scenario: Parse inline todo format (backward compatibility)
- **GIVEN** inline format todo entry
- **WHEN** `parseTodoEntryAuto()` is called
- **THEN** it detects inline format and parses correctly

#### Scenario: Round-trip todo serialization
- **GIVEN** `TodoEntry` with all fields
- **WHEN** serialized and parsed
- **THEN** parsed entry matches original

### Requirement: Context YAML Serialization Testing
The test suite SHALL verify context entry serialization and parsing with YAML format.

#### Scenario: Serialize context with schema version and source
- **GIVEN** `ContextItemEntry` with timestamp, source, text
- **WHEN** `serializeContextItemEntryYaml()` is called
- **THEN** output contains `schema_version: "1.0"`
- **AND** output contains `source` field

#### Scenario: Parse YAML context entry
- **GIVEN** valid YAML context entry
- **WHEN** `parseContextItemEntryYaml()` is called
- **THEN** it returns `ContextItemEntry` object
- **AND** source field is parsed correctly

#### Scenario: Parse inline context format (backward compatibility)
- **GIVEN** inline format context entry
- **WHEN** `parseContextItemEntryAuto()` is called
- **THEN** it detects inline format and parses correctly

#### Scenario: Round-trip context serialization
- **GIVEN** `ContextItemEntry` with all fields
- **WHEN** serialized and parsed
- **THEN** parsed entry matches original

### Requirement: Reflection YAML Serialization Testing
The test suite SHALL verify reflection entry serialization and parsing with YAML format.

#### Scenario: Serialize reflection with schema version
- **GIVEN** `ReflectionEntry` with timestamp, text, goal
- **WHEN** `serializeReflectionEntryYaml()` is called
- **THEN** output contains `schema_version: "1.0"`
- **AND** output contains all provided fields

#### Scenario: Serialize reflection with goal link
- **GIVEN** `ReflectionEntry` with goal codename
- **WHEN** `serializeReflectionEntryYaml()` is called
- **THEN** output contains `goal: codename` in metadata

#### Scenario: Parse YAML reflection entry
- **GIVEN** valid YAML reflection entry
- **WHEN** `parseReflectionEntryYaml()` is called
- **THEN** it returns `ReflectionEntry` object
- **AND** all fields match input

#### Scenario: Parse inline reflection format (backward compatibility)
- **GIVEN** inline format `## Reflection at HH:MM`
- **WHEN** `parseReflectionEntryAuto()` is called
- **THEN** it detects inline format
- **AND** parses using `parseReflectionEntry()`

#### Scenario: Round-trip reflection serialization
- **GIVEN** `ReflectionEntry` with all fields
- **WHEN** serialized and parsed
- **THEN** parsed entry matches original

### Requirement: Integration Testing for YAML Storage
The test suite SHALL verify end-to-end YAML storage workflows.

#### Scenario: Mixed format file handling
- **GIVEN** a file containing both YAML and inline format entries
- **WHEN** entries are parsed with auto-detection
- **THEN** all entries are parsed correctly regardless of format
- **AND** each entry uses appropriate parser

#### Scenario: Schema version preservation through read/write cycle
- **GIVEN** a YAML entry with `schema_version: "1.0"`
- **WHEN** parsed and re-serialized
- **THEN** schema version is preserved in output

#### Scenario: Multiple entries in single file
- **GIVEN** multiple YAML entries in one file
- **WHEN** `splitEntries()` and parsing functions are used
- **THEN** all entries are parsed correctly
- **AND** entries maintain proper separation
