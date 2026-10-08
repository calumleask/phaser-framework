# Upgrade framework to TypeScript 6

**Repository:** framework
**Task ID:** 10-typescript-6-transition
**Dependencies:** Task 09 in this repository
**Status:** Planned

## Objective
Upgrade framework to TypeScript 6 without breaking the framework/game integration or foreclosing a future Expo React Native WebView host.

## Scope and acceptance criteria
Record existing TypeScript and dependency versions. Upgrade to latest compatible stable 6.x after verifying compatibility. Modernise tsconfig for TS6 and upcoming TS7: explicit module/moduleResolution, strictness, lib, types, and deprecation cleanup; do not blindly set options unsupported by the chosen builder. Fix errors without weakening strictness. Validate declaration output and downstream game consumption. Do not upgrade to TS7 in this task.

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
