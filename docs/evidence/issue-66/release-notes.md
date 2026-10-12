Tag `v1.1.3` (annotated) is on commit
`be229099bab3d6dfb316e7bf2486d47ea153f80c`, verified on 2026-10-12 in
[issue 66](https://github.com/koniz-dev/react-native-starter/issues/66)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-66)).
This is a maintenance patch release on `v1.1.2`: no new capability and no
platform change.

## What changed

**Removing the demo now removes its backends switch too**
([#64](https://github.com/koniz-dev/react-native-starter/issues/64)):

- `npm run remove-demo` (and `init-project --remove-demo`) removes
  `EXPO_PUBLIC_USE_DEMO_BACKENDS` and the public demo URLs (JSONPlaceholder,
  DummyJSON) from `shared/config/env.ts`, `.env.example`, the e2e runner,
  and the docs. Afterwards the config simply requires
  `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AUTH_API_URL`, and a build can no
  longer fall back to third-party demo servers.
- Tests set placeholder URLs in `jest.setup.env.js` instead of turning the
  demo backends on.
- The last "template" wording after `init-project` is gone (the dependency
  advisories section and the audit allowlist comment).
- Until you remove the demo, it works as before: `cp .env.example .env`
  turns the demo backends on.

**Expo SDK 57 patch releases**
([#65](https://github.com/koniz-dev/react-native-starter/issues/65)):
expo 57.0.28, expo-router 57.0.26, expo-splash-screen 57.0.10, and jest-expo
57.0.6. Without them `npx expo-doctor` fails, so a new project from `v1.1.2`
starts with red CI; upgrade to `v1.1.3` or run `npx expo install --fix`.

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
  has no fix yet; this is tracked in
  [#43](https://github.com/koniz-dev/react-native-starter/issues/43)
  (blocked).

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
