# Issue #142: zod < 4.6.6 (GHSA-mrhx-c7xc-m3w5, high)

Advisory: `zod` through 4.6.5 accumulates an issue per failing array element with no cap, so validating a large array of invalid items can exhaust memory. Patched in 4.6.6. npm reports it for `zod < 4.6.6`, which includes zod 3.

Commits: `main` 1ecec29 ([`package.json`](https://github.com/koniz-dev/react-native-starter/blob/1ecec29/package.json), [`scripts/audit-allowlist.json`](https://github.com/koniz-dev/react-native-starter/blob/1ecec29/scripts/audit-allowlist.json)); `sdk-58` e5c4243 (the same change on SDK 58's lockfile), then 2204ac8 (merge of `main`, no content change, so PR #135 is mergeable again).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Exposure assessed | PASS | See [Exposure](#exposure). `exposure-grep.log`, `web-bundle-zod.log`. |
| 2 | zod >= 4.6.6 on `main` and `sdk-58`; stale `braces` entry removed | PASS | `audit-main-1ecec29.log`, `audit-sdk58-e5c4243.log`: the direct zod is 4.6.7 (range `^4.6.7`); only `@expo/cli`'s zod 3.25.76 remains. The `braces` entry is gone. |
| 3 | `audit:check` passes on both branches; gates, CI, Audit green | PASS | Both audit logs end "No unreviewed high or critical advisories". Gates: `gates-main-1ecec29.log` (708 tests), `gates-sdk58-e5c4243.log` (736 tests). Actions: `main` 1ecec29 CI 40182489225, Audit 40182489172, CodeQL 40182489346; `sdk-58` 2204ac8 CI 40183464359, Audit 40183464319. |
| 4 | Patch tag if the app bundle is reachable | PASS | Reachable (below), so a patch tag was due by 2026-11-08 (Support Policy: 14 days). Shipped in [v1.1.17](https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.17) on 2026-10-25, a security-only release (#143, evidence `issue-143/`). |

## Exposure

- **App bundle: reachable, fixed.** `features/demo-todos/api/todosApi.ts` parses a backend array with `z.array`, and Connect Your Backend teaches the same pattern (`docs/connect-your-backend.md`). A backend (or anything in between that it trusts) returning a huge array of invalid items could crash the app with out-of-memory. The direct dependency is now `^4.6.7`, so a fresh install can't resolve to an affected version. The exported web bundle (sdk-58, e5c4243) contains only zod 4.6.7 (`web-bundle-zod.log`).
- **Expo CLI: build tool only, allowlisted.** `@expo/cli` (SDK 57 and 58) depends on `zod@^3.25.76` and imports it only in the dev server's dev-tools plugin and MCP extension schemas (`exposure-grep.log`), on the developer's machine. There is no zod 3 fix, and overriding to zod 4 would break the CLI's range. Entry in `scripts/audit-allowlist.json`, reviewed 2026-10-25, `reviewBy` 2027-01-25.
- The allowlist matches by advisory id, so the entry would also hide an affected direct zod. The `^4.6.7` floor prevents that for the starter; the entry's `path` says so for adopters who re-review it.
- Dependabot alert #6 (the transitive zod 3, opened when 1ecec29 was pushed) was dismissed as tolerable risk, pointing to the allowlist entry and #142.
