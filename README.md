# gitx

TypeScript Ink TUI app for Git commands with MCP.

## Getting started

```bash
npm install
npm test
npm run dev
```

## Available commands

```bash
npm run sync:pajussara
npm run dev
npm run lint
npm run lint:js
npm run lint:md
npm test
npm run build
npm run start
npm run typecheck
```

`pajussara_tui_comp` is pulled from the jsDelivr GitHub CDN into a generated `vendor/` directory when these commands run. The current app uses its `DirectoryTextBrowserWithStatusBar` component as the base two-pane TUI, roots the browser at `/home/mpb/Documents/GitHub`, shows `git status --short --branch` in the right pane by default, lets you switch that pane to `git diff` with `[d]` or `git branch` with `[b]`, opens a second-level `git log` options bar with `[l]` before running `git log` or `git log --oneline`, refreshes remote refs with `git fetch --prune` on demand via `[r]`, and runs `git pull` with `[p]` or `git push` with `[x]` against the selected folder. The primary status bar now shows which Git action is running, completed, or failed so networked commands are visible instead of silent.

## Workflow automation

This repository now includes `.workflow-config.yaml` plus the root documentation files `ARCHITECTURE.md`, `FUNCTIONAL_REQUIREMENTS.md`, and `CHANGELOG.md` so `ai_workflow.js` has the project metadata and documentation context it expects.

Repository automation metadata and project-specific Copilot guidance live under `.github/`.

The workflow configuration can now run the committed lint and test surface through `npm run lint` and `npm test`.
