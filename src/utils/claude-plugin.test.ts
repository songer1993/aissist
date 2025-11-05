import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isProductionEnvironment, resolveMarketplaceUrl } from './claude-plugin.js';

describe('claude-plugin utilities', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('isProductionEnvironment', () => {
    it('should return true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const result = isProductionEnvironment('/some/random/path');
      expect(result).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      const result = isProductionEnvironment('/some/random/path');
      expect(result).toBe(false);
    });

    it('should return false when NODE_ENV is any value other than production', () => {
      process.env.NODE_ENV = 'test';
      const result = isProductionEnvironment('/some/random/path');
      expect(result).toBe(false);
    });

    it('should return true when NODE_ENV is unset and path contains node_modules', () => {
      delete process.env.NODE_ENV;
      const result = isProductionEnvironment('/home/user/project/node_modules/aissist');
      expect(result).toBe(true);
    });

    it('should return false when NODE_ENV is unset and path does not contain node_modules', () => {
      delete process.env.NODE_ENV;
      const result = isProductionEnvironment('/home/user/dev/aissist');
      expect(result).toBe(false);
    });
  });

  describe('resolveMarketplaceUrl', () => {
    it('should return GitHub URL when in production environment (NODE_ENV)', () => {
      process.env.NODE_ENV = 'production';
      const result = resolveMarketplaceUrl('/some/path');
      expect(result).toBe('albertnahas/aissist');
    });

    it('should return GitHub URL when in production environment (node_modules path)', () => {
      delete process.env.NODE_ENV;
      const result = resolveMarketplaceUrl('/usr/local/lib/node_modules/aissist');
      expect(result).toBe('albertnahas/aissist');
    });

    it('should return local path when in development environment', () => {
      process.env.NODE_ENV = 'development';
      const packagePath = '/home/user/dev/aissist';
      const result = resolveMarketplaceUrl(packagePath);
      expect(result).toBe(`${packagePath}/aissist-plugin`);
    });

    it('should return local path when NODE_ENV is unset and not in node_modules', () => {
      delete process.env.NODE_ENV;
      const packagePath = '/home/user/dev/aissist';
      const result = resolveMarketplaceUrl(packagePath);
      expect(result).toBe(`${packagePath}/aissist-plugin`);
    });
  });
});
