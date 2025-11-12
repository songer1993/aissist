# Proposal: add-e2e-testing

## Context
Currently, aissist has comprehensive unit test coverage (264 passing tests) for utility functions, but lacks end-to-end (E2E) integration tests that validate CLI commands as users experience them. This gap means we cannot reliably test:

1. **Command execution workflows** - Commands are tested indirectly through utilities but not as complete user flows
2. **CLI binary integration** - The interaction between `bin/aissist.js`, `dist/index.js`, and Commander.js
3. **External integrations** - Claude Code CLI integration (`src/llm/claude.ts`) has no test coverage
4. **CI/CD validation** - No automated way to verify the CLI works correctly in CI environments

The user specifically needs E2E tests that:
- Work reliably in CI environments
- Mock/fake Claude Code integration to avoid external dependencies
- Test actual CLI commands as subprocess invocations

## Proposed Solution
Add comprehensive E2E testing infrastructure using `execa` for subprocess management and Vitest for test execution. This will:

1. **Test harness** - Create reusable test utilities that spawn the CLI as a subprocess with isolated storage
2. **Claude Code mocking** - Implement a mock `claude` CLI executable for testing without external dependencies
3. **CI-ready configuration** - Add separate test scripts and environment configuration for CI execution
4. **Example test suites** - Provide E2E tests for key workflows (goal lifecycle, history logging, recall with fallback)

### Architecture
```
src/
  __tests__/
    e2e/
      *.e2e.test.ts         # E2E test suites
    helpers/
      cli-test-harness.ts   # Test harness for subprocess management
      mock-claude-cli.ts    # Mock Claude CLI for testing
```

### Key Design Decisions
- **execa over child_process**: More robust subprocess management with better error handling
- **Subprocess testing**: Test the actual CLI binary to catch integration issues
- **Isolated environments**: Each test gets a temporary `.aissist` directory
- **Mock Claude CLI**: Fake `claude` executable that responds with predictable output
- **Separate test script**: `npm run test:e2e` distinct from unit tests

## Scope
### In Scope
- E2E test infrastructure (harness, utilities)
- Mock Claude Code CLI implementation
- Example E2E tests for core workflows (goal, history, recall, propose)
- CI-specific configuration and documentation
- Updated package.json scripts

### Out of Scope
- Visual/screenshot testing
- Performance benchmarking
- Load/stress testing
- Testing interactive prompts (stdin injection is complex, can be added later)

## Dependencies
- Requires `execa` package installation
- Builds on existing `vitest` test infrastructure
- Uses existing `storage.ts` utilities for test setup

## Success Criteria
- [ ] E2E tests execute successfully in local development
- [ ] E2E tests pass in CI without Claude Code installed
- [ ] Mock Claude CLI provides realistic responses
- [ ] Test harness supports isolated storage per test
- [ ] Documentation guides adding new E2E tests
- [ ] `npm run test:e2e` runs all E2E tests separately from unit tests

## Related Changes
- Complements existing unit test coverage in `src/utils/*.test.ts`
- Relates to `cli-infrastructure` spec (testing CLI commands)
- Relates to `claude-integration` spec (mocking Claude Code)

## Implementation Notes
- Mock Claude CLI will be a simple Node.js script that responds to `--allowedTools` and stdin prompts
- Test harness will manage PATH manipulation to inject mock Claude CLI
- Tests will use environment variable `AISSIST_HOME` to control storage location
- CI configuration will set `CI=true` environment variable for test detection
