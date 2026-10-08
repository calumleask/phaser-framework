Implement:

@tasks/modernise-phaser-framework/08-final-modernisation-review.md

This is the final independent review of the Phaser framework modernisation.

Assume previous migration tasks may have missed things.

First read:

@AGENTS.md @docs/modernisation-plan.md @docs/architecture.md @docs/development.md @docs/dependencies.md @docs/best-practices-review.md

where those files exist.

Also review the previous tasks under:

@tasks/modernise-phaser-framework/

Then inspect the actual repository, configuration, dependency tree and Phaser implementation.

The repository is the source of truth. Do not assume previous documentation or task conclusions are correct.

Pay particular attention to:

- incomplete dependency migrations
- obsolete packages
- old configuration left behind
- Webpack/build-system migration leftovers
- TypeScript migration shortcuts
- Phaser APIs or patterns originating from the old Phaser 3.55.2 implementation
- lifecycle and runtime regressions that compilation would not detect
- stale npm scripts
- documentation that no longer matches the implementation

Run the complete repository validation suite.

Also run and assess:

`npm outdated`

and:

`npm audit`

Do not use `npm audit fix --force`.

Fix clearly correct, reasonably scoped problems discovered during the review.

Do not perform speculative or large architectural rewrites.

Create:

@docs/modernisation-review.md

Document the final state, issues found and fixed, validation results, remaining recommendations and relevant manual runtime checks.

Finish with a concise verdict on whether the repository can reasonably be considered successfully modernised and identify anything preventing that conclusion.
