# VHS Documentation: https://github.com/charmbracelet/vhs
#
# Aissist Demo 1: Developer Progress Tracking
# Theme: From scattered commits to standups in seconds
# Duration: ~32 seconds

# Output Configuration
Output demo-1-progress.gif

# Set up the terminal
Set FontSize 14
Set FontFamily "Monaco"
Set Width 1200
Set Height 600
Set Theme "Dracula"
Set TypingSpeed 30ms
Set PlaybackSpeed 2

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 1 — Import GitHub activity (0:00-0:10)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Type "aissist history log --from 'today'"
Enter
# Wait for GitHub import + AI summarization
Sleep 10s

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 2 — Add manual entry (0:10-0:14)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Sleep 1s
Type "aissist history log 'Fixed auth bug and reviewed 3 PRs'"
Enter
Sleep 2s

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 3 — Generate AI proposal (0:14-0:34)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Sleep 1s
Type "aissist propose now"
Enter
# Wait for Claude analysis + menu interaction
Sleep 30s

# Final pause with cursor blinking
Sleep 30s
