# Audit and migrate the framework build

**Repository:** framework
**Task ID:** 09-framework-build-modernisation
**Dependencies:** Existing modernisation tasks and current baseline
**Status:** Planned

## Objective
Audit and migrate the framework build without breaking the framework/game integration or foreclosing a future Expo React Native WebView host.

## Scope and acceptance criteria
Inspect Webpack entrypoints, output formats, consumers, aliases, asset loaders, declaration generation and the game copy script. Select Vite library mode or a dedicated library builder based on actual requirements; document decision. Migrate only framework-owned build files and dependencies. Preserve public API, output layout or explicitly coordinate a versioned contract change. Ensure deterministic clean build, ESM output compatible with game, source maps, and declaration files if applicable. Avoid bundling duplicate Phaser runtime unless intentional. Validate npm install, typecheck, tests, build and a game smoke integration.

## Mandatory constraints
- Inspect the repository before changing code; existing AGENTS.md and documentation are authoritative.
- Change only files owned by this repository. In the game repository, copied/generated framework output is read-only.
- Maintain separate framework and game responsibilities and avoid speculative refactors.
- Prefer the smallest reversible migration; explain any breaking change.
- Keep Phaser browser rendering intact; future React Native hosting means a WebView unless a later investigation establishes another supported approach.
- No new gameplay features in this task.

## Verification and deliverables
- Record baseline and final commands/results for install, lint, typecheck, tests and build (where scripts exist).
- Verify the sibling repository's consumption contract where relevant; clearly state any checks that could not run.
- Update the README or engineering docs with configuration, build commands, decisions and migration notes.
- Report changed files, decisions, risks, manual checks and any follow-up work.
