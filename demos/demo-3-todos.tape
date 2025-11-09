# VHS Documentation: https://github.com/charmbracelet/vhs
#
# Aissist Demo 3: AI-Enhanced Goal & Todo Management
# Theme: Your goals and todos that understand context
# Duration: ~35 seconds

# Output Configuration
Output demo-3-todos.gif

# Set up the terminal
Set FontSize 14
Set FontFamily "Monaco"
Set Width 1200
Set Height 600
Set Theme "Dracula"
Set TypingSpeed 30ms
Set PlaybackSpeed 2

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 1 — Add goal with deadline prompt (0:00-0:15)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Type "aissist goal add 'Ship authentication feature by Friday'"
Enter
# Wait for codename generation + deadline prompt appears
Sleep 12s
# Accept default deadline (Tomorrow)
Enter
Sleep 2s

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 2 — Add todos (0:15-0:20)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Type "Fix auth bug"
Enter
Sleep 1s

Type "aissist todo add 'Update security docs'"
Enter
Enter
Sleep 2s

# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻
# Scene 3 — Get AI suggestions (0:20-0:40)
# ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

Sleep 1s
Type "aissist propose now"
Enter
# Wait for Claude proposal generation
Sleep 30s

# Final pause with cursor blinking
Sleep 30s
