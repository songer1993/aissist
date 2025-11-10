import { describe, it, expect } from 'vitest';
import {
  parseGoalEntry,
  parseGoalEntries,
  serializeGoalEntryYaml,
  parseGoalEntryYaml,
  parseGoalEntryAuto,
  type GoalEntry,
} from './storage.js';

describe('parseGoalEntry', () => {
  it('should parse goal with codename and deadline', () => {
    const entry = `## 14:30 - complete-project-proposal

Complete project proposal

Deadline: 2025-11-15`;

    const result = parseGoalEntry(entry);

    expect(result).toEqual({
      timestamp: '14:30',
      codename: 'complete-project-proposal',
      text: 'Complete project proposal',
      description: null,
      deadline: '2025-11-15',
      rawEntry: entry,
    });
  });

  it('should parse goal with codename but no deadline', () => {
    const entry = `## 14:30 - launch-mvp

Launch MVP to production`;

    const result = parseGoalEntry(entry);

    expect(result).toEqual({
      timestamp: '14:30',
      codename: 'launch-mvp',
      text: 'Launch MVP to production',
      description: null,
      deadline: null,
      rawEntry: entry,
    });
  });

  it('should parse legacy goal without codename', () => {
    const entry = `## 14:30

Complete project proposal`;

    const result = parseGoalEntry(entry);

    expect(result).toEqual({
      timestamp: '14:30',
      codename: null,
      text: 'Complete project proposal',
      description: null,
      deadline: null,
      rawEntry: entry,
    });
  });

  it('should parse goal with multiline text', () => {
    const entry = `## 14:30 - complex-task

This is a complex task
with multiple lines
and details`;

    const result = parseGoalEntry(entry);

    expect(result).toEqual({
      timestamp: '14:30',
      codename: 'complex-task',
      text: 'This is a complex task\nwith multiple lines\nand details',
      description: null,
      deadline: null,
      rawEntry: entry,
    });
  });

  it('should handle empty or invalid entries', () => {
    expect(parseGoalEntry('')).toBeNull();
    expect(parseGoalEntry('   ')).toBeNull();
    expect(parseGoalEntry('Not a goal entry')).toBeNull();
  });

  it('should parse goal with numeric codename suffix', () => {
    const entry = `## 09:00 - project-proposal-2

Second project proposal`;

    const result = parseGoalEntry(entry);

    expect(result?.codename).toBe('project-proposal-2');
  });
});

describe('parseGoalEntries', () => {
  it('should parse multiple goal entries', () => {
    const content = `## 09:00 - first-goal

First goal text

## 14:30 - second-goal

Second goal text

Deadline: 2025-11-20`;

    const results = parseGoalEntries(content);

    expect(results).toHaveLength(2);
    expect(results[0].codename).toBe('first-goal');
    expect(results[0].deadline).toBeNull();
    expect(results[1].codename).toBe('second-goal');
    expect(results[1].deadline).toBe('2025-11-20');
  });

  it('should handle mixed legacy and new format goals', () => {
    const content = `## 09:00

Legacy goal without codename

## 14:30 - new-goal

New goal with codename`;

    const results = parseGoalEntries(content);

    expect(results).toHaveLength(2);
    expect(results[0].codename).toBeNull();
    expect(results[1].codename).toBe('new-goal');
  });

  it('should handle empty content', () => {
    expect(parseGoalEntries('')).toEqual([]);
    expect(parseGoalEntries('   ')).toEqual([]);
  });

  it('should filter out invalid entries', () => {
    const content = `## 09:00 - valid-goal

Valid goal

This is not a valid goal entry

## 14:30 - another-valid

Another valid goal`;

    const results = parseGoalEntries(content);

    expect(results).toHaveLength(2);
    expect(results[0].codename).toBe('valid-goal');
    expect(results[1].codename).toBe('another-valid');
  });
});

describe('Goal codename format', () => {
  it('should accept valid kebab-case codenames', () => {
    const validCodenames = [
      'simple-goal',
      'multi-word-goal',
      'goal-with-numbers-123',
      'a',
      'very-long-codename-with-many-words',
    ];

    validCodenames.forEach(codename => {
      const entry = `## 14:30 - ${codename}\n\nGoal text`;
      const result = parseGoalEntry(entry);
      expect(result?.codename).toBe(codename);
    });
  });
});

describe('Goal descriptions', () => {
  it('should parse goal with single-line description', () => {
    const entry = `## 14:30 - project-task

Complete the project

> This is a detailed description

Deadline: 2025-11-15`;

    const result = parseGoalEntry(entry);

    expect(result).toEqual({
      timestamp: '14:30',
      codename: 'project-task',
      text: 'Complete the project',
      description: 'This is a detailed description',
      deadline: '2025-11-15',
      rawEntry: entry,
    });
  });

  it('should parse goal with multiline description', () => {
    const entry = `## 14:30 - complex-project

Launch new feature

> Phase 1: Testing
> Phase 2: Marketing
> Phase 3: Launch`;

    const result = parseGoalEntry(entry);

    expect(result).toEqual({
      timestamp: '14:30',
      codename: 'complex-project',
      text: 'Launch new feature',
      description: 'Phase 1: Testing\nPhase 2: Marketing\nPhase 3: Launch',
      deadline: null,
      rawEntry: entry,
    });
  });

  it('should parse goal with description and no deadline', () => {
    const entry = `## 09:00 - research-task

Research AI models

> Focus on transformer architectures
> Compare performance metrics`;

    const result = parseGoalEntry(entry);

    expect(result?.description).toBe('Focus on transformer architectures\nCompare performance metrics');
    expect(result?.deadline).toBeNull();
  });

  it('should parse goal with description between text and deadline', () => {
    const entry = `## 14:30 - important-task

Complete deliverables

> Include documentation
> Run all tests

Deadline: 2025-12-01`;

    const result = parseGoalEntry(entry);

    expect(result).toEqual({
      timestamp: '14:30',
      codename: 'important-task',
      text: 'Complete deliverables',
      description: 'Include documentation\nRun all tests',
      deadline: '2025-12-01',
      rawEntry: entry,
    });
  });

  it('should handle goals without descriptions (backward compatibility)', () => {
    const entry = `## 10:00 - simple-goal

Just a simple goal text

Deadline: 2025-11-30`;

    const result = parseGoalEntry(entry);

    expect(result?.description).toBeNull();
    expect(result?.text).toBe('Just a simple goal text');
  });

  it('should handle empty description blockquotes', () => {
    const entry = `## 10:00 - goal-with-empty-desc

Goal text

>

Deadline: 2025-11-30`;

    const result = parseGoalEntry(entry);

    // Empty blockquote should result in empty string, which will be treated as no description
    expect(result?.description).toBe('');
  });
});

describe('parseGoalEntries with descriptions', () => {
  it('should parse multiple goals with and without descriptions', () => {
    const content = `## 09:00 - first-goal

First goal text

> First description

## 14:30 - second-goal

Second goal text

Deadline: 2025-11-20`;

    const results = parseGoalEntries(content);

    expect(results).toHaveLength(2);
    expect(results[0].description).toBe('First description');
    expect(results[1].description).toBeNull();
  });

  it('should handle complex mix of legacy and new format with descriptions', () => {
    const content = `## 09:00

Legacy goal without codename

## 10:30 - goal-with-desc

Modern goal

> With description

## 14:30 - simple-modern

Simple modern goal`;

    const results = parseGoalEntries(content);

    expect(results).toHaveLength(3);
    expect(results[0].description).toBeNull();
    expect(results[1].description).toBe('With description');
    expect(results[2].description).toBeNull();
  });
});

describe('Goal YAML serialization', () => {
  it('should serialize goal with schema_version and all fields', () => {
    const goal: GoalEntry = {
      timestamp: '14:30',
      codename: 'test-goal',
      text: 'Complete the test implementation',
      description: 'Add comprehensive test coverage',
      deadline: '2025-12-31',
      rawEntry: '',
    };

    const serialized = serializeGoalEntryYaml(goal);

    expect(serialized).toContain('---');
    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "14:30"');
    expect(serialized).toContain('codename: test-goal');
    expect(serialized).toContain('deadline: "2025-12-31"');
    expect(serialized).toContain('description: Add comprehensive test coverage');
    expect(serialized).toContain('Complete the test implementation');
  });

  it('should serialize goal without optional fields', () => {
    const goal: GoalEntry = {
      timestamp: '10:30',
      codename: 'simple-goal',
      text: 'Simple goal text',
      description: null,
      deadline: null,
      rawEntry: '',
    };

    const serialized = serializeGoalEntryYaml(goal);

    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "10:30"');
    expect(serialized).toContain('codename: simple-goal');
    expect(serialized).not.toContain('deadline');
    expect(serialized).not.toContain('description');
    expect(serialized).toContain('Simple goal text');
  });

  it('should parse YAML goal entry with all fields', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
codename: test-goal
deadline: "2025-12-31"
description: Test description
---

Goal text content`;

    const parsed = parseGoalEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.codename).toBe('test-goal');
    expect(parsed!.text).toBe('Goal text content');
    expect(parsed!.deadline).toBe('2025-12-31');
    expect(parsed!.description).toBe('Test description');
  });

  it('should parse YAML goal with missing schema_version', () => {
    const yamlEntry = `---
timestamp: "10:30"
codename: no-version-goal
---

Goal without explicit schema version`;

    const parsed = parseGoalEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.codename).toBe('no-version-goal');
    expect(parsed!.text).toBe('Goal without explicit schema version');
  });

  it('should auto-detect YAML format', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
codename: yaml-goal
---

YAML formatted goal`;

    const parsed = parseGoalEntryAuto(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.codename).toBe('yaml-goal');
    expect(parsed!.text).toBe('YAML formatted goal');
  });

  it('should auto-detect inline format for backward compatibility', () => {
    const inlineEntry = `## 10:30 - inline-goal

Inline formatted goal`;

    const parsed = parseGoalEntryAuto(inlineEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.codename).toBe('inline-goal');
    expect(parsed!.text).toBe('Inline formatted goal');
  });

  it('should round-trip serialize and parse correctly', () => {
    const original: GoalEntry = {
      timestamp: '15:45',
      codename: 'round-trip-goal',
      text: 'Test round-trip serialization',
      description: 'Ensure no data loss',
      deadline: '2025-11-15',
      rawEntry: '',
    };

    const serialized = serializeGoalEntryYaml(original);
    const parsed = parseGoalEntryYaml(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe(original.timestamp);
    expect(parsed!.codename).toBe(original.codename);
    expect(parsed!.text).toBe(original.text);
    expect(parsed!.description).toBe(original.description);
    expect(parsed!.deadline).toBe(original.deadline);
  });
});
