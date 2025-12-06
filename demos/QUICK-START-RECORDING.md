# Quick Start: Record Demo 4 in 10 Minutes

## Prerequisites Check
```bash
# 1. VHS installed?
which vhs || brew install vhs

# 2. Aissist built?
cd /path/to/aissist && npm run build

# 3. Ready to record!
```

---

## 5-Minute Setup

### Step 1: Create Demo Environment (2 min)
```bash
# Create temp demo directory
mkdir -p /tmp/aissist-demo-2025
cd /tmp/aissist-demo-2025

# Set local storage
export AISSIST_PATH=./.aissist

# Create directory structure
mkdir -p .aissist/{goals,history,reports}
mkdir -p .aissist/context/fitness/{goals,history}
mkdir -p .aissist/context/creative/{goals,history}
```

### Step 2: Populate Mock Data (3 min)
```bash
# Copy this entire block and paste into terminal

# Main goal (work)
cat > .aissist/goals/2025-01-01.md << 'EOF'
---
schema_version: "1.0"
timestamp: "09:00"
codename: get-promoted-to-senior-engineer
deadline: "2025-12-31"
---

Get promoted to senior engineer
EOF

# Fitness goal
cat > .aissist/context/fitness/goals/2025-01-01.md << 'EOF'
---
schema_version: "1.0"
timestamp: "09:15"
codename: run-my-first-marathon
deadline: "2025-11-01"
---

Run my first marathon
EOF

# Creative goal
cat > .aissist/context/creative/goals/2025-09-01.md << 'EOF'
---
schema_version: "1.0"
timestamp: "10:00"
codename: launch-my-photography-portfolio
deadline: "2025-09-01"
---

Launch my photography portfolio
EOF

# Work history entries
cat > .aissist/history/2025-02-15.md << 'EOF'
---
schema_version: "1.0"
timestamp: "14:30"
---

Shipped new dashboard - 2 weeks ahead of schedule
EOF

cat > .aissist/history/2025-11-15.md << 'EOF'
---
schema_version: "1.0"
timestamp: "15:00"
---

Led team retrospective, mentored 2 junior developers
EOF

# Fitness history entries
cat > .aissist/context/fitness/history/2025-05-20.md << 'EOF'
---
schema_version: "1.0"
timestamp: "06:45"
---

Ran 10 miles today - new personal record!
EOF

cat > .aissist/context/fitness/history/2025-11-10.md << 'EOF'
---
schema_version: "1.0"
timestamp: "11:30"
---

Marathon complete: 4:15:30 finish time
EOF

# Creative history entry
cat > .aissist/context/creative/history/2025-09-05.md << 'EOF'
---
schema_version: "1.0"
timestamp: "19:00"
---

Portfolio site launched - 500 visitors first week!
EOF

# Year-in-review report (copy from sample)
cp /path/to/aissist/demos/sample-year-review.md .aissist/reports/2025-year-review.md

echo "✅ Mock data created!"
```

---

## Record Demo (3 min)

### Option A: VHS Automated (Recommended)
```bash
# From your demo directory
cd /tmp/aissist-demo-2025

# Run VHS
vhs /path/to/aissist/demos/demo-4-year-review.tape

# Wait ~2 minutes for rendering
# Output: demo-4-year-review.gif
```

### Option B: Manual Recording (More Control)
```bash
# Start recording
asciinema rec demo-4-year-review.cast

# Follow the script:
# (Type commands slowly, pause between scenes)

# Act 1: Goals
echo "# January 1st: Setting goals for the year"
aissist goal 'Get promoted to senior engineer' --deadline '2025-12-31'
aissist context fitness goal 'Run my first marathon' --deadline '2025-11-01'
aissist context creative goal 'Launch my photography portfolio' --deadline '2025-09-01'

# Act 2: Journey
clear
echo "# February: Work wins"
aissist history log 'Shipped new dashboard - 2 weeks ahead of schedule'

clear
echo "# May: Fitness progress"
aissist context fitness history log 'Ran 10 miles today - new personal record!'

clear
echo "# September: Creative launch"
aissist context creative history log 'Portfolio site launched - 500 visitors first week!'

clear
echo "# November: Marathon complete!"
aissist context fitness history log 'Marathon complete: 4:15:30 finish time'
aissist history log 'Led team retrospective, mentored 2 junior developers'

# Act 3: The Magic
clear
echo "# December 31st: Time to reflect"
aissist report 'this year'  # Or: cat .aissist/reports/2025-year-review.md
sleep 10

# Act 4: The Kicker
clear
echo "# One tool. Three contexts. Endless possibilities."
aissist recall 'what was my biggest win this year?'
sleep 5

# Closing
clear
echo "# Your life is worth remembering."
echo "# github.com/realdam/aissist"
sleep 3

# Stop recording
exit

# Convert to GIF
agg demo-4-year-review.cast demo-4-year-review.gif
```

---

## Post-Production (2 min)

### Optimize GIF Size
```bash
# If file is > 5MB
gifsicle -O3 --colors 256 demo-4-year-review.gif -o demo-4-year-review-optimized.gif

# Check size
ls -lh demo-4-year-review*.gif
```

### Create Social Variants
```bash
# Twitter teaser (15 seconds)
ffmpeg -i demo-4-year-review.gif -t 15 -vf scale=480:320 twitter-teaser.gif

# Instagram vertical (60 seconds)
ffmpeg -i demo-4-year-review.gif -t 60 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" instagram-vertical.mp4
```

---

## Quick Troubleshooting

### VHS Issues
**Problem**: "command not found: aissist"
**Fix**:
```bash
# Build and link aissist
cd /path/to/aissist
npm run build
npm link

# Or use absolute path in VHS tape:
# Type "/path/to/aissist/node dist/index.js goal add ..."
```

**Problem**: Commands timeout
**Fix**: Increase Sleep times in VHS tape (Line 26, 45, etc.)

**Problem**: GIF is too large (> 5MB)
**Fix**:
```bash
# Reduce playback speed (1.5 → 1.2)
# Or optimize with gifsicle
gifsicle -O3 --colors 256 input.gif -o output.gif
```

### Missing Report Command
**Problem**: `aissist report` doesn't exist yet
**Fix**: Replace in VHS tape:
```tape
# Instead of:
Type "aissist report 'this year'"

# Use:
Type "cat ~/.aissist/reports/2025-year-review.md"
```

---

## Upload Checklist

### YouTube
```
✅ Upload video
✅ Title: "I Tracked My Entire Year in Markdown - Here's What Happened"
✅ Description: (copy from youtube-assets.md)
✅ Tags: (copy from youtube-assets.md)
✅ Thumbnail: Create in Canva (1280x720px)
✅ Set to Public
```

### README
```
✅ Move GIF to demos/demo-4-year-review.gif
✅ Update README.md "Coming soon" to actual GIF
✅ Commit and push
```

### Social Media
```
✅ Twitter: Post 15s teaser with link
✅ LinkedIn: Professional angle (performance reviews)
✅ Reddit: r/productivity, r/CLI
✅ Hacker News: Tuesday-Thursday, 8-10am PT
```

---

## Time Estimates

- **Setup mock data**: 3 minutes
- **Record with VHS**: 2 minutes (automated) or 5 minutes (manual)
- **Post-production**: 2 minutes
- **Upload & launch**: 10 minutes

**Total**: 15-20 minutes from scratch to published demo

---

## Quick Links

- **Full Production Guide**: `DEMO-4-PRODUCTION-GUIDE.md`
- **YouTube Assets**: `youtube-assets.md`
- **Summary**: `DEMO-4-SUMMARY.md`
- **VHS Tape**: `demo-4-year-review.tape`
- **Sample Report**: `sample-year-review.md`

---

## One-Command Setup (Copy-Paste)

```bash
# Run this entire block to set up and record in one go:

# 1. Create environment
mkdir -p /tmp/aissist-demo-2025 && cd /tmp/aissist-demo-2025
export AISSIST_PATH=./.aissist
mkdir -p .aissist/{goals,history,reports}
mkdir -p .aissist/context/{fitness,creative}/{goals,history}

# 2. Create mock data (paste all cat commands from Step 2 above)

# 3. Record
vhs /path/to/aissist/demos/demo-4-year-review.tape

# 4. Optimize
gifsicle -O3 --colors 256 demo-4-year-review.gif -o optimized.gif

# 5. Copy to project
cp optimized.gif /path/to/aissist/demos/demo-4-year-review.gif

echo "🎉 Demo ready! Upload to YouTube and launch!"
```

---

**Need help?** See full guides in `demos/` directory.

**Ready to launch?** Follow the checklist in `youtube-assets.md`.

**Let's make this viral!** 🚀
