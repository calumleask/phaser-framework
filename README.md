# Phaser Framework

A small reusable TypeScript framework for Phaser games. It provides a scene base class, a text button, an input adapter, a lightweight event emitter, and viewport/game-unit scaling helpers. The consuming game owns `Phaser.Game`, its configuration, scenes, assets, and any physics, audio, animation, or tween systems.

## Stack and prerequisites

- Phaser 4.2.1
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
npm run build         # production bundle followed by declarations
npm test              # lint, typecheck, and unit tests
npm run lint          # ESLint on src and test
npm run format:check  # check formatting on src and test
npm run format        # format src and test
npm run typecheck     # strict source/type check without emitting files
npm run clean         # remove dist
```

`npm run build` writes the UMD bundle and generated declarations to `dist/`. Webpack cleans that directory when either build configuration runs, so use the production `build` command last when preparing package artifacts. `npm run dev` builds a library bundle; the repository does not provide a game page or development server.

## Repository layout

- `src/` — exported framework source (`Scene`, `Core`, `Input`, and `Objects`)
- `test/` — Node unit tests
- `types/` — handwritten package declaration file
- `dist/` — generated bundle and declarations
- `docs/` — architecture, development, dependency, and migration notes
- `webpack.*.js`, `tsconfig*.json`, `eslint.config.mjs` — build and quality configuration

See [Architecture](docs/architecture.md) for the actual runtime and package shape, [Development](docs/development.md) for contribution workflows, and [Dependencies](docs/dependencies.md) for dependency rationale and upgrade constraints. The [final modernisation review](docs/modernisation-review.md) reports current validation and release gates; the [best-practices review](docs/best-practices-review.md) and [modernisation plan](docs/modernisation-plan.md) retain the detailed findings and migration history.
