# Issue 38 verification — test infrastructure, baseline-flow coverage, honest coverage

Verified on 2026-10-09.

## Change

- **Shared setup.**
  - `jest.setup.ts` (`setupFilesAfterEnv`) mocks AsyncStorage (the library's
    in-memory mock), `expo-secure-store` (an in-memory store), and React
    Native's `useColorScheme` for every test file, and resets all three
    before each test.
  - `testing/` holds the helpers, imported from `@/testing`:
    `renderWithProviders(ui, { scheme, withSession })` (safe-area metrics,
    Paper theme, optional `SessionProvider`), `secureStore`, and
    `setColorScheme`.
  - The per-file copies are gone ([01](01-duplication.log)): AsyncStorage was
    in 15 files, SecureStore in 13, `useColorScheme` in 3, and hand-written
    provider wrappers in 3; each is now in 0.
- **Coverage.**
  - `collectCoverageFrom` covers `app/`, `features/`, and `shared/`.
  - `coverageThreshold` is global 95 / 88 / 92 / 95 (statements / branches /
    functions / lines).
  - `npm run test:ci` is now `jest --coverage`, so the CI step "Run Jest
    tests" enforces it.
  - `npm run test:coverage` writes the HTML report.
- **New tests.**
  - `features/demo-todos/TodosScreen.test.tsx`: Explore goes loading →
    server error (503, server message) → Retry → list of 10 (of 12) with
    the done badge and meta, plus the empty state. It goes through the real
    HTTP client by holding each request open on the axios adapter.
  - ErrorBoundary: a custom fallback that resets the boundary, and children
    rendering when nothing throws. Default fallback, recovery, and route
    boundaries were already covered from #32.
  - Login: empty-field validation (both fields empty, username only,
    password only) shows "Please fill in all fields" and does not sign in.
  - Storage: `setItem` and `removeItem` failures are logged and rethrown;
    `getItem` failures and malformed JSON are logged and return null.
  - API request without a token: "sends no Authorization header when no
    token is stored" and "does not attach or read the token for another
    origin" already existed in `__tests__/shared/http/api.test.ts` and are
    kept.
- **Shallow tests.**
  - LoadingScreen's "renders without crashing" with
    `expect(result).toBeTruthy()` is replaced by checks of the progress
    indicator, the message color, and the background in the light and dark
    themes (with a new `testID="loading-screen"`).
  - The showcase's static-text test is removed; its press → snackbar tests
    stay.
  - `utils/sum` and its test were removed in #35.
- **Docs.** `docs/testing.md` is rewritten for the real layout, the shared
  setup, the two kinds of UI tests, network stubbing, coverage, and
  timeouts. It is linked from the README ("Available Scripts") and
  `docs/README.md`.

## Coverage, before and after

| Measurement                                                                        | Statements | Branches | Functions | Lines |
| ---------------------------------------------------------------------------------- | ---------- | -------- | --------- | ----- |
| Before, Jest default (only imported files) ([00](00-coverage-before-default.txt))  | 95.91      | 89.39    | 94.41     | 96.20 |
| Before, all source files ([00](00-coverage-before-all-files.txt))                  | 93.83      | 83.19    | 92.42     | 94.00 |
| After, all source files ([04](04-test-ci-with-coverage.log))                       | 97.26      | 90.35    | 94.44     | 97.45 |
| After `npm run remove-demo` on a scratch copy ([08](08-demo-removed-coverage.log)) | 97.41      | 89.60    | 94.97     | 97.64 |

The audit's 82% (2026-10-04) predates the tests added in #25–#36. Before this
change TodosScreen, todosApi, and the storage error branches were at 0%, and
untested files did not count at all.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                             | Evidence                                                                                                                                                                                                                | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `jest.setup.ts` registers shared native mocks; a `test-utils` render wraps the providers; duplicates removed                                                                          | `jest.setup.ts`, `testing/`; [01-duplication.log](01-duplication.log)                                                                                                                                                   | PASS   |
| 2   | `collectCoverageFrom` covers all source; CI runs tests with coverage and a threshold from the honest baseline                                                                         | `package.json`; [04](04-test-ci-with-coverage.log); [06](06-threshold-probe.log): with the branch threshold at 99 the same run exits 1 ("coverage threshold for branches (99%) not met"); CI log in the closing comment | PASS   |
| 3   | New tests: Explore loading → error → Retry → list; ErrorBoundary default/custom fallback and recovery; API request without a token; storage error paths; login empty-field validation | [07-new-tests.log](07-new-tests.log) (47 tests in the affected suites)                                                                                                                                                  | PASS   |
| 4   | Shallow tests replaced or removed                                                                                                                                                     | LoadingScreen rewritten; showcase static-text test removed                                                                                                                                                              | PASS   |
| 5   | `docs/testing.md` describes the real structure and setup and is linked from README and `docs/README.md`                                                                               | `docs/testing.md`; README "Available Scripts"; `docs/README.md` "Project"                                                                                                                                               | PASS   |
| 6   | Gates pass locally and in CI                                                                                                                                                          | [02](02-lint.log), [03](03-type-check.log), [04](04-test-ci-with-coverage.log) (26 suites / 199 tests, threshold met), [05](05-format-check.log); CI run in the closing comment                                         | PASS   |
