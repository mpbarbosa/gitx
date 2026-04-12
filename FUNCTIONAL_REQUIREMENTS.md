# FUNCTIONAL_REQUIREMENTS

## Purpose

`gitx` provides an Ink-based terminal UI for browsing local repositories and inspecting Git state without leaving the terminal.

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
- The project must continue to build with `npm run build` and type-check with `npm run typecheck`.

## Current Gaps

- There is no committed automated test suite yet.
- There is no committed lint configuration yet.
- Workflow automation must treat those gaps as intentional current state rather than missing scripts to invent.

## Roadmap — Minor Issues

> Populated by the `fix-log-issues` skill. Each item was verified against the
> live codebase before being marked done.

| ID | Source step | Description | File / Path | Priority | Status |
|----|-------------|-------------|-------------|----------|--------|
| RI-001 | step_05 | Documented the `.github` directory in the main project docs. | README.md | Low | done |
| RI-002 | step_13 | Removed the markdown list-indentation violation in the requirements doc. | FUNCTIONAL_REQUIREMENTS.md | Low | done |
