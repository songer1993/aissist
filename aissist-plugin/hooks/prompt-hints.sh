#!/bin/bash
# Hook script for UserPromptSubmit - provides datetime and keyword-based aissist suggestions
# Self-contained: no global hook dependencies required

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

PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

# Skip hints for questions, slash commands, or short responses
echo "$PROMPT_LOWER" | grep -qE '^(what|where|how|why|when|which|who|is |are |can |does |do |show|list|explain|describe|read|check|look|find|search|help|tell me|get) ' && exit 0
echo "$PROMPT" | grep -qE '^/' && exit 0
echo "$PROMPT_LOWER" | grep -qE '^(yes|no|ok|sure|thanks|nope|yep|maybe|correct|right|exactly|agreed|perfect|great)' && exit 0

# --- Aissist-specific hints ---

# Recall triggers - asking about past work
if grep -iqE '(how did i|why did i|previously|last time|before|earlier|remember when|what was|did we)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:recall to search past work"
  exit 0
fi

# Goal/progress triggers
if grep -iqE '(my goal|my progress|deadline|what.*(working on|should.*do)|priority|milestone)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:chat to discuss goals and progress"
  exit 0
fi

# Task list triggers (numbered items or explicit list language)
if grep -iqE '(^[0-9]+\.|tasks:|todo:|need to:|things to do|checklist|items:)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:todo to extract and track tasks"
  exit 0
fi

# Report triggers
if grep -iqE '(summary of|report|what.*done|accomplishment|weekly|standup)' <<< "$PROMPT"; then
  echo "Hint: Use /aissist:report to generate accomplishment summary"
  exit 0
fi

# --- General-purpose hints ---

# Substantial work → suggest planning
if echo "$PROMPT_LOWER" | grep -qE '(implement .+ (for|in|to|with)|build (a|the|new)|create (a|the|new)|refactor|write (a|the|new)|add .*(feature|support|functionality)|fix (the|this|all)|migrate|redesign|overhaul)'; then
  echo "Hint: Substantial task - consider breaking down into steps"
  exit 0
fi

# Completion → log to aissist + check CLAUDE.md
if echo "$PROMPT_LOWER" | grep -qE '^(done|finished|completed|that.s (it|all)|looks good|ship it|lgtm|ready to (commit|merge|push)|wrap up|all (set|done))'; then
  echo "Hint: Use /aissist:log to record what was done, capture learnings"
  if [ -d ".git" ] && { [ -f "CLAUDE.md" ] || [ -f ".claude/CLAUDE.md" ]; }; then
    MODIFIED=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|py|go|rs|tex|sty|cls)$' | wc -l | tr -d ' ')
    [ "$MODIFIED" -gt 0 ] && echo "Hint: $MODIFIED source files changed - consider updating CLAUDE.md"
  fi
  exit 0
fi
