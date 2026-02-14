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
import * as fs from 'fs';
import * as path from 'path';
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

    // Show context for today's date
    const today = new Date().toISOString().split('T')[0];
    const result = await harness.run(['context', 'show', 'work', '--date', today]);

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

    // Show context in a separate command using --date for today
    const today = new Date().toISOString().split('T')[0];
    const result = await harness.run(['context', 'show', 'personal', '--date', today]);

    harness.expectSuccess(result);
    expect(result.stdout).toContain('Persistent context item');
  });

  it('should handle multiple context items', async () => {
    // Add multiple context items
    await harness.run(['context', 'log', 'project', 'First context']);
    await harness.run(['context', 'log', 'project', 'Second context']);
    await harness.run(['context', 'log', 'project', 'Third context']);

    // Show all context for today
    const today = new Date().toISOString().split('T')[0];
    const result = await harness.run(['context', 'show', 'project', '--date', today]);

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

  it('should list entity and date files when no flags provided', async () => {
    const storagePath = harness.getStoragePath();
    const contextDir = path.join(storagePath, 'context', 'people');
    fs.mkdirSync(contextDir, { recursive: true });

    // Create entity files
    fs.writeFileSync(path.join(contextDir, 'per-ola-kristensson.md'), '# Per Ola Kristensson\nPhD Supervisor');
    fs.writeFileSync(path.join(contextDir, 'john-dudley.md'), '# John Dudley\nCollaborator');

    // Create a date file
    fs.writeFileSync(path.join(contextDir, '2026-02-14.md'), '## Meeting notes');

    const result = await harness.run(['context', 'show', 'people']);
    harness.expectSuccess(result);

    // Should show entity files
    expect(result.stdout).toContain('Entities:');
    expect(result.stdout).toContain('per-ola-kristensson');
    expect(result.stdout).toContain('john-dudley');

    // Should show date entries
    expect(result.stdout).toContain('Date entries:');
    expect(result.stdout).toContain('2026-02-14');
  });

  it('should show entity file content with --entity flag', async () => {
    const storagePath = harness.getStoragePath();
    const contextDir = path.join(storagePath, 'context', 'people');
    fs.mkdirSync(contextDir, { recursive: true });

    // Create an entity file
    fs.writeFileSync(path.join(contextDir, 'per-ola-kristensson.md'), '# Per Ola Kristensson\nPhD Supervisor at Cambridge');

    const result = await harness.run(['context', 'show', 'people', '--entity', 'per-ola-kristensson']);
    harness.expectSuccess(result);

    expect(result.stdout).toContain('Per Ola Kristensson');
    expect(result.stdout).toContain('PhD Supervisor at Cambridge');
  });

  it('should show info message for non-existent entity', async () => {
    const storagePath = harness.getStoragePath();
    const contextDir = path.join(storagePath, 'context', 'people');
    fs.mkdirSync(contextDir, { recursive: true });

    const result = await harness.run(['context', 'show', 'people', '--entity', 'nonexistent']);
    harness.expectSuccess(result);

    expect(result.stdout).toContain('No entity file found');
  });

  it('should list only entities when no date files exist', async () => {
    const storagePath = harness.getStoragePath();
    const contextDir = path.join(storagePath, 'context', 'tools');
    fs.mkdirSync(contextDir, { recursive: true });

    fs.writeFileSync(path.join(contextDir, 'vim.md'), '# Vim\nText editor');

    const result = await harness.run(['context', 'show', 'tools']);
    harness.expectSuccess(result);

    expect(result.stdout).toContain('Entities:');
    expect(result.stdout).toContain('vim');
    expect(result.stdout).not.toContain('Date entries:');
  });

  it('should list only date files when no entity files exist', async () => {
    // Log a context item to create a date file
    await harness.run(['context', 'log', 'meetings', 'Stand-up discussion']);

    const result = await harness.run(['context', 'show', 'meetings']);
    harness.expectSuccess(result);

    expect(result.stdout).toContain('Date entries:');
    expect(result.stdout).not.toContain('Entities:');
  });

  describe('context query', () => {
    it('should find entries by kind', async () => {
      const storagePath = harness.getStoragePath();

      // Create entity files with frontmatter
      const peopleDir = path.join(storagePath, 'context', 'people');
      fs.mkdirSync(peopleDir, { recursive: true });

      fs.writeFileSync(
        path.join(peopleDir, 'alice.md'),
        '---\nkind: contact\nrole: Engineer\n---\nAlice is a software engineer'
      );
      fs.writeFileSync(
        path.join(peopleDir, 'bob.md'),
        '---\nkind: contact\nrole: Designer\n---\nBob is a product designer'
      );
      fs.writeFileSync(
        path.join(peopleDir, 'meeting-notes.md'),
        '---\nkind: note\n---\nStandup meeting notes'
      );

      const result = await harness.run(['context', 'query', '--kind', 'contact']);
      harness.expectSuccess(result);

      expect(result.stdout).toContain('Found 2 matching entries:');
      expect(result.stdout).toContain('people/alice [contact]');
      expect(result.stdout).toContain('people/bob [contact]');
      expect(result.stdout).not.toContain('meeting-notes');
    });

    it('should filter by kind and field value', async () => {
      const storagePath = harness.getStoragePath();

      const emailsDir = path.join(storagePath, 'context', 'emails');
      fs.mkdirSync(emailsDir, { recursive: true });

      fs.writeFileSync(
        path.join(emailsDir, 'email-phd.md'),
        '---\nkind: email\nproject: my-project\n---\nEmail about the project'
      );
      fs.writeFileSync(
        path.join(emailsDir, 'email-other.md'),
        '---\nkind: email\nproject: other-project\n---\nEmail about something else'
      );
      fs.writeFileSync(
        path.join(emailsDir, 'note.md'),
        '---\nkind: note\nproject: my-project\n---\nJust a note'
      );

      const result = await harness.run([
        'context', 'query',
        '--kind', 'email',
        '--field', 'project=my-project',
      ]);
      harness.expectSuccess(result);

      expect(result.stdout).toContain('Found 1 matching entries:');
      expect(result.stdout).toContain('emails/email-phd [email]');
      expect(result.stdout).not.toContain('email-other');
      expect(result.stdout).not.toContain('note [note]');
    });

    it('should limit search to a specific context subcategory', async () => {
      const storagePath = harness.getStoragePath();

      const peopleDir = path.join(storagePath, 'context', 'people');
      const toolsDir = path.join(storagePath, 'context', 'tools');
      fs.mkdirSync(peopleDir, { recursive: true });
      fs.mkdirSync(toolsDir, { recursive: true });

      fs.writeFileSync(
        path.join(peopleDir, 'alice.md'),
        '---\nkind: contact\n---\nAlice the person'
      );
      fs.writeFileSync(
        path.join(toolsDir, 'vim.md'),
        '---\nkind: tool\n---\nVim text editor'
      );

      const result = await harness.run(['context', 'query', '--context', 'people']);
      harness.expectSuccess(result);

      expect(result.stdout).toContain('Found 1 matching entries:');
      expect(result.stdout).toContain('people/alice');
      expect(result.stdout).not.toContain('vim');
    });

    it('should show message when no entries match', async () => {
      const storagePath = harness.getStoragePath();

      const peopleDir = path.join(storagePath, 'context', 'people');
      fs.mkdirSync(peopleDir, { recursive: true });

      fs.writeFileSync(
        path.join(peopleDir, 'alice.md'),
        '---\nkind: contact\n---\nAlice'
      );

      const result = await harness.run(['context', 'query', '--kind', 'trade']);
      harness.expectSuccess(result);

      expect(result.stdout).toContain('No matching entries found.');
    });
  });
});
