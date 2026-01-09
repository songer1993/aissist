#!/bin/bash
# PostToolUse hook for Edit/Write tools
# Reminds to log work after file modifications

# Check for jq dependency - exit silently if not available
if ! command -v jq &> /dev/null; then
  echo "File modified - consider /aissist:log if this completes a task"
  exit 0
fi

# Read the hook input from stdin (contains tool info)
INPUT=$(cat)

# Extract file path if available (handles different tool implementations)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // .tool_input.target // empty' 2>/dev/null)

if [ -n "$FILE" ]; then
  BASENAME=$(basename "$FILE")
  echo "File modified: $BASENAME - consider /aissist:log if this completes a task"
else
  echo "File modified - consider /aissist:log if this completes a task"
fi
