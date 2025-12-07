#!/bin/bash
# Hook script that outputs the current date and time
# Used by UserPromptSubmit hook to inject datetime context into Claude Code sessions

echo "Current date and time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
