# Scripts

Project scripts, run from the project root (most through `npm run`).

<!-- @init remove-block-start -->

## `init-project.js`

Turns the template into your project (`npm run init-project`, prompts for
each value, or flags; `-- --dry-run` to preview): sets the app identity,
removes the demo if you choose to and the recipes unless you keep them, and
then deletes itself. See
[`docs/getting-started.md`](../docs/getting-started.md#make-it-your-project-first).

<!-- @init remove-block-end -->

<!-- @demo remove-block-start -->

## `remove-demo.js`

Removes the demo features and `@demo`-marked code and docs, leaving the
foundation, and then itself (`npm run remove-demo`, `-- --dry-run` to
preview). See [`docs/remove-demo.md`](../docs/remove-demo.md).

<!-- @demo remove-block-end -->

## `check-docs.js`

Checks the docs against the code (`npm run docs:check`, also run in CI):
compiles every TypeScript snippet in `README.md`, `docs/`, and the folder
READMEs with `tsc`, and checks every `npm run` script, link, anchor, and repo
path they mention. See [`docs/README.md`](../docs/README.md).

## `check-audit.js`

`npm run audit:check` (the Audit workflow, `.github/workflows/audit.yml`):
runs `npm audit --omit=dev` and fails on any high or critical advisory that
is not reviewed in `audit-allowlist.json`, whose review date (`reviewBy`) has
passed, or that npm can now fix within the current dependency ranges. Each allowlist entry records the
dependency path, exposure, owner, review date, and tracking link; see
[Dependency advisories](../docs/getting-started.md#dependency-advisories) for
reviewing them in your project.

## `e2e/`

`run.sh` runs the Maestro flows (`npm run test:e2e:ios`,
`npm run test:e2e:android`): it starts `mock-api.js`, the local API the flows
use, and Metro, runs the flows, and stops both. See
[End-to-end flows](../docs/testing.md#end-to-end-flows-maestro).

<!-- @init remove-block-start -->

## No reset-project command

The template intentionally does not ship a destructive `reset-project`
script. Create a branch or copy the files you want to adapt instead of moving
the committed `app/` directory from an automated script.

<!-- @init remove-block-end -->
