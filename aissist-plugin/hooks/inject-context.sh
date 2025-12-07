#!/bin/bash
# Hook script that injects active goals and recent history into Claude Code sessions
# Controlled by: aissist config context-injection enable/disable

# Check if context injection is enabled
STATUS=$(aissist config context-injection 2>/dev/null | grep -i "Enabled:" | awk '{print $2}')

# Exit silently if disabled or can't determine status
if [ "$STATUS" != "yes" ]; then
  exit 0
fi

# Collect goals - extract codenames and deadlines from plain output
# Format: codename (deadline: YYYY-MM-DD) or codename (no deadline)
GOALS_RAW=$(aissist goal list --plain 2>/dev/null)

# Parse goals: look for codename and deadline lines in YAML frontmatter
GOALS=""
CURRENT_CODENAME=""
CURRENT_DEADLINE=""

while IFS= read -r line; do
  # Extract codename
  if [[ "$line" =~ ^codename:\ *(.+)$ ]]; then
    CURRENT_CODENAME="${BASH_REMATCH[1]}"
  fi
  # Extract deadline
  if [[ "$line" =~ ^deadline:\ *\"?([0-9-]+)\"?$ ]]; then
    CURRENT_DEADLINE="${BASH_REMATCH[1]}"
  fi
  # Entry separator - output accumulated goal
  if [[ "$line" == "---" ]] && [ -n "$CURRENT_CODENAME" ]; then
    if [ -n "$CURRENT_DEADLINE" ]; then
      GOALS="${GOALS}  • ${CURRENT_CODENAME} (due: ${CURRENT_DEADLINE})\n"
    else
      GOALS="${GOALS}  • ${CURRENT_CODENAME} (ongoing)\n"
    fi
    CURRENT_CODENAME=""
    CURRENT_DEADLINE=""
  fi
done <<< "$GOALS_RAW"

# Handle last goal if any
if [ -n "$CURRENT_CODENAME" ]; then
  if [ -n "$CURRENT_DEADLINE" ]; then
    GOALS="${GOALS}  • ${CURRENT_CODENAME} (due: ${CURRENT_DEADLINE})\n"
  else
    GOALS="${GOALS}  • ${CURRENT_CODENAME} (ongoing)\n"
  fi
fi

# Collect recent history - extract timestamps and text
HISTORY_RAW=$(aissist history show --date "3 days ago" 2>/dev/null)
HISTORY=""
CURRENT_DATE=""
CURRENT_TEXT=""

while IFS= read -r line; do
  # Skip banner lines and empty lines
  [[ "$line" =~ ^[[:space:]]*[/_\\|] ]] && continue
  [[ "$line" =~ "Personal AI" ]] && continue
  [[ "$line" =~ ^ℹ ]] && continue
  [[ "$line" =~ ^## ]] && CURRENT_DATE="${line#\#\# }" && continue

  # Look for timestamp in frontmatter
  if [[ "$line" =~ ^timestamp:\ *\"?([0-9:]+)\"?$ ]]; then
    continue
  fi

  # Non-frontmatter, non-empty lines are likely content
  if [[ ! "$line" =~ ^(---|schema_version|timestamp|codename|goal|deadline): ]] && [ -n "$line" ] && [[ ! "$line" =~ ^[[:space:]]*$ ]]; then
    # Trim and add to history
    TEXT=$(echo "$line" | sed 's/^[[:space:]]*//' | head -c 80)
    if [ -n "$TEXT" ] && [ -n "$CURRENT_DATE" ]; then
      HISTORY="${HISTORY}  • [${CURRENT_DATE}] ${TEXT}\n"
    fi
  fi
done <<< "$HISTORY_RAW"

# Only output if we have content
if [ -n "$GOALS" ] || [ -n "$HISTORY" ]; then
  echo "Active context:"

  if [ -n "$GOALS" ]; then
    echo ""
    echo "Goals:"
    echo -e "$GOALS" | head -5
  fi

  if [ -n "$HISTORY" ]; then
    echo ""
    echo "Recent history (last 3 days):"
    echo -e "$HISTORY" | head -5
  fi
fi
