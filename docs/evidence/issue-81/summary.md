# Issue 81: release v1.1.8 (tag on 69afacb)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Tag `v1.1.8` on the verified commit, pushed; later commits only on `evidence` | annotated tag 0d4eff2 → 69afacb54b13db9850eda942420d79a386bf9b10 | PASS |
| 2 | Clean clone passes every gate; CI and Audit green on the tag | `01-clean-clone-gates.log` (fresh clone of GitHub at 69afacb, `npm ci`, Node 24.21.0: lint, type-check, format, docs:check, test:ci 409 tests with coverage thresholds, audit:check, doctor 21/21, web export: all exit 0); `02-docs-check-with-recipes.log` (recipe libraries installed as CI does: 44 snippets, none skipped); `04-ci-runs.txt` (CI, Audit green on 69afacb) | PASS |
| 3 | init --remove-demo --remove-recipes leaves no template wording; gates pass | `03-init-remove-demo-remove-recipes-gates.log`: init exit 0, every gate exit 0 (333 tests), `git grep -i starter\|rnstarter\|demo\|dummyjson\|koniz\|template` finds nothing | PASS |
| 4 | Flows on the tagged code, screenshots checked | Android native debug 7/7 + dark on 69afacb (run 38414725085); Android Expo Go 7/7 + dark, Android native debug 7/7 + dark, iOS 7/7 + dark, web smoke on c65c808, which differs from 69afacb only in the e2e workflow file (`04-ci-runs.txt`). Logs, sheets, and screenshots in issue-79 (`ios/`, `android-expo-go/`, `android-native-debug/`, `web/`), all reviewed | PASS |
| 5 | Release published as latest with changes, adoption advice, scope, non-goals, limitations | `release-notes.md`; `github-release.log` | PASS |
| 6 | Evidence and verdict recorded; no open issue | this file; `gh issue list --state open` → [] after closing | PASS |
