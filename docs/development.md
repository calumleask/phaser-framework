# Development guide

## Environment and install

Use Node 24.21.0 from `.nvmrc` and npm 12.2.x. `.npmrc` enables strict engine checks. From the repository root, run:

```sh
npm ci
```

Use npm for dependency changes and commit the synchronised `package-lock.json`. Do not bypass peer or engine conflicts with force flags. See [Dependencies](dependencies.md) for current constraints.

## Build and validation workflow

- `npm run dev` creates the development UMD bundle in `dist/`.
- `npm run watch` or `npm start` rebuilds that bundle as files change.
- `npm run build` creates the production bundle and then emits declarations.
- `npm test` runs lint, typecheck, then Node unit tests; `npm run test:unit` runs only the unit tests.
- `npm run lint` checks `src` and `test`; `npm run lint:fix` applies safe ESLint fixes.
- `npm run format:check` checks `src` and `test`; `npm run format` formats those paths.
- `npm run typecheck` runs TypeScript without output. `npm run ts:defs` emits declarations.
- `npm run clean` removes `dist/`.

Webpack cleans `dist` on each build. Run `npm run build` last before inspecting or packing production artifacts. There is no local game host or browser test fixture, so building the framework does not itself demonstrate consumer rendering or lifecycle behavior.

## Extending the framework

### Add a scene

Subclass the exported `Scene` and provide a stable key to `super`. Phaser's host game registers and starts the scene. Override Phaser lifecycle methods as needed. If the scene needs scale context, pass the documented `{ scaling }` data to `init`; do not assume it is always present before `init` or across a restart. The base class does not create a game or manage scene transitions.

### Add a GameObject

Use Phaser GameObjects and lifecycle directly. For a custom object based on an existing GameObject, follow the `TextButton` pattern where it fits; after constructing it, add it to the scene display list (for example, `scene.add.existing(object)`). Keep input listeners attached to the owning GameObject when its own lifecycle can manage them. Avoid adding a general manager unless actual framework consumers need one.

### Add assets

Assets belong to the consuming game. This repository has no assets, loader wrapper, URL convention, or asset-copy stage. Load assets from the host scene using Phaser's loader and have the host build/package those files. Do not add assumptions about a game's directory or deployment base path to the framework.

### Add a dependency

Check whether the framework or platform already provides the needed behavior, verify maintenance and compatibility with the pinned Node/TypeScript/Phaser/Webpack versions, and use npm to update the lockfile. Add runtime packages under `dependencies` only when source requires them; keep build/test-only packages in `devDependencies`. Review the package's peer requirements and security status before accepting an upgrade.

## TypeScript and Phaser conventions

The source uses strict TypeScript (`strict`, exact optional properties, checked indexed access, override checks, isolated modules, and verbatim module syntax). Keep imports explicit, use `import type` for type-only Phaser references, prefer narrow public types, and avoid `any`, suppressions, unnecessary assertions, and non-null assertions. `skipLibCheck` is scoped to the current external Phaser declaration incompatibilities; do not use it to hide framework source errors.

Use Phaser's actual scene and GameObject lifecycle rather than introducing a parallel game bootstrap, global state container, or service locator. Consider that keyboard availability is nullable. InputManager currently has no per-instance teardown or focus reset, TextButton has one pressed flag across pointers, and scaling has no resize behavior; changes to these behaviors need targeted browser verification and an explicit contract. See [Architecture](architecture.md) and the [best-practices review](best-practices-review.md).

## Tests and release checks

Place Node tests in `test/` using the built-in `node:test` runner. Current tests exercise the pure custom event emitter; they do not cover a real Phaser renderer, scene restart, touch, scaling, or package consumer. Add meaningful behavior assertions rather than tests that mirror private implementation. For Phaser-sensitive changes, verify a representative host game in browsers and record unsupported or untested paths.

Before preparing artifacts, run `npm test`, `npm run format:check`, and `npm run build`; inspect `dist/` after the final build. The current package entrypoints and handwritten type declaration have documented parity gaps, so do not infer release compatibility solely from a successful build. See the [modernisation plan](modernisation-plan.md) for open migration gates.
