# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.10/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2026-04-13

### Added

- Added contextual status-bar feedback for `git fetch --prune`, `git pull`, and `git push` so the active or last Git action remains visible.

### Changed

- Clear stale command feedback when switching repositories or text views so the primary status bar reflects the current context.

## [1.2.0] - 2026-04-13

### Added

- Added an explicit `[r]` shortcut that runs `git fetch --prune` for the selected repository.
- Added ESLint and markdownlint-cli2 configuration with `npm run lint`, `npm run lint:js`, and `npm run lint:md`.
- Added a GitHub Actions CI workflow that runs linting, tests, build, and type-check validation.

### Changed

- Removed the implicit fetch side effect from the default `git status` view so switching views no longer performs network work automatically.
- Tightened the workflow-facing documentation analysis guidance so `step_02` stays anchored to the markdown files actually in scope.
- Aligned the workflow-facing docs with the live `DirectoryTextBrowserWithStatusBar` UI and documented the `git fetch --prune`, `git pull`, and `git push` shortcuts in `README.md`.

## [1.1.10] - 2026-04-12

### Added

- Added workflow-facing project documentation in `ARCHITECTURE.md` and `FUNCTIONAL_REQUIREMENTS.md`.
- Added `.workflow-config.yaml` so `ai_workflow.js` can execute with project-specific settings.
- Added `.ai_workflow/` to `.gitignore` to keep generated workflow artifacts untracked.
- Added a Jest-based `npm test` workflow for the committed suite under `test/`.
- Added Jest configuration and test-only TypeScript configuration for the Ink app.

### Changed

- Updated the committed tests to run under the repository's ESM setup.
- Updated README and project architecture/requirements guidance for the v1.1.10 validation workflow.
