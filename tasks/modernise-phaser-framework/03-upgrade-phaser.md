# Task 03 — Upgrade Phaser

## Objective

Upgrade the framework from Phaser 3.55.2 to the target Phaser version identified in:

`docs/modernisation-plan.md`

Preserve existing framework and game behaviour.

## Before editing

Inspect actual usage of Phaser throughout the repository.

Search for:

- Game configuration
- scenes
- scene lifecycle
- GameObjects
- loaders
- textures
- cameras
- input
- keyboard input
- pointer input
- events
- animations
- tweens
- physics
- audio
- scaling
- rendering
- plugins
- Phaser types

Compare repository usage against breaking or behavioural changes between the existing and target Phaser versions.

## Implementation

Upgrade Phaser and make the smallest appropriate compatibility changes.

Replace deprecated APIs where appropriate.

Prefer current supported Phaser APIs.

Do not redesign working framework abstractions solely because another approach exists.

Maintain existing public framework APIs unless there is a strong reason to change them.

If an API must change, document the migration implications.

## TypeScript

Resolve type changes properly.

Do not:

- add broad `any`
- suppress TypeScript errors
- use unsafe casts simply to bypass new Phaser types

## Verification

Run all available:

- typecheck
- lint
- tests
- production build

Where practical, run the game and inspect for runtime errors.

Pay particular attention to behaviour that static validation cannot verify, including:

- scene transitions
- input
- physics
- animations
- tweens
- asset loading
- audio
- scaling/resizing

## Documentation

Update `docs/modernisation-plan.md` with:

- Phaser version migrated from/to
- APIs changed
- compatibility changes
- unresolved concerns
- runtime verification performed
