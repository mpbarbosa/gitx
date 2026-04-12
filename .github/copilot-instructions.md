# Copilot Instructions

## Build, test, and lint commands

- Install dependencies with `npm install`.
- Sync the upstream `pajussara_tui_comp` CDN files with `npm run sync:pajussara`.
- Run the TUI in development with `npm run dev`.
- Build the app with `npm run build`.
- Run the built CLI with `npm run start`.
- Type-check the project with `npm run typecheck`.

There is not a committed test suite or lint configuration yet, so do not invent `npm test` or `npm run lint`. There is also no single-test command until a test runner is added.

## High-level architecture

This repository is a Node.js ESM CLI built with **TypeScript**, **React**, and **Ink**. The entrypoint is `src/index.tsx`, which renders the TUI, and the main screen component lives in `src/app.tsx`.

The TUI base is the upstream `DirectoryTextBrowser` component from `pajussara_tui_comp`. This repository does not install that library from npm; instead, `scripts/sync-pajussara-cdn.mjs` mirrors the pinned compiled files from the jsDelivr GitHub CDN into `vendor/pajussara_tui_comp/`, and package import aliases expose those files to the app.

Application-specific behavior should stay in `src/`, while the generated CDN mirror remains an implementation detail that can be refreshed from the upstream ref. The current app roots the directory browser at `/home/mpb/Documents/GitHub` and renders `git status --short --branch` output for the selected folder in the right pane.

## Key conventions

- Keep the repository aligned with the README's stated scope: a Git-focused terminal UI built with TypeScript and Ink, with MCP as part of the integration surface.
- Keep imports and packaging compatible with the repository's ESM setup (`"type": "module"` and TypeScript `NodeNext` module settings), including `.js` extension imports between compiled local modules.
- Treat `vendor/pajussara_tui_comp/` as generated code from jsDelivr; change the sync script or upstream ref instead of hand-editing mirrored files.
- Consume the CDN-backed component through the local wrapper/import aliases rather than scattering direct vendor paths throughout the application.
- `src/app.tsx` treats the selected directory as the execution context for Git commands; keep folder-specific command execution tied to the current `DirectoryTextBrowser` selection.
- Follow the existing environment-file convention from `.gitignore`: ignore local `.env` and `.env.*` files, but keep `.env.example` tracked when example configuration is needed.
- Respect the existing generated-artifact boundaries from `.gitignore`; compiled output, coverage data, logs, caches, and dependency directories should stay uncommitted unless the repository structure changes intentionally.
- Ink UI behavior should live in React components under `src/`, with `src/index.tsx` kept as the thin CLI bootstrap.
