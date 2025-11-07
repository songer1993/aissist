# Tasks for beautify-markdown-output

## Implementation Order

### Phase 1: Core Infrastructure
1. - [ ] **Install markdown rendering dependencies**
   - [ ] Add `marked` to package.json dependencies
   - [ ] Add `marked-terminal` to package.json dependencies
   - [ ] Run `npm install`
   - [ ] Update package-lock.json
   - **Validation**: Dependencies installed successfully, no conflicts

2. - [ ] **Create markdown rendering utility** (src/utils/markdown.ts)
   - [ ] Import `marked` and `TerminalRenderer` from `marked-terminal`
   - [ ] Create `renderMarkdown(text: string, raw?: boolean)` function
   - [ ] Configure marked-terminal with sensible defaults (colors, width)
   - [ ] Handle errors gracefully (fallback to raw on render failure)
   - [ ] Export utility for use in commands
   - **Validation**: Utility renders sample markdown correctly

3. - [ ] **Add unit tests for markdown utility** (src/utils/markdown.test.ts)
   - [ ] Test rendering with various markdown elements
   - [ ] Test raw mode returns unformatted text
   - [ ] Test error handling and fallback
   - [ ] Test terminal capability detection
   - **Validation**: All tests pass, coverage >80%

### Phase 2: Command Integration
4. - [ ] **Update propose command** (src/commands/propose.ts)
   - [ ] Add `--raw` option to commander definition
   - [ ] Import `renderMarkdown` utility
   - [ ] Wrap response output with `renderMarkdown(response, options.raw)`
   - [ ] Update help text to document `--raw` flag
   - [ ] Test with and without `--raw` flag
   - **Validation**: Command renders beautifully by default, raw with flag

5. - [ ] **Update recall command** (src/commands/recall.ts)
   - [ ] Add `--raw` option to commander definition
   - [ ] Import `renderMarkdown` utility
   - [ ] Wrap answer output with `renderMarkdown(answer, options.raw)`
   - [ ] Update help text to document `--raw` flag
   - [ ] Test with and without `--raw` flag
   - **Validation**: Command renders beautifully by default, raw with flag

### Phase 3: Documentation & Polish
6. - [ ] **Update README** (README.md)
   - [ ] Add section on formatted output
   - [ ] Show examples with screenshots or ASCII art
   - [ ] Document `--raw` flag usage
   - [ ] Add note for AI agents and piping
   - **Validation**: Documentation is clear and accurate

7. - [ ] **Update plugin documentation** (aissist-plugin/README.md)
   - [ ] Document when Claude Code should use `--raw` flag
   - [ ] Add examples for AI consumption
   - [ ] Update command examples
   - **Validation**: Plugin docs reflect new flags

8. - [ ] **Manual testing**
   - [ ] Test in various terminals (iTerm2, Terminal.app, Windows Terminal)
   - [ ] Test piping output to files and other commands
   - [ ] Test with color and no-color terminals
   - [ ] Test with large and small outputs
   - [ ] Verify visual quality and readability
   - **Validation**: Works well in all test scenarios

## Dependencies & Parallelization
- **Can run in parallel**:
  - Tasks 1-3 (dependencies, utility, tests are independent)
- **Must run sequentially**:
  - Tasks 4-5 depend on tasks 1-3 (need utility and deps)
  - Tasks 6-8 depend on tasks 4-5 (need implementation complete)

## Notes
- **marked-terminal** handles terminal capability detection automatically
- Default rendering should work without additional configuration
- `--raw` flag ensures backward compatibility for scripts
- Consider adding `NO_COLOR` environment variable support (marked-terminal may handle this)
