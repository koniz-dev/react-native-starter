# Issue 90: session refresh and the documented adapter (fix ce743f1; verified on main a222f45)

Found by the fourth deep audit: six reviewers read all 161 tracked files of e4742f2 (`audit/coverage-all-161-files.tsv`, scopes in `audit/scope-*.txt`, brief in `audit/brief.md`). Every reported defect was re-run as a repro on a fresh copy of e4742f2 (`audit/repros/`, results in `audit/repros-at-e4742f2.txt`) before the fixes, which are split over #90–#95.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | The client handed to refresh never starts a refresh; a 401 there signs out, never hangs | `tests-before-after.txt`: "signs out, never waits forever, when the refresh itself gets a 401" fails (times out) before, passes after; repro F1 in `audit/repros-at-e4742f2.txt` (HUNG) | PASS |
| 2 | The example logout revokes through `public`, clears in finally; the fake backend rotates and revokes by refresh token; logout after expiry revokes | `doc-and-mutation.txt` part 1: with the old doc snippet the logout tests fail, with the new one all 12 pass | PASS |
| 3 | The example refresh revokes a rotated token from a refresh that finished after sign-out; the doc sentence is accurate | same file: "revokes, and keeps nothing from, a refresh that finishes after logout" fails on the old snippet, passes after; docs/connect-your-backend.md "Sign-out during a refresh" | PASS |
| 4 | A failed restore is logged and keeps the stored session; documented | `tests-before-after.txt`: "keeps the token, and logs why…" fails before, passes after; docs/api-and-storage.md | PASS |
| 5 | A 401 from an earlier session with the same token does not refresh | `doc-and-mutation.txt` part 2: deleting the guard fails that test | PASS |
| 6 | Gates and CI green | Gates on a clean clone of a222f45 and after both init paths (lint, type-check, format, docs, 529/440/440 tests, audit, doctor 21/21, web and iOS+Android exports: `../issue-90/verification/gates-clean-clone-and-init.txt`); Maestro iOS 7/7, Android Expo Go 7/7, Android native debug 7/7 (Actions run 38572469509), dark mode on both; web smoke passed (`../issue-90/verification/`); CI, Audit, CodeQL green on a222f45 | PASS |
