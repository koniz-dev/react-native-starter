# Issue 37 verification — useFetch: cancellation, race guard, typed errors

Verified on 2026-10-09.

## Change

- **`shared/lib/useFetch.ts`, rewritten.**
  - `fetchFn(signal)` receives an `AbortSignal`. Each run creates an
    `AbortController` and aborts the previous one: on a deps change, on
    `refetch`, and on unmount (effect cleanup).
  - Only the current controller's result updates state, so a stale response
    is ignored even when the server doesn't honor the abort.
  - `fetchFn` is kept in a ref, updated in an effect, so an inline function
    neither refetches nor goes stale.
  - `deps` changes are detected by comparing the previous list, kept in
    state (React's "storing information from previous renders" pattern), with
    `Object.is` per item. The `eslint-disable react-hooks/exhaustive-deps` is
    gone and lint is clean under the strict `react-hooks` rules.
  - There is no mounted flag any more. The abort in the effect cleanup
    replaces it, so an effect that is cleaned up and run again (StrictMode,
    `<Activity>`) works; the old flag stayed `false` after the first cleanup
    and the hook stuck in loading.
  - `error` is `ApiError | null` via `toApiError`.
- **Callers.** `todosApi.getAll(signal)` passes the signal to axios; the
  Explore tab shows `error.message`.
- **Docs.**
  - `docs/api-and-storage.md` "Loading data in screens": the new contract, an
    example, when to keep `useFetch` versus adopting TanStack Query or SWR,
    and a `useQueryFetch` adapter with the same result shape.
  - `docs/connect-your-backend.md`: its snippet now passes `signal` and shows
    `error.message`.
  - The criterion named `docs/error-and-loading.md`, which #39 merged into
    `api-and-storage.md`; that is where this guidance lives now.
- **CI.** The docs step also installs `@tanstack/react-query@5`
  (`--no-save`), so the migration example compiles on every run.

## Acceptance criteria

| #   | Criterion                                                                                                                   | Evidence                                                                                                                                                                                                                                                     | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | `fetchFn` gets an `AbortSignal`; requests abort on unmount and re-run; stale responses ignored                              | Tests "aborts the request on unmount and ignores its result", "aborts the previous request when deps change", "keeps the latest response when an older one arrives later", "refetch aborts a request in flight…" in [01](01-useFetch-tests.log)              | PASS   |
| 2   | Mounted flag set inside the effect; `fetchFn` in a ref; eslint-disable removed; lint clean                                  | The mounted flag is replaced by aborting in the effect cleanup (see Change); test "keeps working when its effect is cleaned up and run again" (`<Activity>` hide/show); `fetchFn` ref; [04](04-hook-lint.log): no eslint-disable, eslint clean               | PASS   |
| 3   | `error` is `ApiError \| null` via `toApiError`                                                                              | Tests "loads data, exposes a typed ApiError, and refetches" (`instanceof ApiError`, `code: 'unknown'`) and "maps HTTP failures to ApiError codes" (503 → `server`, server message)                                                                           | PASS   |
| 4   | Jest: unmount mid-request, deps change aborts, out-of-order keeps latest, error typing, refetch                             | [01](01-useFetch-tests.log): 7 hook tests plus the Explore screen tests (9 total). [02](02-old-hook-against-new-tests.log): the same 7 hook tests against the previous hook all fail, including the effect re-run (stuck in loading)                         | PASS   |
| 5   | Docs: when to keep `useFetch` vs TanStack Query/SWR, short migration example behind the same hook shape (nothing installed) | `docs/api-and-storage.md#loading-data-in-screens`; [03](03-docs-check-with-tanstack.log): with `@tanstack/react-query` installed in a scratch copy (as CI does), all 37 snippets compile, including the adapter                                              | PASS   |
| 6   | Gates pass locally and in CI                                                                                                | [05 lint](05-lint.log), [06 tsc](06-type-check.log), [07 tests](07-test-ci.log) (205, coverage 97.31 / 91.28 / 94.55 / 97.49), [08 format](08-format-check.log), [09 docs](09-docs-check.log), [10 audit](10-audit-check.log); CI run in the closing comment | PASS   |

A StrictMode wrapper was tried first for the re-run case, but the test
renderer doesn't replay effects under StrictMode (checked: one run, no
cleanup), so that test passed with the old hook too. `<Activity>` does replay
them (run, cleanup, run), which is why it is used instead.
