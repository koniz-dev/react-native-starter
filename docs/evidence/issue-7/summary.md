# Evidence: issue #7 — add a type-check script

Verification was run locally on 2026-09-29 after adding `npm run type-check`.

| Acceptance criterion                                                                      | Result | Evidence                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run type-check` exists and exits 0 on the current codebase                           | PASS   | `01-type-check-pass.log` and `04-type-check-restored.log` show `tsc --noEmit` completing without diagnostics.                                             |
| A deliberate type error fails the command, names the file, and reverting restores success | PASS   | `02-type-check-intentional-failure.log` shows TS2322 in `utils/sum.ts`; the temporary error was removed before `04-type-check-restored.log` was captured. |
| README lists `npm run type-check`                                                         | PASS   | `README.md` Available Scripts section documents the command.                                                                                              |

Regression gate: `03-lint.log` shows ESLint passing and `05-test-ci.log` shows 4 suites and 33 tests passing.
