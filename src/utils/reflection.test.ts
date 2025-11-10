import { describe, it, expect } from 'vitest';
import {
  serializeReflectionEntryYaml,
  parseReflectionEntryYaml,
  parseReflectionEntryAuto,
  type ReflectionEntry,
} from './storage.js';

describe('Reflection YAML serialization', () => {
  it('should serialize reflection with schema_version', () => {
    const reflection: ReflectionEntry = {
      timestamp: '14:30',
      text: 'Today I learned the importance of writing tests early in the development process.',
      goal: null,
      rawEntry: '',
    };

    const serialized = serializeReflectionEntryYaml(reflection);

    expect(serialized).toContain('---');
    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "14:30"');
    expect(serialized).not.toContain('goal');
    expect(serialized).toContain('Today I learned the importance of writing tests early');
  });

  it('should serialize reflection with goal link', () => {
    const reflection: ReflectionEntry = {
      timestamp: '10:30',
      text: 'Reflecting on the code review process - need to be more thorough.',
      goal: 'improve-code-quality',
      rawEntry: '',
    };

    const serialized = serializeReflectionEntryYaml(reflection);

    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "10:30"');
    expect(serialized).toContain('goal: improve-code-quality');
    expect(serialized).toContain('Reflecting on the code review process');
  });

  it('should parse YAML reflection entry with all fields', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
goal: test-goal
---

Deep reflection on today's work and learnings`;

    const parsed = parseReflectionEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.text).toBe('Deep reflection on today\'s work and learnings');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should parse YAML reflection without goal', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:30"
---

General reflection about the week`;

    const parsed = parseReflectionEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.text).toBe('General reflection about the week');
    expect(parsed!.goal).toBeNull();
  });

  it('should parse YAML reflection with missing schema_version', () => {
    const yamlEntry = `---
timestamp: "10:30"
---

Reflection without explicit schema version`;

    const parsed = parseReflectionEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.text).toBe('Reflection without explicit schema version');
  });

  it('should auto-detect YAML format', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
goal: test-goal
---

YAML formatted reflection`;

    const parsed = parseReflectionEntryAuto(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.text).toBe('YAML formatted reflection');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should auto-detect inline format for backward compatibility', () => {
    const inlineEntry = `## Reflection at 10:30

Inline formatted reflection

Goal: test-goal`;

    const parsed = parseReflectionEntryAuto(inlineEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.text).toBe('Inline formatted reflection');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should round-trip serialize and parse correctly', () => {
    const original: ReflectionEntry = {
      timestamp: '15:45',
      text: 'Multi-line reflection:\n- Key insight 1\n- Key insight 2\n- Action items for tomorrow',
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

  it('should handle long reflection text', () => {
    const longText = `This is a very long reflection that spans multiple paragraphs.

It discusses various aspects of the day's work, including technical challenges, team dynamics, and personal growth.

The reflection includes:
- Detailed analysis of problems encountered
- Solutions that were tried
- Lessons learned
- Plans for future improvement

This kind of in-depth reflection is valuable for continuous learning.`;

    const reflection: ReflectionEntry = {
      timestamp: '17:00',
      text: longText,
      goal: 'daily-learning',
      rawEntry: '',
    };

    const serialized = serializeReflectionEntryYaml(reflection);
    const parsed = parseReflectionEntryYaml(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe(longText);
  });

  it('should handle reflections with special characters', () => {
    const reflection: ReflectionEntry = {
      timestamp: '14:30',
      text: 'Reflection with "quotes", colons:, and other: special characters!',
      goal: null,
      rawEntry: '',
    };

    const serialized = serializeReflectionEntryYaml(reflection);
    const parsed = parseReflectionEntryYaml(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe(reflection.text);
  });
});
