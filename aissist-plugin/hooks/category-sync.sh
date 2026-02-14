#!/bin/bash
# category-sync.sh — Detect new context categories and suggest DESCRIPTION.md updates
# Triggered on PostToolUse(Write) to check if new context subcategories were created

# Find aissist storage
AISSIST_DIR="$HOME/.aissist"
if [ ! -d "$AISSIST_DIR" ]; then
  # Try local
  DIR="$(pwd)"
  while [ "$DIR" != "/" ]; do
    if [ -d "$DIR/.aissist" ]; then
      AISSIST_DIR="$DIR/.aissist"
      break
    fi
    DIR="$(dirname "$DIR")"
  done
fi

[ ! -d "$AISSIST_DIR" ] && exit 0

CONTEXT_DIR="$AISSIST_DIR/context"
DESCRIPTION="$AISSIST_DIR/DESCRIPTION.md"

[ ! -d "$CONTEXT_DIR" ] && exit 0
[ ! -f "$DESCRIPTION" ] && exit 0

# Get documented categories from DESCRIPTION.md
DOCUMENTED=$(grep -oP '^\s*-\s+\K\w+(?=:)' "$DESCRIPTION" 2>/dev/null || true)

# Get actual context subdirectories
ACTUAL=$(ls -d "$CONTEXT_DIR"/*/ 2>/dev/null | xargs -I{} basename {} | sort)

# Find undocumented categories
UNDOCUMENTED=""
for dir in $ACTUAL; do
  if ! echo "$DOCUMENTED" | grep -qw "$dir"; then
    UNDOCUMENTED="$UNDOCUMENTED $dir"
  fi
done

if [ -n "$UNDOCUMENTED" ]; then
  echo "New context categories detected but not in DESCRIPTION.md:$UNDOCUMENTED"
  echo "Consider updating DESCRIPTION.md to document these categories."
fi
