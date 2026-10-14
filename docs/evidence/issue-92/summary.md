# Issue 92: foundation robustness (fix e3ebce3; verified on main a222f45)

`tests-before-after.txt`: 14 of the new tests fail on e3ebce3^ and all 137 pass after.

| # | Criterion | Test (fails before, passes after) | Result |
|---|-----------|-----------------------------------|--------|
| 1 | A throwing configureIntegrations() is logged; the config error screen still renders | "is logged, and the app still shows the configuration error screen" | PASS |
| 2 | A throwing analytics provider doesn't break navigation | "logs a provider that throws, and the app keeps working" | PASS |
| 3 | Screen names are route patterns, not URL values | "names a dynamic route by its pattern…" | PASS |
| 4 | useFetch drops an old error on a successful re-run; vacuous assertion replaced | "drops the old error when its effect runs again and succeeds" | PASS |
| 5 | logger.error never throws | "never throws on a context it cannot read" | PASS |
| 6 | Date, Map, Set, URL logged by value | "logs dates, maps, sets, and URLs by value…" | PASS |
| 7 | The response body isn't an enumerable field sent to reporters | "sends an ApiError without its response body…" | PASS |
| 8 | The default reporter is silent in release builds | "the default reporter writes nothing in release builds…" | PASS |
| 9 | Falsy thrown values show the fallback | "shows the fallback and reports when undefined/null/0/'' is thrown" | PASS |
| 10 | Light primary meets 4.5:1 on surfaceVariant and secondaryContainer | the two contrast tests; screenshots in `../issue-90/verification/` | PASS |
| 11 | Gates, CI, e2e | Gates on a clean clone of a222f45 and after both init paths (lint, type-check, format, docs, 529/440/440 tests, audit, doctor 21/21, web and iOS+Android exports: `../issue-90/verification/gates-clean-clone-and-init.txt`); Maestro iOS 7/7, Android Expo Go 7/7, Android native debug 7/7 (Actions run 38572469509), dark mode on both; web smoke passed (`../issue-90/verification/`); CI, Audit, CodeQL green on a222f45 | PASS |
