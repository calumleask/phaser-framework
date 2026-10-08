# Final modernisation review

Reviewed 8 October 2026 against the repository, the installed dependency tree, generated artifacts, and Phaser 4.2.1 source. This is an independent check of the work recorded in the [modernisation plan](modernisation-plan.md), not a browser compatibility certification.

## Assessment

The Node/npm, TypeScript, Webpack, lint/format, dependency, and Phaser version migrations are coherent. The package installs cleanly, passes its automated checks, and emits its intended UMD bundle and declarations. The reusable package contract and representative Phaser browser behavior remain unverified and have known defects; those are release gates before claiming the framework is fully modernised for consuming games.

## Issues found and fixed

| Finding | Resolution |
| --- | --- |
| `eslint.config.mjs` still declared `console` and browser-global `devicePixelRatio` after the task 06 source cleanup removed their use. | Removed both unused global allowances. Current source has no remaining direct use. |
| Documentation described `skipLibCheck` as if it applied only to external Phaser declarations. | Corrected `AGENTS.md`, the architecture and development guides, and the modernisation plan. It skips checking **all** declaration files, including this package's handwritten declarations; framework `.ts` source remains strictly checked. |
| Earlier task results in the plan could be mistaken for the current failing `npm test` state. | The plan now explicitly marks those results as historical and points to the current final review. The README links here for current validation and release gates. |

No dependency or runtime source change was justified by this review. The published type/export mismatch, input/button lifecycle semantics, and scale coordinate contract have consumer-visible behavior or versioning implications and need separately verified changes.

## Dependency and configuration status

- `npm ci` installed 319 packages from the npm-owned lockfile and reported zero vulnerabilities. `npm ls --all` resolved successfully. Every direct dependency has a current source, configuration, or script use: Phaser for scene/text/input, Babel and `babel-loader` for Webpack transforms, Webpack/CLI/merge/Terser for builds, TypeScript for checks/declarations, and ESLint/typescript-eslint/Prettier for quality commands. No obsolete direct package was found to remove.
- `npm outdated` reports only `@babel/core`, `@babel/preset-env`, and `@babel/preset-typescript` at 7.29.7 (latest 8.0.7), plus TypeScript at 5.9.3 (latest 7.0.2). They are exact-pinned and therefore also show `Wanted` equal to `Current`. Babel 8 changes module/target/transform behavior; TypeScript 7 is outside the installed typescript-eslint 8.71.1 peer range. Retention is deliberate pending a coordinated compatibility review. Phaser 4.2.1 and the other direct packages are not listed as outdated.
- `npm audit` reports **zero vulnerabilities**. There is no audit fix, override, force install, or package manager migration to apply.
- The repository has one ESLint flat config and one Prettier config. No legacy `.eslintrc`, `.eslintignore`, Vite/Rollup setup, redundant Webpack cleaning plugin, `npm-run-all`, dev server config, environment convention, CI config, or obsolete asset pipeline remains. `clean` is an npm script using Node's filesystem API; `start` aliases the Webpack watch build. None is stale.

## Build and TypeScript review

Webpack remains justified by the existing UMD `phfw` output contract. The development command builds a bundle with an inline source map; it is not a browser server. Production creates `dist/phfw.js` (1.33 MiB), an external map, extracted license text, and nine generated declaration files. Phaser is bundled, so Webpack's three size/performance warnings are expected, though the distribution cost matters for consumers. There are no repository assets or static files to copy. Webpack `output.clean` removes prior `dist` contents, and `build` correctly runs declaration emit after bundling; a later `dev` build removes those declarations.

The source uses strict TypeScript, modern module resolution, and no `any`, suppression comment, unsafe cast, or non-null assertion introduced for Phaser 4. The Phaser 4.2.1 declaration file still fails TypeScript 5.9.3 library checking at `setFlipV` (TS2526) and `SubmitterMeshToQuad.run` (TS2416); a direct check with `--skipLibCheck false` reproduced both diagnostics. The required `skipLibCheck: true` also means `types/phfw.d.ts` is not checked for internal consistency. A consumer type fixture is required to validate that file and any replacement.

## Phaser and architecture review

Source integration with Phaser is small: `Scene` extends `Phaser.Scene`, `TextButton` extends `Phaser.GameObjects.Text`, and `InputManager` uses a scene input plugin and its optional keyboard plugin. Installed Phaser 4.2.1 source confirms the `keydown-*`/`keyup-*` event pattern, native `KeyboardEvent` payloads, and `KeyboardPlugin.shutdown()` removal of its listeners. Explicit Phaser runtime imports avoid the old implicit browser-global assumption. The repository has no loader, texture, timer, tween, physics, camera, audio, animation, plugin, or game bootstrap implementation to migrate. No obsolete Phaser API use was found in the implemented surface.

The framework remains a small library without a global store, duplicated Phaser subsystem, or speculative service layer. EventEmitter is independent and preserves its own event payload contract. The outstanding runtime issues are behavioral rather than TypeScript diagnostics: `InputManager` lacks per-instance listener disposal and held-key reset; `TextButton` tracks only one pressed flag across pointers and needs cancellation checks; `GameScaleManager` does not react to resize and centers with uncapped DPR even when distance scaling is capped; `Scene.init` assumes host-provided context and sets its context to `undefined` if a restart supplies no data. See the [best-practices review](best-practices-review.md) for the decisions needed before changing these contracts.

## Validation results

Commands used Node 24.21.0 and npm 12.2.0 via a temporary local toolchain. Its generated `npm.cmd` shim was broken for nested `npm` calls, so the first `npm test` attempt stopped before project checks; a temporary wrapper invoking the same npm 12 CLI corrected the environment, and the complete test script then passed. This was a local invocation problem, not a repository failure.

| Command | Result |
| --- | --- |
| `npm ci` | Pass; 319 packages installed, zero reported vulnerabilities. |
| `npm ls --all` | Pass; dependency tree resolves. |
| `npm run typecheck` | Pass. |
| `npm run lint` | Pass. |
| `npm run format:check` | Pass. |
| `npm test` | Pass after toolchain wrapper correction; lint, typecheck, one Node unit test. Node emits a module-detection warning when the test imports source TypeScript. |
| `npm run dev` | Pass; 22.6 MiB development bundle with inline source map. This executes the compiler, not a game. |
| `npm run build` | Pass; production bundle, map, license file, and declarations; three expected Webpack size warnings. |
| `npm pack --dry-run --json` | Pass; package includes the bundle, generated declarations, raw source entry, handwritten declaration, and README. |
| `npm outdated` | Exit 1 because four pinned packages have newer major versions; see dependency status above. |
| `npm audit` | Pass; zero vulnerabilities. |
| `tsc --noEmit --skipLibCheck false` | Fails in Phaser's two published declaration locations noted above; this diagnostic probe is separate from the configured passing typecheck. |

## Remaining findings

### Critical for a consumer release

1. **Package contract mismatch.** `package.json` advertises a raw TypeScript `module` entry and handwritten `types/phfw.d.ts`, while `main` is a UMD bundle whose tested browser API sits under `phfw.default`. The handwritten declaration also differs from source: optionality of `textColor`, `onSelect`, and scene context, plus missing public methods. Align the published entrypoints and declarations only after testing an actual packed package from the supported consumer modes; decide compatibility and framework versioning first.
2. **No representative browser/consumer gate.** The automated test covers only EventEmitter, and the prior temporary Chrome fixture was removed. There is no persistent host game to demonstrate Phaser 4 rendering, scene restart, input ownership, responsive scaling, or package consumption. A successful build is insufficient for a reusable Phaser release claim.

### Recommended

- Define and test `InputManager` disposal, focus loss, shutdown, and retained-instance restart semantics without removing listeners owned by other users of the shared keyboard plugin.
- Specify pointer identity/cancellation for `TextButton` and scaling units/resize ownership for `GameScaleManager`, then fix the identified cases with browser comparisons.
- Resolve `Scene.init` context lifetime and restart behavior with a host example; add consumer type/package checks so future declaration drift is caught.
- Establish a browser support matrix and CI checks for the declared Node/npm toolchain and a real Phaser host fixture.

### Optional

- Evaluate built ESM output and Phaser peer/externalisation once existing UMD consumers are known; these change distribution and installation contracts.
- Revisit Babel 8 and TypeScript 7 when browser target behavior and lint peer support can be validated. Reconsider `skipLibCheck` when Phaser declarations are corrected.
- Revisit the Node test import strategy if package module format changes; the current module-detection warning does not fail tests.

## Manual runtime verification checklist

Use a representative consuming game in supported browsers. Verify that the packed production bundle loads and exposes the documented API without a preloaded Phaser global; create and start a framework scene with scaling context, transition and restart it with and without data, and check shutdown/cleanup. Add a `TextButton` to the display list and check rendering, hit area, hover, press, release outside, touch cancellation, and simultaneous pointers. Check keyboard first/repeated down/up, blur and focus recovery, keyboard-disabled input, and repeated scene starts for duplicate events or stale held state. Resize and rotate the host canvas across capped/uncapped DPR cases, comparing visual center and game-unit coordinates. Check asset loading and other Phaser systems only in consuming games that actually use them; this repository has no implementation of those subsystems.
