# Proposal: Add Instance Description

## Summary
Add an optional "description" prompt during `aissist init` that allows users to provide a one-line high-level description (northstar) of what this aissist instance is about. This description is stored in a simple markdown file and helps users remember the purpose of project-specific instances.

## Motivation
When users create multiple aissist instances across different projects, it can be unclear what each instance is for. A brief description like "Personal goal tracking for Q1 career development" or "Project Apollo sprint management" provides immediate context when returning to a project after time away.

## Scope
- **In scope**: Interactive prompt during init, storage as `DESCRIPTION.md`, display in relevant commands
- **Out of scope**: Complex multi-line editors, version history, programmatic description management commands

## Approach
1. Add optional interactive prompt after storage initialization asking "What is this aissist instance for? (optional, press Enter to skip)"
2. Store the response in `.aissist/DESCRIPTION.md` as a single-line markdown file
3. Skip the prompt in non-TTY environments
4. Support a `--description` flag for non-interactive init

## Affected Capabilities
- `onboarding-prompts` - New prompt in init flow
- `storage-system` - New `DESCRIPTION.md` file

## Trade-offs
- **Simplicity vs. Features**: A single-line description is minimal but sufficient for the use case
- **File vs. Config**: Storing in a dedicated markdown file (vs. config.json) keeps it human-readable and editable

## Open Questions
None - implementation is straightforward.
