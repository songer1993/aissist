# Tasks

## Implementation Tasks

- [x] Add environment detection utility function `isProductionEnvironment()` in `src/utils/claude-plugin.ts`
  - Check `NODE_ENV` environment variable
  - Fallback to checking if path contains `node_modules`
  - Return boolean indicating if production

- [x] Add marketplace URL resolver function `resolveMarketplaceUrl()` in `src/utils/claude-plugin.ts`
  - Call `isProductionEnvironment()` to detect environment
  - Return GitHub URL (`albertnahas/aissist`) for production
  - Return local path for development
  - Accept package path as parameter

- [x] Update `addMarketplace()` function signature
  - Change to accept `marketplaceUrl: string` parameter
  - Remove internal path construction
  - Use provided URL directly in spawn command

- [x] Update `integrateClaudeCodePlugin()` to use environment-aware marketplace URL
  - Call `resolveMarketplaceUrl()` after resolving package path
  - Pass resolved marketplace URL to `addMarketplace()`
  - Update error messages to show correct manual command based on environment

- [x] Add unit tests for environment detection
  - Test `NODE_ENV=development` detection
  - Test `NODE_ENV=production` detection
  - Test `node_modules` path detection
  - Test development path detection

- [x] Add unit tests for marketplace URL resolution
  - Test production URL resolution
  - Test development URL resolution

- [x] Test end-to-end integration flow
  - Test in development environment (local source)
  - Test in production-like environment (simulated `node_modules` install)
  - Verify correct marketplace URLs are used

- [x] Update documentation if needed
  - Update manual installation instructions
  - Document environment variable usage

## Validation

- [x] Run `npm run build` successfully
- [x] Run unit tests with `npm test`
- [x] Manually test `aissist init` in development mode
- [x] Manually test `aissist init` with `NODE_ENV=production`
- [x] Verify Claude Code plugin marketplace commands use correct URLs
