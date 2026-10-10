# Issue 48 verification — the adopter journey

Verified on 2026-10-10. Template: `koniz-dev/react-native-starter` `main` at
[`bf1f4e1`](https://github.com/koniz-dev/react-native-starter/commit/bf1f4e1).
Trial project: the private repository `koniz-dev/rns-adopter-trial`, made with
`gh repo create --template` (temporary; to be deleted by the owner). Times and
snags per step: [friction-log.md](friction-log.md).

## Verdict

**Yes, with gaps.** Starting from "Use this template", an adopter reached a
working, release-shaped app (an Android production release build passing e2e
flows against their own backend) in about 65 minutes. They used the shipped
docs plus the `shared/` code that the docs point to. The fresh agent session
that played the adopter estimated that 80% of the work was doc-driven.

What was not covered by the docs alone is filed:

- [#49](https://github.com/koniz-dev/react-native-starter/issues/49) (P1):
  after `--remove-demo`, the docs, README, `.env.example`, and Maestro flows
  still point at the deleted demo.
- [#50](https://github.com/koniz-dev/react-native-starter/issues/50) (P2):
  realistic backends need `AuthAdapter.logout` and error-envelope support,
  plus documented credentials mapping and refresh-token storage.
- [#51](https://github.com/koniz-dev/react-native-starter/issues/51) (P2):
  registering a provider breaks the full-app seam tests, and the test env
  uses two origins.
- [#52](https://github.com/koniz-dev/react-native-starter/issues/52) (P3):
  smaller docs gaps: dev-only Node code, tabs that need sign-in, `identify`,
  emulator localhost, release builds against a local backend, `prebuild`
  rewriting `package.json`, and a doubled dry-run message.

## Acceptance criteria

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Repository made with "Use this template" / `gh repo create --template`; file count and size; no maintainer-only files, no evidence | [01-create.log](01-create/01-create.log): only `main` was copied (one "Initial commit"), 140 files, 1.8 MB working tree and 464 KB `.git`, 0 evidence files. The six maintainer files (`docs/maintainers/`, `scripts/maintainers/`, `scripts/maintainer-files.json`) **are present right after creation**: #46 put them on `main`, marked "delete in your project", with a guard so an adopter's agent ignores them. `init-project` deletes them in step 2 ([02-init](02-init/02b-init-project.log)). Read strictly, "no maintainer-only files" holds only after `init-project`. That is the design #46 chose: GitHub copies the whole default branch, and the maintainer files have to live on it. | PASS (see note) |
| 2   | `npm ci`, `.env`, `init-project` with a new identity and `--remove-demo`; transcript | [02a npm ci](02-init/02a-npm-ci.log), [02b init-project](02-init/02b-init-project.log) (dry run, then the real run: Field Notes, `com.fieldtrial.notes`, demo removed). CI on the initialized repo: [run 38049843106](02-init/github-actions-ci-38049843106.log), success | PASS |
| 3   | Build on it from the docs only: `AuthAdapter` for a different backend with refresh, env with the demo off, a list feature (loading/error/Retry, route, i18n, tests), one seam into a fake provider; doc steps cited; gaps filed or fixed | A fresh `claude -p` session played the adopter ([prompt](03-build-on-it/prompt.md), [transcript](03-build-on-it/session-transcript.jsonl), startup inventory event removed). Built: `mock-backend/server.js` (tokens-only login, `/me`, rotating refresh, error envelope, notes with a 503 switch), `features/auth/fieldNotesAuthAdapter.ts`, `features/notes/` (Notes tab), `shared/integrations/adapters/memoryAnalytics.ts`, and 212 tests ([diff](03-build-on-it/step3.diff), [stat](03-build-on-it/step3-commit-stat.txt)). Each step cites its doc sections in [FRICTION.md](03-build-on-it/FRICTION.md). I re-checked the main findings (F1, F3, F4, F5, F10) against the code. All findings are filed as #49–#52. | PASS |
| 4   | Gates pass in the new project (lint, type-check, `test:ci` with the threshold, format, `docs:check`, `audit:check`, `expo-doctor`, web export); its CI green | [04-gates](04-gates/): lint, type-check, test:ci (212 tests, coverage above the threshold), format:check, docs:check, audit:check, expo-doctor (21/21), web export, all exit 0. CI [run 38050724298](04-gates/github-actions-ci-38050724298.log) on `7779251`: success | PASS |
| 5   | Android release build of the production variant installs and runs with the new identity; applicable Maestro flows against it | `npm run prebuild:production`, then `assembleRelease` with production env and `https://localhost:4443` ([prebuild](05-release-android/05a-prebuild-production.log), [gradle](05-release-android/05b-assemble-release.log)). [apk-and-device.log](05-release-android/apk-and-device.log): package `com.fieldtrial.notes`, label "Field Notes", 1.0.0, installed on Android 13 (`sdk_gphone64_x86_64`). The mock sat behind a TLS proxy ([tls-proxy.js](05-release-android/tls-proxy.js)) whose test CA was installed in the rooted emulator's system store, so the release app trusts it unmodified. Two Maestro flows ([flows](05-release-android/maestro/)): sign in against the mock, then relaunch still signed in; Notes shows the 503 error, Retry loads the list, then logout. [Log](05-release-android/05d-maestro.log): 2/2 passed. [Screenshots](05-release-android/screenshots-sheet.png) (each opened and checked). [Proxy log](05-release-android/tls-proxy.log): `POST /sessions`, `GET /me`, `GET /notes` 503 then 200, `DELETE /sessions`. The starter's own flows can't run on a demo-free app (#49). | PASS |
| 6   | iOS scope stated honestly: how to build, and that the starter hasn't verified native iOS | [`docs/getting-started.md#supported-platforms`](https://github.com/koniz-dev/react-native-starter/blob/82c673a/docs/getting-started.md#supported-platforms) at `82c673a`: native iOS is unverified; build with EAS Build (`eas build --platform ios`) or locally with Xcode 26.4+ (`prebuild`, then `expo run:ios` or Xcode). The Android row now lists the verified release build. Native iOS was not built here (this Mac has Xcode 16.4). | PASS |
| 7   | Evidence with a friction log (time per step, every snag); verdict and remaining gaps | [friction-log.md](friction-log.md), [FRICTION.md](03-build-on-it/FRICTION.md); the verdict above | PASS |

## Notes

- **Remaining trial resources.**
  - The trial repository `koniz-dev/rns-adopter-trial` (private) is left for
    the owner to delete. The `gh` token here has no `delete_repo` scope.
  - The AVD `Trial_Root_API_33` and its API 33 `google_apis` image (about
    1.5 GB) stay on this machine until removed.
- **No secrets committed.** The CA and server private keys are not in the
  evidence, and `.env` was never committed in the trial repository. The mock's
  tokens are random test values.
