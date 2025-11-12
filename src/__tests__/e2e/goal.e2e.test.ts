/**
 * E2E Tests for Goal Lifecycle
 *
 * Tests the complete workflow of goal management:
 * - Adding goals
 * - Listing goals
 * - Completing goals
 * - Viewing goal details
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CliTestHarness } from '../helpers/cli-test-harness.js';

describe('Goal Lifecycle E2E', () => {
  let harness: CliTestHarness;

  beforeEach(async () => {
    harness = new CliTestHarness({ mockClaudeCli: true });
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should add a new goal', async () => {
    const result = await harness.run(['goal', 'add', 'Complete project documentation', '--deadline', '2025-12-31']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Goal added');

    // Verify goal file was created
    const goalFiles = harness.listFiles('goals');
    expect(goalFiles.length).toBeGreaterThan(0);

    // Check that the goal contains the expected text
    const goalFile = goalFiles[0];
    const content = harness.readFile(`goals/${goalFile}`);
    expect(content).toContain('Complete project documentation');
  });

  it('should list goals', async () => {
    // Add a goal first
    await harness.run(['goal', 'add', 'Test goal 1', '--deadline', '2025-12-31']);
    await harness.run(['goal', 'add', 'Test goal 2', '--deadline', '2025-12-31']);

    // List goals
    const result = await harness.run(['goal', 'list', '--plain']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Test goal 1');
    expect(result.stdout).toContain('Test goal 2');
  });

  it('should complete a goal', async () => {
    // Add a goal
    const addResult = await harness.run(['goal', 'add', 'Goal to complete', '--deadline', '2025-12-31']);
    harness.expectSuccess(addResult);

    // Extract the codename from the output (format: "Goal added with codename: codename")
    const codenameMatch = addResult.stdout.match(/Goal added with codename: ([a-z0-9-]+)/i);
    expect(codenameMatch).toBeTruthy();
    const codename = codenameMatch![1];

    // Complete the goal
    const completeResult = await harness.run(['goal', 'complete', codename]);
    harness.expectSuccess(completeResult);

    // Verify the goal files still exist (completed goals are kept in the same directory)
    const goalFiles = harness.listFiles('goals');
    expect(goalFiles.length).toBeGreaterThan(0);
  });

  it('should read goal from file system', async () => {
    // Add a goal
    const addResult = await harness.run(['goal', 'add', 'Detailed goal', '--deadline', '2025-12-31']);
    harness.expectSuccess(addResult);

    // Extract codename
    const codenameMatch = addResult.stdout.match(/Goal added with codename: ([a-z0-9-]+)/i);
    const codename = codenameMatch![1];

    // Read the goal file directly
    const goalFiles = harness.listFiles('goals');
    expect(goalFiles.length).toBeGreaterThan(0);

    const goalFile = goalFiles[0];
    const content = harness.readFile(`goals/${goalFile}`);
    expect(content).toContain('Detailed goal');
    expect(content).toContain(codename);
  });

  it('should handle multiple goals', async () => {
    // Add multiple goals
    const goal1 = await harness.run(['goal', 'add', 'Active goal 1', '--deadline', '2025-12-31']);
    const goal2 = await harness.run(['goal', 'add', 'Active goal 2', '--deadline', '2025-12-31']);
    const goal3 = await harness.run(['goal', 'add', 'Active goal 3', '--deadline', '2025-12-31']);

    harness.expectSuccess(goal1);
    harness.expectSuccess(goal2);
    harness.expectSuccess(goal3);

    // List all goals
    const listResult = await harness.run(['goal', 'list', '--plain']);
    harness.expectSuccess(listResult);

    // Should show all active goals
    expect(listResult.stdout).toContain('Active goal 1');
    expect(listResult.stdout).toContain('Active goal 2');
    expect(listResult.stdout).toContain('Active goal 3');
  });

  it('should persist goals across command invocations', async () => {
    // Add a goal
    await harness.run(['goal', 'add', 'Persistent goal', '--deadline', '2025-12-31']);

    // List goals in a separate command
    const result = await harness.run(['goal', 'list', '--plain']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Persistent goal');
  });
});
