# Task 01 — Audit and Modernisation Plan

## Objective

Analyse the existing Phaser TypeScript framework and produce a repository-specific modernisation plan.

This task is analysis only. Do not perform the dependency migration yet.

The project currently uses:

- npm
- TypeScript
- Phaser 3.55.2

## Analyse

Inspect the repository, including:

- `package.json`
- `package-lock.json`
- TypeScript configuration
- bundler/build configuration
- npm scripts
- source structure
- Phaser bootstrap
- scenes
- loaders
- GameObjects
- input
- events
- animations
- tweens
- physics
- audio
- scale configuration
- plugins
- tests
- ESLint/formatting
- CI
- existing documentation

Establish the current Node, TypeScript, Phaser, bundler and major tooling versions.

Run the existing validation commands where available to establish a baseline.

## Dependency audit

Determine:

- current dependencies
- current stable versions
- breaking upgrade paths
- deprecated packages
- unmaintained packages
- unnecessary dependencies
- dependency replacements worth considering
- peer dependency conflicts
- security concerns

Do not assume every dependency should simply move to latest.

## Phaser analysis

Analyse the migration path from Phaser 3.55.2 to the current appropriate stable release.

Search the actual source for affected Phaser APIs.

Identify required code changes and migration risks.

## Deliverable

Create:

`docs/modernisation-plan.md`

Include:

- current state
- baseline validation results
- dependency audit
- target versions
- Phaser migration analysis
- build/tooling analysis
- required changes
- recommended changes
- optional changes
- risks
- proposed implementation order
- verification strategy

Do not perform substantial implementation as part of this task.
