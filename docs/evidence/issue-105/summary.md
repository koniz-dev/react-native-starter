# Issue 105: test hygiene, CI concurrency, flow 07, Expo patches, favicon (fix b42bfb2)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | No leaked mocks or order dependence | Jest `clearMocks` + `restoreMocks`; LoginScreen tests wait for the restored session and spy where they assert; the Button mock no longer invents a busy state | PASS |
| 1b | The flaky login tests pass 20/20 alone | `flaky-20x.txt` | PASS |
| 1c | The suite passes in random order | `randomize.txt` (3 seeds) and `flake-hunt-10x.txt` (10 seeds, 579/579 each). One earlier `test:ci` run (before these changes were final) had 1 failure that was not captured; it did not recur in 16 later runs | PASS |
| 2 | Mutation gaps closed | route-group ErrorBoundary exports and `preventAutoHideAsync` (`routeGroups.test.ts`), redaction keys (`auth`, `x_auth`, `authenticator`, `pwd`, `passwd`, `apiKey`, `api_key`, `cvc`), lint `no-console`, `no-explicit-any`, floating/misused promises as errors | PASS |
| 3 | Script tests ignore the developer's git config | `gpgsign.txt`: with a global config that requires signing and a failing gpg, 23 failed before, 63/63 pass after | PASS |
| 4 | CI/Audit concurrency | push runs grouped by commit (ci.yml, audit.yml) | PASS |
| 5 | Flow 07 checks the reload once done | waits for `profile-refreshing` to go; Android runs 7/7 on b42bfb2 | PASS |
| 6 | Expo patches; favicon | expo 57.0.30, expo-router 57.0.28, expo-linking 57.0.13, expo-constants 57.0.22: `expo install --check` up to date, doctor 21/21, audit:check passes; `favicon/before.png` vs `after.png` | PASS |
| 7 | Gates, CI, e2e | 579 tests; CI, Audit green on b42bfb2; Android Expo Go 38768549833 and native debug 38768559956 success | PASS |
