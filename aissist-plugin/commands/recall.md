---
description: Semantic search across your aissist memory
argument-hint: <query>
allowed-tools: Bash(aissist:*), Bash(npx aissist:*), Grep, Read, Glob
---

# Recall from Memory

Ask questions about your goals, history, reflections, and context using AI-powered semantic search.

## Usage

```
/aissist:recall <query> [--raw]
```

## Arguments

- `query` (required): Your question or search query

## Options

- `--raw`: Output raw Markdown without terminal formatting (recommended for Claude Code)

## Examples

```
/aissist:recall "what did I work on last week?" --raw
/aissist:recall "show my progress on the authentication feature" --raw
/aissist:recall "what goals am I currently working on?" --raw
/aissist:recall "what did I learn about React this month?" --raw
```

## What it does

1. Searches your aissist memory (goals, history, reflections, context)
2. Uses AI to understand your question semantically
3. Finds relevant entries across all your data
4. Provides a summarized answer with references

## Requirements

- aissist initialized (run `aissist init` first)
- Claude API key configured (for semantic search)

## Tips

- Always use `--raw` flag when using with Claude Code for proper markdown parsing
- Ask natural questions - the AI understands context
- Be specific about timeframes for better results
- You can ask about goals, past work, reflections, or any logged context

---

$ARGUMENTS
