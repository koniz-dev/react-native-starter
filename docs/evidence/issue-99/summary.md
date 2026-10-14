# Issue 99: adopter docs and DX from dogfooding (fix 22e433a)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Install output explained | Getting Started, after "npm ci installs the exact versions" | PASS |
| 2 | Adding a field to the user documented | Connect Your Backend, "More fields on the user" | PASS |
| 3 | Pointing the adapter test at your adapter, where an adopter meets it | Connect Your Backend, "Testing your adapter" (linked from the old paragraph) | PASS |
| 4 | The Login tests that pin the field label named | Connect Your Backend, "Your backend's field names" | PASS |
| 5 | Upload example uses the picker's name and type | API and Storage, "Uploading files" (compiled by docs:check) | PASS |
| 6 | Config plugins in app.config.ts | App Config, "Libraries with a config plugin" | PASS |
| 7 | `testing/` exports the request helpers, tested, used by the docs | `testing/http.ts` (`holdRequests`, `ok`, `httpError`), `__tests__/testing/http.test.ts`; Testing's example and the Todos test use them; `tests-before-after.txt` | PASS |
| 8 | Test runs don't print the default analytics debug lines | `test-output-noise.txt`: a full run printed 99 console blocks (92 debug) before, 7 after (from the two tests that use invalid config, where the logger falls back to debug); 531 tests pass | PASS |
| 9 | Gates and CI green | lint, type-check, format, docs:check (45 snippets), 531 tests; CI, Audit, CodeQL green on 22e433a; Android e2e (Expo Go, native debug) 7/7 each | PASS |
