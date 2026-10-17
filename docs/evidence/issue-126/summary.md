# Issue 126: web path check untested; "Go home" leaves two Homes; OAuth error messages; small gaps

Found in the seventh deep audit (2026-10-17) by auditors A, B, C and F.

Fixes:

| Commit | Change |
|--------|--------|
| ce54c55 | The web case of the same-origin redirect test. |
| 1713513 | "Go home". |
| 4411870 | `error_description`. |
| d508043 | The SecureStore mock. |
| 806bfaf | Refresh race test and the 30 s timeout. |
| 5c7e5c3 | README and markdownText tests. |
| 34fccc5 | remove-demo's no-git note. |
| ca3f006 | The non-rotating refresh never writes the refresh token (from confirmation round R2). |

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Item 1: F's mutant `hc-ios-android` is killed, and that was applied and checked. | PASS | The old web case was empty: `signIn` wrote the token to SecureStore, which the web never reads, so no session existed and the case failed even on unchanged code (`item1-old-web-test.log`). The web cases now sign in to the web's memory store, and the sibling cross-origin web test also asserts that the token is kept. `item1-after.log`: all 12 redirect tests pass. `item1-mutant.log`: under the mutant, only "on web, ends the session…" fails. |
| 2 | Items 2–7 are fixed with tests, or recorded with a reason. Item 3 has an old-vs-new case table. | PASS | See "Items 2–7" below. |
| 3 | Gates and CI are green. | PASS | `gates.log`: lint, type-check, format, 684/684 tests, docs:check. CI, Audit and CodeQL: see "CI and e2e". |

## Items 2–7

- **Item 2, "Go home".** Two tests: from Home push `/boom` in `(app)`, and a deep link
  to it. Both fail before the fix (`canGoBack()` is true; `item2-before.log`). I tried
  `dismissTo('/')` alone first; it broke a boundary inside the tabs (the path does not
  become `/`). So the fix keeps `dismissTo('/')` and then `replace('/')`, as auditor B
  proposed. All 20 ErrorBoundary tests pass.
- **Item 3, `error_description`.**
  - `item3-case-table.md` runs 16 bodies through the real `serverMessage`, before and
    after the fix. Three rows change, all as intended: an OAuth2 body with a
    description, a description alone, and an envelope that also has a description
    (not a real backend shape).
  - No row was right before and is wrong now.
  - The test uses Keycloak's real body for a wrong password, and it fails before the
    fix (`item3-before.log`).
  - Connect Your Backend lists the new field.
- **Item 4.** The mock rejects `null`, `undefined`, a number and an object with the
  module's own message. It fails before (`item4-before.log`).
- **Item 5.** The three-render web flow test gets a 30 s timeout.
- **Item 6.**
  - `appReadme` is exported, and the test checks the README's heading and first line
    for a name that needs escaping.
  - `+`, `#` and `_` are tested.
  - Removing `markdownText` from the README fails the test (`item6a-mutant.log`).
  - The new test "a refresh that succeeds after a sign-out + sign-in keeps the new
    session's refresh token" fails under F's mutant `ad-mismatch-check`
    (`item6c-mutant.log`: the new session's token is erased).
- **Item 7.** Without git, remove-demo prints the same note as init-project. It doesn't
  print it under `--no-summary`, which init-project passes, so the note appears once.
  The test fails before (`item7-before.log`).

## Confirmation round on #125 and #126 (82f7548~4..34fccc5): no HIGH or MEDIUM

**R1: runtime code and the docs adopters copy.**

- **"Go home":** 14 cases, old against new, through the real app with `renderRouter`
  (`confirmation/gohome-*.log`). The cases cover the tabs, `(app)` and `(auth)` (pushed
  and deep-linked), root-level screens, and the app boundary before navigation is
  ready. The same cases ran on the web export in Chrome (`web-probe.log`).
  - Seven cases are fixed.
  - The rest behave as before.
  - No regression.
- **`serverMessage`** against 25 real backend bodies
  (`confirmation/R1-serverMessage-real-bodies.md`):
  - better for Keycloak, Auth0, Okta, GoTrue, Django OAuth Toolkit and Spring OAuth;
  - unchanged for Cognito, Firebase, Laravel, Devise, FastAPI and DRF;
  - the only changed row that isn't better is the envelope plus description shape
    above.
- **LOWs:**
  - "Local release builds are signed with the debug key" holds for Android only.
    Fixed in dd4b86e.
  - The try/catch in `goHome` rarely fires, because the router only queues the
    navigation. Recorded: it is harmless, and it predates this change.
  - From Explore → an `(app)` screen → error → "Go home", Back no longer returns to
    Explore. That is what "Go home" means.

**R2: tests and scripts.**

- **Mutation run:** 31 mutants (`confirmation/R2-mutants.log`). Every mutant that undoes
  a fix is killed.
- **`tokenSafety.test.ts`:** passes under 8 `--randomize` seeds and with each test run
  alone.
- **Scripts:** remove-demo and init-project, with and without git, print the note once,
  exit 0, and leave no leftovers.
- **Load:** the changed files ran 6 times at a load average of about 60 with no
  failures. The slowest new test took 8.4 s against a 60 s limit.
- **LOWs:**
  - **The `??` fallback was untested.** The native test passed even without it, since
    SecureStore rejects `undefined`. On the web, the memory store would take it.
    Fixed in ca3f006, and the mutant now fails the test (`r2-l1-mutant.log`).
  - **Equivalent mutants.** A few are left, and are recorded.
  - **A skipped docs example.** The docs snippet runner would pass a docs example
    turned into `it.skip`. Recorded, because only a maintainer editing the doc could
    cause it.
  - **A harness bug.** F's harness used a string replacement, which expanded `$&` in
    three init mutants. Those three were reported as killed while not running. With a
    function replacer, they are really killed.

The round meets the stop rule: no HIGH or MEDIUM.

## Recorded, not fixed (LOW)

- e2e: `adb reverse` for a localhost URL without a port.
- iPad orientation.
- Root-level screens have no route error boundary, so the app boundary catches them.
- The error screens have no DocumentTitle.
- check-audit under yarn or pnpm.
- There is no way to run an adapter against a real backend in Jest.
- F's remaining equivalent or contrived mutants.

## CI and e2e

- **CI, Audit and CodeQL:** green on 34fccc5 (run 39053188611) and on ca3f006 (run 39054865720). CodeQL reports no results.
- **Android Expo Go:** run 39053209562 (34fccc5), 7/7 plus dark mode.
- **Android native debug:** run 39053219232 (34fccc5), 7/7 plus dark mode.
- **iOS native:** run 39059683736 (ca3f006), 7/7 plus dark mode. The commits after 34fccc5 change only docs and a test.

  Earlier, iOS run 39053221530 (34fccc5) failed twice, each time in a different flow:
  - **Attempt 1:** flow 05. The tap on the Explore tab had no effect, and no `GET /todos` reached the mock.
  - **Attempt 2:** flow 03. The tap on Log out had no effect.

  Both runners were much slower than usual:

  | | Full bundles | Bundle after each relaunch | Cold start |
  |---|---|---|---|
  | Usual (v1.1.14) | 32 s / 25 s | 0.3 s | 2m 1s |
  | Attempt 1 | 25 s / 79 s | 6–9 s | 2m 57s |
  | Attempt 2 | 54 s / 160 s | 6–9 s | 4m 46s |

  Neither tap goes through code these commits touch. The flake is tracked in its own
  issue, #127.

Verdict: PASS.
