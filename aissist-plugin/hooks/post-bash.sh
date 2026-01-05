#!/bin/bash
# PostToolUse hook for Bash tool
# Detects git commits and other significant operations

# Check for jq dependency - exit silently if not available
if ! command -v jq &> /dev/null; then
  exit 0
fi

# Read the hook input from stdin
INPUT=$(cat)

# Extract the command that was run
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Exit if no command extracted
[ -z "$COMMAND" ] && exit 0

# Check for git commit (word boundaries to avoid false positives)
if grep -qE '\bgit\s+commit\b' <<< "$COMMAND"; then
  echo "Git commit detected - use /aissist:log to record this work"
  exit 0
fi

# Check for test runs (word boundaries)
if grep -qE '\b(pytest|npm\s+test|yarn\s+test|cargo\s+test|go\s+test|make\s+test)\b' <<< "$COMMAND"; then
  echo "Tests completed - consider /aissist:log if this concludes a task"
  exit 0
fi

# Check for build commands (word boundaries)
if grep -qE '\b(npm|yarn|pnpm)\s+(run\s+)?build\b|\bcargo\s+build\b|\bgo\s+build\b|\bmake\b' <<< "$COMMAND"; then
  echo "Build completed - consider /aissist:log if this concludes a task"
  exit 0
fi

# Check for deployment commands (word boundaries)
if grep -qE '\b(deploy|publish|release)\b' <<< "$COMMAND"; then
  echo "Deployment detected - use /aissist:log to record this milestone"
  exit 0
fi

# No significant command detected - silent
