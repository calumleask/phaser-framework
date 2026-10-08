# Architecture

## Role and entry point

This repository builds a reusable Phaser library, not a complete game. A consuming application creates `Phaser.Game`, configures the renderer and scale manager, registers scenes, and owns startup. The source entry is [`src/index.ts`](../src/index.ts), which default-exports an object with `Core`, `Input`, `Objects`, and `Scene` namespaces. Core, input, and object modules expose their current classes through their `index.ts` files.

The package advertises `dist/phfw.js` as `main`, built `dist/phfw.mjs` as `module`, and generated `dist/types/index.d.ts` as `types`. Webpack produces a UMD library named `phfw`; its browser API is under `phfw.default` to preserve the existing default-export shape. Bundlers select the ESM build, where `import framework from 'phaser-framework'` yields the API object. An isolated packed-package fixture verifies both paths and the generated public types. There is no handwritten declaration or raw-TypeScript module entry.

## Phaser integration and configuration

The framework itself has no bootstrap, HTML page, `Phaser.Game` construction, or central game configuration. The host game supplies Phaser's `GameConfig` and passes its chosen input plugin and scene data to framework classes. Phaser 4.2.1 is a required peer dependency, with the same version installed locally for development. Both distribution builds externalise Phaser so framework scenes inherit from the host's Phaser instance. A browser script host loads Phaser before `phfw.js`; a bundler host imports Phaser and the framework. The repository's `test/consumer/` directory contains a small validation host, not a production game.

## Scenes and data

[`Scene`](../src/Scene.ts) extends `Phaser.Scene`. Its constructor accepts a key and passes that key in Phaser's scene settings. Phaser controls `init` timing; this base implementation stores an optional context containing a `GameScaleManager` under `context.scaling`. Scene subclasses and their host decide when that context is supplied and how restart data is handled. The context is not a global store and is not automatically created by the framework.

## GameObjects and assets

[`TextButton`](../src/objects/TextButton.ts) extends Phaser's Text GameObject, establishes interactivity, tracks a single pressed state, changes text color, and calls the optional `onSelect` callback on its pointer-up path. Consumers must add it to the display list, typically with `scene.add.existing(button)`. Pointer-out cancels the pressed visual state. There is no asset directory, loader abstraction, asset manifest, or asset-copy build step; consuming games load their own assets through Phaser.

## Input

[`InputManager`](../src/input/InputManager.ts) adapts a `Phaser.Input.InputPlugin` and key/name mappings to the framework's [`EventEmitter`](../src/core/EventEmitter.ts). If the scene keyboard plugin exists, it subscribes to matching key-down and key-up events and emits native `KeyboardEvent` payloads with `down`, `up`, `pressed`, and `released` flags. It exposes Phaser's active pointer and can be created with keyboard-disabled input. Each manager owns its keyboard callbacks and disposes them on scene shutdown or explicit `dispose()`. Phaser's game `blur` event clears held codes and emits `input:reset` with `{ reason: 'blur', codes: string[] }` only when codes were held. This notification has no `event: KeyboardEvent`. Consumers create a fresh manager on each scene start; see [Development](development.md) for the lifecycle contract.

## Events and scaling

The custom emitter stores callbacks by string event name, suppresses duplicate callback registration, removes a single matching callback, and dispatches synchronously. Its payload spreads caller data first, then sets `type` and `target`, so those two fields are controlled by the emitter. Dispatch iterates the live listener array; mutation during dispatch is not given snapshot semantics.

[`GameScaleManager`](../src/core/GameScaleManager.ts) is a pure calculation helper. Construction takes viewport width/height, device-pixel ratio, a maximum target narrowest dimension in pixels, and game units for the narrowest dimension. It exposes asset scaling, game-unit-to-pixel conversion, and centered coordinate conversion. It does not subscribe to resize events or validate dimensions. Its center uses uncapped device-pixel ratio while distance conversion applies the configured pixel cap; this known edge case needs a consumer contract and runtime verification before correction.

This framework has no physics integration or state system beyond scene context and its local event emitter.

## Build and execution

Webpack's common configuration uses `src/index.ts` and Babel TypeScript/modern-JavaScript transforms. Development emits a UMD bundle with an inline source map. Production emits the UMD bundle with an external map, then a built ESM entry, then declarations under `dist/types`. Terser is configured to extract license comments if any are present; the current external-Phaser output emits no separate license text file. Phaser stays external in both bundles. The UMD build cleans `dist`, while the following ESM build preserves prior outputs; a later standalone development build can remove production artifacts, so run `npm run build` last for packaging. Strict TypeScript checks framework source. `skipLibCheck` is enabled because Phaser 4.2.1 has declaration errors under TypeScript 5.9.3; it also skips checking generated declarations, so the packed consumer typecheck provides an additional public-contract gate.
