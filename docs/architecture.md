# Architecture

## Role and entry point

This repository builds a reusable Phaser library, not a complete game. A consuming application creates `Phaser.Game`, configures the renderer and scale manager, registers scenes, and owns startup. The source entry is [`src/index.ts`](../src/index.ts), which default-exports an object with `Audio`, `Core`, `Input`, `Objects`, and `Scene` namespaces. Core, input, and object modules expose their current classes through their `index.ts` files.

The package advertises `dist/phfw.js` as `main`, built `dist/phfw.mjs` as `module`, and generated `dist/types/index.d.ts` as `types`. Webpack produces a UMD library named `phfw`; its browser API is under `phfw.default` to preserve the existing default-export shape. Bundlers select the ESM build, where `import framework from 'phaser-framework'` yields the API object. An isolated packed-package fixture verifies both paths and the generated public types. There is no handwritten declaration or raw-TypeScript module entry.

## Audio

The additive `Audio` namespace exports `MusicTransport`, `MusicLayerMixer`, `TICKS_PER_QUARTER` (24), and `ticksPerBar`. Public configuration and scheduling types are exported from the package root. The foundation imports no game content and chooses no browser timer. Hosts inject a clock/timer, decoded sample-aligned loops, and explicit per-layer default boundaries. The mixer owns its transport, sources, gains and context-state subscription, while the host retains its AudioContext and destination. See [Music usage and ownership](audio.md) for the contract and a synthetic example.

## Phaser integration and configuration

The framework itself has no bootstrap, HTML page, `Phaser.Game` construction, or central game configuration. The host game supplies Phaser's `GameConfig` and passes its chosen input plugin and scene data to framework classes. Phaser 4.2.1 is a required peer dependency, with the same version installed locally for development. Both distribution builds externalise Phaser so framework scenes inherit from the host's Phaser instance. A browser script host loads Phaser before `phfw.js`; a bundler host imports Phaser and the framework. The repository's `test/consumer/` directory contains a small validation host, not a production game.

## Scenes and data

[`Scene`](../src/Scene.ts) extends `Phaser.Scene`. Its constructor accepts a key and passes that key in Phaser's scene settings. Phaser controls `init` timing; this base implementation stores an optional context containing a `GameScaleManager` under `context.scaling`. Scene subclasses and their host decide when that context is supplied and how restart data is handled. The context is not a global store and is not automatically created by the framework.

## GameObjects and assets

[`TextButton`](../src/objects/TextButton.ts) extends Phaser's Text GameObject, establishes interactivity, tracks a single pressed state, changes text color, and calls the optional `onSelect` callback on its pointer-up path. Applications must add it to the display list, typically with `scene.add.existing(button)`. Pointer-out cancels the pressed visual state. There is no asset directory, loader abstraction, asset manifest, or asset-copy build step; applications load their own assets through Phaser.

## Input

[`InputManager`](../src/input/InputManager.ts) adapts a `Phaser.Input.InputPlugin` and key/name mappings to the framework's [`EventEmitter`](../src/core/EventEmitter.ts). If the scene keyboard plugin exists, it subscribes to matching key-down and key-up events and emits native `KeyboardEvent` payloads with `down`, `up`, `pressed`, and `released` flags. Root-level type exports `InputKeyEvent` and `InputResetEvent` describe separate payloads; `onKey`/`offKey` and `onReset`/`offReset` provide typed subscriptions while inherited `on`/`off` remain generic. It exposes Phaser's active pointer and can be created with keyboard-disabled input. Each manager owns its keyboard callbacks and disposes them on scene shutdown or explicit `dispose()`. Phaser's game `blur` event clears held codes and emits `input:reset` with `{ reason: 'blur', codes: string[] }` only when codes were held. This notification has no `event: KeyboardEvent`. Consumers create a fresh manager on each scene start; see [Development](development.md) for the lifecycle contract.

## Events and scaling

The custom emitter stores callbacks by string event name, suppresses duplicate callback registration, removes a single matching callback, and dispatches synchronously. Its payload spreads caller data first, then sets `type` and `target`, so those two fields are controlled by the emitter. Dispatch iterates the live listener array; mutation during dispatch is not given snapshot semantics.

[`GameScaleManager`](../src/core/GameScaleManager.ts) is a pure calculation helper. Construction takes viewport width/height, device-pixel ratio, a maximum target narrowest dimension in pixels, and game units for the narrowest dimension. It exposes asset scaling, game-unit-to-pixel conversion, and centered coordinate conversion. It does not subscribe to resize events or validate dimensions. Its center uses uncapped device-pixel ratio while distance conversion applies the configured pixel cap; this known edge case needs a consumer contract and runtime verification before correction.

This framework has no physics integration or state system beyond scene context and its local event emitter.

## Build and execution

Webpack is the library builder. Its production configuration emits the UMD, ESM, and declaration paths listed above; Phaser is external in both JavaScript bundles so the application and framework share the same Phaser instance. There are no framework asset loaders or static assets. Any future build-system change must preserve the documented package entry points, default-export shape, external Phaser peer, and generated declarations.

Webpack's common configuration uses `src/index.ts` and Babel TypeScript/modern-JavaScript transforms. Development emits a UMD bundle with an inline source map. `npm run build` cleans `dist` once, then emits the production UMD and ESM bundles with external source maps, then generates declarations under `dist/types`. Terser is configured to extract license comments if any are present; the current external-Phaser output emits no separate license text file. Phaser stays external in both bundles. Standalone `dev` and `watch` builds do not clean `dist` and only refresh the UMD file, so run `npm run build` last for packaging. Strict TypeScript 6.0.3 checks framework source; the declaration config explicitly sets `rootDir` to `src` to preserve `dist/types/index.d.ts` under TypeScript 6's changed default. `skipLibCheck` remains enabled because Phaser 4.2.1 has declaration errors under TypeScript 6.0.3; it also skips checking generated declarations, so the packed consumer typecheck provides an additional public-contract gate.
