# Proposal: Add DateTime Context Hook

## Summary

Add a `UserPromptSubmit` hook to the aissist plugin that automatically injects the current date and time into the conversation context whenever a user submits a prompt.

## Motivation

Claude Code sessions lack awareness of the current date and time unless explicitly provided. For a personal assistant tool like aissist that tracks goals, todos, and history with deadlines and timestamps, having the current datetime context is valuable for:

- Providing accurate relative time references ("today", "this week", "due tomorrow")
- Understanding urgency of deadlines
- Contextualizing historical entries
- Planning and scheduling assistance

## Scope

- **In scope**: Add a `UserPromptSubmit` hook and supporting script to the `aissist-plugin` directory
- **Out of scope**: Modifying the CLI tool itself, adding other hook types

## Implementation Approach

1. Create a `hooks/` directory in `aissist-plugin/`
2. Add a `settings.json` file with the hook configuration
3. Create a simple shell script that outputs the current datetime

## Success Criteria

- Hook successfully triggers on every user prompt submission
- Current date/time is injected into the conversation context
- No noticeable latency impact (< 100ms)
- Works across platforms (macOS, Linux)
