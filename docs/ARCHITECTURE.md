# ARCHITECTURE

## Overview

`gitx` is a Node.js ESM terminal UI built with TypeScript, React, and Ink. It presents a two-pane repository browser rooted at `/home/mpb/Documents/GitHub` and runs Git commands against the currently selected folder.

## Versioning

| Version | Milestone | Notes |
| --- | --- | --- |
| 1.3.3 | Command feedback in the status bar | Adds explicit per-command feedback for `git fetch --prune`, `git pull`, and `git push`, and clears stale command state when the user changes context. |
| 1.2.0 | Explicit Git refresh action | Replaces the implicit fetch during status rendering with an explicit `[r]` refresh action that runs `git fetch --prune` against the selected repository. |
| 1.1.10 | Runnable committed test suite | Adds a Jest-based `npm test` workflow for the existing `test/` suite and documents the supported validation path. |

The CLI bootstrap lives in `src/index.tsx`, which renders `App` from `src/app.tsx`. All user-facing behavior is implemented in React components under `src/`.

## Runtime Flow

1. `src/index.tsx` starts the Ink app.
2. `src/app.tsx` renders `DirectoryTextBrowserWithStatusBar`.
3. The left pane selects a directory under the configured root.
4. The right pane renders Git command output for the selected directory.
5. Git commands execute with the selected directory as `cwd`.

## Major Components

### `src/index.tsx`

- Thin CLI entrypoint.
- Imports `App` using ESM-compatible `.js` extension output semantics.
- Calls `render(<App />)`.

### `src/app.tsx`

- Owns the TUI state, keyboard handling, and Git command execution.
- Computes dynamic pane sizes from the terminal dimensions.
- Maps Git output into `TextListItem` entries for the right pane.
- Supports `git status`, `git diff`, `git branch`, `git log`, `git fetch --prune`, `git pull`, and `git push`.
- Keeps the status view side-effect free by separating remote refresh from status rendering.
- Tracks the currently running or last completed Git action so the status bar can show contextual command feedback.

### `src/pajussara-cdn.*`

- Local wrapper around the generated `vendor/pajussara_tui_comp/` mirror.
- Keeps application code decoupled from direct vendor paths.

### `scripts/sync-pajussara-cdn.mjs`

- Refreshes the generated vendor mirror from the pinned upstream CDN source.
- Runs before `dev`, `build`, `start`, and `typecheck`.

## Boundaries and Constraints

- `vendor/pajussara_tui_comp/` is generated and should not be hand-edited.
- `src/` contains application-specific logic and should remain the primary edit surface.
- The selected directory is the execution context for all Git commands.
- The project has committed lint and test workflows exposed through `npm run lint` and `npm test`.

## Build and Validation Surface

- Install dependencies with `npm install`.
- Sync generated vendor files with `npm run sync:pajussara`.
- Lint code and Markdown with `npm run lint`.
- Run tests with `npm test`.
- Run the TUI in development with `npm run dev`.
- Build with `npm run build`.
- Run the built CLI with `npm run start`.
- Type-check with `npm run typecheck`.
