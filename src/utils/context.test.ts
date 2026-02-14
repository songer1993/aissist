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
      kind: null,
      metadata: {},
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
      kind: null,
      metadata: {},
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
        kind: null,
        metadata: {},
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
      kind: null,
      metadata: {},
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
      kind: null,
      metadata: {},
      rawEntry: '',
    };

    const serialized = serializeContextItemEntryYaml(context);
    const parsed = parseContextItemEntryYaml(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe(context.text);
  });

  describe('kind and metadata fields', () => {
    it('should serialize context entry with kind and metadata', () => {
      const context: ContextItemEntry = {
        timestamp: '10:00',
        source: 'Entity',
        text: 'Professor of computational interaction at Cambridge.',
        goal: null,
        kind: 'contact',
        metadata: {
          role: 'PhD Supervisor',
          institution: 'Cambridge',
          email: 'pok21@cam.ac.uk',
        },
        rawEntry: '',
      };

      const serialized = serializeContextItemEntryYaml(context);

      expect(serialized).toContain('kind: contact');
      expect(serialized).toContain('role: PhD Supervisor');
      expect(serialized).toContain('institution: Cambridge');
      expect(serialized).toContain('email: pok21@cam.ac.uk');
      // source 'Entity' should be omitted (it's just a marker)
      expect(serialized).not.toContain('source: Entity');
      expect(serialized).toContain('Professor of computational interaction');
    });

    it('should serialize context entry with kind but omit empty metadata', () => {
      const context: ContextItemEntry = {
        timestamp: '11:00',
        source: 'Entity',
        text: 'A reference note about VR haptics.',
        goal: null,
        kind: 'reference',
        metadata: {},
        rawEntry: '',
      };

      const serialized = serializeContextItemEntryYaml(context);

      expect(serialized).toContain('kind: reference');
      expect(serialized).not.toContain('source: Entity');
    });

    it('should preserve source Entity when kind is null (non-entity entry)', () => {
      const context: ContextItemEntry = {
        timestamp: '14:30',
        source: 'Entity',
        text: 'A regular context entry that happens to have source Entity',
        goal: null,
        kind: null,
        metadata: {},
        rawEntry: '',
      };

      const serialized = serializeContextItemEntryYaml(context);

      // When kind is null, source should be preserved even if it's 'Entity'
      expect(serialized).toContain('source: Entity');
      expect(serialized).not.toContain('kind');
    });

    it('should parse YAML context entry with kind and extra metadata fields', () => {
      const yamlEntry = `---
schema_version: "1.0"
timestamp: "10:00"
kind: contact
role: PhD Supervisor
institution: Cambridge
email: pok21@cam.ac.uk
---

Professor of computational interaction at Cambridge.`;

      const parsed = parseContextItemEntryYaml(yamlEntry);

      expect(parsed).not.toBeNull();
      expect(parsed!.timestamp).toBe('10:00');
      expect(parsed!.kind).toBe('contact');
      expect(parsed!.metadata).toEqual({
        role: 'PhD Supervisor',
        institution: 'Cambridge',
        email: 'pok21@cam.ac.uk',
      });
      expect(parsed!.source).toBe('Text'); // No source field => default
      expect(parsed!.text).toBe('Professor of computational interaction at Cambridge.');
    });

    it('should default kind to null and metadata to {} for entries without them', () => {
      const yamlEntry = `---
schema_version: "1.0"
timestamp: "14:30"
source: Meeting
goal: test-goal
---

Plain context without kind or metadata`;

      const parsed = parseContextItemEntryYaml(yamlEntry);

      expect(parsed).not.toBeNull();
      expect(parsed!.kind).toBeNull();
      expect(parsed!.metadata).toEqual({});
      expect(parsed!.goal).toBe('test-goal');
    });

    it('should default kind to null and metadata to {} for inline format entries', () => {
      const inlineEntry = `## 10:30

**Source:** Meeting

Inline formatted context

Goal: test-goal`;

      const parsed = parseContextItemEntryAuto(inlineEntry);

      expect(parsed).not.toBeNull();
      expect(parsed!.kind).toBeNull();
      expect(parsed!.metadata).toEqual({});
    });

    it('should round-trip kind and metadata through serialize/parse', () => {
      const original: ContextItemEntry = {
        timestamp: '09:15',
        source: 'Entity',
        text: 'BTC short trade with strong conviction.',
        goal: 'trading-bot',
        kind: 'trade',
        metadata: {
          coin: 'BTC',
          side: 'short',
          pnl: 2142,
          status: 'closed',
        },
        rawEntry: '',
      };

      const serialized = serializeContextItemEntryYaml(original);
      const parsed = parseContextItemEntryYaml(serialized);

      expect(parsed).not.toBeNull();
      expect(parsed!.timestamp).toBe(original.timestamp);
      expect(parsed!.kind).toBe('trade');
      expect(parsed!.goal).toBe('trading-bot');
      expect(parsed!.metadata).toEqual({
        coin: 'BTC',
        side: 'short',
        pnl: 2142,
        status: 'closed',
      });
      expect(parsed!.text).toBe(original.text);
    });

    it('should preserve real source when kind is set and source is not Entity', () => {
      const context: ContextItemEntry = {
        timestamp: '12:00',
        source: 'Email',
        text: 'Email content here.',
        goal: null,
        kind: 'email',
        metadata: {
          direction: 'from',
          correspondent: 'Per Ola Kristensson',
        },
        rawEntry: '',
      };

      const serialized = serializeContextItemEntryYaml(context);

      expect(serialized).toContain('source: Email');
      expect(serialized).toContain('kind: email');
      expect(serialized).toContain('direction: from');
    });
  });
});
