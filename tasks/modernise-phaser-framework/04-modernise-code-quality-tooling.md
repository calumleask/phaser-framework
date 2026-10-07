# Task 04 — Modernise Code Quality Tooling

## Objective

Modernise and simplify the repository's linting, formatting and static-analysis tooling.

Use `docs/modernisation-plan.md` as the source for previously identified issues.

## Review

Inspect:

- ESLint
- TypeScript ESLint integration
- Prettier
- ignore files
- npm scripts
- duplicate formatting/linting tools
- obsolete ESLint plugins
- deprecated rules
- legacy configuration formats

## Implementation

Move to an appropriate current configuration.

Prefer:

- simple configuration
- TypeScript-aware linting where useful
- minimal plugins
- deterministic formatting
- useful rules rather than excessive stylistic rules

Remove obsolete dependencies/configuration.

Do not weaken meaningful rules simply to make lint pass.

Fix legitimate lint problems exposed by the migration.

Avoid unrelated source refactoring.

## Scripts

Ensure package scripts provide clear commands for relevant operations such as:

- lint
- lint fixes
- formatting
- formatting checks
- type checking

Avoid redundant scripts.

## Verification

Run:

- lint
- formatting check
- typecheck
- tests
- production build

Update the modernisation plan after completion.
