# Issue 100: release v1.1.11 (tag on 22e433af6ff5f400a1ccc185b6d43de536d83fb1)

Released only once no issue was open (#97, #98, #99 closed).

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Annotated tag v1.1.11 on the verified commit, pushed | `tag-and-release.txt` | PASS |
| 2 | A clean clone of the tag (Node 24.21.0, `npm ci`, the recipe libraries linked as CI does) passes every gate: lint, type-check, test:ci with thresholds (531 tests), format, docs:check (45 snippets), audit:check, doctor 21/21, web export, iOS and Android bundles; CI and Audit green on the commit | `release-gates.txt` part 1 (all exit 0); `actions.txt` (CI, Audit, CodeQL success on 22e433a) | PASS |
| 3 | `init-project --remove-demo --remove-recipes` on that clone leaves no starter, demo, template, or recipe wording, markers, or template docs, and every gate passes (442 tests) | `release-gates.txt` part 2 (all exit 0; `docs/` holds only the app's pages, `.maestro/subflows/` keeps open-app, open-login, sign-in); `leftovers.txt`: `git grep` outside tests and the lockfile finds nothing (exit 1). The script's first leftover search used an invalid pathspec, so it was rerun on the same clone | PASS |
| 4 | Flows on the tagged code, every screenshot checked | Android Expo Go and native debug on 22e433a (Actions 38601056894, 38601062944) 7/7 plus dark each; iOS Expo Go on the tagged commit 7/7 plus dark (`e2e-ios.txt`); web smoke on the production export passed (`web-smoke.log`). All screenshots checked: `sheets/` (30 Android, 14 iOS, 9 web) | PASS |
| 5 | Release v1.1.11 published as latest; notes list the changes since v1.1.10, what earlier adopters should take (no runtime change; the e2e subflows and test helpers), and the supported scope, non-goals, and known limitations | `tag-and-release.txt` (also: no change under app/, features/, shared/ since v1.1.10), `release-notes.md` | PASS |
| 6 | Evidence and verdict recorded; no issue left open | this folder; #100 closed after this commit | PASS |

Verdict: PASS.
