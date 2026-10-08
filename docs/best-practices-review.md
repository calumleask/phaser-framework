# Framework best-practices review

Reviewed 8 October 2026 against the repository source and installed Phaser 4.2.1. This package is a small reusable library: consumers create `Phaser.Game`, configure scenes and assets, and add framework game objects to a scene. The source contains a scene base class, a text button, an input adapter, and two independent utilities. There is no local game bootstrap, asset pipeline, animation, tween, physics, audio, or camera implementation to redesign.

The source has no `any`, suppression comments, unsafe casts, global mutable singleton, duplicated subsystem implementation, or unusually large class. The concrete risks are lifecycle ownership, pointer behavior, scaling units, and the published type/package contract.

## Implemented

| Change | Reason and behavior |
| --- | --- |
| [EventEmitter](../src/core/EventEmitter.ts) stores listeners in a `Map` and drops an event entry after its final listener is removed. | The former `{}` store collided with inherited names such as `toString` and `__proto__`; subscribing to those names could throw. Normal callback order, duplicate suppression, `off`, and the `fire` payload (`type` and `target` override caller data) remain the same. |
| [TextButton](../src/objects/TextButton.ts) and [GameScaleManager](../src/core/GameScaleManager.ts) no longer print unconditional debug messages. The scale utility also drops viewport/aspect fields used only for those messages. | Buttons can receive frequent pointer events, and logging every event or scale construction adds noise in consuming games. The button's public hover hook and scaling calculations remain intact. |
| A dependency-free [EventEmitter unit test](../test/EventEmitter.test.mjs) replaces the failing `test:unit` placeholder. | It checks ordinary delivery semantics and event names that previously failed. Node 24 runs the TypeScript source using built-in type stripping. Lint and format scripts include the test directory. |

## Recommended follow-up work

| Priority | Finding and evidence | Decision to make before changing it |
| --- | --- | --- |
| High | [InputManager](../src/input/InputManager.ts) registers anonymous keyboard callbacks but has no per-instance disposal or held-state reset. Phaser's installed `KeyboardPlugin.shutdown()` clears its listeners on scene shutdown, so this is not evidence of a plugin listener leak across that boundary. Multiple managers created while a scene is active still accumulate callbacks; a retained manager loses subscriptions after shutdown while its `_keys` set may retain held codes. | Define whether the manager is recreated in each scene start or persists across restarts. Then retain callback references, remove only its own listeners, and define blur/shutdown release behavior. Verify listener counts and held-state transitions in a browser fixture. Do not call `removeAllListeners()` on the shared plugin from this class. Phaser [scene lifecycle](https://docs.phaser.io/phaser/concepts/scenes) allows repeated starts. |
| High | [TextButton](../src/objects/TextButton.ts) has one `_isDown` flag for all pointers. A second pointer's release can select a button pressed by the first; release outside the object and touch cancellation need characterization. `pointerout` currently cancels the pressed color. | Choose pointer identity and cancellation rules with a consuming game, then verify mouse/touch behavior and hit areas under Phaser 4. Object-owned listeners are removed by Phaser on [GameObject destruction](https://docs.phaser.io/api-documentation/4.0.0/class/gameobjects-gameobject), so a separate listener manager is unnecessary for this button. |
| High | [GameScaleManager](../src/core/GameScaleManager.ts) calculates ratios once and does not listen for resize. Its center uses uncapped DPR while distance conversion caps DPR, which can put coordinates outside a capped canvas. Zero or negative dimensions can also produce invalid results. | First define whether inputs are CSS viewport dimensions or game canvas dimensions and who rebuilds the helper on resize. Test DPR caps, portrait/landscape, canvas offsets, and invalid values before changing the formulas or public return types. |
| High | [types/phfw.d.ts](../types/phfw.d.ts) disagrees with source: `textColor` is declared optional, `onSelect` and scene context required, and several public methods are missing. The package advertises raw TypeScript as `module` while `main` is a UMD bundle whose browser access path is `phfw.default`. | Repair the package's declaration/export contract with packed-package consumer fixtures and a versioning decision. A source-only type cleanup would leave the published contract ambiguous. |
| Medium | [Scene](../src/Scene.ts) receives its scaling context through `init`, while Phaser can start/restart scenes with optional data. Subclasses need an explicit rule for access before `init` and after restart; the protected `key` also duplicates Phaser scene settings but may be used by downstream subclasses. | Specify the context lifetime and restart contract, then align source and public declarations. Preserve the protected key unless consumer usage shows it is safe to remove. |
| Medium | [EventEmitter](../src/core/EventEmitter.ts) iterates its live listener array. A callback that unsubscribes another listener during dispatch can affect which callbacks run. | Define dispatch-mutation semantics before switching to a snapshot. Preserve the current `type`/`target` payload and duplicate-callback policy. Let callback exceptions propagate unless consumers need a different error contract. |
| Medium | The new unit test covers one pure utility but no persistent browser host exercises scene restart, input ownership, text rendering, scaling, or package entrypoints. | Add a representative game fixture and consumer type/package checks before claiming full Phaser 4 runtime compatibility. The temporary Chrome fixture from the migration was removed after that task. |

## Optional opportunities

- Consider a built ESM entry and making Phaser a peer dependency after confirming how consuming games load the current UMD bundle. Those are distribution changes, not source cleanups.
- Tighten event names or scene context types when real consumers need stronger compile-time guarantees. The current classes are small, and a generic state or service framework would add more surface than value.
- Add CI for Node/npm validation and browser smoke checks once the test and support matrix is defined.

## Rejected or inappropriate for this library now

- A framework-owned `Phaser.Game` bootstrap, asset registry, animation manager, physics layer, audio layer, or game-specific constants: consumers own those choices, and this repository has no duplicated code in those areas.
- Replacing the custom emitter with Phaser's emitter merely for consistency: that would alter its callback payload and duplicate-registration behavior without solving a demonstrated need.
- A global state container, service locator, dependency-injection framework, or generic scene communication bus: the current source has no global mutable state or large class that warrants one. Phaser scene events and lifecycle should remain the first integration points where a consuming game needs them.
- Broad error-catching wrappers around Phaser callbacks: they would hide failures without an established recovery policy.

## Verification limits

The repository has no game fixture, and static checks cannot establish visual, touch, audio, or scene-transition behavior. The current unit test uses Node's TypeScript source import, which emits a module-detection warning because the package has no module type; changing the package to ESM solely to silence that warning could change the CommonJS Webpack configuration and UMD distribution. Revisit the test import strategy when package entrypoints are modernised.
