# Issue 94: scripts (fix 9dbe37d; verified on main a222f45)

`tests-before-after.txt`: 14 new or changed tests fail on 9dbe37d^ and all 86 pass after.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | remove-demo refuses a dirty tree unless --force and never advises discarding work | "refuses uncommitted changes unless --force, and then never suggests discarding them" | PASS |
| 2 | init and remove-demo change nothing on a Prettier failure and delete themselves last | "changes nothing when Prettier can't format a result" (both scripts) | PASS |
| 3 | Without git: a note, and no git advice | "without git, says it cannot check or undo…" | PASS |
| 4 | The init failure tests can fail (real after-start failures, a regex that matches) | the rewritten tests on uncommitted changes and on a clean tree | PASS |
| 5 | check-audit matches package and severity and caps reviewBy | 5 new check-audit tests | PASS |
| 6 | docs:check covers .sh, .yml, .env.example, root files | the check-docs test (run.sh anchor, .env.example link) | PASS |
| 7 | md() removed; npx-free spawns; comment fixed; symlinked node_modules handled | commit 9dbe37d; "leaves out a symlinked node_modules…" | PASS |
| 8 | init + remove-demo end to end keep every gate green | `../issue-90/verification/gates-clean-clone-and-init.txt` parts 2 and 3: no leftovers, all gates exit 0 | PASS |
| 9 | Gates and CI | Gates on a clean clone of a222f45 and after both init paths (lint, type-check, format, docs, 529/440/440 tests, audit, doctor 21/21, web and iOS+Android exports: `../issue-90/verification/gates-clean-clone-and-init.txt`); Maestro iOS 7/7, Android Expo Go 7/7, Android native debug 7/7 (Actions run 38572469509), dark mode on both; web smoke passed (`../issue-90/verification/`); CI, Audit, CodeQL green on a222f45 | PASS |
