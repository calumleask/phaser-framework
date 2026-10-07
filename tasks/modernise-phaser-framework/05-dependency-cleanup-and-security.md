# Task 05 — Dependency Cleanup and Security Review

## Objective

Complete the general dependency modernisation after the core tooling and Phaser migrations.

## Analyse

Run and review:

- `npm outdated`
- `npm audit`

Inspect remaining dependencies manually.

Determine whether each remaining outdated package should be:

- upgraded
- retained
- replaced
- removed

Check for packages that are:

- unused
- deprecated
- abandoned
- redundant
- vulnerable
- only required by obsolete tooling

## Implementation

Upgrade safe remaining dependencies.

Remove unused dependencies where their lack of usage has been verified.

Replace obsolete dependencies only when there is a clear maintenance benefit.

Do not automatically replace small stable dependencies simply because alternatives exist.

Do not use:

`npm audit fix --force`

Analyse security findings individually.

## Verification

Run the complete repository validation suite after changes.

Run `npm outdated` and `npm audit` again.

Any intentionally outdated dependency must have a documented reason.

## Documentation

Update:

`docs/modernisation-plan.md`

Record:

- packages upgraded
- packages removed
- packages replaced
- intentionally retained versions
- remaining audit findings
