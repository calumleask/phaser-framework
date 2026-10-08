# Phaser Framework

A small reusable TypeScript framework for Phaser games. It provides a scene base class, a text button, an input adapter, a lightweight event emitter, and viewport/game-unit scaling helpers. The consuming game owns `Phaser.Game`, its configuration, scenes, assets, and any physics, audio, animation, or tween systems.

## Stack and prerequisites

- Phaser 4.2.1 (required peer dependency in consuming games)
- TypeScript 5.9.3
- Webpack 5 and Babel 7
- ESLint 10, Prettier 3, and Node's built-in test runner
- Node 24.21.0 and npm 12.2.x (the package requires Node `>=24.15 <25` and npm `>=12.2 <13`)

Use a Node version manager with `.nvmrc`, then install the locked dependencies:

```sh
npm ci
```

## Common commands

```sh
npm run dev           # development UMD bundle
npm run watch         # rebuild the development bundle on changes
npm start             # alias for watch
npm run build         # production UMD and ESM bundles, then declarations
npm run verify:consumer  # packed-package types and Chrome/Edge WebGL checks
npm test              # lint, typecheck, and unit tests
npm run lint          # ESLint on src and test
npm run format:check  # check formatting on src and test
npm run format        # format src and test
npm run typecheck     # strict source/type check without emitting files
npm run clean         # remove dist
```

`npm run build` writes `dist/phfw.js` (UMD), `dist/phfw.mjs` (ESM), and generated declarations. Phaser is supplied by the host game: load Phaser before the UMD script, then access `phfw.default`; bundlers can use the built ESM entry and a default import. The package pins the verified Phaser peer version to 4.2.1. `npm run verify:consumer` builds, installs a tarball into an isolated fixture, typechecks a consumer, and runs UMD and bundled WebGL checks in Chrome or Edge. Set `PHFW_CHROME_PATH` if the browser is in a nonstandard location.

Webpack cleans `dist/` when the UMD build runs, so use the production `build` command last when preparing package artifacts. `npm run dev` builds a library bundle; it does not start a development server.

## Repository layout

- `src/` — exported framework source (`Scene`, `Core`, `Input`, and `Objects`)
- `test/` — Node unit tests and the packed browser consumer fixture
- `dist/` — generated UMD/ESM bundles and authoritative declarations
- `docs/` — architecture, development, dependency, and migration notes
- `webpack.*.js`, `tsconfig*.json`, `eslint.config.mjs` — build and quality configuration

See [Architecture](docs/architecture.md) for the actual runtime and package shape, [Development](docs/development.md) for contribution workflows, and [Dependencies](docs/dependencies.md) for dependency rationale and upgrade constraints. The [final modernisation review](docs/modernisation-review.md) reports current validation and release gates; the [best-practices review](docs/best-practices-review.md) and [modernisation plan](docs/modernisation-plan.md) retain the detailed findings and migration history.
