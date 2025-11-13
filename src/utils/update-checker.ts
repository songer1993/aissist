/**
 * Update checker utility for CLI version management
 * Checks npm registry for latest version and provides update notifications
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string | null;
  lastChecked: number;
}

interface UpdateCheckCache {
  lastChecked: number;
  latestVersion: string | null;
  updateAvailable: boolean;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const NPM_REGISTRY_TIMEOUT_MS = 5000; // 5 seconds
const PACKAGE_NAME = 'aissist';

/**
 * Compare two semantic version strings
 * Returns true if newVersion is greater than currentVersion
 * Simple comparison: splits by dots and compares numerically
 */
export function isNewerVersion(currentVersion: string, newVersion: string): boolean {
  // Remove 'v' prefix if present
  const current = currentVersion.replace(/^v/, '');
  const latest = newVersion.replace(/^v/, '');

  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) {
      return true;
    }
    if (latestPart < currentPart) {
      return false;
    }
  }

  return false; // Versions are equal
}

/**
 * Fetch latest version from npm registry with timeout
 * Returns null if fetch fails or times out
 */
export async function fetchLatestVersion(packageName: string = PACKAGE_NAME): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NPM_REGISTRY_TIMEOUT_MS);

    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as { version?: string };
    return data.version || null;
  } catch (_error) {
    // Network error, timeout, or parse error - silently fail
    return null;
  }
}

/**
 * Read update check cache from file
 */
async function readCache(cachePath: string): Promise<UpdateCheckCache | null> {
  try {
    await access(cachePath);
    const content = await readFile(cachePath, 'utf-8');
    const cache = JSON.parse(content) as UpdateCheckCache;
    return cache;
  } catch {
    return null;
  }
}

/**
 * Write update check cache to file
 */
async function writeCache(cachePath: string, cache: UpdateCheckCache): Promise<void> {
  try {
    await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // Silently fail if cache write fails
  }
}

/**
 * Check if cache is still valid (within TTL)
 */
function isCacheValid(cache: UpdateCheckCache | null): boolean {
  if (!cache) return false;
  const now = Date.now();
  return (now - cache.lastChecked) < CACHE_TTL_MS;
}

/**
 * Check for updates with caching support
 * Cache is stored in the global user directory (~/.aissist/cache/)
 * @param currentVersion - Current installed version
 * @param forceCheck - Force check even if cache is valid
 * @returns Update check result
 */
export async function checkForUpdates(
  currentVersion: string,
  forceCheck: boolean = false
): Promise<UpdateCheckResult> {
  const cacheDir = join(homedir(), '.aissist', 'cache');
  const cachePath = join(cacheDir, 'update-check.json');

  // Ensure cache directory exists
  try {
    await mkdir(cacheDir, { recursive: true });
  } catch {
    // Silently fail if directory creation fails
  }

  // Try to read cache first (unless force check)
  if (!forceCheck) {
    const cache = await readCache(cachePath);
    if (cache && isCacheValid(cache)) {
      return {
        updateAvailable: cache.updateAvailable,
        currentVersion,
        latestVersion: cache.latestVersion,
        lastChecked: cache.lastChecked,
      };
    }
  }

  // Perform fresh check
  const latestVersion = await fetchLatestVersion();
  const now = Date.now();

  const updateAvailable = latestVersion !== null && isNewerVersion(currentVersion, latestVersion);

  // Write to cache
  const cache: UpdateCheckCache = {
    lastChecked: now,
    latestVersion,
    updateAvailable,
  };
  await writeCache(cachePath, cache);

  return {
    updateAvailable,
    currentVersion,
    latestVersion,
    lastChecked: now,
  };
}

/**
 * Format update notification message for terminal display
 * @param result - Update check result
 * @returns Formatted message string (uses chalk internally for colors)
 */
export function formatUpdateNotification(result: UpdateCheckResult): string | null {
  if (!result.updateAvailable || !result.latestVersion) {
    return null;
  }

  // Import chalk dynamically to avoid issues during initial load
  // This will be handled by the caller (index.ts) using chalk
  return `
╭─────────────────────────────────────────────────────╮
│  Update available: ${result.currentVersion} → ${result.latestVersion}${' '.repeat(Math.max(0, 20 - result.currentVersion.length - result.latestVersion.length))}│
│  Run: npm install -g aissist@latest                 │
╰─────────────────────────────────────────────────────╯
`.trim();
}
