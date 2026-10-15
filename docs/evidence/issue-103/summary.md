# Issue 103: useFetch stale data, splash over a root error, tracking, a11y (fix 79f803d)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | `useFetch` drops the old deps' data, keeps data on refetch | `useFetch.test.tsx` "drops the old deps' data…": fails before (`tests-before.txt`), passes after; API and Storage documents it | PASS |
| 2 | The splash hides when the app error boundary catches a startup error | `splashScreen.test.tsx` "hides when the app error boundary catches a startup error" (i18n adapter throwing in RootNavigator): fails before, passes after | PASS |
| 3 | Screen tracking reports only what the user sees | `screenTracking.test.tsx`: signed-out cold start at /profile reports `['/']` only (before: `/profile`, `/`) | PASS |
| 4 | Todos Retry keeps the screen and focus; no "what" comments | `TodosScreen.test.tsx`: Retry shows "Loading..." on the button, no full-screen loader; screenshots in issue-101 (web, iOS) | PASS |
| 5 | Headings, snackbar announcement, check glyph | Home "Session", "Todos (N)", Showcase sections are headers (tests); Showcase announces the snackbar on iOS (test); "Done" with a decorative check icon (iOS/web screenshots in issue-101) | PASS |
| 6 | Logger strips queries from URL strings | `logger.test.ts` "logs URL strings under URL-like keys…"; Error Reporting doc | PASS |
| 7 | Gates, CI, e2e | 562 tests at the fix; CI green on 79f803d and later; e2e as in issue-102 | PASS |
