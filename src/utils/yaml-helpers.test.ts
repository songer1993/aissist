import { describe, it, expect, vi } from 'vitest';
import {
  parseYamlFrontMatter,
  serializeYamlFrontMatter,
  detectFormat,
  normalizeSchemaVersion,
  splitEntries,
} from './yaml-helpers.js';

describe('parseYamlFrontMatter', () => {
  it('should parse valid YAML front matter with multiple fields', () => {
    const content = `---
schema_version: "1.0"
timestamp: "10:30"
codename: test-goal
deadline: "2025-12-31"
---

This is the body content`;

    const result = parseYamlFrontMatter(content);

    expect(result).not.toBeNull();
    expect(result![0]).toEqual({
      schema_version: '1.0',
      timestamp: '10:30',
      codename: 'test-goal',
      deadline: '2025-12-31',
    });
    expect(result![1]).toBe('This is the body content');
  });

  it('should return null for invalid YAML syntax', () => {
    const content = `---
invalid: yaml: structure: [
---

Body`;

    expect(parseYamlFrontMatter(content)).toBeNull();
  });

  it('should return null for content without front matter', () => {
    const content = `## 10:30 - goal\n\nGoal text without YAML`;
    expect(parseYamlFrontMatter(content)).toBeNull();
  });

  it('should handle empty YAML blocks', () => {
    const content = `---
---

Body with empty metadata`;

    const result = parseYamlFrontMatter(content);
    expect(result).not.toBeNull();
    expect(result![0]).toEqual({});
    expect(result![1]).toBe('Body with empty metadata');
  });

  it('should handle content with only opening delimiter', () => {
    const content = `---
timestamp: "10:30"

No closing delimiter`;

    expect(parseYamlFrontMatter(content)).toBeNull();
  });
});

describe('serializeYamlFrontMatter', () => {
  it('should include schema_version in output', () => {
    const metadata = { schema_version: '1.0', timestamp: '10:30' };
    const body = 'Test content';

    const result = serializeYamlFrontMatter(metadata, body);

    expect(result).toContain('---');
    expect(result).toContain('schema_version: "1.0"');
    expect(result).toContain('timestamp: "10:30"');
    expect(result).toContain('Test content');
  });

  it('should format YAML correctly with delimiters', () => {
    const metadata = { timestamp: '14:30' };
    const body = 'Body text';

    const result = serializeYamlFrontMatter(metadata, body);

    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---\n\nBody text$/);
  });

  it('should omit null values from YAML', () => {
    const metadata = {
      schema_version: '1.0',
      timestamp: '10:30',
      deadline: null,
      goal: 'test-goal',
    };
    const body = 'Test content';

    const result = serializeYamlFrontMatter(metadata, body);

    expect(result).not.toContain('deadline');
    expect(result).toContain('goal: test-goal');
  });

  it('should omit undefined values from YAML', () => {
    const metadata = {
      schema_version: '1.0',
      timestamp: '10:30',
      description: undefined,
    };
    const body = 'Test content';

    const result = serializeYamlFrontMatter(metadata, body);

    expect(result).not.toContain('description');
  });

  it('should handle empty metadata', () => {
    const metadata = {};
    const body = 'Body only';

    const result = serializeYamlFrontMatter(metadata, body);

    expect(result).toContain('---');
    expect(result).toContain('Body only');
  });

  it('should handle special characters in values', () => {
    const metadata = {
      text: 'Text with "quotes" and special: characters',
      timestamp: '10:30',
    };
    const body = 'Body';

    const result = serializeYamlFrontMatter(metadata, body);

    expect(result).toContain('text:');
    // YAML should escape or quote the value appropriately
  });
});

describe('detectFormat', () => {
  it('should detect YAML format when content starts with ---', () => {
    const content = '---\ntimestamp: "10:30"\n---\n\nBody';
    expect(detectFormat(content)).toBe('yaml');
  });

  it('should detect inline format when content starts with ##', () => {
    const content = '## 10:30 - goal\n\nGoal text';
    expect(detectFormat(content)).toBe('inline');
  });

  it('should handle empty string', () => {
    expect(detectFormat('')).toBe('inline');
  });

  it('should handle content with leading whitespace', () => {
    const yamlContent = '  ---\ntimestamp: "10:30"\n---\n\nBody';
    // detectFormat trims content, so leading whitespace is ignored
    expect(detectFormat(yamlContent)).toBe('yaml');
  });
});

describe('normalizeSchemaVersion', () => {
  it('should default to 1.0 when undefined', () => {
    expect(normalizeSchemaVersion(undefined)).toBe('1.0');
  });

  it('should accept known version 1.0', () => {
    expect(normalizeSchemaVersion('1.0')).toBe('1.0');
  });

  it('should warn and fallback for unknown version', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = normalizeSchemaVersion('2.5');

    expect(result).toBe('1.0');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown schema version 2.5')
    );

    consoleSpy.mockRestore();
  });

  it('should handle empty string by defaulting to 1.0', () => {
    expect(normalizeSchemaVersion('')).toBe('1.0');
  });

  it('should handle null by defaulting to 1.0', () => {
    expect(normalizeSchemaVersion(null as unknown as string | undefined)).toBe('1.0');
  });
});

describe('splitEntries', () => {
  it('should split multiple YAML entries correctly', () => {
    const content = `---
schema_version: "1.0"
timestamp: "10:30"
---

First entry text

---
schema_version: "1.0"
timestamp: "14:00"
---

Second entry text`;

    const entries = splitEntries(content);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain('10:30');
    expect(entries[0]).toContain('First entry text');
    expect(entries[1]).toContain('14:00');
    expect(entries[1]).toContain('Second entry text');
  });

  it('should split multiple inline entries correctly', () => {
    const content = `## 10:30 - first

First entry

## 14:00 - second

Second entry`;

    const entries = splitEntries(content);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain('10:30');
    expect(entries[0]).toContain('First entry');
    expect(entries[1]).toContain('14:00');
    expect(entries[1]).toContain('Second entry');
  });

  it('should handle single YAML entry', () => {
    const content = `---
schema_version: "1.0"
timestamp: "10:30"
---

Single entry`;

    const entries = splitEntries(content);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain('10:30');
    expect(entries[0]).toContain('Single entry');
  });

  it('should handle single inline entry', () => {
    const content = `## 10:30\n\nSingle entry`;

    const entries = splitEntries(content);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain('10:30');
  });

  it('should handle empty content', () => {
    const entries = splitEntries('');
    expect(entries).toHaveLength(0);
  });

  it('should preserve entry completeness without data loss', () => {
    const content = `---
schema_version: "1.0"
timestamp: "10:30"
goal: test-goal
---

Entry with **markdown** and special characters: #$%

Multiple lines
And more content

---
schema_version: "1.0"
timestamp: "14:00"
---

Second entry`;

    const entries = splitEntries(content);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain('**markdown**');
    expect(entries[0]).toContain('special characters: #$%');
    expect(entries[0]).toContain('Multiple lines');
    expect(entries[0]).toContain('And more content');
  });
});
