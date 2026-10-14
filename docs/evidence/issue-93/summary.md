# Issue 93: UI fixes and test gaps (fix 41a8e04; verified on main a222f45)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Empty names fall back; Profile placeholder translated | `tests-before-after.txt` (Home and Profile tests fail before) | PASS |
| 2 | A repeated empty-field error is said again | `tests-before-after.txt` ("says the same empty-field error again…"); web: `web/login93.log` shows the live region going "" then the message on a second press | PASS |
| 3 | The missing field is named in words | `tests-before-after.txt` (3 cases); web: "Please enter your password" (`web/web-93-password-missing.png`) | PASS |
| 4 | Password autocomplete is current-password | test, and `web/login93.log`: the input's autocomplete attribute is current-password | PASS |
| 5 | The false comment and no-op title are gone | commit 41a8e04 | PASS |
| 6 | Test gaps closed | `mutants.txt`: Back always Home, Login without DocumentTitle, Profile without DocumentTitle are each killed; the permissions test is renamed | PASS |
| 7 | The demo adapter validates with zod | `tests-before-after.txt` (3 malformed payloads fail before) | PASS |
| 8 | Gates, CI, e2e | Gates on a clean clone of a222f45 and after both init paths (lint, type-check, format, docs, 529/440/440 tests, audit, doctor 21/21, web and iOS+Android exports: `../issue-90/verification/gates-clean-clone-and-init.txt`); Maestro iOS 7/7, Android Expo Go 7/7, Android native debug 7/7 (Actions run 38572469509), dark mode on both; web smoke passed (`../issue-90/verification/`); CI, Audit, CodeQL green on a222f45 (flows 04 and 06 cover Login on iOS and Android) | PASS |
