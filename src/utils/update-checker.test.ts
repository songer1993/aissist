import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isNewerVersion, fetchLatestVersion, checkForUpdates } from './update-checker.js';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

describe('update-checker', () => {
  describe('isNewerVersion', () => {
    it('should return true when new version is greater', () => {
      expect(isNewerVersion('1.0.0', '1.0.1')).toBe(true);
      expect(isNewerVersion('1.0.0', '1.1.0')).toBe(true);
      expect(isNewerVersion('1.0.0', '2.0.0')).toBe(true);
      expect(isNewerVersion('1.2.3', '1.2.4')).toBe(true);
    });

    it('should return false when new version is same or lower', () => {
      expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('1.0.1', '1.0.0')).toBe(false);
      expect(isNewerVersion('1.1.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('2.0.0', '1.0.0')).toBe(false);
    });

    it('should handle v prefix', () => {
      expect(isNewerVersion('v1.0.0', 'v1.0.1')).toBe(true);
      expect(isNewerVersion('v1.0.0', '1.0.1')).toBe(true);
      expect(isNewerVersion('1.0.0', 'v1.0.1')).toBe(true);
    });

    it('should handle different version lengths', () => {
      expect(isNewerVersion('1.0', '1.0.1')).toBe(true);
      expect(isNewerVersion('1.0.0', '1.0')).toBe(false);
    });
  });

  describe('fetchLatestVersion', () => {
    beforeEach(() => {
      // Mock global fetch
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return version on successful fetch', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '1.5.0' }),
      });

      const result = await fetchLatestVersion('test-package');
      expect(result).toBe('1.5.0');
    });

    it('should return null on network error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const result = await fetchLatestVersion('test-package');
      expect(result).toBe(null);
    });

    it('should return null on non-ok response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
      });

      const result = await fetchLatestVersion('test-package');
      expect(result).toBe(null);
    });

    it('should handle abort/timeout correctly', async () => {
      // Mock an aborted fetch (simulating timeout)
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('AbortError'));

      const result = await fetchLatestVersion('test-package');
      expect(result).toBe(null);
    });
  });

  describe('checkForUpdates', () => {
    const globalCacheDir = join(homedir(), '.aissist', 'cache');
    const globalCachePath = join(globalCacheDir, 'update-check.json');
    let backupCache: string | null = null;

    beforeEach(async () => {
      // Backup existing cache if present
      try {
        backupCache = await readFile(globalCachePath, 'utf-8');
      } catch {
        backupCache = null;
      }

      // Ensure cache directory exists
      await mkdir(globalCacheDir, { recursive: true });

      // Mock fetch
      global.fetch = vi.fn();
    });

    afterEach(async () => {
      vi.restoreAllMocks();

      // Restore backup or remove test cache
      try {
        if (backupCache) {
          await writeFile(globalCachePath, backupCache, 'utf-8');
        } else {
          await rm(globalCachePath, { force: true });
        }
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should detect available updates', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '2.0.0' }),
      });

      const result = await checkForUpdates('1.0.0');

      expect(result.updateAvailable).toBe(true);
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.latestVersion).toBe('2.0.0');
    });

    it('should detect when up to date', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '1.0.0' }),
      });

      const result = await checkForUpdates('1.0.0');

      expect(result.updateAvailable).toBe(false);
      expect(result.currentVersion).toBe('1.0.0');
      expect(result.latestVersion).toBe('1.0.0');
    });

    it('should use cache when valid', async () => {
      // Write cache file to global location
      const cache = {
        lastChecked: Date.now(),
        latestVersion: '2.0.0',
        updateAvailable: true,
      };
      await writeFile(globalCachePath, JSON.stringify(cache));

      // Mock fetch should NOT be called
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '3.0.0' }),
      });

      const result = await checkForUpdates('1.0.0');

      expect(result.updateAvailable).toBe(true);
      expect(result.latestVersion).toBe('2.0.0'); // From cache, not fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should bypass cache when forceCheck is true', async () => {
      // Write cache file to global location
      const cache = {
        lastChecked: Date.now(),
        latestVersion: '2.0.0',
        updateAvailable: true,
      };
      await writeFile(globalCachePath, JSON.stringify(cache));

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '3.0.0' }),
      });

      const result = await checkForUpdates('1.0.0', true);

      expect(result.latestVersion).toBe('3.0.0'); // From fresh fetch
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should ignore expired cache', async () => {
      // Write expired cache file (25 hours old) to global location
      const cache = {
        lastChecked: Date.now() - (25 * 60 * 60 * 1000),
        latestVersion: '2.0.0',
        updateAvailable: true,
      };
      await writeFile(globalCachePath, JSON.stringify(cache));

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '3.0.0' }),
      });

      const result = await checkForUpdates('1.0.0');

      expect(result.latestVersion).toBe('3.0.0'); // From fresh fetch
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should use global cache directory', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ version: '1.5.0' }),
      });

      await checkForUpdates('1.0.0');

      // Verify cache was written to global location
      const cacheContent = await readFile(globalCachePath, 'utf-8');
      const cache = JSON.parse(cacheContent);

      expect(cache.latestVersion).toBe('1.5.0');
      expect(cache.updateAvailable).toBe(true);
    });
  });
});
