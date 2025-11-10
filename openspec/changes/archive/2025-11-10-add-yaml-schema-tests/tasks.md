# Tasks: Add YAML Schema Test Coverage

## Phase 1: Foundation Tests (Critical Priority)

### Task 1.1: Create yaml-helpers.test.ts file structure
- **Description**: Create new test file with describe blocks for each utility function
- **Verification**: File exists with proper imports and structure
- **Dependencies**: None
- **Estimated Time**: 15 minutes

### Task 1.2: Test parseYamlFrontMatter()
- **Description**: Add tests for valid YAML, invalid YAML, and non-YAML content
- **Test Cases**:
  - Parse valid YAML with multiple fields
  - Return null for invalid YAML syntax
  - Return null for content without front matter
  - Handle empty YAML blocks
- **Verification**: `npm test yaml-helpers.test.ts` passes all parseYamlFrontMatter tests
- **Dependencies**: Task 1.1
- **Estimated Time**: 30 minutes

### Task 1.3: Test serializeYamlFrontMatter()
- **Description**: Add tests for YAML serialization with various metadata
- **Test Cases**:
  - Include schema_version in output
  - Format YAML correctly with delimiters
  - Omit null and undefined values
  - Handle empty metadata
  - Handle special characters in values
- **Verification**: All serializeYamlFrontMatter tests pass
- **Dependencies**: Task 1.1
- **Estimated Time**: 30 minutes

### Task 1.4: Test detectFormat()
- **Description**: Add tests for format detection
- **Test Cases**:
  - Detect YAML format (starts with ---)
  - Detect inline format (starts with ##)
  - Handle edge cases (empty string, whitespace)
- **Verification**: All detectFormat tests pass
- **Dependencies**: Task 1.1
- **Estimated Time**: 15 minutes

### Task 1.5: Test normalizeSchemaVersion()
- **Description**: Add tests for schema version normalization
- **Test Cases**:
  - Default to "1.0" when undefined
  - Accept known version "1.0"
  - Warn and fallback for unknown versions
  - Handle empty string
- **Verification**: All normalizeSchemaVersion tests pass, console.warn mocked correctly
- **Dependencies**: Task 1.1
- **Estimated Time**: 20 minutes

### Task 1.6: Test splitEntries()
- **Description**: Add tests for entry splitting with both formats
- **Test Cases**:
  - Split multiple YAML entries correctly
  - Split multiple inline entries correctly
  - Handle single entry
  - Handle empty content
  - Preserve entry completeness (no data loss)
- **Verification**: All splitEntries tests pass
- **Dependencies**: Task 1.1
- **Estimated Time**: 30 minutes

### Task 1.7: Verify Phase 1 complete
- **Description**: Run full test suite and verify all yaml-helpers tests pass
- **Verification**: `npm test yaml-helpers.test.ts` shows all tests passing, no failures
- **Dependencies**: Tasks 1.2-1.6
- **Estimated Time**: 10 minutes

**Phase 1 Total: ~2.5 hours**

---

## Phase 2: Entry Type Tests (High Priority)

### Task 2.1: Extend goal.test.ts with YAML tests
- **Description**: Add new describe block "Goal YAML serialization" to existing goal.test.ts
- **Test Cases**:
  - Serialize goal with schema_version
  - Serialize with all fields vs optional fields
  - Parse YAML goal entry
  - Parse YAML with missing schema_version
  - Auto-detect YAML vs inline format
  - Round-trip serialization
  - Backward compatibility with inline format
- **Verification**: All new goal YAML tests pass, existing tests still pass
- **Dependencies**: Task 1.7 (foundation complete)
- **Estimated Time**: 1 hour

### Task 2.2: Extend history.test.ts with YAML tests
- **Description**: Add new describe block "History YAML serialization" to existing history.test.ts
- **Test Cases**:
  - Serialize history with schema_version
  - Serialize with goal link
  - Parse YAML history entry
  - Auto-detect format
  - Round-trip serialization
  - Backward compatibility
- **Verification**: All new history YAML tests pass
- **Dependencies**: Task 1.7
- **Estimated Time**: 45 minutes

### Task 2.3: Create todo.test.ts
- **Description**: Create comprehensive test file for todo YAML functionality
- **Test Cases**:
  - Serialize todo with schema_version
  - Handle completed vs uncompleted states
  - Parse priority correctly
  - Parse goal links
  - Auto-detect format
  - Round-trip serialization
  - Backward compatibility with inline checkbox format
- **Verification**: `npm test todo.test.ts` passes all tests
- **Dependencies**: Task 1.7
- **Estimated Time**: 1 hour

### Task 2.4: Create context.test.ts
- **Description**: Create test file for context YAML functionality
- **Test Cases**:
  - Serialize context with schema_version and source
  - Parse YAML context entry
  - Handle goal links
  - Auto-detect format
  - Round-trip serialization
  - Backward compatibility
- **Verification**: `npm test context.test.ts` passes all tests
- **Dependencies**: Task 1.7
- **Estimated Time**: 45 minutes

### Task 2.5: Create reflection.test.ts
- **Description**: Create test file for reflection YAML functionality (new feature)
- **Test Cases**:
  - Serialize reflection with schema_version
  - Serialize with goal link
  - Parse YAML reflection entry
  - Parse inline reflection format
  - Auto-detect format
  - Round-trip serialization
  - Handle multi-line reflection text
- **Verification**: `npm test reflection.test.ts` passes all tests
- **Dependencies**: Task 1.7
- **Estimated Time**: 1 hour

### Task 2.6: Verify Phase 2 complete
- **Description**: Run full test suite for all entry types
- **Verification**: All entry type tests pass, no regressions in existing tests
- **Dependencies**: Tasks 2.1-2.5
- **Estimated Time**: 15 minutes

**Phase 2 Total: ~4.75 hours**

---

## Phase 3: Integration Tests (Medium Priority)

### Task 3.1: Create storage-yaml.test.ts file structure
- **Description**: Create integration test file with describe blocks for workflows
- **Verification**: File exists with proper structure
- **Dependencies**: Task 2.6 (all entry types tested)
- **Estimated Time**: 15 minutes

### Task 3.2: Test mixed format file handling
- **Description**: Test files containing both YAML and inline entries
- **Test Cases**:
  - Parse file with mixed formats
  - Auto-detection works for each entry
  - No cross-contamination between formats
  - Preserve order of entries
- **Verification**: Mixed format tests pass
- **Dependencies**: Task 3.1
- **Estimated Time**: 30 minutes

### Task 3.3: Test round-trip workflows
- **Description**: Test complete write → read → verify cycles
- **Test Cases**:
  - Serialize → parse → compare for each entry type
  - No data loss through round-trip
  - Schema version preserved
  - Optional fields handled correctly
- **Verification**: Round-trip tests pass for all entry types
- **Dependencies**: Task 3.1
- **Estimated Time**: 45 minutes

### Task 3.4: Test backward compatibility scenarios
- **Description**: Test reading legacy inline format with new parsers
- **Test Cases**:
  - Parse old goal files
  - Parse old history files
  - Parse old todo files
  - Auto-detection works correctly
  - No breaking changes for existing data
- **Verification**: Backward compatibility tests pass
- **Dependencies**: Task 3.1
- **Estimated Time**: 30 minutes

### Task 3.5: Test multi-entry files
- **Description**: Test files with multiple entries of same type
- **Test Cases**:
  - Split and parse multiple YAML entries
  - Split and parse multiple inline entries
  - Handle large files (10+ entries)
  - Preserve entry boundaries
- **Verification**: Multi-entry tests pass
- **Dependencies**: Task 3.1
- **Estimated Time**: 30 minutes

### Task 3.6: Verify Phase 3 complete
- **Description**: Run complete test suite and verify all pass
- **Verification**: `npm test` shows all tests passing, coverage reports available
- **Dependencies**: Tasks 3.2-3.5
- **Estimated Time**: 15 minutes

**Phase 3 Total: ~2.75 hours**

---

## Phase 4: Finalization

### Task 4.1: Review test coverage metrics
- **Description**: Analyze test coverage and identify gaps
- **Verification**: Review vitest coverage report, identify any uncovered lines
- **Dependencies**: Task 3.6
- **Estimated Time**: 30 minutes

### Task 4.2: Add missing edge case tests
- **Description**: Fill any coverage gaps discovered in Task 4.1
- **Verification**: Coverage increases, edge cases handled
- **Dependencies**: Task 4.1
- **Estimated Time**: 1 hour

### Task 4.3: Document test patterns
- **Description**: Add comments/documentation for test patterns and helpers
- **Verification**: Test files have clear documentation
- **Dependencies**: Task 4.2
- **Estimated Time**: 30 minutes

### Task 4.4: Final verification
- **Description**: Run full test suite and verify quality
- **Checks**:
  - All tests pass: `npm test`
  - No linting errors: `npm run lint`
  - Build succeeds: `npm run build`
  - Coverage meets targets
- **Verification**: All checks pass
- **Dependencies**: Task 4.3
- **Estimated Time**: 15 minutes

**Phase 4 Total: ~2 hours**

---

## Summary

**Total Estimated Time**: ~12 hours (conservative estimate)

**Parallelization Opportunities**:
- Phase 2 tasks (2.1-2.5) can be done in parallel after Phase 1 complete
- Phase 3 tasks (3.2-3.5) can be done in parallel after Task 3.1

**Critical Path**:
1. Phase 1 (foundation) → must complete first
2. Phase 2 (entry types) → can parallelize
3. Phase 3 (integration) → depends on Phase 2
4. Phase 4 (finalization) → sequential

**Success Metrics**:
- 80+ new tests added
- Zero test failures
- Backward compatibility verified for all entry types
- Round-trip tests pass for all entry types
- Schema version included in all serialized output
