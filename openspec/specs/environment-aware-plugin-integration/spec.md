# environment-aware-plugin-integration Specification

## Purpose
TBD - created by archiving change environment-aware-plugin-installation. Update Purpose after archive.
## Requirements
### Requirement: Environment Detection
The system SHALL detect whether it's running in a development or production environment.

The system MUST check the `NODE_ENV` environment variable first. If `NODE_ENV` is set to `'production'`, the system SHALL treat it as production. If `NODE_ENV` is set to `'development'` or any other value, the system SHALL treat it as development.

When `NODE_ENV` is not set, the system SHALL check if the package path contains `node_modules`. If the path contains `node_modules`, the system SHALL treat it as production. Otherwise, the system SHALL treat it as development.

#### Scenario: Development Environment Detection
**Given** a developer running aissist from source (not in `node_modules`)
**And** `NODE_ENV` is either unset or set to `'development'`
**When** the environment detection runs
**Then** the system identifies it as a development environment

#### Scenario: Production Environment Detection via NODE_ENV
**Given** a user has installed aissist via npm
**And** `NODE_ENV` is set to `'production'`
**When** the environment detection runs
**Then** the system identifies it as a production environment

#### Scenario: Production Environment Detection via Path
**Given** a user has installed aissist via npm (located in `node_modules`)
**And** `NODE_ENV` is not set
**When** the environment detection runs
**Then** the system identifies it as a production environment based on the `node_modules` path

---

### Requirement: Marketplace URL Resolution
The system SHALL resolve the appropriate marketplace URL based on the detected environment.

For development environments, the system MUST return the local file path `${packagePath}/aissist-plugin`. For production environments, the system MUST return the GitHub shorthand `albertnahas/aissist`.

#### Scenario: Development Marketplace URL
**Given** the environment is detected as development
**When** resolving the marketplace URL
**Then** the system returns the local file path to `aissist-plugin` directory

#### Scenario: Production Marketplace URL
**Given** the environment is detected as production
**When** resolving the marketplace URL
**Then** the system returns `'albertnahas/aissist'` (GitHub shorthand)

---

### Requirement: Updated addMarketplace Function
The `addMarketplace()` function SHALL accept a marketplace URL parameter instead of constructing it internally.

The function signature MUST change to `addMarketplace(marketplaceUrl: string)`. The function SHALL pass the URL directly to the `claude plugin marketplace add` command and MUST NOT construct any paths internally.

#### Scenario: Add Marketplace with Custom URL
**Given** a marketplace URL is provided
**When** `addMarketplace(url)` is called
**Then** the function executes `claude plugin marketplace add <url>`
**And** does not construct any paths internally

---

### Requirement: Integration Flow Update
The `integrateClaudeCodePlugin()` function SHALL detect the environment and use the appropriate marketplace URL.

The function MUST detect the environment before adding the marketplace. The function SHALL resolve the marketplace URL based on the detected environment and MUST pass the resolved URL to `addMarketplace()`. Error messages MUST include the correct manual installation command for the current environment.

#### Scenario: Development Integration
**Given** the environment is development
**When** `integrateClaudeCodePlugin()` runs
**Then** it detects development environment
**And** resolves to local file path
**And** calls `addMarketplace()` with the local path

#### Scenario: Production Integration
**Given** the environment is production
**When** `integrateClaudeCodePlugin()` runs
**Then** it detects production environment
**And** resolves to GitHub URL `albertnahas/aissist`
**And** calls `addMarketplace()` with the GitHub URL

#### Scenario: Error Message with Correct Manual Command
**Given** automated installation fails
**When** returning the error result
**Then** the error message includes the correct manual installation command for the current environment
**And** development shows: `claude plugin marketplace add ${localPath}/aissist-plugin`
**And** production shows: `claude plugin marketplace add albertnahas/aissist`

