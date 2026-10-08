# Architecture

## Role and entry point

This repository builds a reusable Phaser library, not a complete game. A consuming application creates `Phaser.Game`, configures the renderer and scale manager, registers scenes, and owns startup. The source entry is [`src/index.ts`](../src/index.ts), which default-exports an object with `Core`, `Input`, `Objects`, and `Scene` namespaces. Core, input, and object modules expose their current classes through their `index.ts` files.

The package advertises `dist/phfw.js` as `main`, raw `src/index.ts` as `module`, and `types/phfw.d.ts` as `types`. Webpack produces a UMD library named `phfw`; in the tested browser UMD shape the framework API is under `phfw.default`. The raw-TypeScript `module` entry and handwritten declaration do not fully match the generated/source API. Treat this as a known package-contract limitation, not a second independently verified runtime format.

## Phaser integration and configuration

There is no framework bootstrap, HTML page, `Phaser.Game` construction, or central game configuration. The host game supplies Phaser's `GameConfig` and passes its chosen input plugin and scene data to framework classes. The package currently bundles Phaser in the Webpack UMD output; it does not declare Phaser as a peer dependency.

## Scenes and data

[`Scene`](../src/Scene.ts) extends `Phaser.Scene`. Its constructor accepts a key and passes that key in Phaser's scene settings. Phaser controls `init` timing; this base implementation stores an optional context containing a `GameScaleManager` under `context.scaling`. Scene subclasses and their host decide when that context is supplied and how restart data is handled. The context is not a global store and is not automatically created by the framework.

## GameObjects and assets

[`TextButton`](../src/objects/TextButton.ts) extends Phaser's Text GameObject, establishes interactivity, tracks a single pressed state, changes text color, and calls the optional `onSelect` callback on its pointer-up path. Consumers must add it to the display list, typically with `scene.add.existing(button)`. Pointer-out cancels the pressed visual state. There is no asset directory, loader abstraction, asset manifest, or asset-copy build step; consuming games load their own assets through Phaser.

## Input

[`InputManager`](../src/input/InputManager.ts) adapts a `Phaser.Input.InputPlugin` and key/name mappings to the framework's [`EventEmitter`](../src/core/EventEmitter.ts). If the scene keyboard plugin exists, it subscribes to matching key-down and key-up events and emits native `KeyboardEvent` payloads with `down`, `up`, `pressed`, and `released` flags. It exposes Phaser's active pointer and can be created with keyboard-disabled input. It does not own or dispose its listeners, restore held-key state on scene restart, or manage browser focus; see the [best-practices review](best-practices-review.md).

## Events and scaling

The custom emitter stores callbacks by string event name, suppresses duplicate callback registration, removes a single matching callback, and dispatches synchronously. Its payload spreads caller data first, then sets `type` and `target`, so those two fields are controlled by the emitter. Dispatch iterates the live listener array; mutation during dispatch is not given snapshot semantics.

[`GameScaleManager`](../src/core/GameScaleManager.ts) is a pure calculation helper. Construction takes viewport width/height, device-pixel ratio, a maximum target narrowest dimension in pixels, and game units for the narrowest dimension. It exposes asset scaling, game-unit-to-pixel conversion, and centered coordinate conversion. It does not subscribe to resize events or validate dimensions. Its center uses uncapped device-pixel ratio while distance conversion applies the configured pixel cap; this known edge case needs a consumer contract and runtime verification before correction.

This framework has no physics integration or state system beyond scene context and its local event emitter.

## Build and execution

Webpack's common configuration uses `src/index.ts`, Babel TypeScript/modern-JavaScript transforms, and emits a UMD bundle to `dist/`; Phaser is included. Development uses inline source maps. Production uses external source maps, Terser minification, and extracted license comments. `tsc -p tsconfig.types.json` emits declarations under `dist/types`; the package also retains `types/phfw.d.ts`. `output.clean` means a later development build can remove generated declarations, so run `npm run build` last for packaging. Strict TypeScript checks framework source. `skipLibCheck` is enabled because Phaser 4.2.1 has declaration errors under TypeScript 5.9.3; it also skips checking this package's handwritten and generated declarations, so a successful typecheck does not prove public type parity.
