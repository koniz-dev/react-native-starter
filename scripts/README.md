# Scripts

Project scripts, run from the project root (most through `npm run`).

## `remove-demo.js`

Removes the demo features and `@demo`-marked code, leaving the foundation
(`npm run remove-demo`, `-- --dry-run` to preview). See
[`docs/remove-demo.md`](../docs/remove-demo.md).

## `check-docs.js`

Checks the docs against the code (`npm run docs:check`, also run in CI):
compiles every TypeScript snippet in `README.md`, `docs/`, and the folder
READMEs with `tsc`, and checks every `npm run` script, link, anchor, and repo
path they mention. See [`docs/README.md`](../docs/README.md).

## `check-audit.js`

`npm run audit:check` (also in CI): runs `npm audit --omit=dev` and fails on
any high or critical advisory that is not reviewed in `audit-allowlist.json`,
or whose review date (`reviewBy`) has passed. Each allowlist entry records the
dependency path, exposure, owner, review date, and tracking link; see
[Dependency advisories](../docs/getting-started.md#dependency-advisories) for
reviewing them in your project.

## No reset-project command

This starter intentionally does not ship a destructive `reset-project` script.
Create a branch or copy the files you want to adapt instead of moving the
committed `app/` directory from an automated script.
