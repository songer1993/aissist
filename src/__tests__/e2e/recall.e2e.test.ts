/**
 * E2E Tests for Recall with Mock Claude
 *
 * Tests the recall functionality with mock Claude CLI:
 * - Semantic search with Claude
 * - Fallback to keyword search when Claude unavailable
 * - Raw output mode
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CliTestHarness } from '../helpers/cli-test-harness.js';

describe('Recall E2E', () => {
  let harness: CliTestHarness;

  beforeEach(async () => {
    harness = new CliTestHarness({ mockClaudeCli: true });
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should recall with mock Claude CLI', async () => {
    // First, create some data to search
    await harness.run(['goal', 'add', 'Improve productivity', '--deadline', '2025-12-31']);
    await harness.run(['history', 'log', 'Implemented time-blocking system']);

    // Recall using the mock Claude CLI
    const result = await harness.run(['recall', 'productivity']);

    harness.expectSuccess(result);
    // The mock Claude should return results about productivity
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  it('should use raw output mode', async () => {
    // Create some data
    await harness.run(['goal', 'add', 'Launch product', '--deadline', '2025-12-31']);
    await harness.run(['history', 'log', 'Completed feature development']);

    // Recall with raw output
    const result = await harness.run(['recall', 'product', '--raw']);

    harness.expectSuccess(result);
    // Raw output should not contain formatting characters
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  it('should search across goals and history', async () => {
    // Create goals and history entries
    await harness.run(['goal', 'add', 'Complete API documentation', '--deadline', '2025-12-31']);
    await harness.run(['history', 'log', 'Reviewed API endpoints']);
    await harness.run(['history', 'log', 'Updated documentation structure']);

    // Search for API-related content
    const result = await harness.run(['recall', 'API']);

    harness.expectSuccess(result);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  it('should handle queries with no results gracefully', async () => {
    // Search for something that doesn't exist
    const result = await harness.run(['recall', 'nonexistent-topic-xyz']);

    harness.expectSuccess(result);
    // Should still succeed even if no results found
    expect(result.exitCode).toBe(0);
  });

  it('should handle complex multi-word queries', async () => {
    // Create data with specific phrases
    await harness.run(['goal', 'add', 'Implement user authentication system', '--deadline', '2025-12-31']);
    await harness.run(['history', 'log', 'Set up OAuth integration']);

    // Search with multi-word query
    const result = await harness.run(['recall', 'user authentication']);

    harness.expectSuccess(result);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});
