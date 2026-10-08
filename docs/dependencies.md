# Dependencies

Versions below reflect `package.json` after the framework modernisation recorded on 8 October 2026. Recheck npm metadata and upstream release notes before changing versions.

## Runtime dependency

| Package | Version | Why it is present | Upgrade notes |
| --- | --- | --- | --- |
| `phaser` | 4.2.1 | Base scene, text GameObject, input types and runtime; bundled in the UMD output. | The migration from 3.55.2 to 4.2.1 required explicit runtime imports and nullable keyboard handling. Browser verification was limited; see the [modernisation plan](modernisation-plan.md). Do not treat later Phaser versions as drop-in upgrades. |

## Development dependencies

| Packages | Version | Purpose and constraints |
| --- | --- | --- |
| `@babel/core`, `@babel/preset-env`, `@babel/preset-typescript` | 7.29.7 | Babel transforms TypeScript and browser JavaScript in the Webpack pipeline. Kept on Babel 7 because Babel 8 changes module format and target/transform behavior. |
| `babel-loader` | 10.1.1 | Connects Babel to Webpack; its peer range permits the installed Babel 7 stack. |
| `webpack`, `webpack-cli`, `webpack-merge` | 5.111.1, 7.2.3, 6.0.1 | Bundle orchestration, CLI, and shared dev/prod configuration. The library output remains UMD. |
| `terser-webpack-plugin` | 5.6.1 | Production minification and license-comment extraction. |
| `typescript` | 5.9.3 | Strict source checking and declaration generation. TypeScript 7 was outside the installed typescript-eslint peer range at audit time. |
| `eslint`, `@eslint/js`, `typescript-eslint` | 10.12.0, 10.0.1, 8.71.1 | Flat-config linting for JavaScript/TypeScript and recommended rules. `typescript-eslint` peer compatibility constrains TypeScript upgrades. |
| `prettier` | 3.9.9 | Source/test formatting; run separately from ESLint. |

Node's built-in `node:test` is used for unit tests, so there is no separate test-runner dependency.

## Toolchain constraints and deliberate deferrals

The repository pins Node 24.21.0 in `.nvmrc`, npm 12.2.0 in `packageManager`, and engine ranges in `package.json`; `.npmrc` enables `engine-strict`. `package-lock.json` is the install source of truth.

The task 05 audit found no unused direct dependencies and reported zero npm audit vulnerabilities. `npm outdated` listed Babel 7.29.7 packages with Babel 8.0.7 available, and TypeScript 5.9.3 with TypeScript 7.0.2 available. Babel 8 was deferred because its migration changes can affect module loading and browser output. TypeScript 7 was deferred because it did not fit the installed typescript-eslint peer range. These were deliberate compatibility decisions, not overlooked vulnerabilities. Re-run `npm outdated` and `npm audit` when revisiting them.

Phaser is currently a regular bundled runtime dependency, not a peer dependency. Externalising it could reduce bundle size and avoid multiple Phaser instances, but changes installation and consumer loading contracts; evaluate only with a package-consumer fixture. The package's raw-TypeScript `module` entry and handwritten `types/phfw.d.ts` do not fully match generated output/source, so dependency work should not be mistaken for a resolved package API contract.
