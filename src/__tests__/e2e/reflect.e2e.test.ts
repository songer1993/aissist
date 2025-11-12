/**
 * E2E Tests for Reflection
 *
 * Tests the reflection show functionality.
 * Note: The reflect command is interactive by default, so we test
 * the show subcommand and manually create reflection files for testing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { CliTestHarness } from '../helpers/cli-test-harness.js';

describe('Reflect E2E', () => {
  let harness: CliTestHarness;

  beforeEach(async () => {
    harness = new CliTestHarness({ mockClaudeCli: true });
    await harness.setup();
  });

  afterEach(async () => {
    await harness.teardown();
  });

  it('should show reflections from file', async () => {
    // Manually create a reflection file
    const reflectionsDir = join(harness.getStoragePath(), 'reflections');
    mkdirSync(reflectionsDir, { recursive: true });

    const today = new Date().toISOString().split('T')[0];
    const reflectionPath = join(reflectionsDir, `${today}.md`);

    writeFileSync(reflectionPath, `---
timestamp: 09:00
goal: null
---

### What went well today?

Made great progress on testing infrastructure

### What could have gone better?

Could have started earlier
`);

    // Show reflections
    const result = await harness.run(['reflect', 'show']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Made great progress');
    expect(result.stdout).toContain('Could have started earlier');
  });

  it('should show reflections for specific date', async () => {
    // Manually create a reflection file for a past date
    const reflectionsDir = join(harness.getStoragePath(), 'reflections');
    mkdirSync(reflectionsDir, { recursive: true });

    const reflectionPath = join(reflectionsDir, '2025-01-01.md');

    writeFileSync(reflectionPath, `---
timestamp: 10:00
goal: null
---

New year reflection - setting goals for 2025
`);

    // Show reflections for specific date
    const result = await harness.run(['reflect', 'show', '--date', '2025-01-01']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('New year reflection');
  });

  it('should handle missing reflections gracefully', async () => {
    // Try to show reflections when none exist
    const result = await harness.run(['reflect', 'show', '--date', '2025-01-15']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('No reflections found');
  });

  it('should show reflections with goal references', async () => {
    // Manually create a reflection file with goal reference
    const reflectionsDir = join(harness.getStoragePath(), 'reflections');
    mkdirSync(reflectionsDir, { recursive: true });

    const today = new Date().toISOString().split('T')[0];
    const reflectionPath = join(reflectionsDir, `${today}.md`);

    writeFileSync(reflectionPath, `---
timestamp: 14:00
goal: test-goal-123
---

Made progress on test-goal-123 today. Feeling confident about completion.
`);

    // Show reflections
    const result = await harness.run(['reflect', 'show']);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('test-goal-123');
    expect(result.stdout).toContain('Feeling confident');
  });
});
