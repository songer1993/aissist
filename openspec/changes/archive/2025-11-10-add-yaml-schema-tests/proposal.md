# Proposal: Add Comprehensive Test Coverage for YAML Schema Version Implementation

## Problem Statement

The recent YAML schema version implementation (`schema_version: "1.0"`) added critical functionality across the entire storage system—affecting goals, todos, history, context, and reflections. However, **zero unit tests** were written for this implementation, creating significant risk:

1. **No validation** that serializers include `schema_version` in output
2. **No verification** that parsers handle YAML format correctly
3. **No backward compatibility tests** for reading legacy inline format
4. **No format detection tests** (YAML vs inline)
5. **No schema version normalization tests** (defaults, unknown versions)
6. **No round-trip tests** (serialize → parse → verify)

This proposal addresses the testing gap by adding comprehensive test coverage for all YAML serialization/parsing functionality.

## Current State

### What Exists
- **Implementation**: Complete YAML serializers and parsers for all entry types
- **Test Framework**: Vitest configured and running (173 existing tests passing)
- **Test Files**:
  - `src/utils/storage.test.ts` (31 tests) - Only tests inline format
  - `src/utils/goal.test.ts` (19 tests) - Only tests inline format
  - `src/utils/history.test.ts` (8 tests) - Only tests inline format
  - No tests for: yaml-helpers, todos, context, reflections

### What's Missing
- **0 tests** for YAML serializers (5 functions)
- **0 tests** for YAML parsers (5 functions)
- **0 tests** for yaml-helpers utilities (parseYamlFrontMatter, serializeYamlFrontMatter, etc.)
- **0 tests** for schema_version validation/normalization
- **0 tests** for format detection (detectFormat function)
- **0 tests** for reflection functionality (entirely new feature)
- **0 tests** for backward compatibility with inline format

## Proposed Solution

Add comprehensive unit test coverage organized into three phases:

### Phase 1: Foundation (Critical)
- Create `yaml-helpers.test.ts` with tests for core YAML utilities
- Test schema version normalization and validation
- Test format detection (YAML vs inline)
- Test YAML front matter parsing and serialization

### Phase 2: Entry Types (High Priority)
- Extend `goal.test.ts` with YAML serialization/parsing tests
- Extend `history.test.ts` with YAML tests
- Create `todo.test.ts` for todo YAML format
- Create `context.test.ts` for context YAML format
- Create `reflection.test.ts` for new reflection functionality

### Phase 3: Integration (Medium Priority)
- Create `storage-yaml.test.ts` for end-to-end workflows
- Add round-trip serialization tests (write → read → verify)
- Test backward compatibility (mixed format files)
- Test migration scenarios

## Success Criteria

1. **Coverage Metrics**:
   - All YAML serializer functions have unit tests
   - All YAML parser functions have unit tests
   - yaml-helpers utilities have 100% test coverage
   - Backward compatibility verified for all entry types

2. **Test Quality**:
   - Each serializer has "includes schema_version" test
   - Each parser has "handles missing schema_version" test
   - Each parser has "reads legacy inline format" test
   - Format detection has comprehensive test cases

3. **Integration**:
   - Round-trip tests for all entry types pass
   - Mixed format files handled correctly
   - Schema version normalization consistent across all parsers

## Non-Goals

- **Not testing** command-level integration (covered by separate integration tests)
- **Not testing** file I/O operations (covered by existing storage.test.ts)
- **Not testing** UI/prompts (covered by manual testing)
- **Not refactoring** existing inline format tests (maintain for regression)

## Dependencies

- Vitest test framework (already installed)
- Existing YAML serializers/parsers (already implemented)
- No external dependencies required

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tests discover bugs in implementation | Medium | Fix bugs as discovered, validate fixes with tests |
| Test suite becomes too large | Low | Keep tests focused and well-organized by capability |
| Backward compatibility breaks | High | Extensive tests for inline format parsing prevent regressions |

## Estimated Effort

- **Phase 1**: 3-4 hours (yaml-helpers.test.ts)
- **Phase 2**: 6-8 hours (5 test files for entry types)
- **Phase 3**: 2-3 hours (integration tests)
- **Total**: 11-15 hours

## Related Changes

- Builds on archived change: `2025-11-09-add-yaml-schema-version`
- Builds on archived change: `2025-11-09-migrate-to-yaml-frontmatter`
- Relates to spec: `storage-system` (file format requirements)
- Relates to spec: `goal-management` (goal serialization)
- Relates to spec: `history-tracking` (history serialization)
- Relates to spec: `todo-management` (todo serialization)
