# Issue 76: session races (verified on main b6c108d; device runs on c65c808)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Tests reproduce each defect, fail before, pass after | `tests-before-after.txt`: 7 new tests fail on b6c108d^, 22/22 pass on b6c108d | PASS |
| 2 | A 401 from an earlier session is never retried and never ends the current one | tests "doesn't end the next user's session…", "doesn't replay an earlier user's request…" | PASS |
| 3 | A late refresh or profile load stores nothing | "doesn't store a profile that loads after the user signed out / signed in as someone else", and the existing refresh-after-sign-out test | PASS |
| 4 | No stale Authorization header on a token-less retry; a retry whose session ended is canceled | "sends a retry without a token…", "doesn't send a retry once its session has ended" | PASS |
| 5 | A failed sign-in leaves no token | "leaves no token behind when storing the profile at sign-in fails" | PASS |
| 6 | Docs, gates, CI, e2e sign-in flows | `gates.log` (383 tests then; all gates exit 0); docs/api-and-storage.md "Expired sessions (401)"; CI and Audit green on b6c108d; `e2e-ios-sign-in-flows.log` 7/7 on iOS (sign-in, relaunch, profile); Android 7/7 in issue-79 | PASS |
