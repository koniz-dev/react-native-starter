# Issue 125: three docs examples that break when copied

Found in the seventh deep audit (2026-10-17) by auditors A, D and G.

Fixes:
- 3830433: the adapter example.
- bec8b8f: the analytics test in testing.md.
- 2db179e: linking to a signed-in screen.
- 82f7548: the LOW docs items.
- 4c9b5c2 and dd4b86e: follow-ups. One wraps the docs/README paragraph from 82f7548. The other fixes app-config: only Android release builds are signed with the debug key locally (confirmation round R1, LOW).

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The example's `refresh` accepts a response without `refresh_token` and keeps the stored one. A test against a non-rotating backend fails before the fix and passes after. Both kinds of backend are covered. | PASS | `rotate-before.log`: "keeps the session with a backend that does not rotate refresh tokens" fails ("rejected instead of resolved"), while the rotating test passes. `rotate-after.log`: both pass. The fake backend has a `rotate` flag, so a single test file covers both backends. |
| 2 | The docs' analytics test is run by Jest from the page itself, and it fails before the fix. | PASS | `__tests__/docs/testingSnippets.test.tsx` takes the snippet out of `docs/testing.md` and runs it. `analytics-before.log`: the old snippet fails ("Number of calls: 0"). `analytics-after.log`: the snippet with `waitFor` passes. |
| 3 | conventions has a section on linking to a signed-in screen from a public one, with a snippet that docs:check compiles. The `(app)` comment covers deep links only. | PASS | 2db179e adds "A link to a screen that needs sign-in": the `ProfileLink` snippet goes to `/profile` or `/login`. `gates.log`: docs:check compiles 42 snippets. The comment in `app/(app)/_layout.tsx` now says that only a deep link is sent back to Home. |
| 4 | The LOW docs items are fixed or recorded. | PASS | All of them are fixed. 82f7548: getting-started (iOS native verified, the `npm ci` line, `npm audit fix --force`), the 401 note, app-config (local build number, debug key), remove-demo (`.env`), and the docs/README lint fallback. 3830433: the rotation grace interval, and "share an origin (scheme, host, and port)" in Connect Your Backend; 82f7548's message lists that change, but it went into 3830433, which was committed in the same minute. 2db179e: `Tabs.Screen`. bec8b8f: the testing.md notes (backend secrets, public artifacts, Home's test IDs). |
| 5 | Gates and CI are green. | PASS | `gates.log`: lint, type-check, format, 677/677 tests, docs:check. CI and Audit passed on 82f7548 (run 39051494364). |

These are docs and test changes only; no runtime code changed. e2e on the next
runtime change, #126's 34fccc5, also covers these commits.

Verdict: PASS.
