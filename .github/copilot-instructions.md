# Copilot Instructions

## Build, test, and lint commands

- Install dependencies with `npm install`.
- Sync the upstream `pajussara_tui_comp` CDN files with `npm run sync:pajussara`.
- Run the TUI in development with `npm run dev`.
- Refresh the lockfile with `npm run lockfile:sync`.
- Check lockfile drift with `npm run lockfile:sync-check`.
- Lint the lockfile with `npm run lockfile:lint`.
- Format the repository with `npm run format`.
- Check formatting with `npm run format:check`.
- Lint the codebase with `npm run lint`.
- Lint JavaScript/TypeScript with `npm run lint:js`.
- Lint Markdown with `npm run lint:md`.
- Run the committed Jest suite with `npm test`.
- Collect Jest coverage with `npm run test:coverage`.
- Build the app with `npm run build`.
- Run the built CLI with `npm run start`.
- Type-check the project with `npm run typecheck`.

The repository now includes a committed lint configuration. Prefer the published lint scripts above instead of inventing alternate commands.

## High-level architecture

This repository is a Node.js ESM CLI built with **TypeScript**, **React**, and **Ink**. The entrypoint is `src/index.tsx`, which renders the TUI, and the main screen component lives in `src/app.tsx`.

The current TUI renders the upstream `DirectoryTextBrowserWithStatusBar` component from `pajussara_tui_comp`, backed by the mirrored directory-browser primitives exposed through `src/pajussara-cdn.ts`. This repository does not install that library from npm; instead, `scripts/sync-pajussara-cdn.mjs` mirrors the pinned compiled files from the jsDelivr GitHub CDN into `vendor/pajussara_tui_comp/`, and package import aliases expose those files to the app.

Application-specific behavior should stay in `src/`, while the generated CDN mirror remains an implementation detail that can be refreshed from the upstream ref. The current app roots the directory browser at `/home/mpb/Documents/GitHub` and renders `git status --short --branch` output for the selected folder in the right pane.

## Key conventions

- Keep the repository aligned with the README's stated scope: a Git-focused terminal UI built with TypeScript and Ink, with MCP as part of the integration surface.
- Keep imports and packaging compatible with the repository's ESM setup (`"type": "module"` and TypeScript `NodeNext` module settings), including `.js` extension imports between compiled local modules.
- Treat `vendor/pajussara_tui_comp/` as generated code from jsDelivr; change the sync script or upstream ref instead of hand-editing mirrored files.
- Consume the CDN-backed component through the local wrapper/import aliases rather than scattering direct vendor paths throughout the application.
- `src/app.tsx` treats the selected directory as the execution context for Git commands; keep folder-specific command execution tied to the current `DirectoryTextBrowserWithStatusBar` selection.
- Follow the existing environment-file convention from `.gitignore`: ignore local `.env` and `.env.*` files, but keep `.env.example` tracked when example configuration is needed.
- Respect the existing generated-artifact boundaries from `.gitignore`; compiled output, coverage data, logs, caches, and dependency directories should stay uncommitted unless the repository structure changes intentionally.
- Ink UI behavior should live in React components under `src/`, with `src/index.tsx` kept as the thin CLI bootstrap.
- For documentation-only reviews, keep conclusions anchored to files that are actually present in the provided context; if package manifests, scripts, or source files are out of scope, mark those checks as inconclusive instead of inferring compliance.
- Do not claim version badges, JSDoc/TSDoc examples, or terminology evidence unless the exact supporting text is visible in the files under review.
