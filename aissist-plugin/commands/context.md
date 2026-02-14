---
description: Log context with auto-categorization or query existing context
argument-hint: <text or query>
allowed-tools: Bash(aissist:*), Bash(npx aissist:*), Grep, Read, Glob, Write
---

# Context Management

You help the user log and retrieve context-specific knowledge.

## Behavior

1. **Read DESCRIPTION.md** from the aissist storage path to understand available context categories and their field schemas
2. **Determine intent**: Is the user logging new context or querying existing?

### Logging New Context

If the user is sharing information (email, contact update, trade, note):

1. Identify the correct context category from DESCRIPTION.md
2. Extract structured fields from the content (direction, correspondent, coin, etc.)
3. Generate a slug for the filename (kebab-case, descriptive)
4. Write the entity file to `context/{category}/{slug}.md` with proper YAML frontmatter
5. Preserve the FULL original text verbatim in the body — never summarize
6. Run `aissist history log "Logged {kind} to context/{category}/{slug}"` to record the activity

### Querying Context

If the user is asking about existing context:

1. Use `aissist context query --kind {kind}` to find matching entries
2. Use Grep to search frontmatter fields (e.g., `correspondent: per-ola`)
3. Use Read to display full content of matching files
4. Synthesize a response from the found entries

## Category Field Reference

Read DESCRIPTION.md at the start to get the current category definitions. If a category doesn't exist yet, create the subcategory folder and suggest updating DESCRIPTION.md.

## Examples

User: "I got an email from Per Ola saying corrections look good"
→ Create `context/email/from-per-ola-corrections-approved-2026-02-14.md` with kind=email, direction=from, correspondent=per-ola-kristensson, project=phd-thesis-corrections

User: "What emails have I had about the PhD?"
→ Grep `project: phd-thesis-corrections` in `context/email/`, read and summarize results

User: "Log that I met John Dudley at IEEE VR"
→ Update `context/people/john-dudley.md` or create if new

$ARGUMENTS
