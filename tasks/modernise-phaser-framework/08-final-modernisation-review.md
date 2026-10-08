# Task 08 — Final Modernisation Review

## Objective

Perform an independent final review of the completed Phaser TypeScript framework modernisation.

The previous modernisation tasks should already have:

- audited the repository
- modernised Node/npm and TypeScript tooling
- reviewed or replaced the build system
- upgraded Phaser
- modernised code-quality tooling
- cleaned up dependencies
- reviewed framework best practices
- updated documentation

Do not assume those tasks were implemented correctly.

Treat this as a fresh technical review of the resulting repository.

## Before Editing

Read:

- `AGENTS.md`
- `README.md`
- `docs/modernisation-plan.md`
- `docs/architecture.md`
- `docs/development.md`
- `docs/dependencies.md`
- `docs/best-practices-review.md`

Also inspect all task files under:

`tasks/modernise-phaser-framework/`

Then inspect the actual repository implementation.

The repository is the source of truth.

Documentation and previous task reports may be incorrect or incomplete.

---

## 1. Review the Modernisation

Determine whether the modernisation achieved its intended goals.

Review:

- Node version/support
- npm configuration
- dependency versions
- TypeScript
- Phaser
- build tooling
- development server
- production builds
- linting
- formatting
- tests
- project structure
- documentation

Look for incomplete migrations where old and new approaches coexist unnecessarily.

Examples include:

- obsolete configuration files
- unused Webpack/Vite configuration
- obsolete loaders
- legacy TypeScript configuration
- duplicate lint configuration
- deprecated packages
- unused dependencies
- stale npm scripts
- compatibility workarounds that are no longer required

---

## 2. Dependency Review

Inspect:

- `package.json`
- `package-lock.json`

Run:

```sh
npm outdated
npm audit
```

Review the results rather than blindly applying upgrades.

For remaining outdated dependencies determine whether they are:

- intentionally retained
- blocked by compatibility
- forgotten during the migration
- unnecessary
- candidates for removal

Check for dependencies that are no longer referenced by:

- source
- configuration
- scripts
- tests
- build tooling

Do not remove dependencies based solely on assumptions.

Verify their usage first.

Do not use:

```sh
npm audit fix --force
```

---

## 3. Build-System Review

Review the final build system carefully.

If Webpack remains, determine whether retaining it is justified by actual repository requirements.

If the project migrated from Webpack to another build system such as Vite, verify the migration is complete.

Check for leftover:

- Webpack packages
- loaders
- plugins
- configuration
- npm scripts
- environment handling
- asset handling
- documentation

Verify development and production builds use the intended modern build pipeline.

Ensure Phaser assets and static files are handled correctly.

Check source-map behaviour where appropriate.

---

## 4. TypeScript Review

Review the final TypeScript configuration and representative source code.

Look for migration shortcuts such as:

- new `any` usage
- unnecessary assertions
- `@ts-ignore`
- unjustified `@ts-expect-error`
- excessive non-null assertions
- weakened compiler options
- duplicated Phaser types
- unsafe casts introduced to satisfy upgraded APIs

Determine whether strictness is appropriate for the current codebase.

Do not enable additional strictness merely for theoretical purity if it would require unrelated large-scale changes.

Document worthwhile future improvements instead.

---

## 5. Phaser Review

Perform a fresh review of Phaser usage against the installed Phaser version.

Do not rely solely on the previous Phaser migration task.

Search for:

- deprecated APIs
- obsolete APIs
- old compatibility workarounds
- incorrect lifecycle assumptions
- scene lifecycle issues
- event-listener leaks
- input-listener leaks
- timer lifecycle problems
- tween lifecycle problems
- unsafe GameObject assumptions
- asset-loading issues
- texture handling issues
- camera issues
- physics issues
- scale/responsive issues
- audio issues
- plugin compatibility issues

Pay particular attention to code originally written for Phaser 3.55.2 that may compile successfully while behaving differently on the upgraded version.

Compilation success alone is not sufficient evidence of Phaser runtime compatibility.

---

## 6. Architecture Review

Review whether the modernisation accidentally introduced unnecessary complexity.

Look for:

- unnecessary wrappers
- speculative abstractions
- duplicated services
- excessive inheritance
- global mutable state
- inappropriate web-application patterns applied to Phaser
- framework/game-specific coupling
- duplicated configuration
- unclear ownership
- overly large classes

Also identify useful abstractions that may still be missing.

Do not perform a large architecture rewrite during this review.

Only implement improvements that are:

- clearly correct
- low risk
- directly related to the modernisation

Document larger improvements as future work.

---

## 7. Configuration Cleanup

Search the repository for obsolete configuration and migration artefacts.

Check for old:

- Webpack configuration
- Babel configuration
- TypeScript configuration
- ESLint configuration
- Prettier configuration
- loader configuration
- environment files/examples
- npm scripts
- CI commands
- build scripts

Remove obsolete files only after confirming they are no longer required.

---

## 8. Documentation Verification

Do not merely proofread the documentation.

Verify it against the implementation.

Check:

### README

Ensure setup and commands actually work.

### Architecture

Ensure `docs/architecture.md` describes the architecture that exists.

### Development

Ensure development instructions match current tooling.

### Dependencies

Ensure documented dependencies and version decisions remain accurate.

### Modernisation Plan

Ensure completed and outstanding work is represented accurately.

### AGENTS.md

Ensure instructions remain appropriate for the modernised repository.

Correct stale or contradictory documentation.

---

## 9. Full Validation

Run the repository's actual validation scripts.

Where available this should include:

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Use the actual scripts from `package.json`.

Also run:

```sh
npm outdated
npm audit
```

Where practical, run the development environment and check for startup/runtime errors.

Do not claim runtime validation occurred if the game was not actually executed.

---

## 10. Runtime Risk Review

Identify behaviour that automated validation cannot adequately prove.

Produce a concise manual verification checklist covering relevant areas such as:

- application startup
- asset loading
- scene startup
- scene transitions
- scene restart
- keyboard input
- pointer input
- GameObject interaction
- animations
- tweens
- physics
- cameras
- audio
- resizing
- scaling
- shutdown/cleanup

Only include areas actually relevant to this repository.

---

## Implementation Policy

Fix issues discovered during this review when the fix is:

- clearly correct
- directly related to the modernisation
- reasonably scoped
- low or moderate risk

Do not turn this task into another major migration.

For substantial new architectural work:

- document the finding
- explain why it matters
- recommend a separate follow-up task

---

## Deliverable

Create:

`docs/modernisation-review.md`

Include:

- overall migration assessment
- issues discovered
- issues fixed
- dependency status
- Phaser review
- build-system review
- TypeScript review
- architecture findings
- configuration cleanup
- documentation corrections
- validation results
- manual runtime verification checklist
- remaining recommended work

Categorise remaining findings as:

- critical
- recommended
- optional

If there are no findings in a category, say so rather than inventing improvements.

---

## Completion Criteria

This task is complete when:

- the final repository has been independently reviewed
- migration leftovers have been identified
- appropriate low-risk fixes have been implemented
- documentation matches the implementation
- relevant validation commands have been run
- failures are documented honestly
- remaining work is clearly identified

Do not state that the modernisation is complete solely because the project compiles.
