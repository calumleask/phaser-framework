# Task 01 — InputManager lifecycle and focus handling

## Objective

Give the framework's `InputManager` a clear ownership and cleanup contract for the keyboard handlers it registers. Make held-key state recover when browser focus is lost, so the next physical keydown can be reported as a new press.

This task belongs in the **phaser-framework** repository. Copy this file and its matching prompt into `tasks/framework-follow-ups/` there before implementation. Do not implement it in a consuming game or edit generated `dist/` output by hand.

## Current behavior and boundary

`src/input/InputManager.ts` subscribes anonymous callbacks to `keydown-*` and `keyup-*` on a supplied `Phaser.Input.InputPlugin`. It tracks held `KeyboardEvent.code` values in `_keys` and emits named events through the framework's `EventEmitter`. It has no per-instance disposal or focus reset.

The framework's `docs/best-practices-review.md` notes that Phaser's `KeyboardPlugin.shutdown()` clears listeners at scene shutdown. Do not describe this as a proven listener leak across that boundary. Multiple managers created during one active scene can still accumulate callbacks, and a retained manager can keep stale held-key state. A consumer may also need to recreate the manager after scene restart because Phaser has removed its keyboard subscriptions.

The host game owns scene creation and gameplay movement. The framework owns the handlers and key state inside `InputManager`. Keep that distinction.

## Work

1. Inspect `AGENTS.md`, `docs/architecture.md`, `docs/development.md`, `docs/best-practices-review.md`, `src/input/InputManager.ts`, `src/core/EventEmitter.ts`, and the consumer fixture before editing.
2. Define and document the manager lifecycle: whether consumers create a manager on each scene start, what `dispose()` does, and what is valid after disposal. Keep the API usable when `input.keyboard` is absent.
3. Retain references to each keyboard callback registered by an instance. Add an idempotent disposal path that removes **only that instance's** callbacks and clears its held-key state. Do not call `removeAllListeners()` on the shared Phaser keyboard plugin.
4. Clear held-key state when the browser loses focus. Define how consumers learn that held input was cancelled. Preserve the meaning of `event: KeyboardEvent`; do not fabricate a keyboard event for a blur. If a reset notification is introduced, document its distinct payload and coordinate its public typing with Task 02.
5. Remove any window or scene lifecycle listeners the manager adds. Avoid assumptions that a game uses the framework `Scene` subclass.
6. Update framework documentation and the packed consumer fixture for the chosen lifecycle contract. Leave game-specific movement rules in the game repository.

## Acceptance criteria

- Two managers on the same live keyboard plugin do not remove one another's handlers when one is disposed.
- Repeated `dispose()` calls are safe; disposed managers no longer emit named keyboard events.
- After focus loss, stale held codes do not suppress `pressed` on the next physical keydown.
- A scene shutdown/restart follows the documented creation or reattachment contract without duplicate handlers or stale held state.
- Existing pointer access, named key mappings, key repeat semantics, and behavior when keyboard input is unavailable remain defined and covered.
- No hand edits to generated `dist/` files, game-owned code, or a new framework game bootstrap.

## Validation

Add meaningful assertions for ownership, disposal, focus reset, and restart behavior using the framework's existing Node and packed browser fixtures. Run `npm test`, `npm run format:check`, and `npm run verify:consumer`; finish with `npm run build` so `dist/` contains the production UMD/ESM bundles and generated declarations. Report any manual browser behavior the fixtures cannot establish.

After a framework release or local rebuild, refresh the consuming game with its existing `npm run get-framework` workflow and validate that game as a separate follow-up.
