# VHS Documentation: https://github.com/charmbracelet/vhs
#
# Aissist Demo 2: Semantic Memory Search
# Theme: Remember everything, even what you forgot you knew
# Duration: ~30 seconds

# Output Configuration
Output demo-2-memory.gif

# Set up the terminal
Set FontSize 14
Set FontFamily "Monaco"
Set Width 1200
Set Height 600
Set Theme "Dracula"
Set TypingSpeed 30ms
Set PlaybackSpeed 2

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 1 — Log activities (0:00-0:09)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Type "aissist history log 'Discussed Redis caching strategy with team'"
Enter
Sleep 2s

Type "aissist history log 'Updated API rate limiting with token bucket'"
Enter
Sleep 2s

Type "aissist history log 'Refactored user authentication flow'"
Enter
Sleep 3s

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 2 — Semantic recall (0:09-0:30)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Sleep 1s
Type "aissist recall 'what did we decide about performance optimization?'"
Enter
# Wait for Claude semantic search
Sleep 18s

# Final pause with cursor blinking
Sleep 25s
