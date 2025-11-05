# Refactor Log Command: AI-Enhanced History Logging

## Problem

Currently, the `/aissist:log` Claude Code plugin command is dedicated to GitHub activity import, which creates confusion and limits its usefulness:

1. **Naming confusion**: The generic name `/aissist:log` suggests general-purpose logging, but it only imports from GitHub
2. **Missing quick-logging capability**: Users in Claude Code cannot quickly log history entries without switching to terminal
3. **No multimodal support**: Users cannot log entries with images, screenshots, or other context that Claude has access to
4. **Manual entry formatting**: Users must manually craft well-structured history entries

This makes logging history entries from Claude Code unnecessarily cumbersome and under-utilizes Claude's ability to enhance and structure user input.

## Solution

Refactor the plugin command structure to support both use cases:

1. **Rename GitHub import command**: `/aissist:log` → `/aissist:log-github`
   - Clear naming that reflects its specific purpose (GitHub activity import)
   - Maintains all existing functionality under a more descriptive name

2. **Create new AI-enhanced logging command**: `/aissist:log`
   - Accepts freeform text input from users
   - Uses Claude AI to rephrase, structure, and enhance the input into meaningful history entries
   - Supports multimodal input (images, screenshots) - Claude describes/analyzes them and includes descriptions
   - Automatically calls `aissist history log` with the enhanced text
   - Optionally links to relevant goals based on content analysis

This creates a clear separation:
- `/aissist:log` = Quick, AI-enhanced history logging (general purpose)
- `/aissist:log-github` = GitHub activity import (specific integration)

## Impact

**Benefits:**
- **Improved UX**: Quick history logging directly from Claude Code conversations
- **Better naming**: Command names clearly reflect their purpose
- **Multimodal support**: Leverage Claude's vision capabilities for image-based logging
- **Enhanced entries**: AI transforms rough notes into well-structured history entries
- **Goal intelligence**: Automatic goal linking based on content analysis

**User Experience:**
```
User: /aissist:log Fixed the authentication bug, took 3 hours
Claude: [AI rephrases] → "Resolved authentication bug in login flow (3 hours)"
         [Calls] aissist history log "Resolved authentication bug in login flow (3 hours)"

User: /aissist:log [attaches screenshot of performance metrics]
Claude: [Analyzes image] → "Performance optimization: Reduced page load time from 3.2s to 1.1s"
         [Calls] aissist history log "Performance optimization: Reduced page load time from 3.2s to 1.1s"
```

## Scope

This change refactors existing plugin commands:

**Modifications:**
- Rename `aissist-plugin/commands/log.md` → `log-github.md`
- Update command description and documentation for GitHub import
- Create new spec: `github-import-command` (MODIFIED from implicit behavior)

**Additions:**
- Create `aissist-plugin/commands/log.md` (new command)
- Add AI enhancement logic for rephrasing user input
- Add image description capability for multimodal logging
- Create new spec: `ai-enhanced-logging` (ADDED capability)

## Dependencies

- Requires existing `history-tracking` spec (for `aissist history log` command)
- Requires existing `goal-management` spec (for optional goal linking)
- Requires existing `claude-integration` spec (for AI rephrasing and image analysis)
- Claude Code plugin infrastructure (already in place)

## Non-Goals

- This change does NOT modify the core `aissist history log` CLI command
- This change does NOT add image storage/attachment features (only text descriptions)
- This change does NOT change GitHub import functionality (only renames the command)
- This change does NOT add new command-line flags to existing commands
