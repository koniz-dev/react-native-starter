# Issue 47 verification — `npm run init-project`

Verified on 2026-10-10 on `main` at
[`bf1f4e1`](https://github.com/koniz-dev/react-native-starter/commit/bf1f4e1).

## Change

- **[`scripts/init-project.js`](https://github.com/koniz-dev/react-native-starter/blob/bf1f4e1/scripts/init-project.js)**
  runs as `npm run init-project`. It takes flags, or prompts in a terminal.
  - **Identity.** It sets the `APP` block in `app.config.ts` (name, slug,
    scheme, bundle ID, version `1.0.0`), the `package.json` and
    `package-lock.json` name and version, the README title and intro (the rest
    of the README, including the docs map, is kept), and the LICENSE holder.
    It also updates the identity examples: the variant table in
    `docs/make-it-yours.md`, the dev scheme in `docs/testing.md`, and the app
    ID and URL in `.github/workflows/e2e-android.yml`.
  - **Demo.** With `--remove-demo` (or a "y" at the prompt), it runs
    `remove-demo`.
  - **Cleanup.** It deletes the files and the `AGENTS.md` block listed in
    `scripts/maintainer-files.json`, plus the manifest itself. It removes the
    `@init` blocks that advertise it in the README, Getting Started, Make It
    Yours, and `scripts/README.md`. Last, it deletes itself, its test, and its
    npm script, and formats the changed files with Prettier.
  - **Guards.** It validates the input and refuses a dirty working tree or a
    second run unless `--force` is given. `--dry-run` lists every change, and
    `--help` lists the options.
- **`app.config.ts`** exports `APP`. `__tests__/app/appConfig.test.ts` now
  builds its expected values from `APP` instead of hard-coding the starter's
  identity, so it passes after a rename.
- **Docs.** `docs/getting-started.md` opens with "Make it your project first".
  `docs/make-it-yours.md` opens with "Start with `npm run init-project`" and
  keeps the checklist as the reference. `README.md` and `scripts/README.md`
  point to the command. All of these sit in `@init` blocks, so they are
  removed with the command.
- **Maintainer note.** `docs/maintainers/README.md` says that a new file
  naming the starter's identity needs a rule in `init-project`.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Flags (non-interactive) or prompts; name, slug, scheme, bundle ID, `--remove-demo` / `--keep-demo`                                                                                       | **Prompts:** [06](06-init-interactive.log), a real terminal session driven through a pseudo-terminal by [drive.py](drive.py). The slug and scheme defaults were accepted, `com.example.notes` was rejected and re-asked, and "y" removed the demo. **Flags:** [10](10-dry-run.log) and [11](11-refusals.log)                                                                                                                                                                                                                                                                                                                       | PASS   |
| 2   | Updates `APP`, `package.json` name, version `1.0.0`, README title and intro (keeping the docs map); runs `remove-demo` if asked; deletes the manifest's files, the manifest, the script, and its npm script | [06](06-init-interactive.log) lists every update and delete. [09](09-after-grep.log): README title and intro, LICENSE, the remaining `docs/` and `scripts/` files, and no `init-project` or `@init` left anywhere. Package and lock names and versions are at the end of 09. [after-init/git-status](after-init/git-status.log): 40 changed paths, including the demo removal                                                                                                                                                                                                                                                         | PASS   |
| 3   | Validates input; refuses a second run, or a dirty tree without `--force`                                                                                                                  | [11](11-refusals.log): a dirty tree is refused. Refused input: an invalid slug, a scheme starting with a digit, `acme`, `com.acme-corp.app` (Android does not allow `-`), and a name containing `\|`. A missing bundle ID without a terminal is refused. A second run is refused ("already initialized"). After all of these, `git status` is clean                                                                                                                                                                                                                                                                                  | PASS   |
| 4   | `--dry-run` lists every change                                                                                                                                                           | [10](10-dry-run.log): every file update and delete, plus the `remove-demo` dry run. `git status` is empty afterwards                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | PASS   |
| 5   | Afterwards: lint, type-check, `test:ci`, `docs:check`, `audit:check`, web export pass; `expo config` shows the new identity for all variants; the `git grep` finds nothing                | Run on a clone of `main` after the interactive init (Acme Notes, `com.acme.notes`, demo removed). [lint](after-init/lint.log), [type-check](after-init/type-check.log), [test:ci](after-init/test-ci.log) (191 tests, coverage above the threshold), [docs:check](after-init/docs-check.log), [audit:check](after-init/audit-check.log), [format:check](after-init/format-check.log), [web export](after-init/expo-export-web.log). [08 expo config](08-expo-config.log): `Acme Notes (Dev)` / `com.acme.notes.dev` / `acmenotes-dev`, Preview, and production. [09](09-after-grep.log): `git grep -iE "koniz-dev\|react-native-starter\|rnstarter\|com\.example"` exits 1 (no matches) | PASS   |
| 6   | Jest or a script test covers the validation and the file changes on a temp copy                                                                                                           | `__tests__/scripts/initProject.test.ts`, 34 tests in [03](03-test-ci.log). The validators accept and reject cases, and argument parsing is covered. On temp copies, committed in git and sharing `node_modules`: the dry run changes nothing, invalid input is refused, a dirty tree is refused, a full run sets the identity and removes the maintainer files and itself (no leftover identity, Prettier clean), and `--remove-demo` works and a second run is refused                                                                                                                                                         | PASS   |
| 7   | Getting Started and Make It Yours lead with `npm run init-project`; the checklist stays as the reference                                                                                  | [getting-started.md](https://github.com/koniz-dev/react-native-starter/blob/bf1f4e1/docs/getting-started.md#make-it-your-project-first), [make-it-yours.md](https://github.com/koniz-dev/react-native-starter/blob/bf1f4e1/docs/make-it-yours.md)                                                                                                                                                                                                                                                                                                                                                                               | PASS   |
| 8   | Gates pass locally and in CI                                                                                                                                                             | [01 lint](01-lint.log), [02 type-check](02-type-check.log), [03 test:ci](03-test-ci.log) (239 tests), [04 format](04-format-check.log), [05 docs:check](05-docs-check.log). CI run 38048427679 on `bf1f4e1`: success, [log](12-github-actions-ci-38048427679.log)                                                                                                                                                                                                                                                                                                                                                                           | PASS   |

## Notes

- **Unchanged files.** `scripts/audit-allowlist.json` keeps its inherited
  entries, as #46 designed. The command's final message points to
  "Dependency advisories" for re-reviewing them. Icons and theme colors are
  not touched; the final message lists them as next steps.
- **Overlapping errors.** An invalid `--slug` with no `--scheme` reports two
  errors, because the default scheme is derived from the slug.
- **Interactive driver.** The first driver for the interactive run hung
  because prompt detection did not strip terminal escape codes. It was
  rewritten; the log is from the second driver.
