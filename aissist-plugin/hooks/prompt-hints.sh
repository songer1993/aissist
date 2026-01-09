#!/bin/bash
# Hook script for UserPromptSubmit - provides datetime and keyword-based aissist suggestions
# Replaces add-datetime.sh with enhanced functionality

# Output datetime first (always works, no dependencies)
echo "Current date and time: $(date '+%Y-%m-%d %H:%M:%S %Z')"

# Check for jq dependency - exit silently if not available
if ! command -v jq &> /dev/null; then
  exit 0
fi

# Read the hook input from stdin
INPUT=$(cat)

# Extract user prompt (keep original case, use grep -i for matching)
PROMPT=$(echo "$INPUT" | jq -r '.user_prompt // empty' 2>/dev/null)

# Skip keyword detection if no prompt
[ -z "$PROMPT" ] && exit 0

# Check for recall triggers - asking about past work (case insensitive)
if grep -iqE '(how did i|why did i|previously|last time|before|earlier|remember when|what was|did we)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:recall to search past work"
  exit 0
fi

# Check for goal/progress triggers
if grep -iqE '(my goal|my progress|deadline|what.*(working on|should.*do)|priority|milestone)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:chat to discuss goals and progress"
  exit 0
fi

# Check for task list triggers (numbered items or explicit list language)
if grep -iqE '(^[0-9]+\.|tasks:|todo:|need to:|things to do|checklist|items:)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:todo to extract and track tasks"
  exit 0
fi

# Check for report triggers
if grep -iqE '(summary of|report|what.*done|accomplishment|weekly|standup)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:report to generate accomplishment summary"
  exit 0
fi

# No specific trigger - silent (datetime already shown)
