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
npm run lockfile:sync
npm run lockfile:sync-check
npm run lockfile:lint
npm run format
npm run format:check
npm run lint
npm run lint:js
npm run lint:md
npm test
npm run test:coverage
npm run build
npm run start
npm run typecheck
```

`pajussara_tui_comp` is pulled from the jsDelivr GitHub CDN into a generated `vendor/` directory when these commands run. The current app uses its `DirectoryTextBrowserWithStatusBar` component as the base two-pane TUI, roots the browser at `/home/mpb/Documents/GitHub`, shows `git status --short --branch` in the right pane by default, lets you switch that pane to `git diff` with `[d]` or `git branch` with `[b]`, opens a second-level `git log` options bar with `[l]` before running `git log` or `git log --oneline`, refreshes remote refs with `git fetch --prune` on demand via `[r]`, and runs `git pull` with `[p]` or `git push` with `[x]` against the selected folder. The primary status bar now shows which Git action is running, completed, or failed so networked commands are visible instead of silent.

## Dependency update policy

- Update dependencies through `package.json` and commit the matching `package-lock.json` in the same change.
- Run `npm run lockfile:sync` after any dependency or version-range edit so the lockfile stays deterministic.
- Use `npm run lockfile:sync-check` to confirm the committed lockfile is current, and `npm run lockfile:lint` to enforce HTTPS-only npm registry URLs plus integrity and package-name validation.
- CI runs both lockfile checks before the rest of the validation pipeline so stale or suspicious lockfiles fail fast.

## Workflow automation

This repository now includes `.workflow-config.yaml` plus `README.md`, `docs/ARCHITECTURE.md`, `docs/FUNCTIONAL_REQUIREMENTS.md`, and `CHANGELOG.md` so `ai_workflow.js` has the project metadata and documentation context it expects.

Repository automation metadata and project-specific Copilot guidance live under `.github/`.

The workflow configuration can now run the committed lockfile, format, lint, and test surface through `npm run lockfile:sync-check`, `npm run lockfile:lint`, `npm run format:check`, `npm run lint`, `npm test`, and `npm run test:coverage`.
