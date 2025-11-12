# Tasks: add-e2e-testing

## Implementation Order

1. **[x] Install execa dependency**
   - Run `npm install --save-dev execa`
   - Verify installation with `npm list execa`
   - **Validation**: Package.json includes execa in devDependencies

2. **[x] Create mock Claude CLI executable**
   - Create `src/__tests__/mocks/mock-claude-cli.ts` as a Node.js script
   - Implement stdin prompt reading
   - Add response patterns for recall and propose prompts
   - Make executable with proper shebang (`#!/usr/bin/env node`)
   - **Validation**: Run `node src/__tests__/mocks/mock-claude-cli.ts` with test input and verify response

3. **[x] Create CLI test harness utility**
   - Create `src/__tests__/helpers/cli-test-harness.ts`
   - Implement CliTestHarness class with setup(), teardown(), run(), expectSuccess()
   - Add PATH manipulation for mock Claude CLI
   - Add helper methods: assertFileExists(), readFile(), assertFileContains()
   - **Validation**: Import and instantiate the harness in a test file (doesn't have to pass yet)

4. **[x] Configure Vitest for E2E tests**
   - Update `vitest.config.ts` to support separate E2E test pattern
   - Add E2E-specific timeout configuration (60s per test)
   - **Validation**: Run `npx vitest --help` and verify configuration is valid

5. **[x] Write E2E test for goal lifecycle**
   - Create `src/__tests__/e2e/goal.e2e.test.ts`
   - Test: init storage, add goal, list goals, complete goal
   - Use test harness with isolated storage
   - **Validation**: Run `npx vitest src/__tests__/e2e/goal.e2e.test.ts` and verify it passes

6. **[x] Write E2E test for history logging**
   - Create `src/__tests__/e2e/history.e2e.test.ts`
   - Test: log history entry, list history, verify file format
   - Include retroactive logging test
   - **Validation**: Run `npx vitest src/__tests__/e2e/history.e2e.test.ts` and verify it passes

7. **[x] Write E2E test for recall with mock Claude**
   - Create `src/__tests__/e2e/recall.e2e.test.ts`
   - Test: recall query with mock Claude CLI returns results
   - Test: recall falls back to keyword search when Claude unavailable
   - Use test harness with mockClaudeCli: true
   - **Validation**: Run test and verify both scenarios pass

8. **[x] Write E2E test for propose with mock Claude**
   - Create `src/__tests__/e2e/propose.e2e.test.ts`
   - Test: propose command with mock Claude returns actionable items
   - Test: propose handles Claude unavailability gracefully
   - **Validation**: Run test and verify both scenarios pass
   - **Note**: Fixed interactive prompt issue by making `--raw` flag skip post-proposal actions

8a. **[x] Optimize propose command performance**
   - Fixed `--raw` flag to skip interactive prompts after proposal generation
   - Reduced test execution time from 172s to 47s (73% improvement)
   - **Validation**: All propose tests now complete in ~47s total

8b. **[x] Add E2E tests for additional commands**
   - Created `src/__tests__/e2e/context.e2e.test.ts` (6 tests)
   - Created `src/__tests__/e2e/todo.e2e.test.ts` (7 tests)
   - Created `src/__tests__/e2e/reflect.e2e.test.ts` (4 tests)
   - Fixed CLI command syntax for non-interactive testing
   - **Validation**: All 40 tests passing across 7 test suites

9. **[x] Add npm scripts for E2E tests**
   - Add `"test:e2e": "vitest run src/__tests__/e2e"` to package.json
   - Add `"test:e2e:ci": "CI=true npm run build && npm run test:e2e"` for CI
   - Add `"test:all": "npm test && npm run test:e2e"` to run everything
   - **Validation**: Run `npm run test:e2e` and verify all E2E tests execute

10. **[x] Add CI environment detection to test harness**
    - Update CliTestHarness to detect CI=true environment variable
    - Increase timeouts to 30s in CI
    - Add verbose error output in CI
    - **Validation**: Run `CI=true npm run test:e2e` and verify adjusted behavior

11. **[x] Create GitHub Actions workflow**
    - Updated existing `.github/workflows/ci.yml` to include E2E tests
    - Added separate step after build: "Run E2E tests"
    - Set CI=true and MOCK_CLAUDE_CLI=true environment variables
    - **Validation**: Ready for next push/PR to verify workflow execution

12. **[x] Document E2E testing in CONTRIBUTING.md**
    - Added comprehensive "E2E Testing" section to CONTRIBUTING.md
    - Documented how to run tests locally (all commands and options)
    - Explained E2E test infrastructure (harness, mock CLI, isolation)
    - Provided complete Test Harness API reference
    - Included non-interactive testing guidelines
    - Documented AI feature testing with mock Claude CLI
    - Explained CI/CD integration and environment variables
    - Added debugging tips and troubleshooting
    - Provided 5 common E2E test patterns with code examples
    - **Validation**: Documentation is complete and ready for contributors

## Parallel Work Opportunities
- Tasks 5-8 (individual E2E test files) can be implemented in parallel once tasks 1-4 are complete
- Tasks 10-11 (CI configuration) can be worked on in parallel with tasks 5-8

## Dependencies
- Tasks 3-4 depend on task 1 (execa installation)
- Tasks 5-8 depend on tasks 2-3 (mock CLI and test harness)
- Task 9 depends on tasks 5-8 (all test files exist)
- Tasks 10-11 depend on task 9 (scripts exist)
- Task 12 can be started after task 9

## Estimated Effort
- **Total**: ~4-6 hours
- **Core infrastructure** (tasks 1-4): 2-3 hours
- **Test suites** (tasks 5-8): 1-2 hours
- **CI configuration** (tasks 9-11): 30-60 minutes
- **Documentation** (task 12): 30 minutes
