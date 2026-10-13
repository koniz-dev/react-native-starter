# Issue 87: release v1.1.9 (tag on 5268598)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Tag on the verified commit, pushed; later commits only on `evidence` | annotated tag v1.1.9 → 52685987a2623656ac13e686216bd6d158e2c0d0 (`github-release.log`) | PASS |
| 2 | Clean clone passes every gate; CI and Audit green | `01-clean-clone-gates-with-recipes.log`: fresh GitHub clone at 5268598, `npm ci`, recipe libraries installed as CI does (no snippet skipped): lint, type-check, format, docs:check (snippets compiled and linted), test:ci 466 with coverage thresholds, audit:check, doctor 21/21, web export all exit 0; `03-ci-runs.txt` | PASS |
| 3 | init --remove-demo --remove-recipes: no template wording; gates pass | `02-init-remove-demo-remove-recipes-gates.log`: init exit 0, all gates exit 0 (386 tests), the leftover grep finds nothing | PASS |
| 4 | Flows on the tagged commit, screenshots checked | all on 5268598: iOS 7/7 + dark, Android Expo Go 7/7 + dark (run 38427230189), Android native debug 7/7 + dark (run 38427235192), web smoke passed; artifacts and sheets in issue-85, all reviewed | PASS |
| 5 | Release published as latest with changes, adoption advice, scope, non-goals, limitations | `release-notes.md`, `github-release.log` (latest: v1.1.9) | PASS |
| 6 | Evidence and verdict recorded; no open issue | this file; #84 and #86 closed with it (their post-init criterion is row 3) | PASS |
