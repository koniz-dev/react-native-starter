# Issue #115: remove-demo runs on --help or a typo; init-project input and doc gaps

Found in the sixth deep audit (2026-10-17) by auditor C. Fixes:

- 8c5a410: remove-demo.
- c18b0de: init-project input, README escaping, the SecureStore mock, and the jest setup constant.
- 22ac324: lint rules, docs:check heading anchors, and docs.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | remove-demo rejects an unknown argument (exit 2, nothing changed) and has `--help`. The test fails before the fix and passes after. | PASS | `args-before.log`: `--help` printed "Removing the demo..." and ran. `args-after.log`: 9/9, including "prints its usage on --help and refuses an unknown argument, changing nothing". |
| 2 | Items 2–8 are fixed with tests, or recorded with a reason. | PASS | See the item table below. |
| 3 | Gates and CI are green. | PASS | `gates.log`: 600/600 at 22ac324. CI is green on that commit and later. |

| Item | What | Evidence |
|------|------|----------|
| 2 | Getting Started: what happens when init-project fails after `--remove-demo` (it prints the command that undoes both). | `docs/getting-started.md` |
| 3 | The SecureStore mock applies expo-secure-store's key check. | `mock-before.log` shows the mock accepted `user:token`. `mock-after.log` passes. |
| 4 | The type-check row says `.js` scripts are parsed, not type-checked. | `docs/getting-started.md` Scripts table |
| 5 | `npm run doctor` is named as using POSIX syntax. | `docs/getting-started.md` |
| 6 | init-project rejects format characters (U+202E, zero-width) in the name and owner, an owner with surrounding spaces, and an `exp+` scheme. A blank interactive answer says "a value is required". The README writes the name as literal Markdown. | `validators-before.log`: 5 failures. `init-after.log`: 61/61, including `markdownText`. |
| 7 | jest.setup uses `STORAGE_KEYS.INSTALL_MARKER`. | c18b0de |
| 8 | import-boundaries normalizes `@/…/../…` paths, `globalThis.process` is restricted, docs:check anchors use a heading link's text, and scripts/README lists AGENTS.md and CLAUDE.md. | `lint-before.log`: 2 failures, then 42/42. `slug-before.log`: "no heading for #see-expo", then the test passes. |

## Not changed

The interactive prompt itself (a blank answer when there is no default) was checked
by reading the code, not run in a pty.
