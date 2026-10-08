Implement:

@tasks/framework-follow-ups/01-input-manager-lifecycle.md

Read:

@AGENTS.md @docs/architecture.md @docs/development.md @docs/best-practices-review.md

Work in the **phaser-framework** repository. Inspect `InputManager`, the event emitter, and the packed consumer fixture before changing the lifecycle contract. Add per-instance keyboard handler cleanup and focus-loss state recovery without removing listeners owned by Phaser or another manager. Define and document disposal, restart, and reset-event behavior. Do not edit generated `dist/` files by hand or add game-specific movement logic.

Run the framework validation listed in the task. Report the public API and any consuming-game changes needed after the framework is rebuilt.
