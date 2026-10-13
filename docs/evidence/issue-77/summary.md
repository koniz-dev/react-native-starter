# Issue 77: template scripts (verified on main 2644584)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Tests reproduce each defect, pass after | `tests-before-after.txt`: 14 tests fail on 2644584^, 70/70 pass on 2644584 | PASS |
| 2 | remove-demo with a malformed marker changes nothing, no stack trace | test "changes nothing when a marker is malformed…" (exact stderr, clean git status); "fails when a doc still names a deleted file" now also leaves git status clean | PASS |
| 3 | run.sh fails when the Metro port is in use | `run-sh-port-in-use.log`: a server on 18081, run.sh exits 1 with the message, before starting anything (bash 3.2) | PASS |
| 4 | Invalid allowlist entries fail audit:check | tests for missing/malformed reviewBy (undefined, 2027-1-9, 2027/01/09, Jan 9 2027, 2027-02-30) and missing id/package/tracking | PASS |
| 5 | init: dependency-name slugs, flag-like values, --force re-init identity, safe recovery hint | tests "rejects slug react/expo", "--name --remove-demo", "on --force after the APP block was edited…" (no RN Starter/rnstarter left), "after a failure on uncommitted changes, never suggests discarding them" | PASS |
| 6 | check-docs catches indented snippets, .maestro/public paths, docs/ subfolder refs | test "checks indented snippets, flow and public paths…"; docs:check now compiles 44 snippets (was 43) | PASS |
| 7 | Gates, CI, post-init gates | `gates.log` (all exit 0, 395 tests); `init.log` + `gates-after-init.log` (init --remove-demo --remove-recipes, all gates exit 0, 323 tests); CI green on 2644584 | PASS |
