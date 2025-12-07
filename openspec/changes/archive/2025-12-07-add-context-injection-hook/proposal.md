# Proposal: Add Context Injection Hook

## Why

Claude Code sessions lack awareness of the user's current goals, recent history, and priorities unless explicitly provided. For a personal assistant like aissist, having this context readily available helps Claude:

- Understand current priorities and active goals
- Reference recent accomplishments for continuity
- Provide more relevant suggestions aligned with user's focus areas
- Avoid asking redundant questions about ongoing work

Currently, users must manually run recall commands or explain their context each session.

## What Changes

Add a `SessionStart` hook to the aissist plugin that injects a summary of active goals and recent history into the conversation context. The hook is controlled by a configuration flag so users can enable/disable it.

### Scope

- **In scope**:
  - Add `hooks.contextInjection.enabled` config flag (default: false)
  - Add CLI commands to enable/disable: `aissist config context-injection enable|disable`
  - Add `SessionStart` hook script that checks config and outputs context summary
  - Update plugin settings.json with SessionStart hook

- **Out of scope**:
  - Modifying existing datetime hook
  - Adding other hook types
  - Complex context summarization (keep it simple)

## Success Criteria

- Hook only runs when `hooks.contextInjection.enabled` is true
- When enabled, outputs active goals and recent history summary
- Minimal latency impact (< 500ms)
- Easy to toggle via CLI command
