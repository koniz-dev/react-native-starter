# Evidence: issue #8 — GitHub Actions CI

Local verification was run on 2026-09-29 before the workflow was pushed.

| Acceptance criterion                                          | Result                      | Evidence                                                                                         |
| ------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| CI workflow exists and becomes active after push              | Pending remote verification | `.github/workflows/ci.yml`; remote workflow evidence will be added after the push.               |
| A push-triggered workflow run succeeds                        | Pending remote verification | Remote run log will be added after the push.                                                     |
| CI contains distinct lint, format, type-check, and Jest steps | PASS (source review)        | `.github/workflows/ci.yml` names `Lint`, `Check formatting`, `Type-check`, and `Run Jest tests`. |

Local gate passed: `01-format-check.log`, `02-lint.log`, and `03-type-check.log`
completed without diagnostics; `04-test-ci.log` shows 4 Jest suites and 33 tests passing.
