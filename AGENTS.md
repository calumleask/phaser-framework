# Agent instructions

This repository is a reusable Phaser 4.2.1 framework written in TypeScript. The consuming game owns `Phaser.Game`, game configuration, scenes, assets, and optional systems such as physics or audio. Keep changes focused on the framework's actual source; do not invent a bootstrap or game-specific architecture.

## Repository map

- `src/` — framework entry point and scene, core utilities, input adapter, and GameObjects
- `test/` — Node built-in test runner tests
- `types/` — handwritten package declarations
- `dist/` — generated bundle and declarations; do not edit by hand
- `docs/` — architecture, development, dependency, review, and migration documentation
- `webpack.*.js`, `tsconfig*.json`, `eslint.config.mjs` — build and quality configuration

Read the requested task, relevant source/configuration, and linked docs before editing. Check `package.json` for commands. Read [Architecture](docs/architecture.md) for the current package and runtime shape, and [Development](docs/development.md) for workflows.

## Tooling and validation

Use Node 24.21.0 and npm 12.2.x (`.nvmrc` and `package.json` are authoritative); use npm and keep `package-lock.json` synchronised through npm commands. Do not bypass engine/peer conflicts with force flags or `npm audit fix --force`.

Available checks:

- `npm test` — lint, typecheck, and unit tests
- `npm run lint` / `npm run lint:fix` — ESLint on `src` and `test`
- `npm run format:check` / `npm run format` — Prettier on `src` and `test`
- `npm run typecheck` — strict TypeScript check
- `npm run build` — production UMD bundle followed by declaration emit
- `npm run dev`, `npm run watch`, `npm start` — development bundle/watch

Run relevant checks after edits and the full suite for broad changes. Webpack cleans `dist`; run `npm run build` last when verifying package artifacts. Static checks do not replace browser verification for Phaser rendering or lifecycle behavior.

## Code conventions

- Keep TypeScript strict and explicit. Avoid `any`, unjustified assertions/suppressions, and unnecessary non-null assertions. Use type-only imports when appropriate. `skipLibCheck` is enabled because of Phaser 4.2.1 declaration diagnostics, but it skips checking all declaration files, including this package's handwritten declarations. Do not rely on it to validate the public type contract.
- Follow Phaser scene/GameObject lifecycle. Consider keyboard availability nullable and avoid removing listeners owned by shared Phaser plugins. Do not add a framework game bootstrap, generic state container, or subsystem without concrete consumer need.
- Preserve public behavior unless the task explicitly changes it. Input teardown/focus, multi-pointer button semantics, resize/scaling contract, browser runtime coverage, and package entrypoint/type parity remain known follow-up areas; read the best-practices review before changing them.
- Add meaningful `node:test` assertions for pure behavior. Phaser-sensitive changes require a representative host/browser check where available; document gaps rather than claiming unverified behavior.
- Update the relevant docs when commands, architecture, dependencies, public behavior, or known risks change. Keep documentation specific to this repository and avoid duplicating entire guides.
