# FUNCTIONAL_REQUIREMENTS

## Purpose

`gitx` provides an Ink-based terminal UI for browsing local repositories and inspecting Git state without leaving the terminal.

**Current version:** 1.1.7

## Functional Scope

### Repository browsing

- The application must browse directories under `/home/mpb/Documents/GitHub`.
- The left pane must allow selecting a child directory as the active repository context.

### Git status view

- The default right-pane view must show `git status --short --branch` for the selected directory.
- If the selected directory is not a Git repository, the UI must show an informational message instead of crashing.

### Alternate Git views

- The UI must switch the right pane between `git status`, `git diff`, `git branch`, and `git log`.
- `git log` must support no additional options and `--oneline`.

### Command execution

- `git pull` and `git push` must execute against the selected directory.
- Command failures must surface a readable error message in the status bar.
- Git commands must use the selected directory as the working directory.

### Keyboard interaction

- The UI must support keyboard navigation for directory selection and text-pane paging.
- The primary shortcuts must include `q`, `Tab`, `s`, `d`, `b`, `l`, `p`, and `x`.
- The Git log submenu must support `1`, `2`, arrow keys, `Enter`, and `Esc`.

## Non-Functional Requirements

- The codebase must remain compatible with Node.js ESM and TypeScript `NodeNext`.
- Generated vendor files must be refreshed through `npm run sync:pajussara`, not hand-edited.
- Application-specific behavior must remain in `src/`.
- JavaScript/TypeScript and Markdown linting must run through `npm run lint`.
- The committed test suite under `test/` must run through `npm test`.
- The project must continue to build with `npm run build` and type-check with `npm run typecheck`.

## Roadmap — Minor Issues

> Populated by the `fix-log-issues` skill. Each item was verified against the
> live codebase before being marked done.

| ID | Source step | Description | File / Path | Priority | Status |
| -- | ----------- | ----------- | ----------- | -------- | ------ |
| RI-001 | step_05 | Documented the `.github` directory in the main project docs. | README.md | Low | done |
| RI-002 | step_13 | Removed the markdown list-indentation violation in the requirements doc. | FUNCTIONAL_REQUIREMENTS.md | Low | done |
| RI-003 | step_02 | Updated stale documentation that claimed the repo had no committed test suite. | README.md, ARCHITECTURE.md, FUNCTIONAL_REQUIREMENTS.md, .github/copilot-instructions.md | Medium | done |
| RI-004 | step_02 | Refreshed `.workflow-config.yaml` so workflow metadata, docs roots, and test execution settings match the live repository. | .workflow-config.yaml | Medium | done |
| RI-005 | step_20 | Added explicit top-level failure handling to the pajussara CDN sync script. | scripts/sync-pajussara-cdn.mjs | Medium | done |
| RI-006 | step_05 | Removed stale workflow metadata that pointed at a nonexistent `docs/` root and `FLOWCHART.md`. | .workflow-config.yaml, FUNCTIONAL_REQUIREMENTS.md | Medium | done |
