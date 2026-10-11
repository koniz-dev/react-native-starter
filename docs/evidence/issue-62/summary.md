# Issue 62 verification — after `init-project`, an app instead of the starter

Verified on 2026-10-11 on `main` at
[`e315552`](https://github.com/koniz-dev/react-native-starter/commit/e315552)
(the change) and
[`c78899b`](https://github.com/koniz-dev/react-native-starter/commit/c78899b)
(a test fix found during this verification).

## Change

- **README:** `init-project` replaces `README.md` with a short README for
  the app: what it is, "Run it", the documentation links, and the license.
- **Onboarding:** `docs/make-it-yours.md` is now a one-time checklist, and
  `init-project` deletes it. The parts that stay useful moved to a new
  permanent page, `docs/app-config.md` (identity, build variants, icons and
  splash), which also gets the identity examples. Every permanent link
  points there.
- **Recipes:** they are optional.
  - By default (or with `--remove-recipes`, or by answering no at the
    prompt), `init-project` deletes `docs/recipes/` and every
    `@recipes remove-block`: the AGENTS.md links, the docs index section,
    the TanStack Query example in `api-and-storage.md`, and CI's
    `npm install --no-save` of the recipe libraries.
  - `--keep-recipes` keeps the content and drops only the marker lines.
- **Wording:** docs, comments, and `AGENTS.md` describe "the app".
  - `init-project` sets the allowlist `owner` to the project and rewrites
    its `$comment`.
  - The platform table states where the app runs. The template release's
    verification claim is now an `@init` block that points to the release
    notes.
  - The template-only section in `scripts/README.md` is an `@init` block.
- **Test fix (`c78899b`):** the new "no starter wording" check first used
  the pathspec `':!__tests__'`. git 2.39 rejects it with exit 128 and empty
  stdout, so the check passed without searching. It now uses
  `':(exclude)…'`, and every leftover grep in the script tests also asserts
  exit 1 (no match). The real grep on the initialized clone confirms there
  is no match.

## Acceptance criteria

| #   | Criterion                                                                                         | Evidence                                                                                                                                                                                                                                                                                                                                                            | Result |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | After init, README is a short app README with no starter pitch                                    | [clean-clone-after-init.log](clean-clone-after-init.log) (`cat README.md` at the end). The test asserts `## Run it` and `## Documentation`, and no "What you get" or "template"                                                                                                                                                                                     | PASS   |
| 2   | make-it-yours deleted by init; durable guidance in permanent pages; no dangling links             | `docs/app-config.md` (Identity, Build variants, Icons and splash screen). After init, `make-it-yours.md` is gone, `app-config.md` holds `com.acme.notes.preview` and `Acme Notes (Dev)`, and docs:check passes ([clean-clone-gates.log](clean-clone-gates.log))                                                                                                     | PASS   |
| 3   | Recipes optional; CI stops installing their libraries when removed; TanStack handled the same way | Default run: no `docs/recipes`, no `recipes/` link in AGENTS.md, no `@tanstack/react-query` in `api-and-storage.md`, and no `npm install --no-save` in `ci.yml`. The new test "keeps the recipes with --keep-recipes, without their markers" checks the other path: the content is kept and there are no `@recipes` markers                                         | PASS   |
| 4   | No starter wording after init                                                                     | [clean-clone-starter-grep.log](clean-clone-starter-grep.log): `git grep -i starter` outside `__tests__` and the lockfile exits 1 (no match). The marker and template-doc grep (`@init`, `@recipes`, `@demo`, `make-it-yours`, `recipes/`, `maintainer`) also exits 1 ([clean-clone-after-init.log](clean-clone-after-init.log)). The allowlist owner is the project | PASS   |
| 5   | On an initialized copy, all gates and the web export pass; the init test checks each point        | Clean clone of `main` from GitHub, Node 24.21.0, `npm ci`, then `init-project --remove-demo` ([clean-clone-init.log](clean-clone-init.log)). [clean-clone-gates.log](clean-clone-gates.log): lint, type-check, format, docs:check, test:ci (226 tests), audit:check, expo-doctor 21/21, and the web export all exit 0. `initProject.test.ts` asserts points 1–4     | PASS   |
| 6   | Gates pass; CI green                                                                              | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log) (278 tests). CI run 38152491215 on `e315552`: success. CI run 38152646328 on `c78899b`: success ([log](github-actions-ci-38152646328.log))                                                          | PASS   |

## What a new project contains after `init-project --remove-demo`

Outside `app/`, `features/`, `shared/`, `__tests__/`, `testing/`, and
`assets/` (listed in [clean-clone-after-init.log](clean-clone-after-init.log)):

- config: `app.config.ts`, `eas.json`, `tsconfig.json`, the ESLint and
  Prettier configs, `.nvmrc`, `.env.example`, `.gitignore`;
- the Jest setup;
- CI and the e2e workflow;
- the Maestro flows, with their e2e mock and runner;
- `scripts/check-docs.js` and `scripts/check-audit.js` (with the allowlist);
- `AGENTS.md`, `CLAUDE.md`, `README.md`, `LICENSE`;
- 11 guide pages in `docs/`.

Nothing in it belongs to the starter's maintenance or onboarding.
