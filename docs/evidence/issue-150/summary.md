# Issue 150: point the Expo Router guard workaround to expo/expo#54249

expo/expo#51916 was closed as a duplicate on 2026-11-25 in favor of the umbrella
expo/expo#54249; the link case (expo/expo#54277) went there too. No fix is merged
(`upstream.txt`: #51925 and #53458 closed unmerged; expo-router 58.0.32 is the latest).

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Comments in `app/_layout.tsx` and `__tests__/app/sessionRoutes.test.tsx` point to #54249; no other file on `main` names #51916 | cf95391. `git grep 51916` finds only `app/_layout.tsx:137`, "first reported as expo/expo#51916". | PASS |
| 2 | Release notes and maintainers README point to #54249 and say no fix is merged | `release-notes-v1.1.19.diff` (the published v1.1.19 notes, edited 2026-11-26; still latest). maintainers 86c2c72. | PASS |
| 3 | Gates; CI green | A temporary worktree of `main` with the change, Node 24.21.0 (SHA256 checked), `npm ci`: lint, type-check, format:check exit 0; 744 tests pass. CI 45836040889, CodeQL 45836041305, Audit 45836041035 success on cf95391. | PASS |

## Notes

- **A downloaded prettier ran once.** The main checkout had no `node_modules`, so my
  `npx prettier --check` fetched prettier 3.10.1 from npm and ran it (format check of the
  two files only). I deleted that npx cache entry and ran the gates in a worktree with
  the lockfile's dependencies.
- The push to `main` reported "Bypassed rule violations: Required status check Verify",
  as for direct commits before; the workflow ships directly to `main`.

Verdict: PASS.
