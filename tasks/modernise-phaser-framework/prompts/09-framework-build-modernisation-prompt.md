# Codex prompt — Audit and migrate the framework build

Implement `@tasks/09-framework-build-modernisation.md` in the **framework repository**.

Read AGENTS.md, package.json, tsconfig files, build scripts, repository documentation and the task first. Inspect the current code and the sibling repository's integration contract before proposing changes.

Work in this order:
1. Summarise current state and a short, repo-specific plan.
2. Identify compatibility risks and any assumptions.
3. Make minimal, reviewable changes that satisfy the task acceptance criteria.
4. Run available verification commands; fix regressions introduced by your changes.
5. Update documentation and report exact commands/results, changed files and unresolved risks.

Critical rules:
- Do not edit generated/copied framework files inside the game repository.
- Do not mix a TypeScript 7 adoption into a TypeScript 6 migration.
- Do not implement React Native itself; preserve future browser-in-WebView hosting and avoid hard coupling core gameplay to browser globals.
- Do not silently change framework exports, artifact paths or the sibling copy script.
- Do not expand into unrelated refactors or gameplay implementation.

If the repository does not match the task assumptions, adapt the plan based on inspected evidence and explain why.
