/**
 * E2E Tests for Context Management
 *
 * Tests the complete workflow of context management:
 * - Adding context items
 * - Showing context items
 * - Linking context to goals
 * - Clearing context
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CliTestHarness } from '../helpers/cli-test-harness.js';

describe('Context E2E', () => {
  let harness: CliTestHarness;

  beforeEach(async () => {
    harness = new CliTestHarness({ mockClaudeCli: true });
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should add a context item', async () => {
    const result = await harness.run(['context', 'log', 'work', 'Working on API refactoring']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Context logged');

    // Verify context file was created
    const contextDirs = harness.listFiles('context');
    expect(contextDirs.length).toBeGreaterThan(0);

    // Check that the context contains the expected text
    const contextFiles = harness.listFiles('context/work');
    expect(contextFiles.length).toBeGreaterThan(0);
    const content = harness.readFile(`context/work/${contextFiles[0]}`);
    expect(content).toContain('Working on API refactoring');
  });

  it('should show context items', async () => {
    // Add some context items first
    await harness.run(['context', 'log', 'work', 'Context item 1']);
    await harness.run(['context', 'log', 'work', 'Context item 2']);

    // Show context
    const result = await harness.run(['context', 'show', 'work']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Context item 1');
    expect(result.stdout).toContain('Context item 2');
  });

  it('should link context to goals', async () => {
    // First create a goal
    const goalResult = await harness.run([
      'goal',
      'add',
      'Complete API documentation',
      '--deadline',
      '2025-12-31',
    ]);
    harness.expectSuccess(goalResult);

    // Extract the codename
    const codenameMatch = goalResult.stdout.match(/Goal added with codename: ([a-z0-9-]+)/i);
    expect(codenameMatch).toBeTruthy();
    const codename = codenameMatch![1];

    // Add context linked to the goal
    const contextResult = await harness.run([
      'context',
      'log',
      'work',
      'API endpoints defined',
      '--goal',
      codename,
    ]);

    harness.expectSuccess(contextResult);
    expect(contextResult.stdout).toContain('Context logged');

    // Verify the context file contains the goal reference
    const contextFiles = harness.listFiles('context/work');
    expect(contextFiles.length).toBeGreaterThan(0);

    const contextFile = contextFiles[0];
    const content = harness.readFile(`context/work/${contextFile}`);
    expect(content).toContain('API endpoints defined');
    expect(content).toContain(codename);
  });

  it('should persist context across command invocations', async () => {
    // Add a context item
    await harness.run(['context', 'log', 'personal', 'Persistent context item']);

    // Show context in a separate command
    const result = await harness.run(['context', 'show', 'personal']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Persistent context item');
  });

  it('should handle multiple context items', async () => {
    // Add multiple context items
    await harness.run(['context', 'log', 'project', 'First context']);
    await harness.run(['context', 'log', 'project', 'Second context']);
    await harness.run(['context', 'log', 'project', 'Third context']);

    // Show all context
    const result = await harness.run(['context', 'show', 'project']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('First context');
    expect(result.stdout).toContain('Second context');
    expect(result.stdout).toContain('Third context');
  });

  it('should list available contexts', async () => {
    // Add context items to different contexts
    await harness.run(['context', 'log', 'work', 'Work context']);
    await harness.run(['context', 'log', 'personal', 'Personal context']);

    // List contexts
    const result = await harness.run(['context', 'list']);
    harness.expectSuccess(result);

    expect(result.stdout).toContain('work');
    expect(result.stdout).toContain('personal');
  });
});
