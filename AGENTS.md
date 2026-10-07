# AGENTS.md

## Purpose

This repository contains a reusable Phaser game framework written in TypeScript.

The framework provides the foundation for building Phaser games and should remain:

- maintainable
- strongly typed
- easy to extend
- straightforward to understand
- compatible with supported modern browsers
- aligned with current Phaser APIs and lifecycle conventions

Changes should improve the framework without introducing unnecessary abstractions or coupling it to a specific game.

---

## Technology

The repository uses:

- Phaser
- TypeScript
- npm

Additional tooling such as the bundler, test framework, ESLint and formatting configuration should be determined from the repository rather than assumed from this document.

`package.json` and the relevant configuration files are the source of truth for versions and commands.

---

## Before Making Changes

Before implementing a task:

1. Read the requested task file completely.
2. Inspect the relevant source and configuration.
3. Read existing documentation related to the change.
4. Identify existing conventions before introducing new ones.
5. Check `package.json` for available scripts.
6. Search for existing abstractions before creating new ones.

Do not assume the repository follows generic Phaser or TypeScript examples.

Work with the architecture that actually exists.

For substantial changes, understand the affected execution path before editing.

---

## Package Management

Use npm.

Do not migrate this repository to:

- Yarn
- pnpm
- Bun
- another package manager

Keep `package-lock.json` committed and synchronised with `package.json`.

Do not manually edit dependency entries in `package-lock.json`.

Use normal npm commands to modify dependencies.

Avoid:

```sh
npm install --force
npm install --legacy-peer-deps
npm audit fix --force
```

Do not use these commands merely to bypass dependency conflicts.

Investigate and resolve the underlying compatibility issue instead.

---

## Dependencies

Before adding a dependency:

1. Determine whether the repository already provides the required functionality.
2. Consider whether the functionality is simple enough to implement without another package.
3. Check that the package is maintained.
4. Check compatibility with the current Node, TypeScript, Phaser and build-tooling versions.

Prefer fewer dependencies.

Do not add packages solely to avoid writing small amounts of straightforward code.

When upgrading dependencies, review breaking changes rather than blindly moving every package to the newest version.

---

## TypeScript

Prefer strict, explicit TypeScript.

Avoid:

- `any`
- unnecessary type assertions
- `@ts-ignore`
- `@ts-expect-error` without documented justification
- non-null assertions where
