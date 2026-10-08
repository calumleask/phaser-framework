# Phaser framework modernisation plan

Audit date: 7 October 2026. Scope: discovery and planning only.

## Current implementation status

Updated 8 October 2026. The original audit below is retained as a historical baseline; implementation updates record completed work and deviations. Tasks 02–06 are complete: Node/npm, TypeScript and Webpack/Babel tooling were modernised; Phaser moved from 3.55.2 through a 3.90.0 checkpoint to 4.2.1; ESLint/Prettier were modernised; dependency/security review found no unused direct packages and zero reported audit vulnerabilities; and the best-practices review implemented low-risk emitter/logging/test improvements. Task 07 adds the repository-specific [README](../README.md), [architecture](architecture.md), [development](development.md), [dependency](dependencies.md), and [best-practices](best-practices-review.md) guides, and makes this file the migration record.

Current toolchain: Node 24.21.0, npm 12.2.x, TypeScript 5.9.3, Phaser 4.2.1, Webpack 5.111.1, Babel 7.29.7, ESLint 10.12.0, and Prettier 3.9.9. The main deviations from the proposed order were that a permanent host fixture and complete runtime tests were not available before the engine migration, and Phaser 4.2.1's external declarations require `skipLibCheck` under TypeScript 5.9.3. The temporary browser smoke fixture provided limited evidence but was removed; manual consumer verification remains open.

Historical task 02–05 entries below report that `npm test` failed at the then-placeholder `test:unit`. Task 06 replaced that placeholder with `test/EventEmitter.test.mjs`; as of this update `npm test` runs lint, typecheck, and the Node unit test. The earlier command results remain historical and should not be read as the current test status.

Still open: representative browser/consumer checks for rendering, scene lifecycle/restarts, touch/input, resize/DPR/scaling, and package loading; resolving the package `module`/UMD/declaration contract; and deciding whether to improve input teardown, multi-pointer button behavior, scale semantics, and event dispatch mutation behavior. Babel 8, TypeScript 7, ESM output, Phaser peer/externalisation, and CI remain optional future work. See the [best-practices review](best-practices-review.md) for scoped findings and decision points.

## Implementation update: task 07, 8 October 2026

Documentation now describes the actual library boundary, source exports, Phaser 4.2.1 integration, build outputs, Node/npm requirements, available scripts, dependency decisions, and verification limitations. No source or dependency changes were made in this documentation task. Commands were checked against `package.json`; the guides explicitly call out the lack of a game host/assets pipeline and the current package entrypoint/type parity gaps.

## Recommendation

Retain npm and Webpack 5. Establish meaningful runtime and package-consumer checks on Phaser 3.55.2, modernise the compatible tooling, remove reliance on Phaser globals, and verify a Phaser 3.90.0 checkpoint before moving to **Phaser 4.2.1**. Treat public declaration repairs, input lifecycle fixes, and any scaling correction as separately reviewable changes. Do not combine the engine upgrade with a new bundler or a wholesale public API redesign.

Phaser 4.2.1 is the current stable release, confirmed by both the [official stable download](https://phaser.io/download/release/v4.2.1) and [npm registry metadata](https://registry.npmjs.org/phaser/4.2.1). Phaser 3.90.0 is the latest Phaser 3 release in the [official archive](https://phaser.io/download/archive); it is an intermediate compatibility checkpoint, not the final current-stable target. If a consuming game cannot yet accept Phaser 4 rendering changes, retain 3.90.0 as an explicitly documented temporary branch with its own verification matrix.

The original audit and proposed sequence below are retained for context. The implementation updates record which checkpoints have since been completed. Recheck registry metadata, peer ranges, security advisories, and release notes before future dependency changes.

## Implementation update: task 06, 8 October 2026

The [framework best-practices review](best-practices-review.md) covers the resulting Phaser 4 source and separates implemented low-risk changes from larger lifecycle, scaling, input, and package-contract decisions. The custom `EventEmitter` now handles prototype-named events, unconditional button/scaling debug logs were removed, and a dependency-free Node test replaced the failing `test:unit` placeholder. The existing build and dependency set remain intact. Browser lifecycle and visual gates remain open until a representative consumer fixture is available.

## Implementation update: task 05, 8 October 2026

The dependency cleanup found **no unused direct package and no reported security advisory** in the current lockfile. No package was upgraded, replaced, or removed during this task. The npm-owned lockfile and build configuration remain unchanged; making an unneeded dependency change would add migration risk without resolving a finding.

| Direct dependencies | Verified use and decision |
| --- | --- |
| `phaser` | Runtime scene, text object, and input types/behavior. Keep the verified 4.2.1 target. |
| `@babel/core`, `@babel/preset-env`, `@babel/preset-typescript`, `babel-loader` | Webpack's Babel loader reads `.babelrc` to strip TypeScript and transpile browser output. Keep the coordinated Babel 7.29.7 set and loader 10.1.1. |
| `webpack`, `webpack-cli`, `webpack-merge`, `terser-webpack-plugin` | Development/production build scripts, shared config composition, and explicit production minifier/license extraction. Keep. |
| `eslint`, `@eslint/js`, `typescript-eslint`, `prettier` | Flat lint config and lint/format scripts. Keep the task 04 versions. The combined `typescript-eslint` package owns its parser/plugin dependencies. |
| `typescript` | Strict source typecheck and declaration emit. Keep 5.9.3. |

Final `npm outdated` lists only four direct packages: `@babel/core`, `@babel/preset-env`, and `@babel/preset-typescript` at 7.29.7 versus latest 8.0.7, plus TypeScript at 5.9.3 versus latest 7.0.2. Babel 8 is a coordinated major migration: its [official guide](https://babeljs.io/docs/v8-migration) documents ESM-only packages, a changed default browser target, and TypeScript transform changes. This repository has no browser target policy or representative consumer comparison yet, so keep Babel 7 until those behavior changes can be reviewed together. `babel-loader` 10.1.1 permits Babel 8 in its peer range, but that alone does not prove unchanged browser output. TypeScript 7 is outside the installed `typescript-eslint` 8.71.1 peer range (`>=4.8.4 <6.1.0`); do not bypass that constraint with forced installation. All other direct dependencies are current according to `npm outdated`.

The full dependency tree resolves (`npm ls --all`), and a clean `npm ci` installed 319 packages with no deprecation warning or audit finding. Both full `npm audit` and production-only `npm audit --omit=dev` report **zero vulnerabilities**. No override, forced audit fix, or package-manager change was applied. The audit result describes reported advisories in this lockfile; it does not replace the consumer/browser compatibility checks listed later in this plan.

Validation after clean install: `npm run dev`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`, and `npm pack --dry-run --json` passed. The packed file list includes the production bundle, generated declarations, source entry, and public declaration. Production Webpack still reports its three existing bundle-size/performance warnings. `npm test` passes lint and typecheck, then exits 1 at the pre-existing `test:unit` placeholder (`Error: no test specified`). The unit-test gap is unresolved and is separate from the dependency/security review.

## Implementation update: task 04, 8 October 2026

The legacy `.eslintrc` setup has been replaced with ESLint **10.12.0** flat config in `eslint.config.mjs`, following the [ESLint configuration guide](https://eslint.org/docs/latest/use/configure/configuration-files) and [typescript-eslint quickstart](https://typescript-eslint.io/getting-started/). The exact release versions were checked against npm metadata before installation; ESLint 10 supports the repository's Node 24 toolchain, and typescript-eslint 8.71.1 supports ESLint 10 and TypeScript 5.9.3.

- `typescript-eslint` now supplies the TypeScript parser/plugin as one direct dependency; `@eslint/js` provides the core recommended rules. The existing TypeScript recommended rules, `no-unused-vars` argument convention, and `consistent-type-definitions` rule remain enabled. The config limits linting to `src/**/*.ts`, retains the previous ignores, and declares the two browser globals used by source.
- Removed the obsolete `.eslintrc` and `.eslintignore`, as well as direct `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, and `eslint-config-prettier` dependencies. Formatting remains a separate Prettier pass, so ESLint no longer duplicates its semicolon/quote formatting rules. Kept `.prettierrc` and its existing style; no `.prettierignore` existed. Babel remains required by the current Webpack TypeScript build and was not changed.
- Added `lint`, `lint:fix`, and `format:check` scripts, updated `test` to call `lint`, and retained `format` for writes. Prettier 3.9.9 required a formatting adjustment only in `InputManager.ts`; other source files were unchanged.

Validation under Node 24.21.0/npm 12.2.0: clean `npm ci` passed with zero audit findings; `npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm run build` passed. Build output still reports the three Phaser bundle-size/performance warnings. `npm test` ran lint and typecheck successfully, then exited 1 at the existing `test:unit` placeholder (`Error: no test specified`); no test runner was added in this tooling task.

## Implementation update: task 03, 8 October 2026

Phaser has been migrated from **3.55.2 to 4.2.1**, with **3.90.0** installed and validated as an intermediate checkpoint. The [official stable download](https://phaser.io/download/release/v4.2.1) still identifies 4.2.1 as stable at implementation time. `package.json` pins that exact version; npm updated `package-lock.json`, including Phaser's `eventemitter3` 5 dependency and removal of its former `path` chain.

### Compatibility changes made

- `Scene` and `TextButton` now import the Phaser runtime namespace explicitly. This removes their dependence on a browser-global `Phaser` when Phaser 3.90/4.2.1's ESM entry is selected. `InputManager` imports Phaser only as a type. The scene context now names the source `GameScaleManager` type instead of relying on the handwritten ambient `phfw` declaration; no public runtime method was changed.
- Phaser 4.2.1 types `InputPlugin.keyboard` as nullable. `InputManager` registers the same `keydown-*` and `keyup-*` callbacks when the keyboard plugin exists and permits pointer-only use when it does not. The event names, logical key mapping, native `KeyboardEvent` payloads, held-key state, and `getActivePointer()` behavior were retained. This is a small compatibility behavior for keyboard-disabled scenes, not the deferred input-listener lifecycle redesign.
- Phaser 4.2.1's published `types/phaser.d.ts` fails TypeScript 5.9.3 library checking at its top-level `setFlipV` declaration (TS2526) and `SubmitterMeshToQuad.run` override (TS2416). `skipLibCheck` is enabled for external declaration files; strict checking of framework source continues. Revisit this when Phaser corrects those declarations. The obsolete `ScriptHost` lib needed only by Phaser 3.55.2 was removed. No source diagnostic was suppressed or cast around.
- No local call uses removed pipelines, masks, custom shaders, camera matrices, particles, tweens, physics, loader, audio, or animation APIs. `Scene` inheritance/settings/init, `TextButton` constructor/interactivity/pointer events/color, and active-pointer access still compile and worked in the limited browser fixture. No speculative API rewrite or scaling correction was made.

### Validation and remaining gates

- On 3.55.2, explicit imports passed lint/typecheck before the dependency upgrade. On 3.90.0, lint, typecheck, and production build passed. On 4.2.1, lint, typecheck with the scoped library-declaration setting, and production build passed. Webpack still emits the UMD bundle, source map, license file, and declarations; its three bundle-size warnings reflect the bundled engine.
- Final verification used Node 24.21.0/npm 12.2.0: `npm ci` passed with zero reported vulnerabilities; `npm run typecheck`, `npm run test:lint`, `npm run build`, `npm ls phaser --depth=0`, and `npm pack --dry-run --json` passed. The pack includes `dist/phfw.js`, generated declarations, `types/phfw.d.ts`, and `src/index.ts`. `npm test` passed its lint/typecheck stages, then exited 1 at the existing `test:unit` placeholder (`Error: no test specified`).
- A temporary Chrome/WebGL host fixture imported Phaser and the source entry through Webpack, created a real game and framework scene, created and added a `TextButton`, exercised keyboard down/up and keyboard-disabled pointer-only construction, and observed button selection after native canvas mouse events. Headless runs reported no uncaught browser errors and renderer type `2` (WebGL). A separate Chrome check loaded the production UMD and found `phfw.default.Scene`, `Objects.TextButton`, and `Input.InputManager` callable. The fixture was removed after testing; no test runner or permanent host was added.
- Scene transition completion was inconsistent in headless virtual-time runs, so the fixture does **not** establish reliable scene restart/transition behavior. It also did not exercise real asset loading, animations, tweens, physics, cameras, audio, touch, resizing/DPR, Canvas rendering, or cross-browser visuals. A representative consuming game must manually verify these areas, especially WebGL text appearance/hit areas, pointer behavior across touch/canvas boundaries, scene init/restart data, and canvas scaling. Consumer use of 3.60 tween/particle APIs and Phaser 4 renderer extension points remains outside this repository's source inventory.
- The handwritten package declaration and raw-TypeScript `module` entry retain the pre-existing contract gaps described below. `npm test` still reaches the deliberate failing `test:unit` placeholder; creating real assertions and a persistent host fixture remains a separate prerequisite before claiming full release readiness. Input listener disposal/focus handling and scaling semantics are also deferred as planned.

## Implementation update: task 02, 7 October 2026

The sections below this update retain the **pre-change audit** as a historical baseline. The following build and TypeScript work has now been implemented; the Phaser migration has not started.

### Completed

- Pinned the tool runtime with `.nvmrc` (**Node 24.21.0**), `packageManager: npm@12.2.0`, Node/npm engine ranges, and `.npmrc` engine enforcement. Because the machine's installed Node is 22.21.1/npm 10.9.4, verification used a temporary Node 24.21.0/npm 12.2.0 toolchain. This changed project requirements, not the machine-wide installation. npm regenerated `package-lock.json` through normal install/uninstall commands; it remains lockfile version 2 and a clean `npm ci` succeeds.
- Upgraded TypeScript to **5.9.3** and made `tsconfig.json` a strict, explicit typecheck config: ES2022/ESNext with Bundler resolution, browser libraries, no ambient Node types, no emit, exact optional properties, checked index access, required override annotations where applicable, fallthrough checking, consistent casing, isolated modules, and verbatim module syntax. `tsconfig.types.json` provides a separate declaration-only build. Phaser 3.55.2's declaration for `ParseXML` still references the removed browser-global `ActiveXObject`; the built-in TypeScript `ScriptHost` library supplies that legacy type until Phaser is upgraded. No library errors are suppressed with `skipLibCheck`.
- Changed only the source typings needed to pass the stricter checks: `InputManager` now accepts native `KeyboardEvent`s and stores string `event.code` values; `EventEmitter` lets TypeScript narrow potentially absent listener arrays. These edits do not change emitted event payloads or selection behavior. The already staged user changes in `InputManager` remain staged and were not replaced.
- Updated the build stack to **Babel 7.29.7** (core and both presets), babel-loader **10.1.1**, Webpack **5.111.1**, webpack-cli **7.2.3**, webpack-merge **6.0.1**, and terser-webpack-plugin **5.6.1**. Phaser remains locked at **3.55.2**. Retained the UMD `phfw` output, bundled Phaser, existing development inline map, production external map, and Terser license extraction. Webpack's `output.clean` replaces `clean-webpack-plugin`; the two sequential script uses no longer require `npm-run-all`. The standalone `clean` command now uses a cross-platform Node command with a workspace target check.
- Added `typecheck`; `build` now emits the production bundle **then** declarations, so its final `dist/` contains both. `start` still invokes the existing watch build. Added a `files` list containing `dist`, `src`, and `types`: a dry-run pack before that change excluded `dist/` because npm was falling back to `.gitignore`, leaving the declared `main` file absent. The current dry-run pack includes `phfw.js`, its map and license text, nine emitted declaration files, the raw source entry referenced by `module`, and the handwritten public declaration referenced by `types`.
- Removed unused `@types/node`: there is no TypeScript Node source/config file and browser source now opts out of ambient Node types. Upgraded the TypeScript ESLint parser and plugin to **8.71.1** to support TypeScript 5.9.3. ESLint **8.57.1** is an interim version compatible with the existing `.eslintrc`; the complete ESLint/Prettier configuration migration belongs to task 04.

No dev server, HTML bootstrap, static asset import, asset-copy step, `.env` convention, or game configuration exists in this library. `dev` still produces a development UMD bundle, and `watch` still recompiles it. The existing Babel environment preset and Webpack development/production modes remain in place; browser targets have not been invented without a browser support policy. Asset handling remains unchanged because there are no assets to transform. The package file list now ensures existing build artifacts are included when packed.

### Deviations and remaining work

- The original sequence preferred tests and a browser host fixture before tooling changes. The repository still has only a deliberate `test:unit` failure, so task 02 established command/type/build/package checks but did not claim runtime or browser verification. Add meaningful tests and a representative host fixture before Phaser 3.90/4.x work.
- ESLint 10/flat config, Prettier 3, and `eslint-config-prettier` 10 are deferred to the dedicated code-quality task. ESLint 8.57.1 is deprecated upstream, although its current combination passes lint and audit. Babel 8 and TypeScript 6/7 remain separate decisions for their documented compatibility reasons. The `@types/node` 24 proposal was dropped because no Node TypeScript declarations are consumed.
- Package entrypoints and public declarations still disagree in the ways described below. The new pack list restores the referenced files but does not repair their export/type contract. Do that with consumer fixtures and a framework versioning decision before release. `module` still points to raw TypeScript; it was preserved intentionally in this tooling task.
- A production build ends with declarations present. A later standalone `dev` or watch compilation can clean them because Webpack cleans `dist`; run `build` last when preparing a package. Future packaging work should make this artifact ownership more robust.
- The Node 24 toolchain was verified locally from a temporary installation. CI configuration, a browser support policy/targets, a development server or demo host, runtime smoke tests, and the Phaser upgrade remain future work. The installed machine-wide Node/npm versions were not altered.

### Validation after task 02

Commands ran under temporary Node 24.21.0/npm 12.2.0 using `npm-cli.js` with that Node binary and its `bin` directory on `PATH`. This avoids the local PowerShell `npm.ps1` signing restriction and ensures lifecycle scripts use Node 24. The table records the final state after package updates; earlier intermediate lint/type failures were corrected before these checks.

| Command | Result |
| --- | --- |
| `npm ci` | Pass; 348 packages installed, 0 audit findings. |
| `npm ls --depth=0` | Pass; direct dependencies resolve and Phaser is 3.55.2. |
| `npm run test:lint` | Pass; zero errors and zero warnings. |
| `npm run typecheck` | Pass with the strict TypeScript 5.9.3 config. |
| `npm test` | **Fails only at `test:unit`**, which still prints `Error: no test specified` and exits 1; preceding lint/typecheck pass. |
| `npm run dev` | Pass; Webpack emits the development bundle. |
| `npm run build` | Pass; emits ~1.01 MiB `phfw.js`, external source map, 4,523-byte extracted license text, and nine declaration files. Webpack still reports its three existing size/performance warnings because Phaser is bundled. |
| `npm pack --dry-run --json` | Pass; confirms the required JavaScript, source map, license, source entry, and declaration paths are in the prospective package. |
| `npm audit --json` | Pass; zero reported vulnerabilities. |
| `npm outdated` | Exits 1 because intentionally deferred packages remain behind current latest releases: Phaser, Babel 8, TypeScript 7, ESLint 10, Prettier 3, and `eslint-config-prettier` 10. |
| Prettier `--check src` | Pass; all source files retain the existing style. |

Production output was also inspected directly: the external source map parses as version 3 and contains the Phaser source, `phfw.js` references that map, the license file is present, and the lockfile still resolves Phaser 3.55.2. The build is not a browser runtime test.

## Inspection scope and current state

Inspected every repository source file, the complete task and local `AGENTS.md`, `package.json`, lockfile, all three Webpack configurations, `tsconfig.json`, Babel configuration, lint/format configuration, ignore files, handwritten public declarations, generated declarations, npm dependency trees, staged changes, and tracked-file inventory. HEAD is `fbd0f11`. There is no README, existing framework documentation, example game, asset directory, test suite, test runner configuration, CI workflow, browser support policy, Node version pin, or npm engine declaration in this checkout. The task files and repository guidance are the only existing Markdown documentation.

The working tree already contained staged edits to `src/input/InputManager.ts` and `types/phfw.d.ts`, plus untracked `AGENTS.md` and `tasks/`. This audit uses those working-tree versions. Those files are user work and must be preserved; conclusions do not describe pristine HEAD. The discovery task adds this document only. Validation regenerates ignored `dist/` artifacts.

### Execution and source structure

| Area | Actual implementation and implications |
| --- | --- |
| Entry and bootstrap | `src/index.ts` default-exports an object containing `Core`, `Input`, `Objects`, and `Scene`. There is no `new Phaser.Game`, HTML entry, or game configuration. Consumers supply bootstrapping, renderer, dimensions, scenes, and display-list insertion. |
| Scene | `src/Scene.ts` extends `Phaser.Scene`, passes a key in `SettingsConfig`, and saves a scaling context in `init`. It has no preload/create/update implementation or shutdown ownership. Its context type refers to ambient `phfw.Core.GameScaleManager` instead of importing the source class type. |
| GameObjects | `src/objects/TextButton.ts` extends `Phaser.GameObjects.Text`. It passes an empty Phaser text style, applies color, calls `setInteractive()`, and handles over/out/down/up. It selects only after a down followed by an up while still down; pointerout cancels down. The constructor does not add the object to a scene; consumers must do so. |
| Input | `src/input/InputManager.ts` receives an `InputPlugin`, registers anonymous `keydown-*`/`keyup-*` keyboard listeners, tracks held codes, fires named framework events, and returns `activePointer`. Four `any` annotations hide a `Set<number>` versus DOM `KeyboardEvent.code` string mismatch. There is no disposal method, focus reset, or retained callback reference. |
| Events | `src/core/EventEmitter.ts` is a small independent abstraction with duplicate-callback suppression and `fire(type, data)` payloads containing `type` and `target`. It is not a Phaser event emitter. It uses a normal object of mutable listener arrays. Subscribing/unsubscribing during dispatch and prototype-named event keys need defined behavior. |
| Scaling | `src/core/GameScaleManager.ts` calculates game-unit, CSS-viewport, and pixel ratios once at construction. It is not Phaser's `ScaleManager`, subscribes to no resize events, and uses uncapped DPR for center coordinates while capping DPR for distances. |
| Loaders, animations, tweens, physics, audio | No implementations or API calls in `src/` or `types/`. These are consumer integration risks, not reasons to add new framework subsystems. |
| Plugins/rendering extensions | No custom Phaser plugins, pipelines, shaders, masks, particle managers, camera transforms, or render textures. Webpack's cleaning plugin is a build plugin, not a Phaser plugin. |

Runtime path: importing the framework evaluates its barrels, imports Phaser for side effects in `Scene` and `TextButton`, then defines subclasses against a global `Phaser`. A host creates the game, starts the framework scene with context, constructs an input manager, creates/adds buttons, and attaches callbacks. The custom event and scale utilities do not depend on Phaser at runtime themselves.

### Toolchain and distribution

- Observed host: Windows PowerShell, Node **22.21.1**, npm **10.9.4**. `npm.ps1` is blocked by the machine's signing policy; `npm.cmd` works. This does not require changing the machine's execution policy.
- TypeScript **4.8.4**, strict checking enabled, `target: ESNext`, `module: commonjs`, `outDir: dist`. There are no explicit source include, library, module-resolution, or environment-type boundaries. The ambient declarations are included in the project and make the source's `phfw` reference resolve.
- Babel strips TypeScript and transpiles using the TypeScript/env presets. Webpack does **not** run TypeScript checking. No explicit Babel browser targets exist, and only `src/` passes through Babel. Changing TypeScript's target does not by itself control the JavaScript bundled by Babel or transpile Phaser's distributed code.
- Webpack emits `dist/phfw.js` as a UMD library named `phfw`; it bundles Phaser. Development uses inline maps, production uses external maps and explicit Terser comment extraction. No server or HMR exists: `start` invokes the watch script.
- `main` points to built UMD, `module` points to raw `src/index.ts`, and `types` points to handwritten `types/phfw.d.ts`. No package `exports` or `files` policy exists. Different consumers can therefore select different implementations and type contracts.
- `ts:defs` emits a source-derived module declaration tree under `dist/types`; it is not wired to the package's `types` field. The shared cleaning plugin removes that tree on the next Webpack build. Build before declaration generation until this ordering is repaired.
- The lockfile is version **2**, contains 470 `packages` entries including the root, and matches the root manifest's ranges. Installed direct versions match its resolutions. The manifest's broad ranges do not describe the installed historical toolchain: Webpack and Babel core have already advanced within their major ranges.

## Baseline validation

Executed with existing installed dependencies. No dependency installation, audit fix, source correction, or configuration migration was performed. Exit statuses below are individual command results, not the status of a containing PowerShell command sequence.

| Command | Result | Evidence/limit |
| --- | --- | --- |
| `npm.cmd ls --depth=0` | Pass, exit 0 | All 18 direct dependencies present; versions listed below. |
| `npm.cmd ls --all` | Pass, exit 0 | No reported invalid/missing dependency or peer-conflict tree. This checks today's installed tree only. |
| `npm.cmd test` | **Fail, exit 1** | Lint succeeds, then `test:unit` deliberately exits 1. |
| `npm.cmd run test:lint` | Pass, exit 0 | Four `@typescript-eslint/no-explicit-any` warnings at InputManager lines 24, 27, 33, and 44; zero lint errors. Warnings are not currently fatal. |
| `npm.cmd run test:unit` | **Fail, exit 1** | Prints `Error: no test specified`. No unit assertions execute. |
| `node node_modules/typescript/bin/tsc --noEmit` | Pass, exit 0 | Additional read-only type check; no npm typecheck script exists. Current annotations/declarations mask important contract errors. |
| `npm.cmd run ts:defs` | Pass, exit 0 | Generates `dist/types`; does not validate handwritten declarations against runtime exports or update package metadata. |
| `npm.cmd run dev` | Pass, exit 0 | Development compilation succeeds with Webpack 5.111.1. Repeated with a temporary log to retain the exit/summary after progress output obscured the first summary. |
| `npm.cmd run build` | Pass, exit 0 | Production compilation succeeds with three performance warnings: asset size, entrypoint size, and performance recommendations. Output is approximately **1.01 MiB**, mostly the bundled Phaser distribution (6.52 MiB before minimisation). Maps and extracted license text are emitted. |
| `node node_modules/prettier/bin-prettier.js --check src` | Pass, exit 0 | Read-only equivalent of checking the existing formatting configuration; all source files match. |
| `npm.cmd audit --json` | **Fail, exit 1** | Nine high-severity vulnerable package entries, zero critical/moderate/low entries; details below. |
| `npm.cmd audit --omit=dev --json` | Pass, exit 0 | Zero reported production-tree advisories at audit time. |

`format` was not run because it rewrites source; `clean` was not run because it deletes artifacts and uses a Unix-specific command. `watch`/`start` are long-running compilation commands, not finite validation checks. Browser execution, clean-install reproducibility, package-consumer compilation, and downstream game behavior remain **unverified**. Passing Webpack is not evidence that scenes boot or buttons receive input.

## Dependency audit and target versions

Current-stable metadata was fetched directly from `https://registry.npmjs.org/<package>`, including `dist-tags`, engine requirements, peer dependencies, publication times, and deprecation fields. Specific version links below preserve the versions examined. Stable means the registry's `latest` tag, excluding prerelease tags; it does not mean every latest version belongs in the recommended target.

| Package | Manifest range | Locked/installed | Current stable | Recommended target/disposition |
| --- | --- | --- | --- | --- |
| Phaser | `^3.55.2` | 3.55.2 | [4.2.1](https://registry.npmjs.org/phaser/4.2.1) | Pin 3.90.0 at the checkpoint, then 4.2.1 during migration; widen within verified 4.x only after testing. |
| TypeScript | `^4.8.4` | 4.8.4 | [7.0.2](https://registry.npmjs.org/typescript/7.0.2) | **5.9.3** initially; compatible with selected lint tooling. Evaluate 6.0.3 separately; defer 7.x until lint support exists. |
| `@types/node` | `^16.18.0` | 16.18.0 | [26.6.4](https://registry.npmjs.org/@types%2Fnode/26.6.4) | **24.19.1** if Node declarations are needed; match the Node 24 tool environment and keep them out of browser source's ambient types. |
| `@babel/core` | `^7.19.6` | 7.29.7 | [8.0.7](https://registry.npmjs.org/@babel%2Fcore/8.0.7) | **7.29.7** initially; already installed. Babel 8 is a separate later change. |
| `@babel/preset-env` | `^7.19.4` | 7.19.4 | [8.0.7](https://registry.npmjs.org/@babel%2Fpreset-env/8.0.7) | **7.29.7**, paired with core 7; define browser targets. |
| `@babel/preset-typescript` | `^7.18.6` | 7.18.6 | [8.0.7](https://registry.npmjs.org/@babel%2Fpreset-typescript/8.0.7) | **7.29.7**, paired with core 7. |
| `babel-loader` | `^8.2.5` | 8.2.5 | [10.1.1](https://registry.npmjs.org/babel-loader/10.1.1) | **10.1.1**, compatible with Babel 7 and selected Webpack. |
| Webpack | `^5.74.0` | 5.111.1 | [5.111.1](https://registry.npmjs.org/webpack/5.111.1) | **5.111.1**; retain the already installed current major. |
| `webpack-cli` | `^4.10.0` | 4.10.0 | [7.2.3](https://registry.npmjs.org/webpack-cli/7.2.3) | **7.2.3** in a build-tooling change. |
| `webpack-merge` | `^5.8.0` | 5.8.0 | [6.0.1](https://registry.npmjs.org/webpack-merge/6.0.1) | **6.0.1**; verify the existing `merge(common, ...)` configs. |
| `terser-webpack-plugin` | `^5.3.6` | 5.6.1 | [5.6.1](https://registry.npmjs.org/terser-webpack-plugin/5.6.1) | **5.6.1**; retain explicit comment/license extraction until output parity is checked. |
| `clean-webpack-plugin` | `^4.0.0` | 4.0.0 | [4.0.0](https://registry.npmjs.org/clean-webpack-plugin/4.0.0) | Remove after adopting Webpack `output.clean` and fixing artifact order. |
| ESLint | `^8.26.0` | 8.26.0 | [10.12.0](https://registry.npmjs.org/eslint/10.12.0) | **10.12.0** with flat configuration; do not reuse `.eslintrc` invocation. |
| `@typescript-eslint/parser` | `^5.40.1` | 5.40.1 | [8.71.1](https://registry.npmjs.org/@typescript-eslint%2Fparser/8.71.1) | **8.71.1**, paired exactly with plugin. |
| `@typescript-eslint/eslint-plugin` | `^5.40.1` | 5.40.1 | [8.71.1](https://registry.npmjs.org/@typescript-eslint%2Feslint-plugin/8.71.1) | **8.71.1**, paired exactly with parser. |
| `eslint-config-prettier` | `^8.5.0` | 8.5.0 | [10.1.8](https://registry.npmjs.org/eslint-config-prettier/10.1.8) | **10.1.8**, applied after lint rules. |
| Prettier | `^2.7.1` | 2.7.1 | [3.9.9](https://registry.npmjs.org/prettier/3.9.9) | **3.9.9** in a separate formatting change. |
| `npm-run-all` | `^4.1.5` | 4.1.5 | [4.1.5](https://registry.npmjs.org/npm-run-all/4.1.5) | Remove: only sequential script chaining is needed. Use npm script composition. |

Tool runtime proposal: **Node 24.21.0 LTS** and **npm 12.2.0**, pinning the project/CI runtime and recording npm policy. Node 26.11.0 is current, but Node 24 is the LTS choice in the [official release table](https://nodejs.org/en/about/previous-releases). [npm 12.2.0](https://registry.npmjs.org/npm/12.2.0) requires Node `^22.22.2 || ^24.15.0 || >=26`; the observed Node 22.21.1 is insufficient for it. Upgrade the runtime before npm. No host/runtime update is part of this audit.

### Compatibility and breaking paths

1. **TypeScript and lint must be planned together.** Parser/plugin 8.71.1 advertise ESLint `^8.57.0 || ^9.0.0 || ^10.0.0` and TypeScript `>=4.8.4 <6.1.0`. Latest TypeScript 7.0.2 violates that peer range. The existing parser/plugin 5.x are not an appropriate target for TypeScript 5.9.3. Use the proposed 5.9.3/8.71.1/10.12.0 set, then run a normal install and inspect the resolved tree; metadata compatibility is not a tested install. See [typescript-eslint supported dependencies](https://typescript-eslint.io/users/dependency-versions/).
2. **ESLint 8 to 10 is configuration migration.** ESLint 10 requires Node `^20.19.0 || ^22.13.0 || >=24` and removes legacy configuration support. Create a flat config, port `.eslintignore`, browser/Node scopes, existing rules, and Prettier ordering; audit renamed/removed TypeScript rules. Flat recommended configurations may need an explicit `@eslint/js` dependency: select the matching 10.x release and verify metadata if added. Keep config files in CommonJS-compatible `.cjs` form unless the package's module policy changes. See [ESLint 10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0).
3. **Build tool peers are compatible on paper.** babel-loader 10.1.1 accepts Babel `^7.12.0 || ^8.0.0-beta.1` and Webpack `>=5.61.0`; its Node minimum is `^18.20.0 || ^20.10.0 || >=22.0.0`. webpack-cli 7.2.3 requires Node >=20.9 and Webpack `^5.101.0`; webpack-merge 6 requires Node >=18. The proposed Node 24/Webpack 5.111.1 combination satisfies these. Additional CLI integrations and Rspack peers are optional; they do not justify installing unused tools.
4. **Babel 8 is not necessary to migrate Phaser.** Core/presets 8.0.7 are current, but Babel 8 is ESM-only, requires Node `^22.18.0 || >=24.11.0`, and requires matching core/preset majors. Loader 8 cannot accept core 8. Keep Babel 7.29.7 together initially; defer the ESM/configuration and class-field behavior review to its own change. See [Babel 8 migration](https://babeljs.io/docs/v8-migration).
5. **Prettier 3 changes its programmatic API and formatting.** This repository uses the CLI, so the main local effect is formatting churn. Preserve the existing style settings and put any changed formatting in its own commit. See [Prettier 3 release notes](https://prettier.io/blog/2023/07/05/3.0.0).
6. **Lockfile evolution is npm-owned.** A newer npm may regenerate the version-2 lock into its current format and change transitive resolutions. Do not manually edit dependencies in it. Separate intentional dependency updates from mechanical lockfile changes where practical; verify with `npm ci` in a disposable checkout and review diffs. Do not use forced installs or legacy peer bypasses.

### Maintenance, redundancy, and security

- The registry marks installed ESLint 8.26.0 deprecated because it is unsupported. None of the examined direct latest releases has a registry deprecation flag. Old version age is not sufficient evidence that a project is abandoned.
- `npm-run-all` last published 4.1.5 on 24 November 2018. This is a maintenance concern; removing its two simple uses avoids introducing a replacement. The maintained fork [npm-run-all2 9.0.3](https://registry.npmjs.org/npm-run-all2/9.0.3) is worth considering only if future scripts need substantial orchestration. Its Node requirements also exceed the observed host version.
- `clean-webpack-plugin` last published 4.0.0 on 1 September 2021. Its function is already available through [Webpack output.clean](https://webpack.js.org/configuration/output/#outputclean); it is redundant here. Do not assert formal deprecation or abandonment without further maintainer evidence.
- Keep `webpack-merge` for the established common/dev/prod structure. Keep Babel while browser targets and output compatibility are being established. No package is needed merely to implement small cleanup/type fixes. `@types/node` is not needed for browser runtime source, though it can remain scoped to tooling if required.
- Full npm audit reports **nine high-severity package entries derived from one braces advisory**, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): deeply nested glob patterns can exhaust the stack in braces <=3.0.3. The reported chain is `@typescript-eslint` packages -> `globby` -> `fast-glob` -> `micromatch` -> `braces`. The nine entries include propagated vulnerable parents, not nine independent exploits. The audit proposes parser/plugin 8.71.1 as a major-version remedy. Refresh the resolved tree and rerun audit to confirm the actual outcome; do not assume an upgrade eliminates every advisory.
- Production-only audit reports zero findings. The observed glob issue is in development tooling, so the report does not establish an exploitable game runtime. Absence of registry advisories is not proof of overall security. No forced audit fix, overrides, or migration has been applied.

## Phaser migration analysis

### Directly affected source

| Source/API | Evidence and required action | Regression exposure |
| --- | --- | --- |
| `Scene.ts`, `TextButton.ts`: `import 'phaser'` and global `Phaser` | The installed 3.55.2 build assigns `global.Phaser`. Phaser 3.90.0 introduces an ESM package entry and 4.2.1 has conditional package exports selecting ESM for imports. Inspected both tagged ESM distributions: neither assigns `global/window/globalThis.Phaser`. Use explicit runtime imports, such as a verified namespace import, instead of relying on side effects. Add explicit type imports wherever Phaser types are used. | **High:** subclass definitions can throw before a scene boots even when Webpack and TypeScript pass. Verify source imports, bundled UMD, and intended ESM consumption independently. |
| `InputManager.ts`: `config.input.keyboard.on(...)` | In the [4.2.1 declarations](https://github.com/phaserjs/phaser/blob/v4.2.1/types/phaser.d.ts), `InputPlugin.keyboard` is `KeyboardPlugin \| null`; installed 3.55.2 types declare it non-null. Narrow once before registering listeners. Define whether missing keyboard produces an explicit configuration error or permits pointer-only operation; the latter suits consumers on touch-only/keyboard-disabled scenes. Avoid assertions hiding the null case. | Medium/high: keyboard-disabled scenes and setup ordering; change is required for strict compilation on the new types. |
| `InputManager.ts`: keyboard events and held state | The [tagged key-down event](https://github.com/phaserjs/phaser/blob/v4.2.1/src/input/keyboard/events/KEY_DOWN_EVENT.js) and [key-up event](https://github.com/phaserjs/phaser/blob/v4.2.1/src/input/keyboard/events/KEY_UP_EVENT.js) still pass native `KeyboardEvent`, and dynamic `keydown-*`/`keyup-*` names remain supported. Replace all four `any` annotations and use `Set<string>` for `event.code`. Keep logical event names distinct from Phaser key-name suffixes. | Medium: preserve down/up/pressed/released semantics and browser repeat behavior; no rewrite to polling is required. |
| `Scene.ts`: inheritance, settings, `init` | Scene inheritance and settings remain available; no removed call is present. Replace ambient `phfw` in `GameContext` with an imported `GameScaleManager` type. Compare the target init signature and define context availability before/after init and restart. | Medium: context lifetime and downstream subclass declarations. |
| `TextButton.ts`: constructor, `setInteractive`, pointer events, `setColor` | Target declarations retain these APIs. No direct replacement is required. Text texture/rendering and pointer processing have changed internally across releases; test behavior rather than declaring a source-only migration successful. | **High** for visible text and hit areas; medium for callback semantics. |
| `InputManager.getActivePointer()` | Target declarations still return `Phaser.Input.Pointer`. No rename required. Verify pointer coordinates in resized/scaled canvases and which pointer is active on touch. | Medium, especially on mobile. |
| `EventEmitter`, `GameScaleManager` | They do not call Phaser APIs. Engine migration does not require replacing them with Phaser classes. | Existing behavior risks remain; scaling changes can create wide regressions if bundled with the engine update. |

The module-entry findings are supported by [Phaser 3.60 ESM notes](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/ESMSupport.md), the [3.90.0 metadata](https://registry.npmjs.org/phaser/3.90.0), [4.2.1 metadata](https://registry.npmjs.org/phaser/4.2.1), and tagged distributions [3.90 ESM](https://github.com/phaserjs/phaser/blob/v3.90.0/dist/phaser.esm.js) / [4.2.1 ESM](https://github.com/phaserjs/phaser/blob/v4.2.1/dist/phaser.esm.js). This is a concrete package-resolution risk, not a claim that the existing browser bundle was observed failing.

### Changes between 3.55.2 and 3.90.0

Read the [3.60 subsystem index](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/CHANGELOG-v3.60.md) and relevant input, scene, scale, text, and tween notes, then checked later releases against the source inventory.

- **Input/lifecycle:** 3.60 allows scene input during init/preload, changes touch movement outside the canvas, and removes `InteractiveObject.alwaysEnabled`. That property is absent here. Earlier input availability and touch cancellation matter to consumer setup and button behavior; verify the framework's own held-state reset separately. See [3.60 input notes](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/Input.md).
- **Scenes/scaling:** scene queue operations can complete in different frames; scale refresh now detects canvas position changes and honors `scale.mode`. There is no corresponding framework scene queue or scale config to patch, but hosts must test restart and canvas relocation. See [scene notes](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/Scene.md) and [scale notes](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/ScaleManager.md).
- **Text:** metrics/RTL/wrapping fixes affect rendering. In 3.80, Text textures enter the global texture manager, and orientation refresh changes; test repeated button destruction and parent resize. See [3.60 Text notes](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/TextGameObject.md) and [3.80 changelog](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.80/CHANGELOG-v3.80.md).
- **Tweens:** 3.60 removes tween timelines in favor of chains, changes seek to milliseconds, removes frame-based timing, changes callback arguments, and destroys completed tweens unless persisted. There are no local tween calls to migrate, but downstream code must be searched before claiming game compatibility. See [tween migration notes](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/TweenManager.md).
- **Particles:** 3.60 removes `ParticleEmitterManager`; `add.particles` creates an emitter directly with a changed signature. No local particle use exists. Check consumer games for old manager/createEmitter usage. See [particle notes](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.60/ParticleEmitter.md).
- **Animation, physics, loader, audio:** no local changes are identifiable. Consumer animation-frame durations need checking because 3.80 treats duration as total frame duration; loader/audio processing and physics fixes can alter host behavior. Do not silently add game-specific wrappers. The [3.90 changelog](https://github.com/phaserjs/phaser/blob/master/changelog/v3/3.90/CHANGELOG-v3.90.md) includes frame-duration, text-direction, audio, and EXPAND canvas-clamping fixes. These require consumer smoke coverage where used.

There is no requirement to ship every intermediate Phaser version. Use 3.90.0 as one verified checkpoint while treating 3.60 as the principal breaking-change review boundary. Phaser's statement that 3.90 is a drop-in upgrade from 3.88 does not establish compatibility from 3.55.2.

### Phaser 4 boundary

The [official migration guide](https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/MIGRATION-GUIDE.md) describes a replacement WebGL renderer: pipelines become render nodes, FX/masks become filters, camera matrices and texture orientation change, and Canvas remains available but deprecated. Pixel-rounding defaults/behavior change, which is relevant to scaled text and centered coordinates even without custom rendering code.

Searches found no framework use of pipelines, masks/FX, compressed textures, dynamic/render textures, shaders, direct camera matrices, `Geom.Point`, Phaser collections, legacy plugins, or removed game objects. No speculative replacement code is required for those APIs here. The downstream checklist still needs those areas because the framework accepts ordinary Phaser scenes and objects. The input manager uses a native `Set`, not the removed Phaser collection API.

Use WebGL as the primary verification renderer. If existing consumers require Canvas, test it explicitly and document its status instead of silently removing support. Renderer-wide changes make visual and mobile verification necessary despite the small number of direct APIs used.

Prefer 4.2.1 over an early 4.0 release: its [patch changelog](https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.2.1/CHANGELOG-v4.2.1.md) fixes parent-container resizing, ESM namespace access, and delayed tween activation. These fixes reinforce the need to check the exact target release.

## Build/tooling and public contract changes

### Required for a reliable migration

1. Add a finite typecheck command and make lint, typecheck, real unit assertions, build, declaration generation, and package-consumer checks part of validation. Keep Babel transpilation and TypeScript validation explicit. Replace the deliberately failing unit placeholder; do not hide it by returning success without tests.
2. Adopt the compatible dependency set using normal npm operations. Resolve lint flat-config and peer requirements before installing a compiler major that the parser cannot support.
3. Replace global Phaser dependencies with explicit imports, guard nullable keyboard access, and type native keyboard events/held codes. Validate direct entry imports as well as barrel imports.
4. Repair the declaration/runtime contract before publishing. The handwritten declarations currently make `textColor` optional while source requires it, make `onSelect` required while source permits it to be absent, make scene context required while source makes it optional, omit `getAssetScaleRatio`, and omit public button/input methods. Generated declarations also retain the ambient `phfw` context reference.
5. Establish a single authoritative declaration output and ensure the package's `types` points to the file actually shipped. Preserve existing global/UMD usage through a documented compatibility declaration if needed. Inspect the default-export shape: TypeScript's `export = phfw` declaration does not automatically describe the Webpack UMD export of a default object (`phfw.default` may be the actual browser access path). Confirm with a consumer fixture before changing `library.export` or claiming `phfw.Scene` works.
6. Align emitted JavaScript with package entrypoints. Stop advertising raw TypeScript as a generic `module` entry unless source consumption is a deliberate supported contract. Decide which built UMD/ESM entrypoints to ship, then add `exports`/`files` and a package smoke check. Introducing `exports` can block undocumented deep imports; inventory consumers and version the public change accordingly.
7. Make build/declaration ordering deterministic so cleaning cannot erase deliverables. For TypeScript 5.9, consider an explicit browser config with `module: ESNext`, `moduleResolution: Bundler`, DOM/ES libraries, and source includes; keep tooling/consumer compilation scoped separately. Do not mechanically apply Bundler resolution to CommonJS output or Node-consumer tests.

### Recommended, separately scoped fixes

- Give InputManager ownership of each callback and a disposal path that removes only its own listeners. Wire ownership to scene shutdown/destroy and define whether restart recreates or reattaches the manager. Clear held state on loss of focus and shutdown; decide whether reset emits release events. Do not call `removeAllListeners` on a shared keyboard plugin. This is an existing lifecycle defect, not an API rename imposed by Phaser.
- Define button behavior for release outside the canvas, touch cancel, scene shutdown, and multiple simultaneous pointers. Current `_isDown` is one shared boolean without pointer identity; cross-pointer selection is a potential defect to characterize before fixing. Keep the documented pointerout cancellation semantics unless intentionally changing them.
- Verify scaling units against the host canvas. Distances use capped DPR, but center uses uncapped DPR. For viewport 800x600, DPR 2, and cap 600, the effective ratio is 1; a host canvas sized to the capped ratio would be 800x600, yet this helper centers at (800,600) rather than (400,300). This is conditional on how the host sizes its canvas, which is absent here. Establish that contract, then fix centers and resize behavior in their own change with tests. Returning a typed coordinate tuple and rejecting invalid dimensions are useful later improvements.
- Preserve the custom EventEmitter's `fire` payload and callback deduplication. Define safe iteration and event-key handling before using a Map or another internal representation. Replacing it with Phaser's emitter would change behavior and create unnecessary runtime coupling.
- Use Webpack `output.clean` instead of the cleaning package, and use a small platform-independent Node cleanup command if a standalone clean script remains necessary. Remove `npm-run-all` and simplify `start`/test orchestration.
- Define a modern-browser support policy and matching Babel targets; avoid unneeded legacy transforms. Remove/debug-gate unconditional button and scaling console logs.
- Add a README with actual import paths, renderer setup, scene context, button display-list insertion, input disposal, coordinate units, Node/npm requirements, and verification commands. Add Windows/Linux CI using `npm ci` and the pinned toolchain; browser checks should exercise Chromium, Firefox, and WebKit with real desktop/mobile follow-up for touch/DPR behavior.

### Optional follow-ups

- Produce an additional built ESM distribution after the existing UMD contract is verified. Keep this separate from switching the engine.
- Externalise Phaser and move it to a peer dependency to avoid duplicate engines in host applications. This is attractive for a reusable framework and could remove most of the 1.01 MiB bundle, but changes installation, browser script ordering, and Phaser instance ownership. Preserve a standalone bundle if consumers need it. Declare only the Phaser range actually verified; do not advertise simultaneous 3.x/4.x compatibility by assumption.
- Evaluate Babel 8 and TypeScript 6 independently; reconsider TypeScript 7 when the lint peer range supports it. Newer stable versions are not sufficient justification for overriding peer conflicts.
- Consider a bundler replacement only if measured development/distribution needs justify it. There is no demonstrated Webpack blocker here, and Vite would not itself solve public declaration drift or lifecycle bugs.
- Stronger event maps, broader context generics, and added physics/audio/loader abstractions require consumer needs. They are not prerequisites for modernising this small framework.

## Risks and proposed implementation order

| Order | Deliverable/checkpoint | Risk and exit gate |
| --- | --- | --- |
| 1 | Preserve current user changes; add a minimal host fixture and meaningful tests on 3.55.2; record actual package/global export shape and scaling expectations. | Low production impact. Gate: existing behavior is characterized and `test:unit` runs assertions. |
| 2 | Pin Node 24/npm, migrate lint to the compatible flat-config set, upgrade TypeScript to 5.9.3, keep Babel 7, and simplify scripts. Refresh lockfile normally. | Medium tooling risk. Gate: clean `npm ci`, dependency/peer tree, lint, typecheck, assertions, audit; any new failures explained. |
| 3 | Repair imports, native keyboard types, missing-keyboard behavior, and source context types while still on 3.55.2. Add generated declaration/consumer parity checks; resolve output contract in a separate commit. | **High package-loading/public API risk.** Gate: UMD and intended module consumers boot and compile without an externally preloaded Phaser global or stale ambient declarations. |
| 4 | Upgrade Phaser alone to 3.90.0. Apply only proven source/type fixes; review consumer 3.60 breaking APIs. | Medium/high engine risk. Gate: input/button/scene/resize fixture and representative downstream game pass; collect screenshots and listener counts. |
| 5 | Upgrade Phaser alone to 4.2.1; review renderer support and downstream APIs. | **Highest engine/visual regression risk.** Gate: cross-browser WebGL rendering, pointer hit areas, text appearance, resize/DPR, scene restart, and host integration checks pass. Canvas gate if supported. |
| 6 | Fix input ownership/focus, button cancellation/pointer identity, scaling contract, and emitter edge cases as separate behavior changes. | **High input/scaling regression risk** despite modest code size. Gate: targeted old/new behavior comparisons, boundary dimensions, lifecycle and multi-pointer checks. |
| 7 | Finalise packaging/docs/CI; consider ESM, Phaser peer/externalisation, formatting, and later compiler/Babel upgrades independently. | **High distribution risk** for entrypoint/externalisation changes; low for documentation/isolated formatting. Gate: packed-package consumer checks and published support contract agree. |

Keep each checkpoint's dependency lock and behavior changes reviewable and reversible through commits. Do not combine corrective scaling semantics with the Phaser renderer switch; otherwise a changed coordinate could have multiple causes. A corrected export/declaration surface or a Phaser 4 peer requirement may warrant a framework major release even though the framework package currently says 1.0.0.

## Verification strategy and completion gates

### Automated checks to implement

- **Pure utilities:** EventEmitter duplicate subscription, removal, dispatch mutation, payload `type`/`target`, and special event names; scaling conversions across portrait/landscape, DPR 1/2/3, capped/uncapped dimensions, centers, and invalid input policy. Node's built-in test facilities can cover these without a large runner dependency; decide how TypeScript fixtures compile/load before selecting a runner.
- **Input ownership:** first down versus repeated down, first/repeated up, simultaneous keys, remapped names, missing keyboard, focus reset, disposal, and repeated setup/shutdown. Tests must assert event counts and state transitions, not merely mirror private implementation.
- **Browser fixture:** a real Phaser game using the framework scene, added TextButton, InputManager and scaling context. Assert boot without global preloading, visible text, color state, selection counts, cancellation, active pointer positions, and scene restart without duplicate listeners. Run both development and production output paths.
- **Consumer types/package:** compile small fixtures using the documented imports and scene subclassing. Ensure optional callbacks/context and required style properties match runtime. Test generated declarations without ambient source-tree declarations accidentally supplying missing types. Use `npm pack --dry-run --json` to inspect packaging, then install the actual tarball into isolated consumer fixtures when implementing release verification.
- **Build:** production build then declarations, assert every advertised `main`/`module`/`types`/`exports` file exists, retain required license extraction and useful maps, and compare bundle size/composition. Verify no unexpected duplicate Phaser copy if externalisation is adopted.

### Browser and downstream checks

Run current stable Chromium, Firefox, and WebKit; include Safari/iOS and Android touch verification for behaviors desktop emulation cannot establish. Verify resize, parent-container move/resize, orientation changes, high-DPI caps, canvas CSS scaling, text replacement/font loading, hover/down/out/up, release outside, touch cancel, multiple pointers, keyboard repeat, tab blur, and repeated scene restart/destruction. Capture text/button images and expected hit regions; pixel comparison needs controlled fonts/DPR and reasonable tolerance.

The repository has no game consuming loaders, physics, audio, tweens, animations, or custom plugins. Before making a release-wide compatibility claim, obtain a representative consuming game and search its actual source for the changed APIs listed above. Exercise audio unlock/resume, representative collisions, tween completion/replay, animation duration, asset loading failure, and plugin integration only where present. Lack of a consumer fixture is an explicit limit on confidence, not proof that those subsystems are unaffected.

At each implementation checkpoint run the available finite checks and audit again, using a clean npm install in CI/disposable checkout. Accept completion only when lint/typecheck/tests/build/declarations/consumer checks pass, the placeholder is gone, there are no unexplained peer/engine conflicts or unresolved high/critical findings, documented renderer/browser support passes, and package entrypoints/types describe the same API. Record intentional behavior/API changes and any accepted limitations. This audit establishes the baseline and sequence; it does not satisfy these future migration gates.
