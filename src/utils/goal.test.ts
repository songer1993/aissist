import { describe, it, expect } from 'vitest';
import { parseGoalEntry, parseGoalEntries } from './storage.js';

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
