import { describe, it, expect } from 'vitest';
import {
  serializeTodoEntryYaml,
  parseTodoEntryYaml,
  parseTodoEntryAuto,
  type TodoEntry,
} from './storage.js';

describe('Todo YAML serialization', () => {
  it('should serialize todo with schema_version and all fields', () => {
    const todo: TodoEntry = {
      timestamp: '14:30',
      text: 'Complete the test implementation',
      completed: false,
      goal: 'test-goal',
      priority: 3,
      rawEntry: '',
    };

    const serialized = serializeTodoEntryYaml(todo);

    expect(serialized).toContain('---');
    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "14:30"');
    expect(serialized).toContain('completed: false');
    expect(serialized).toContain('priority: 3');
    expect(serialized).toContain('goal: test-goal');
    expect(serialized).toContain('- [ ] Complete the test implementation');
  });

  it('should serialize completed todo with checkbox [x]', () => {
    const todo: TodoEntry = {
      timestamp: '10:30',
      text: 'Completed task',
      completed: true,
      goal: null,
      priority: 0,
      rawEntry: '',
    };

    const serialized = serializeTodoEntryYaml(todo);

    expect(serialized).toContain('completed: true');
    expect(serialized).toContain('- [x] Completed task');
  });

  it('should serialize uncompleted todo with checkbox [ ]', () => {
    const todo: TodoEntry = {
      timestamp: '10:30',
      text: 'Pending task',
      completed: false,
      goal: null,
      priority: 0,
      rawEntry: '',
    };

    const serialized = serializeTodoEntryYaml(todo);

    expect(serialized).toContain('completed: false');
    expect(serialized).toContain('- [ ] Pending task');
  });

  it('should omit priority when zero', () => {
    const todo: TodoEntry = {
      timestamp: '10:30',
      text: 'Simple todo',
      completed: false,
      goal: null,
      priority: 0,
      rawEntry: '',
    };

    const serialized = serializeTodoEntryYaml(todo);

    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).not.toContain('priority');
  });

  it('should omit goal when null', () => {
    const todo: TodoEntry = {
      timestamp: '10:30',
      text: 'Simple todo',
      completed: false,
      goal: null,
      priority: 0,
      rawEntry: '',
    };

    const serialized = serializeTodoEntryYaml(todo);

    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).not.toContain('goal');
  });

  it('should parse YAML todo entry with all fields', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
completed: false
priority: 3
goal: test-goal
---

- [ ] Complete the task`;

    const parsed = parseTodoEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.text).toBe('Complete the task');
    expect(parsed!.completed).toBe(false);
    expect(parsed!.priority).toBe(3);
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should parse YAML todo with completed checkbox', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:30"
completed: true
---

- [x] Completed task`;

    const parsed = parseTodoEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.completed).toBe(true);
    expect(parsed!.text).toBe('Completed task');
  });

  it('should parse YAML todo without optional fields', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:30"
completed: false
---

- [ ] Simple todo`;

    const parsed = parseTodoEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.text).toBe('Simple todo');
    expect(parsed!.completed).toBe(false);
    expect(parsed!.priority).toBe(0);
    expect(parsed!.goal).toBeNull();
  });

  it('should auto-detect YAML format', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
completed: false
goal: test-goal
---

- [ ] YAML formatted todo`;

    const parsed = parseTodoEntryAuto(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.text).toBe('YAML formatted todo');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should auto-detect inline format for backward compatibility', () => {
    const inlineEntry = `## 10:30

- [ ] Inline formatted todo (Goal: test-goal)`;

    const parsed = parseTodoEntryAuto(inlineEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.text).toBe('Inline formatted todo');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should round-trip serialize and parse correctly', () => {
    const original: TodoEntry = {
      timestamp: '15:45',
      text: 'Test round-trip serialization',
      completed: false,
      goal: 'test-goal',
      priority: 2,
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

  it('should handle various priority levels', () => {
    const priorities = [0, 1, 2, 3, 4, 5];

    priorities.forEach(priority => {
      const todo: TodoEntry = {
        timestamp: '10:30',
        text: `Priority ${priority} task`,
        completed: false,
        goal: null,
        priority,
        rawEntry: '',
      };

      const serialized = serializeTodoEntryYaml(todo);
      const parsed = parseTodoEntryYaml(serialized);

      expect(parsed).not.toBeNull();
      expect(parsed!.priority).toBe(priority);
    });
  });
});
