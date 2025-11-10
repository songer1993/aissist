import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  appendToMarkdown,
  readMarkdown,
  getActiveGoals,
  serializeHistoryItemEntryYaml,
  parseHistoryItemEntryYaml,
  parseHistoryItemEntryAuto,
  type HistoryItemEntry,
} from './storage';

describe('history goal linking', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique test directory in tmp
    testDir = join(tmpdir(), `aissist-test-history-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('history entry format', () => {
    it('should create history entry without goal link', async () => {
      const historyDir = join(testDir, 'history');
      await mkdir(historyDir);

      const filePath = join(historyDir, '2025-11-04.md');
      const entry = `## 10:30\n\nCompleted code review`;

      await appendToMarkdown(filePath, entry);

      const content = await readMarkdown(filePath);
      expect(content).toBe(entry);
      expect(content).not.toContain('Goal:');
    });

    it('should create history entry with goal link', async () => {
      const historyDir = join(testDir, 'history');
      await mkdir(historyDir);

      const filePath = join(historyDir, '2025-11-04.md');
      const entry = `## 10:30\n\nCompleted code review\n\nGoal: review-pr`;

      await appendToMarkdown(filePath, entry);

      const content = await readMarkdown(filePath);
      expect(content).toBe(entry);
      expect(content).toContain('Goal: review-pr');
    });

    it('should preserve multiline history entries with goal link', async () => {
      const historyDir = join(testDir, 'history');
      await mkdir(historyDir);

      const filePath = join(historyDir, '2025-11-04.md');
      const entry = `## 10:30\n\nCompleted code review\nFound 3 issues\nRecommended changes\n\nGoal: review-pr`;

      await appendToMarkdown(filePath, entry);

      const content = await readMarkdown(filePath);
      expect(content).toBe(entry);
      expect(content).toContain('Goal: review-pr');
      expect(content).toContain('Found 3 issues');
    });

    it('should append multiple history entries with different goal links', async () => {
      const historyDir = join(testDir, 'history');
      await mkdir(historyDir);

      const filePath = join(historyDir, '2025-11-04.md');
      const entry1 = `## 10:30\n\nCompleted code review\n\nGoal: review-pr`;
      const entry2 = `## 14:00\n\nFixed bug in authentication\n\nGoal: fix-auth-bug`;

      await appendToMarkdown(filePath, entry1);
      await appendToMarkdown(filePath, entry2);

      const content = await readMarkdown(filePath);
      expect(content).toContain('Goal: review-pr');
      expect(content).toContain('Goal: fix-auth-bug');
      expect(content).toContain('10:30');
      expect(content).toContain('14:00');
    });

    it('should allow some entries with goal links and some without', async () => {
      const historyDir = join(testDir, 'history');
      await mkdir(historyDir);

      const filePath = join(historyDir, '2025-11-04.md');
      const entry1 = `## 10:30\n\nCompleted code review\n\nGoal: review-pr`;
      const entry2 = `## 12:00\n\nLunch meeting with team`;
      const entry3 = `## 14:00\n\nFixed bug\n\nGoal: fix-bug`;

      await appendToMarkdown(filePath, entry1);
      await appendToMarkdown(filePath, entry2);
      await appendToMarkdown(filePath, entry3);

      const content = await readMarkdown(filePath);
      expect(content).toContain('Goal: review-pr');
      expect(content).toContain('Lunch meeting');
      expect(content).toContain('Goal: fix-bug');

      // Count goal links
      const goalMatches = content?.match(/Goal: /g);
      expect(goalMatches?.length).toBe(2);
    });
  });

  describe('goal linking integration', () => {
    it('should retrieve active goals for history linking', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goal1 = `## 10:00 - review-pr\n\nReview pull request #123`;
      const goal2 = `## 11:00 - fix-bug\n\nFix authentication bug`;

      await writeFile(join(goalsDir, '2025-11-04.md'), goal1);
      await writeFile(join(goalsDir, '2025-11-03.md'), goal2);

      const activeGoals = await getActiveGoals(testDir);

      expect(activeGoals).toHaveLength(2);
      // Most recent first
      expect(activeGoals[0].codename).toBe('review-pr');
      expect(activeGoals[0].date).toBe('2025-11-04');
      expect(activeGoals[1].codename).toBe('fix-bug');
      expect(activeGoals[1].date).toBe('2025-11-03');
    });

    it('should link history to goals that exist', async () => {
      // Setup goals
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const goal = `## 10:00 - review-pr\n\nReview pull request #123`;
      await writeFile(join(goalsDir, '2025-11-04.md'), goal);

      // Verify goal exists
      const activeGoals = await getActiveGoals(testDir);
      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].codename).toBe('review-pr');

      // Create history entry linked to that goal
      const historyDir = join(testDir, 'history');
      await mkdir(historyDir);

      const filePath = join(historyDir, '2025-11-04.md');
      const entry = `## 14:30\n\nCompleted the review\n\nGoal: review-pr`;

      await appendToMarkdown(filePath, entry);

      // Verify history entry
      const content = await readMarkdown(filePath);
      expect(content).toContain('Goal: review-pr');
      expect(content).toContain('Completed the review');
    });

    it('should handle empty active goals list', async () => {
      const goalsDir = join(testDir, 'goals');
      await mkdir(goalsDir);

      const activeGoals = await getActiveGoals(testDir);
      expect(activeGoals).toEqual([]);

      // History entry without goal link should still work
      const historyDir = join(testDir, 'history');
      await mkdir(historyDir);

      const filePath = join(historyDir, '2025-11-04.md');
      const entry = `## 14:30\n\nCompleted some work`;

      await appendToMarkdown(filePath, entry);

      const content = await readMarkdown(filePath);
      expect(content).toBe(entry);
      expect(content).not.toContain('Goal:');
    });
  });
});

describe('History YAML serialization', () => {
  it('should serialize history with schema_version', () => {
    const history: HistoryItemEntry = {
      timestamp: '14:30',
      text: 'Completed code review for PR #123',
      goal: null,
      rawEntry: '',
    };

    const serialized = serializeHistoryItemEntryYaml(history);

    expect(serialized).toContain('---');
    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "14:30"');
    expect(serialized).not.toContain('goal');
    expect(serialized).toContain('Completed code review for PR #123');
  });

  it('should serialize history with goal link', () => {
    const history: HistoryItemEntry = {
      timestamp: '10:30',
      text: 'Fixed authentication bug',
      goal: 'fix-auth-bug',
      rawEntry: '',
    };

    const serialized = serializeHistoryItemEntryYaml(history);

    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "10:30"');
    expect(serialized).toContain('goal: fix-auth-bug');
    expect(serialized).toContain('Fixed authentication bug');
  });

  it('should parse YAML history entry', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
goal: review-pr
---

Completed the code review`;

    const parsed = parseHistoryItemEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.text).toBe('Completed the code review');
    expect(parsed!.goal).toBe('review-pr');
  });

  it('should parse YAML history without goal', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:30"
---

Attended team meeting`;

    const parsed = parseHistoryItemEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.text).toBe('Attended team meeting');
    expect(parsed!.goal).toBeNull();
  });

  it('should auto-detect YAML format', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
goal: test-goal
---

YAML formatted history entry`;

    const parsed = parseHistoryItemEntryAuto(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.text).toBe('YAML formatted history entry');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should auto-detect inline format for backward compatibility', () => {
    const inlineEntry = `## 10:30

Inline formatted history entry

Goal: test-goal`;

    const parsed = parseHistoryItemEntryAuto(inlineEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.text).toBe('Inline formatted history entry');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should round-trip serialize and parse correctly', () => {
    const original: HistoryItemEntry = {
      timestamp: '15:45',
      text: 'Deployed new feature to production\nVerified all systems operational',
      goal: 'deploy-feature',
      rawEntry: '',
    };

    const serialized = serializeHistoryItemEntryYaml(original);
    const parsed = parseHistoryItemEntryYaml(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe(original.timestamp);
    expect(parsed!.text).toBe(original.text);
    expect(parsed!.goal).toBe(original.goal);
  });
});
