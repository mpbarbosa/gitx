# gitx

TypeScript Ink TUI app for Git commands with MCP.

## Getting started

```bash
npm install
npm run dev
```

## Available commands

```bash
npm run sync:pajussara
npm run dev
npm run build
npm run start
npm run typecheck
```

`pajussara_tui_comp` is pulled from the jsDelivr GitHub CDN into a generated `vendor/` directory when these commands run. The current app uses its `DirectoryTextBrowserWithStatusBar` component as the base two-pane TUI, roots the browser at `/home/mpb/Documents/GitHub`, shows `git status --short --branch` in the right pane by default, lets you switch that pane to `git diff` with `[d]` or `git branch` with `[b]`, and opens a second-level `git log` options bar with `[l]` before running `git log` or `git log --oneline`.

## Workflow automation

This repository now includes `.workflow-config.yaml` plus the root documentation files `ARCHITECTURE.md`, `FUNCTIONAL_REQUIREMENTS.md`, and `CHANGELOG.md` so `ai_workflow.js` has the project metadata and documentation context it expects.

Repository automation metadata and project-specific Copilot guidance live under `.github/`.

The workflow configuration intentionally disables test and lint execution stages because the repository still lacks a configured test runner, `npm test` script, and lint setup, even though committed test files now exist under `test/`. Build and type-check stages remain available through the existing npm scripts.
