# Issue #139: certificate pinning recipe

Branch `sdk-58`, commit 396b833: [`docs/recipes/certificate-pinning.md`](https://github.com/koniz-dev/react-native-starter/blob/396b833/docs/recipes/certificate-pinning.md). Non-security work ships with the SDK 58 merge (#134).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `docs/recipes/certificate-pinning.md` with a maintained library via a config plugin, a backup pin, rotation guidance, the web limitation, and how it interacts with `shared/http/httpClient.ts` | PASS | `react-native-ssl-public-key-pinning` 1.2.6 (OkHttp / TrustKit; a TurboModule; repository active until 2025-11). It needs no config plugin of its own; the recipe uses the `expo-build-properties` config plugin (`ios.networkInspector: false`) for iOS development builds, where `expo-dev-client`'s inspector bypasses pins (the library's README). Sections: choosing pins (two per host, why not a rotating leaf, `openssl` for a live key and an offline backup), the module, a fail-closed check, rotation (overlap, wait, switch, `expirationDate` trade-off), web. Interaction: the module adds a request interceptor to `api` and both auth clients, so no request goes out before pinning is on, and requests fail if it fails; a pin mismatch reaches callers as ApiError `network`. |
| 2 | Code blocks pass `npm run docs:check` (with `docs-check: requires`) | PASS | The library is pinned in `docs/recipes/package.json` and its lockfile. `gates.log` (local, libraries linked as CI does) and CI 40187859992 on 396b833: "Checked 20 files: 47 TypeScript snippets compiled with tsc. No problems." with no skipped block. Audit 40187860138 green. |
| 3 | `docs/README.md` links it; `remove-demo` / `init-project` leave it or remove it consistently with the other recipes | PASS | `docs/README.md` and AGENTS.md link it inside the `@recipes` blocks. `recipes-lifecycle.log`: after `remove-demo` the recipe stays and docs:check passes; `init-project --remove-recipes` deletes `docs/recipes/` and leaves no mention; `--keep-recipes` keeps both recipes and their links. init-project's prompt, help, and Getting Started now say "the recipes" instead of "the state-management recipes". |

## Beyond the criteria

The recipe's `sslPinning.ts` block was extracted verbatim into a copy of the project and tested with the native module mocked (`recipe-behaviour.test.ts`, `recipe-behaviour.log`): both hosts are pinned, a request waits until pinning is on, a failed start fails requests without sending them, and the web does nothing. Removing the interceptor registration fails two of the three tests.

Not verified here: pinning on a device. The recipe tells adopters to check that it fails closed in a preview build, with made-up pins, before shipping.

## Reverted, closed as not planned (2026-11-01)

The maintainer decided not to ship this, as part of one round that also dropped #137 and the rest of #138-#141 (`sdk-58` was tidied
in one round). The starter is in maintenance mode (security fixes, regressions,
compatibility, documentation fixes), and this was a new addition no user asked for: it came
from comparing with koniz-dev/flutter-starter. It was never on `main` or in a release.

- `sdk-58` 7834bc2 reverts 396b833. The four reverts (8ddba3b, 3c5567c, 7834bc2,
  7f8e2d8) applied without conflicts; afterwards `git grep` finds no reference to
  `new-feature`, `certificate-pinning`, `localization.md` or `E2E_ANDROID_SCHEDULE`, and
  the workflows differ from `main` only in the SDK 58 pins.
- Local gates at 7f8e2d8: format, lint, type-check, docs:check (46 snippets, "No
  problems."), 736 tests, audit:check. CI on 7f8e2d8: see issue-146 or the PR #135 checks.
- The issue was reopened, commented, its `status:in-progress` label removed (it had been
  left on at the original close), and closed as not planned.
