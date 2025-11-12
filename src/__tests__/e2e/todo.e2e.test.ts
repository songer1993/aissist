/**
 * E2E Tests for Todo Management
 *
 * Tests the complete workflow of todo management:
 * - Adding todos
 * - Showing todos
 * - Completing todos
 * - Linking todos to goals
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CliTestHarness } from '../helpers/cli-test-harness.js';

describe('Todo E2E', () => {
  let harness: CliTestHarness;

  beforeEach(async () => {
    harness = new CliTestHarness({ mockClaudeCli: true });
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should add a todo', async () => {
    const result = await harness.run(['todo', 'add', 'Write unit tests']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Todo added');

    // Verify todo file was created
    const todoFiles = harness.listFiles('todos');
    expect(todoFiles.length).toBeGreaterThan(0);

    // Check that the todo contains the expected text
    const todoFile = todoFiles[0];
    const content = harness.readFile(`todos/${todoFile}`);
    expect(content).toContain('Write unit tests');
  });

  it('should list todos', async () => {
    // Add some todos first
    await harness.run(['todo', 'add', 'Todo item 1']);
    await harness.run(['todo', 'add', 'Todo item 2']);

    // List todos with plain flag for non-interactive output
    const result = await harness.run(['todo', 'list', '--plain']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Todo item 1');
    expect(result.stdout).toContain('Todo item 2');
  });

  it('should complete a todo', async () => {
    // Add a todo
    const addResult = await harness.run(['todo', 'add', 'Task to complete']);
    harness.expectSuccess(addResult);

    // List todos to verify it exists
    const listResult = await harness.run(['todo', 'list', '--plain']);
    expect(listResult.stdout).toContain('Task to complete');

    // Complete the todo using text match
    const completeResult = await harness.run(['todo', 'done', 'Task to complete']);
    harness.expectSuccess(completeResult);

    // Verify the todo file is marked as completed (using markdown checkbox format)
    const todoFiles = harness.listFiles('todos');
    expect(todoFiles.length).toBeGreaterThan(0);

    const todoFile = todoFiles[0];
    const content = harness.readFile(`todos/${todoFile}`);
    expect(content).toContain('Task to complete');
    expect(content).toContain('[x]'); // Markdown checkbox format for completed
  });

  it('should link todo to goals', async () => {
    // First create a goal
    const goalResult = await harness.run([
      'goal',
      'add',
      'Complete project',
      '--deadline',
      '2025-12-31',
    ]);
    harness.expectSuccess(goalResult);

    // Extract the codename
    const codenameMatch = goalResult.stdout.match(/Goal added with codename: ([a-z0-9-]+)/i);
    expect(codenameMatch).toBeTruthy();
    const codename = codenameMatch![1];

    // Add todo linked to the goal
    const todoResult = await harness.run([
      'todo',
      'add',
      'Finish documentation',
      '--goal',
      codename,
    ]);

    harness.expectSuccess(todoResult);
    expect(todoResult.stdout).toContain('Todo added');

    // Verify the todo file contains the goal reference
    const todoFiles = harness.listFiles('todos');
    expect(todoFiles.length).toBeGreaterThan(0);

    const todoFile = todoFiles[0];
    const content = harness.readFile(`todos/${todoFile}`);
    expect(content).toContain('Finish documentation');
    expect(content).toContain(codename);
  });

  it('should persist todos across command invocations', async () => {
    // Add a todo
    await harness.run(['todo', 'add', 'Persistent todo item']);

    // List todos in a separate command with plain flag
    const result = await harness.run(['todo', 'list', '--plain']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Persistent todo item');
  });

  it('should handle multiple todos', async () => {
    // Add multiple todos
    await harness.run(['todo', 'add', 'First todo']);
    await harness.run(['todo', 'add', 'Second todo']);
    await harness.run(['todo', 'add', 'Third todo']);

    // List all todos with plain flag
    const result = await harness.run(['todo', 'list', '--plain']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('First todo');
    expect(result.stdout).toContain('Second todo');
    expect(result.stdout).toContain('Third todo');

    // Verify all todos are in the same file (same day)
    const todoFiles = harness.listFiles('todos');
    expect(todoFiles.length).toBe(1); // All todos should be in one file for today
  });

  it('should add todo with priority', async () => {
    const result = await harness.run([
      'todo',
      'add',
      'High priority task',
      '--priority',
      '1',
    ]);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Todo added');

    // Verify the todo file contains the priority
    const todoFiles = harness.listFiles('todos');
    expect(todoFiles.length).toBeGreaterThan(0);

    const todoFile = todoFiles[0];
    const content = harness.readFile(`todos/${todoFile}`);
    expect(content).toContain('High priority task');
    expect(content).toContain('priority: 1');
  });
});
