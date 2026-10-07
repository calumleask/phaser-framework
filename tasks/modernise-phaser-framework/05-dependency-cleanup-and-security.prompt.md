Implement:

@tasks/modernise-phaser-framework/05-dependency-cleanup-and-security.md

Read the current:

@docs/modernisation-plan.md

Audit the dependency tree now that the build tooling and Phaser migration have been completed.

Do not blindly upgrade everything or use `npm audit fix --force`.

Remove dependencies only after verifying they are unused.

Run the complete validation suite after modifications.

Update the modernisation plan and finish with the final `npm outdated` and `npm audit` status, including explanations for anything deliberately left unresolved.
