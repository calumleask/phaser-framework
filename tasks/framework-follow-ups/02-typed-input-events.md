# Task 02 — Public types for named key events

## Objective

Expose a precise public TypeScript type for the named keyboard events emitted by the framework's `InputManager`. A consuming game should be able to read `event`, `down`, `up`, `pressed`, and `released` with their real types, without inferring a callback signature from the inherited generic emitter or casting `unknown` fields.

This task belongs in the **phaser-framework** repository. Copy this file and its matching prompt into `tasks/framework-follow-ups/` there before implementation. Do not change the consuming game or generated `dist/` declarations by hand.

## Current behavior and dependency

`InputManager` inherits `on` and `off` from `src/core/EventEmitter.ts`. That emitter exposes an open data map whose values are `unknown`, plus `type: string` and `target: unknown`. Runtime named key events contain a native `KeyboardEvent` and four boolean flags, but `src/input/index.ts` currently exports only `InputManager`. The packed TypeScript consumer fixture therefore reads `event.pressed` as `unknown`.

Complete or account for **Task 01 — InputManager lifecycle and focus handling** first. If Task 01 adds a distinct focus-reset notification, type that notification separately from keyboard events. Do not represent a browser blur as a `KeyboardEvent`.

## Work

1. Read `AGENTS.md`, the framework architecture/development guides, `InputManager`, `EventEmitter`, `src/input/index.ts`, generated declaration configuration, and both consumer fixture modes.
2. Define and export a named key event payload type from the public input API. It must describe the native keyboard event, the four boolean flags, the emitted name (`type`), and the manager target accurately.
3. Provide a typed subscription and unsubscription path for arbitrary configured event names. Preserve existing runtime dispatch, callback deduplication, `off` behavior, and the generic `EventEmitter` contract. Choose a design that strict TypeScript can express without `any`, ignores, or unsafe casts. A dedicated typed input subscription method is acceptable if overriding the inherited `on`/`off` methods would be unsound.
4. Update the packed TypeScript consumer fixture to consume the public event type directly, and cover the event fields at runtime in the browser fixture. Include focus-reset typing if Task 01 exposes it.
5. Update the input API documentation and any migration note needed for consumers. Keep key names configured by the host game; do not hard-code game controls into the framework.

## Acceptance criteria

- A packed-package consumer can subscribe to a named key event and use the keyboard event and boolean flags without casts or `unknown` comparisons.
- The public declaration makes the event's `type` and `target` accurate and is reachable through the package's documented import shape.
- Existing consumers using `InputManager.on` and `off` continue to work at runtime; any intentional TypeScript API change is documented.
- The generic emitter's payload and listener behavior remain unchanged unless an independently justified change is documented.
- UMD and ESM consumers, Phaser 4.2.1 peer integration, and generated declarations remain valid.

## Validation

Run `npm test`, `npm run format:check`, and `npm run verify:consumer`; finish with `npm run build`. Verify the packed consumer's strict typecheck against generated declarations as well as browser event behavior. Keep the existing Phaser declaration `skipLibCheck` exception; do not add broader suppressions, `any`, unsafe assertions, or hand-edited declaration output to make the consumer compile.

After rebuilding the framework, update the game's consuming code to use the typed API and refresh its copied package through `npm run get-framework` as a separate game-repository task.
