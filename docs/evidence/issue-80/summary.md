# Issue 80: docs corrections (verified on main c65c808)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Claims match the code; examples use errorMessage() and t() | api-and-storage.md (Errors, UserName), connect-your-backend.md (PostsScreen, refresh failures, example adapter, no-adapter message), remove-demo.md, error-reporting.md (checked against shared/lib/logger.ts redact()), testing.md (PostsScreen test, METRO_PORT/MOCK_PORT), jest.setup.env.js. `docs-example-run.txt`: the PostsScreen and postsApi from the docs, with the test from testing.md, pass in a scratch project | PASS |
| 2 | External links return 200 | `external-links.txt`: every docs link 200; the two others are a placeholder Sentry DSN inside a code sample and a funding URL in docs/recipes/package-lock.json, not links | PASS |
| 3 | docs:check, gates, CI, after init | `gates.log` (all exit 0, 44 snippets, 409 tests); CI green on c65c808; post-init gates in issue-77 | PASS |
