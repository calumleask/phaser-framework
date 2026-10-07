# Task 02 — Modernise Build and TypeScript Tooling

## Objective

Modernise the project's Node, npm, TypeScript and build tooling based on the findings in:

`docs/modernisation-plan.md`

Do not upgrade Phaser as part of this task unless a minimal compatibility change is required for the tooling migration.

## Requirements

Review and update:

- supported Node version
- npm configuration
- `package.json`
- `package-lock.json`
- TypeScript
- `tsconfig.json`
- build/bundler tooling
- development server
- production build
- source maps
- static asset handling
- environment handling

Remove obsolete build dependencies when appropriate.

If the current bundler is obsolete or poorly supported, migrate to the replacement recommended by the modernisation plan.

Do not change build systems merely for novelty.

## TypeScript

Move towards a modern strict TypeScript configuration.

Enable strictness options where practical.

Do not:

- suppress errors
- introduce broad `any`
- weaken type safety
- perform unrelated application rewrites

Fix legitimate type problems exposed by the tooling upgrade.

## npm

Continue using npm.

Ensure the lockfile remains valid.

Do not use:

- `--force`
- `--legacy-peer-deps`

unless absolutely necessary and documented.

## Verification

Run all applicable:

- install
- typecheck
- lint
- tests
- development build
- production build

Existing game behaviour should remain unchanged.

## Documentation

Update `docs/modernisation-plan.md` with what was actually changed and any deviations from the plan.
