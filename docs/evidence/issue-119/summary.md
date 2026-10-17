# Issue #119: leak checks that couldn't fail, and untested remove-demo, check-docs and init-project gates (mutation testing)

Found in the sixth deep audit (2026-10-17) by auditor F. F ran 164 mutants against
copies of the repo.

Fixes:
- 09cd12e: storage, logger and ApiError leak tests.
- f828271: check-docs now fails when tsc fails silently, plus gate tests for
  check-docs, remove-demo and init-project.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Items 1–6: each has a test that kills its mutant, checked by applying the mutant. Code is fixed where a gate was missing. | PASS | All 16 mutants of items 1–6 are listed in `mutants-before.txt` and `mutants-after.txt`. Before, F's runs on 16cc770 show every one SURVIVED. After, re-running F's harness (`mut.js`, mutants in `mutants.json`) on the new tests kills all 16. check-docs gained one code fix: it now fails when tsc exits non-zero without a line it could read. The ESLint-crash check already existed and is now tested. |
| 2 | Item 7: fixed where cheap, otherwise recorded with a reason. | PASS | See the notes below. |
| 3 | Gates and CI are green. | PASS | `gates.log`: 632/632 at f828271. CI is green (see the issue comment). |

## Item 7: recorded, not changed

- **No CI job runs the gates after `init-project --remove-demo`.** Every release
  runs them on a clean clone (release-gates part 2, most recently in #113), and F
  ran them by hand on 16cc770: all clean. The release check covers it; a per-push
  job would add several minutes to every CI run.
- **Coverage leaves out `testing/` and `app.config.ts`, and the per-file threshold
  has no `branches` key.** `testing/` is exercised by every suite and has
  `__tests__/testing/`. `app.config.ts` has `appConfig.test.ts`. Adding a per-file
  branches threshold would turn gates red on unrelated files without making the
  tests stronger. No change.
- **Other low-impact survivors:**
  - `tsString` with both quote kinds: the code is correct (single quotes,
    `'` escaped), but untested. A test was added in the commit after f828271,
    and the mutant is now killed (`mutants-after.txt`, last line).
  - A back button on a deep-linked `/profile`.
  - Others listed in F's report as equivalent or defense in depth.

  Left as they are.
- **Timeouts under three parallel jest processes, and console noise in a passing
  run.** No change. The timeouts happen only under artificial load, and CI runs one
  process. The noise is from the expected failures that the tests themselves assert.
- **Mock gaps:**
  - The SecureStore key check was added in #115.
  - The value-size limit can't be checked without a device.
  - The Paper Button mock pressing while disabled is covered by the screen's own
    guard, which mutant `ls-guard` confirms is tested.
