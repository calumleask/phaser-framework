# Final modernisation review

Reviewed 8 October 2026 against the repository, installed dependency tree, generated artifacts, and Phaser 4.2.1 source. The initial independent review found two critical consumer-release gates. The follow-up described here implements and verifies them; historical decisions remain in the [modernisation plan](modernisation-plan.md).

## Verdict and changes

The framework's Node/npm, TypeScript, Phaser, Webpack, lint/format, and dependency migrations are coherent. Its packaged distribution now has a tested contract for browser scripts and browser bundlers. The package version is **2.0.0** because the loading and Phaser dependency contracts changed. No package has been published or tagged by this work. The scoped modernisation can reasonably be considered successful, while broader browser, touch, and game-specific behavior still requires validation before claiming universal compatibility.

The initial review removed stale ESLint browser globals and corrected documentation that overstated the scope of `skipLibCheck`. The consumer-release follow-up then made these changes:

| Initial critical finding | Implemented result |
| --- | --- |
| `module` pointed to raw TypeScript and `types` pointed to a handwritten declaration that disagreed with source. | `main` points to built UMD `dist/phfw.js`, `module` to built ESM `dist/phfw.mjs`, and `types` to generated `dist/types/index.d.ts`. The handwritten declaration was removed. A packed-package TypeScript fixture checks the public surface. |
| Bundled Phaser could differ from an application's Phaser instance, and there was no persistent browser gate. | Phaser 4.2.1 is an exact peer and local development dependency, external in both outputs. The packed fixture runs WebGL checks for UMD browser scripts and a Webpack consumer import, asserting shared `Phaser.Scene` identity, startup, keyboard and button interaction, restart, and host resize. It ran in Chrome here; the runner can also use Edge. |

The Webpack consumer check was necessary: a UMD-only external build still selected Phaser's CommonJS entry inside a bundler while the host's ESM import selected another Phaser build. The built ESM entry resolves both sides to the same class. The UMD browser global remains `phfw.default`; hosts must load Phaser first. This is a deliberate breaking change from the former standalone, Phaser-bundled output.

## Dependency and configuration assessment

The lockfile is npm-owned and includes the Phaser peer plus local development dependency. Babel, `babel-loader`, Webpack/CLI/merge, Terser, TypeScript, ESLint/typescript-eslint, and Prettier all have current source, build, test, or script uses. The new Webpack consumer fixture also uses the existing Webpack dependency. No obsolete direct package, legacy lint configuration, second bundler, redundant cleaning plugin, asset-copy step, or environment convention was found. There is still no development server: `dev` builds UMD and `watch` recompiles it.

At the original review, `npm outdated` listed the exact-pinned Babel 7.29.7 trio versus Babel 8.0.7 and TypeScript 5.9.3 versus TypeScript 7.0.2. Task 10 subsequently moved TypeScript to 6.0.3. Babel 8 changes module/target/transform behavior, and TypeScript 7 remains outside the installed typescript-eslint peer range. The original `npm audit` reported zero vulnerabilities; no forced install, override, or audit fix was used.

## Build and TypeScript assessment

Webpack 5 remains appropriate for the UMD browser contract and also emits an ESM entry. The production script cleans `dist` once, builds UMD and ESM, then generates declarations. The UMD bundle is about 17 KiB and the ESM entry about 16 KiB because Phaser is external; the previous Phaser-bundled UMD was about 1.33 MiB. The development output keeps its inline source map; production now emits external maps for both bundles. Terser remains configured for license extraction, but this output has no comments requiring a separate license file. There are no framework assets or static files. Standalone `dev` only refreshes the UMD artifact; run the full production build last when packing.

Source TypeScript remains strict and contains no `any`, suppression comments, or casts introduced to satisfy Phaser 4. Phaser 4.2.1's published declarations still produce TS2526 and TS2416 under TypeScript 6.0.3 with `skipLibCheck: false`. The configured `skipLibCheck: true` skips all declaration-file checking, so the packed consumer fixture compiles actual generated declarations against a TypeScript consumer. It does not prove every conceivable consumer type pattern. The TypeScript 6 follow-up pinned declaration `rootDir` to `src` to preserve the published path.

## Phaser runtime assessment

The source uses `Phaser.Scene`, `Phaser.GameObjects.Text`, and the scene input/keyboard plugin. It has no framework loader, tween, physics, camera, animation, or game-bootstrap subsystem. Its Audio namespace provides a Web Audio transport and loop mixer, but not content loading, one-shot playback, or application audio policy. Phaser 4.2.1 source confirms the `keydown-*`/`keyup-*` events and keyboard-plugin shutdown behavior. The persistent browser fixture exercises a real `Phaser.Game` with the packaged framework in WebGL. It verifies basic text button selection and key down/up flags, scene context on restart, listener count after restart, and host-owned resize. Headless Chrome virtual time did not schedule the frame that processes Phaser's queued restart, so the fixture advances one `game.step` after requesting it; this is a fixture timing measure, not a framework lifecycle change.

Known behavioral work remains: `TextButton` has one pressed flag for all pointers; `GameScaleManager` uses uncapped DPR for centers even when distance scaling is capped and does not listen for resize; `Scene.init` assumes host-provided data. `InputManager` now owns and disposes its listeners and resets held keys on Phaser game blur, as described in the development guide. The fixture characterizes common paths without resolving the remaining scale and pointer contracts. See the [best-practices review](best-practices-review.md) for follow-up decisions.

## Validation

The task 10 follow-up passed `npm ci`, `npm test`, `npm run format:check`, `npm run build`, and `npm run verify:consumer` with TypeScript 6.0.3. The packed fixture validates the published package from an isolated consumer project; its checks do not establish behavior in every application or browser. The table below records the original review commands before task 10.

Checks used Node 24.21.0 and npm 12.2.0. The local temporary toolchain's generated npm shim required a temporary wrapper for nested npm scripts; that was an invocation issue outside the repository.

| Command | Result |
| --- | --- |
| `npm ci` and `npm ls --all` | Pass; clean installation and resolved tree. |
| `npm test` | Pass; lint, typecheck, and the EventEmitter Node unit test. Node still emits a module-detection warning for the source TypeScript import. |
| `npm run format:check` | Pass. |
| `npm run dev` | Pass; development UMD compilation. |
| `npm run build` | Pass; UMD, ESM, source map, and generated declarations. |
| `npm run verify:consumer` | Pass in Chrome; tarball installation, consumer typecheck, UMD WebGL host, and bundled WebGL host. |
| `npm pack --dry-run --json` | Pass; both JavaScript entries and the generated declaration entry are present. |
| `npm outdated` | Exit 1 for the four intentionally pinned major-version deferrals above. |
| `npm audit` | Pass; zero vulnerabilities. |

## Remaining work

**Critical:** No known blocker remains in the two tested package modes. A release claiming broader browser support must first define and check that support matrix; this run covered Chrome WebGL only.

**Recommended:** Test real touch and multi-pointer cancellation, keyboard blur/repeat and retained managers, scene transitions and restarts without context, capped-DPR resizing and canvas coordinates, and Firefox/WebKit rendering in representative applications. Decide the intended input and scale contracts before changing them. Add CI for the pinned Node/npm checks and the consumer fixture.

**Optional:** Revisit Babel 8 and TypeScript 7 when their behavior and peer constraints can be verified. Reconsider `skipLibCheck` if Phaser corrects its declarations. Avoid changing package module format solely to silence the Node test warning.

For manual runtime verification, load the package in each browser the project intends to support, check text appearance and hit regions, mouse and touch press/release outside the canvas, focus loss, simultaneous pointers, scene transition/shutdown/restart, and resize/orientation at capped and uncapped DPR. Exercise loaders, physics, audio, tweens, cameras, and animations in application hosts that use those systems; this library does not implement them.
