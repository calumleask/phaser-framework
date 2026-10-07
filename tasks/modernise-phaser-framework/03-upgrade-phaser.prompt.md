Implement:

@tasks/modernise-phaser-framework/03-upgrade-phaser.md

First read:

@docs/modernisation-plan.md

The framework originally used Phaser 3.55.2.

Do not treat this as a simple package version bump.

Inspect every meaningful Phaser usage in the repository and compare it with the migration concerns already identified in the modernisation plan.

Upgrade Phaser to the approved target version and make the minimum source changes necessary to maintain existing behaviour.

Do not perform unrelated architectural refactoring.

Run validation incrementally and investigate runtime-sensitive areas that tests/typechecking may not cover.

Update the modernisation documentation with the actual migration.

Finish with a summary of every significant Phaser compatibility change and any areas requiring manual runtime verification.
