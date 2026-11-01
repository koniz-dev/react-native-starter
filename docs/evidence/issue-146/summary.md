# Issue 146: follow-redirects, node-forge and decode-uri-component high advisories

Commits: `main` abda04e (fix), `sdk-58` 64acb33 (merge of `main`). The advisories were
published on 2026-10-29/30 and first failed the Audit workflow on `sdk-58` at 57d73bb (run
41282828756).

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Exposure of each assessed and recorded. | `exposure.txt`. **follow-redirects** (axios): used only by axios's Node `http` adapter, which axios's `react-native` and `browser` maps replace, so it isn't in the app bundles. **node-forge** (`@expo/cli`, `@expo/code-signing-certificates`): build tooling only. **decode-uri-component** (`expo-router` > `query-string@7`): in the bundles but not reached. query-string decodes only in `parse()`, used by React Navigation's default `getStateFromPath`; Expo Router's linking config supplies its own, which reads query strings with `URL.searchParams`, and Expo Router calls only `stringify()`. The app imports neither. None of the three is reachable in the app, so no app-bundle exposure. | PASS |
| 2 | follow-redirects >= 1.16.2 and node-forge >= 1.4.1 on both branches, within the parents' ranges; stale allowlist entries removed. | `audit-main.txt`, `audit-sdk-58.txt` (`npm ls`): follow-redirects 1.16.2 (axios `^1.16.0`), node-forge 1.4.2 (`^1.3.3`). The lockfile diff on `main` changes only these two packages. node-forge 1.4.2 also clears GHSA-86w9-cpqp-85rv, so its entry is removed. | PASS |
| 3 | decode-uri-component fixed or allowlisted with exposure, reason and tracking. | No compatible fix: 0.5.1 is ESM-only (`type: module`, `export default`), and query-string 7 loads it with `require` within `^0.2.2`, so an override would break `parse()`. Allowlisted on `main` (reviewed 2026-11-01, reviewBy 2027-02-01, tracking the GHSA). Not on `sdk-58`: Expo Router 58 has no query-string, so the entry is dropped there in 64acb33. | PASS |
| 4 | audit:check passes on both; gates, CI and Audit green. | Local gates: `main` lint, type-check, format, docs:check, 708 tests, doctor 21/21; `sdk-58` the same with 750 tests and doctor 20/20. Actions on abda04e: CI 41290452844, Audit 41290452818, CodeQL 41290452871. On 64acb33: CI 41290723002, Audit 41290723008, CodeQL 41290719634. All success. | PASS |
| 5 | Patch release prepared; tagged only with the maintainer's approval. | Pending. | OPEN |

## Notes

- **Dependabot** opened four alerts on 2026-11-01 09:49Z: #8 decode-uri-component (high,
  reviewed above), #9 glob GHSA-3g3m-2fjr-6pw4 and #10 minimatch GHSA-g3hv-75wg-m249
  (moderate), and #7 deepmerge GHSA-gcqx-w48m-w2h4 (low). glob 13 (`@expo/config-plugins`),
  minimatch 3 and 10 (Jest, istanbul, `@expo/fingerprint`) and deepmerge 4.3.1
  (`@expo/config`) are build and test tooling only; the app's deepmerge 3.3.0
  (react-native-paper) is outside the affected range. None has a fix within the parents'
  ranges. Moderate and low advisories aren't gated by audit:check. Dismissing the alerts was
  blocked for the agent and waits for the maintainer.
- The push to `main` reported "Bypassed rule violations: Required status check Verify", as
  with every direct commit to `main` in this workflow; CI ran on the commit afterwards.
