import { describe, it, expect } from 'vitest';
import {
  serializeGoalEntryYaml,
  parseGoalEntryYaml,
  parseGoalEntries,
  serializeHistoryItemEntryYaml,
  parseHistoryItemEntryYaml,
  parseHistoryItemEntries,
  serializeTodoEntryYaml,
  parseTodoEntryYaml,
  parseTodoEntries,
  serializeContextItemEntryYaml,
  parseContextItemEntryYaml,
  parseContextItemEntries,
  serializeReflectionEntryYaml,
  parseReflectionEntryYaml,
  parseReflectionEntries,
  type GoalEntry,
  type HistoryItemEntry,
  type TodoEntry,
  type ContextItemEntry,
  type ReflectionEntry,
} from './storage.js';

describe('Storage YAML Integration Tests', () => {
  describe('Format detection', () => {
    it('should parse file with only YAML goal entries', () => {
      const content = `---
schema_version: "1.0"
timestamp: "10:30"
codename: yaml-goal-1
---

First YAML formatted goal

---
schema_version: "1.0"
timestamp: "14:30"
codename: yaml-goal-2
---

Second YAML formatted goal`;

      const entries = parseGoalEntries(content);

      expect(entries).toHaveLength(2);
      expect(entries[0].codename).toBe('yaml-goal-1');
      expect(entries[0].text).toBe('First YAML formatted goal');
      expect(entries[1].codename).toBe('yaml-goal-2');
      expect(entries[1].text).toBe('Second YAML formatted goal');
    });

    it('should parse file with only inline goal entries', () => {
      const content = `## 10:30 - inline-goal-1

First inline formatted goal

## 14:30 - inline-goal-2

Second inline formatted goal`;

      const entries = parseGoalEntries(content);

      expect(entries).toHaveLength(2);
      expect(entries[0].codename).toBe('inline-goal-1');
      expect(entries[0].text).toBe('First inline formatted goal');
      expect(entries[1].codename).toBe('inline-goal-2');
      expect(entries[1].text).toBe('Second inline formatted goal');
    });
  });

  describe('Round-trip workflows', () => {
    it('should round-trip goal with all fields', () => {
      const original: GoalEntry = {
        timestamp: '14:30',
        codename: 'test-goal',
        text: 'Complete integration tests',
        description: 'Add comprehensive test coverage',
        deadline: '2025-12-31',
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

    it('should round-trip history with goal link', () => {
      const original: HistoryItemEntry = {
        timestamp: '10:30',
        text: 'Completed code review',
        goal: 'review-pr',
        rawEntry: '',
      };

      const serialized = serializeHistoryItemEntryYaml(original);
      const parsed = parseHistoryItemEntryYaml(serialized);

      expect(parsed).not.toBeNull();
      expect(parsed!.timestamp).toBe(original.timestamp);
      expect(parsed!.text).toBe(original.text);
      expect(parsed!.goal).toBe(original.goal);
    });

    it('should round-trip todo with priority', () => {
      const original: TodoEntry = {
        timestamp: '14:30',
        text: 'Write documentation',
        completed: false,
        goal: 'docs-goal',
        priority: 3,
        rawEntry: '',
      };

      const serialized = serializeTodoEntryYaml(original);
      const parsed = parseTodoEntryYaml(serialized);

      expect(parsed).not.toBeNull();
      expect(parsed!.timestamp).toBe(original.timestamp);
      expect(parsed!.text).toBe(original.text);
      expect(parsed!.completed).toBe(original.completed);
      expect(parsed!.goal).toBe(original.goal);
      expect(parsed!.priority).toBe(original.priority);
    });

    it('should round-trip context with source', () => {
      const original: ContextItemEntry = {
        timestamp: '14:30',
        source: 'Email',
        text: 'Stakeholder feedback',
        goal: 'requirements-goal',
        rawEntry: '',
      };

      const serialized = serializeContextItemEntryYaml(original);
      const parsed = parseContextItemEntryYaml(serialized);

      expect(parsed).not.toBeNull();
      expect(parsed!.timestamp).toBe(original.timestamp);
      expect(parsed!.source).toBe(original.source);
      expect(parsed!.text).toBe(original.text);
      expect(parsed!.goal).toBe(original.goal);
    });

    it('should round-trip reflection', () => {
      const original: ReflectionEntry = {
        timestamp: '17:00',
        text: 'Daily reflection on progress',
        goal: 'continuous-improvement',
        rawEntry: '',
      };

      const serialized = serializeReflectionEntryYaml(original);
      const parsed = parseReflectionEntryYaml(serialized);

      expect(parsed).not.toBeNull();
      expect(parsed!.timestamp).toBe(original.timestamp);
      expect(parsed!.text).toBe(original.text);
      expect(parsed!.goal).toBe(original.goal);
    });
  });

  describe('Schema version preservation', () => {
    it('should preserve schema version through goal round-trip', () => {
      const goal: GoalEntry = {
        timestamp: '10:30',
        codename: 'test-goal',
        text: 'Test goal',
        description: null,
        deadline: null,
        rawEntry: '',
      };

      const serialized = serializeGoalEntryYaml(goal);
      expect(serialized).toContain('schema_version: "1.0"');

      const parsed = parseGoalEntryYaml(serialized);
      expect(parsed).not.toBeNull();

      const reserialized = serializeGoalEntryYaml(parsed!);
      expect(reserialized).toContain('schema_version: "1.0"');
    });

    it('should preserve schema version through history round-trip', () => {
      const history: HistoryItemEntry = {
        timestamp: '10:30',
        text: 'Test history',
        goal: null,
        rawEntry: '',
      };

      const serialized = serializeHistoryItemEntryYaml(history);
      expect(serialized).toContain('schema_version: "1.0"');

      const parsed = parseHistoryItemEntryYaml(serialized);
      expect(parsed).not.toBeNull();

      const reserialized = serializeHistoryItemEntryYaml(parsed!);
      expect(reserialized).toContain('schema_version: "1.0"');
    });

    it('should preserve schema version through todo round-trip', () => {
      const todo: TodoEntry = {
        timestamp: '10:30',
        text: 'Test todo',
        completed: false,
        goal: null,
        priority: 0,
        rawEntry: '',
      };

      const serialized = serializeTodoEntryYaml(todo);
      expect(serialized).toContain('schema_version: "1.0"');

      const parsed = parseTodoEntryYaml(serialized);
      expect(parsed).not.toBeNull();

      const reserialized = serializeTodoEntryYaml(parsed!);
      expect(reserialized).toContain('schema_version: "1.0"');
    });
  });

  describe('Multiple entries in single file', () => {
    it('should parse multiple YAML goal entries', () => {
      const content = `---
schema_version: "1.0"
timestamp: "10:30"
codename: goal-1
---

First goal

---
schema_version: "1.0"
timestamp: "14:30"
codename: goal-2
---

Second goal

---
schema_version: "1.0"
timestamp: "16:00"
codename: goal-3
---

Third goal`;

      const entries = parseGoalEntries(content);

      expect(entries).toHaveLength(3);
      expect(entries[0].codename).toBe('goal-1');
      expect(entries[1].codename).toBe('goal-2');
      expect(entries[2].codename).toBe('goal-3');
    });

    it('should maintain entry boundaries with complex content', () => {
      const content = `---
schema_version: "1.0"
timestamp: "10:30"
goal: goal-1
---

First history entry
With multiple lines
And special characters: #$%

---
schema_version: "1.0"
timestamp: "14:30"
goal: goal-2
---

Second history entry
Also with multiple lines`;

      const entries = parseHistoryItemEntries(content);

      expect(entries).toHaveLength(2);
      expect(entries[0].text).toContain('With multiple lines');
      expect(entries[0].text).toContain('special characters: #$%');
      expect(entries[1].text).toContain('Also with multiple lines');
    });

    it('should parse large file with 10+ entries', () => {
      const yamlEntries: string[] = [];
      for (let i = 1; i <= 12; i++) {
        yamlEntries.push(`---
schema_version: "1.0"
timestamp: "1${i}:00"
codename: goal-${i}
---

Goal number ${i}`);
      }

      const content = yamlEntries.join('\n\n');
      const entries = parseGoalEntries(content);

      expect(entries).toHaveLength(12);
      expect(entries[0].codename).toBe('goal-1');
      expect(entries[11].codename).toBe('goal-12');
    });
  });

  describe('Backward compatibility scenarios', () => {
    it('should parse legacy inline goal format', () => {
      const content = `## 10:30 - legacy-goal

Legacy goal text

Deadline: 2025-12-31`;

      const entries = parseGoalEntries(content);

      expect(entries).toHaveLength(1);
      expect(entries[0].codename).toBe('legacy-goal');
      expect(entries[0].text).toBe('Legacy goal text');
      expect(entries[0].deadline).toBe('2025-12-31');
    });

    it('should parse legacy inline history format', () => {
      const content = `## 10:30

Legacy history entry

Goal: legacy-goal`;

      const entries = parseHistoryItemEntries(content);

      expect(entries).toHaveLength(1);
      expect(entries[0].text).toBe('Legacy history entry');
      expect(entries[0].goal).toBe('legacy-goal');
    });

    it('should parse legacy inline todo format', () => {
      const content = `## 10:30

- [ ] Legacy todo (Priority: 2) (Goal: legacy-goal)`;

      const entries = parseTodoEntries(content);

      expect(entries).toHaveLength(1);
      expect(entries[0].text).toBe('Legacy todo');
      expect(entries[0].priority).toBe(2);
      expect(entries[0].goal).toBe('legacy-goal');
    });

    it('should not break on missing schema_version in YAML', () => {
      const content = `---
timestamp: "10:30"
codename: no-version-goal
---

Goal without schema version`;

      const entries = parseGoalEntries(content);

      expect(entries).toHaveLength(1);
      expect(entries[0].codename).toBe('no-version-goal');
      expect(entries[0].text).toBe('Goal without schema version');
    });
  });

  describe('Optional field handling', () => {
    it('should handle null optional fields consistently', () => {
      const goal: GoalEntry = {
        timestamp: '10:30',
        codename: 'simple-goal',
        text: 'Simple goal',
        description: null,
        deadline: null,
        rawEntry: '',
      };

      const serialized = serializeGoalEntryYaml(goal);
      expect(serialized).not.toContain('description');
      expect(serialized).not.toContain('deadline');

      const parsed = parseGoalEntryYaml(serialized);
      expect(parsed!.description).toBeNull();
      expect(parsed!.deadline).toBeNull();
    });

    it('should handle present optional fields consistently', () => {
      const goal: GoalEntry = {
        timestamp: '10:30',
        codename: 'detailed-goal',
        text: 'Detailed goal',
        description: 'With description',
        deadline: '2025-12-31',
        rawEntry: '',
      };

      const serialized = serializeGoalEntryYaml(goal);
      expect(serialized).toContain('description: With description');
      expect(serialized).toContain('deadline: "2025-12-31"');

      const parsed = parseGoalEntryYaml(serialized);
      expect(parsed!.description).toBe('With description');
      expect(parsed!.deadline).toBe('2025-12-31');
    });
  });
});
