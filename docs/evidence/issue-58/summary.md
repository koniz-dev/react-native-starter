# Issue 58 verification — test:ci after `npm run remove-demo`

Verified on 2026-10-11 on `main` at
[`ea6e2a4`](https://github.com/koniz-dev/react-native-starter/commit/ea6e2a4).
Found in the release-readiness run (#57) on `v1.1.0` (`281be40`).

## Change

`__tests__/scripts/initProject.test.ts`, "removes the demo with --remove-demo
and refuses a second run", now expects the "1. Register your AuthAdapter"
step only when the demo is present (`HAS_DEMO`). Without the demo, it
expects that step to be absent, which is what `init-project` does when there
is no demo left to remove. The script itself is unchanged.

## Acceptance criteria

| #   | Criterion                                                                                                                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                               | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | After `npm run remove-demo` on a clean copy, `test:ci` passes; the AuthAdapter step is checked only when the demo is present | Clean clone of `v1.1.0`, Node 24.21.0. [remove-demo-on-v1.1.0.log](remove-demo-on-v1.1.0.log): the demo is removed. **Before:** [before-fix-after-remove-demo.log](before-fix-after-remove-demo.log), where the init-project test fails 1 of 34 on the missing step. **After** (the fixed test file in the same tree): [after-fix-after-remove-demo-test-ci.log](after-fix-after-remove-demo-test-ci.log), `test:ci` 24 suites, 259 tests, all passing | PASS   |
| 2   | With the demo present, the test still asserts the step                                                                       | In the repository (demo present), the test passes and asserts that the step is shown: [gate-test-ci.log](gate-test-ci.log)                                                                                                                                                                                                                                                                                                                             | PASS   |
| 3   | Gates pass; CI green                                                                                                         | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log) (276 tests). CI run 38142289175 on `ea6e2a4`: success ([log](github-actions-ci-38142289175.log))                                                                                                                                                                                       | PASS   |
