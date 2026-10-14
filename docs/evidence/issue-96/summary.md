# Issue 96: release v1.1.10 (tag on a222f45b305ca08706a3de3fb53a849288adac34)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Annotated tag v1.1.10 on the verified commit, pushed | `tag-and-release.txt` | PASS |
| 2 | A clean clone of the tag (Node 24.21.0, `npm ci`, recipe libraries as CI links them) passes every gate: lint, type-check, test:ci with coverage thresholds (529 tests), format, docs:check (45 snippets), audit:check, doctor 21/21, web export, iOS and Android bundles; CI and Audit green on the commit | `release-gates.txt` part 1 (all exit 0); `actions.txt` (CI, Audit, CodeQL success on a222f45) | PASS |
| 3 | `init-project --remove-demo --remove-recipes` on that clone leaves no starter, demo, template, or recipe wording, markers, or template docs, and every gate passes (440 tests) | `release-gates.txt` part 2. The only grep match is the check-docs test's deliberately missing path `docs/recipes/no-such.md`, test data for the missing-link check, not recipe content; `docs/` holds only the app's pages | PASS |
| 4 | Flows on the tagged code | Android Expo Go on the tag (Actions 38578329511) 7/7 plus dark; Android native debug on the tagged commit (Actions 38572469509) 7/7 plus dark (`actions.txt`; all 30 screenshots checked in `android-actions/*-sheet.png`); iOS Expo Go 7/7 plus dark, Android Expo Go (local API 37) 7/7 plus dark, the web smoke, and uploads on iOS, Android, and Chrome, all on a222f45 (`../issue-90/verification/`, `../issue-91/upload/`) | PASS |
| 5 | Release v1.1.10 published as latest; notes list the changes since v1.1.9, what earlier adopters should take (session and upload files), and the supported scope, non-goals, and known limitations | `tag-and-release.txt`, `release-notes.md` | PASS |
| 6 | Evidence and verdict recorded; no issue left open | this folder; #96 closed after this commit | PASS |

Verdict: PASS.
