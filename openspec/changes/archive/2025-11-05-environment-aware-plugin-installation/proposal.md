# Environment-Aware Plugin Installation

## Why

Currently, the `aissist init` command always installs the Claude Code plugin using a local file path (`${packagePath}/aissist-plugin`). This works during development but fails for production users who install `aissist` via npm, because:

1. The local file path points to the package installation directory in `node_modules`, which users shouldn't need to know about
2. Users should be able to install the plugin marketplace via the public GitHub repository (`albertnahas/aissist`)
3. The installation method doesn't distinguish between development (local testing) and production (npm-installed) environments

According to Claude Code plugin documentation:
- **Development**: Use local relative paths for iterative testing
- **Production**: Reference GitHub repositories via shorthand format (`owner/repo`)

This change enables proper plugin installation in both environments by detecting whether the user is running from a development directory or from an npm-installed package.

## What Changes

### Environment Detection
- Add logic to detect if running in development vs production environment
- Check `NODE_ENV` environment variable
- Fallback to checking if the package path contains `node_modules` (production) or is a development directory

### Marketplace URL Resolution
- **Development**: Use local file path (`${packagePath}/aissist-plugin`)
- **Production**: Use GitHub repository shorthand (`albertnahas/aissist`)

### Updated Integration Flow
- Modify `addMarketplace()` function in `src/utils/claude-plugin.ts` to accept the resolved marketplace URL
- Update `integrateClaudeCodePlugin()` to determine the environment and pass the appropriate marketplace reference

## Impact

### User Experience
- **Development**: No change - continues to work with local paths for rapid iteration
- **Production**: Users can successfully install the plugin after installing via npm
- Clear manual installation instructions use the correct format for each environment

### Backwards Compatibility
- Existing development workflows remain unchanged
- Users who previously had issues installing from npm will now succeed

## Alternatives Considered

1. **Always use GitHub URL**: Would break development workflow and require pushing to GitHub for every test
2. **Manual installation only**: Would require users to run separate commands rather than automated integration
3. **Environment variable only**: Less robust than checking `node_modules` path as fallback
