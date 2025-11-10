import { describe, it, expect } from 'vitest';
import {
  serializeContextItemEntryYaml,
  parseContextItemEntryYaml,
  parseContextItemEntryAuto,
  type ContextItemEntry,
} from './storage.js';

describe('Context YAML serialization', () => {
  it('should serialize context with schema_version and source', () => {
    const context: ContextItemEntry = {
      timestamp: '14:30',
      source: 'Meeting',
      text: 'Discussed project architecture with the team',
      goal: null,
      rawEntry: '',
    };

    const serialized = serializeContextItemEntryYaml(context);

    expect(serialized).toContain('---');
    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "14:30"');
    expect(serialized).toContain('source: Meeting');
    expect(serialized).not.toContain('goal');
    expect(serialized).toContain('Discussed project architecture with the team');
  });

  it('should serialize context with goal link', () => {
    const context: ContextItemEntry = {
      timestamp: '10:30',
      source: 'Documentation',
      text: 'API design guidelines from internal wiki',
      goal: 'design-api',
      rawEntry: '',
    };

    const serialized = serializeContextItemEntryYaml(context);

    expect(serialized).toContain('schema_version: "1.0"');
    expect(serialized).toContain('timestamp: "10:30"');
    expect(serialized).toContain('source: Documentation');
    expect(serialized).toContain('goal: design-api');
    expect(serialized).toContain('API design guidelines from internal wiki');
  });

  it('should serialize context with various source types', () => {
    const sources = ['Text', 'Meeting', 'Documentation', 'Email', 'Slack', 'Custom Source'];

    sources.forEach(source => {
      const context: ContextItemEntry = {
        timestamp: '10:30',
        source,
        text: `Context from ${source}`,
        goal: null,
        rawEntry: '',
      };

      const serialized = serializeContextItemEntryYaml(context);

      expect(serialized).toContain(`source: ${source}`);
      expect(serialized).toContain(`Context from ${source}`);
    });
  });

  it('should parse YAML context entry with all fields', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
source: Meeting
goal: test-goal
---

Meeting notes about project planning`;

    const parsed = parseContextItemEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.source).toBe('Meeting');
    expect(parsed!.text).toBe('Meeting notes about project planning');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should parse YAML context without goal', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:30"
source: Documentation
---

General technical documentation`;

    const parsed = parseContextItemEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.source).toBe('Documentation');
    expect(parsed!.text).toBe('General technical documentation');
    expect(parsed!.goal).toBeNull();
  });

  it('should default to "Text" source when missing', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:30"
---

Context without explicit source`;

    const parsed = parseContextItemEntryYaml(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.source).toBe('Text');
  });

  it('should auto-detect YAML format', () => {
    const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
source: Meeting
goal: test-goal
---

YAML formatted context`;

    const parsed = parseContextItemEntryAuto(yamlEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('14:30');
    expect(parsed!.source).toBe('Meeting');
    expect(parsed!.text).toBe('YAML formatted context');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should auto-detect inline format for backward compatibility', () => {
    const inlineEntry = `## 10:30

**Source:** Meeting

Inline formatted context

Goal: test-goal`;

    const parsed = parseContextItemEntryAuto(inlineEntry);

    expect(parsed).not.toBeNull();
    expect(parsed!.timestamp).toBe('10:30');
    expect(parsed!.source).toBe('Meeting');
    expect(parsed!.text).toBe('Inline formatted context');
    expect(parsed!.goal).toBe('test-goal');
  });

  it('should round-trip serialize and parse correctly', () => {
    const original: ContextItemEntry = {
      timestamp: '15:45',
      source: 'Email',
      text: 'Important feedback from stakeholder\nRequests for additional features',
      goal: 'gather-requirements',
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

  it('should handle multiline context text', () => {
    const context: ContextItemEntry = {
      timestamp: '14:30',
      source: 'Meeting',
      text: 'Line 1: Introduction\nLine 2: Main points\nLine 3: Action items\nLine 4: Conclusion',
      goal: 'project-planning',
      rawEntry: '',
    };

    const serialized = serializeContextItemEntryYaml(context);
    const parsed = parseContextItemEntryYaml(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe(context.text);
  });
});
