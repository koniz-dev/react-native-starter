Tag `v1.1.4` (annotated) is on commit
`887f634068cb2563ef4f4edc753be2169f56c014`, verified on 2026-10-12 in
[issue 68](https://github.com/koniz-dev/react-native-starter/issues/68)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-68)).
This is a maintenance patch release on `v1.1.3`: no new capability and no
platform change.

## What changed: a commit that passes CI keeps passing

([#67](https://github.com/koniz-dev/react-native-starter/issues/67))

Until now, CI on an unchanged copy of the template could turn red when Expo
or npm published something new (it did on 2026-10-12, fixed in v1.1.3). Now
CI uses only what the repository pins:

- **`npm run doctor`** runs Expo Doctor (a pinned devDependency) against the
  Expo SDK in your lockfile, not against Expo's newest patch releases. It
  still fails when a package doesn't match your installed SDK. To see newer
  patches when you want to update, run `npx expo install --check`.
- **The recipe libraries** that CI installs to compile the docs are pinned to
  exact versions.
- **`npm run audit:check` has its own Audit workflow**
  (`.github/workflows/audit.yml`): on every push and pull request, and weekly.
  A new advisory or an expired review fails that workflow, not CI. It also
  fails when npm can apply a fix to an allowlisted advisory within your
  dependency ranges, so an upstream fix is noticed without tracking it by
  hand.
- **The Maestro flows need no third-party server.** The local e2e mock serves
  the demo sign-in, so `npm run test:e2e:*` works offline. The Android e2e
  workflow downloads Expo Go for your installed SDK.

If you made a project from an earlier release, the same changes apply
cleanly: copy `.github/workflows/ci.yml` and `audit.yml`, add
`expo-doctor` and the `doctor` script to `package.json`, and replace
`scripts/check-audit.js`.

## Supported

| Item     | Supported                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Expo SDK | 57 (React Native 0.86.3, React 19.2.3, Expo Router 57)                                                         |
| Node     | 24 (`.nvmrc`; verified with 24.21.0) or 22.13+ / 24.3+ (`engines`); npm with the committed `package-lock.json` |
| Android  | Expo Go, and a native debug build of the development variant (`npm run prebuild:development`, `assembleDebug`) |
| iOS      | Expo Go on the iOS Simulator                                                                                   |
| Web      | Static export (`npx expo export --platform web`)                                                               |

Verified on:

- **GitHub Actions:** an Android emulator, API 34 `google_apis` x86_64, on
  `ubuntu-latest` (Expo Go and the native debug build).
- **iOS:** an iPhone 16 Plus simulator, iOS 18.6, Expo Go 57.0.9 (Xcode
  16.4, macOS 15.8.1).
- **Web:** Google Chrome 154, headless.

## Non-goals

These are unchanged from v1.0.0:

- **A production backend.** DummyJSON and JSONPlaceholder are demo
  endpoints that you replace.
- **App-store or EAS builds and submission.**
- **Real third-party providers.** Analytics, crash reporting, push,
  feature-flag, and OTA providers are out of scope; only the seams and their
  defaults are.
- **A state-management library.** Recipes only; `init-project` removes them unless `--keep-recipes`.
- **Landscape layouts and physical-device testing.**

## Known issues (found in the 2026-10-13 audit, being fixed for the next release)

These affect this and every earlier release:

- **[#69](https://github.com/koniz-dev/react-native-starter/issues/69) (security):**
  - A 401 from a third-party origin that the app called with its own
    `Authorization` header can refresh the user's token and retry to that
    origin with it.
  - A URL with a backslash (`https://evil\@auth.example.com`) is treated as
    the trusted auth origin.

  If your app calls third-party APIs through the app's `api` client, or
  requests URLs that come from server data, take the fix when it ships.
- [#70](https://github.com/koniz-dev/react-native-starter/issues/70) to
  [#74](https://github.com/koniz-dev/react-native-starter/issues/74):
  - template scripts (for example, `audit:check` passes when `npm audit`
    itself fails);
  - local variant builds;
  - UI and accessibility gaps;
  - docs corrections;
  - test gaps.

## Known limitations

- **Native iOS builds are not verified.** Expo SDK 57 needs Xcode 26.4+, and
  the verification host has Xcode 16.4. For this release, iOS is supported
  in Expo Go only.
- **Web keeps the token in memory**, so a page reload signs you out
  (documented in API and Storage).
- **Two allowlisted high advisories** are in build-time dependencies only:
  - node-forge, through `@expo/cli`;
  - braces, through Metro and Jest's `micromatch`.

  They were reviewed in [issue 41](https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md) and are
  allowlisted until 2027-01-09 in `scripts/audit-allowlist.json`. Upstream
  has no fix yet (re-checked 2026-10-12). The weekly Audit workflow fails
  when npm can apply one or when the review date passes.

- **Expo Go draws its own status bar on Android**, so in light mode the
  status bar is Expo Go's black strip. The native debug build shows the
  app's own status bar.
- **Maestro writes `MAESTRO_*` values into `e2e-results/`.** For signed-in
  flows, use a test account (documented in #55).

- **Expo SDK 58 is close.** Expo Go already announces that its next store
  version supports only SDK 58. Under the support policy the starter moves
  to SDK 58 within about 4 weeks of its release; until then, run SDK 57
  projects in an Expo Go build for SDK 57 or in a development build.

Fixed since v1.0.0: the iOS reinstall Keychain token (#44).

## Maintenance mode

The starter is in maintenance mode. It accepts security fixes, regressions,
compatibility updates, docs corrections, and narrow reliability fixes. Only
the latest Expo SDK is supported, and an upgrade follows within about 4
weeks of an Expo SDK release. To report a vulnerability, use the
repository's **Security** tab.

