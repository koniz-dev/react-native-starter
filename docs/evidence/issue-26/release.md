# Release v1.0.0-mvp — MVP baseline

Tag `v1.0.0-mvp` (annotated, tag object `a9af391`) on commit
`f3f4bd7bb2e8080c3c2b8fad0eef3cc8c9c8ac69`, verified 2026-10-10 in
[issue 26](https://github.com/koniz-dev/react-native-starter/issues/26).
Verification evidence: [summary.md](summary.md).

## What this release is

A React Native starter, not a finished app: an opinionated structure with
the production concerns already working (validated config, HTTP client with
timeouts, typed errors and 401 handling, session and secure token storage,
error boundary and logger wired to a reporting seam, build variants, CI).
Third-party services plug in behind seams with no-op or console defaults;
the starter ships none of them and runs with only `.env.example` values.

## Supported

| Item     | Supported                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Expo SDK | 57 (React Native 0.86, React 19.2, Expo Router 57)                                                             |
| Node     | 24 (`.nvmrc`; verified with 24.21.0) or 22.13+ (`engines`); npm with the committed `package-lock.json`         |
| Android  | Expo Go, and a native debug build of the development variant (`npm run prebuild:development`, `assembleDebug`) |
| iOS      | Expo Go on the iOS Simulator                                                                                   |
| Web      | Static export (`npx expo export --platform web`)                                                               |

Verified on: Android emulator API 34 (`google_apis`, x86_64, GitHub Actions
`ubuntu-latest`); iPhone 16 Plus simulator, iOS 18.6 (Xcode 16.4, macOS
15.8.1); Google Chrome 154 (headless). Expo Go 57.0.9 on iOS; on Android the
Expo Go build named by Expo's versions API for SDK 57.

## Non-goals

- A production backend. DummyJSON (sign-in) and JSONPlaceholder (todos) are
  demo endpoints the adopter replaces ([Connect Your Backend](https://github.com/koniz-dev/react-native-starter/blob/f3f4bd7bb2e8080c3c2b8fad0eef3cc8c9c8ac69/docs/connect-your-backend.md)).
- App-store or EAS builds and submission (build profiles exist; submitting is
  the adopter's).
- Real analytics, crash reporting, push, feature-flag, or OTA providers. The
  seams and their defaults are in scope ([Plug In a Provider](https://github.com/koniz-dev/react-native-starter/blob/f3f4bd7bb2e8080c3c2b8fad0eef3cc8c9c8ac69/docs/plug-in-a-provider.md)).
- A state-management library (recipes in [docs/recipes/](https://github.com/koniz-dev/react-native-starter/blob/f3f4bd7bb2e8080c3c2b8fad0eef3cc8c9c8ac69/docs/recipes/state-management.md)).
- Landscape layouts, physical-device testing.

## Known limitations

- **Native iOS builds are not verified.** Expo SDK 57 needs Xcode 26.4+; the
  verification host has Xcode 16.4. iOS is supported in Expo Go only for this
  release.
- **Web keeps the token in memory**, so a page reload signs out (no secure
  storage on web; [API and Storage](https://github.com/koniz-dev/react-native-starter/blob/f3f4bd7bb2e8080c3c2b8fad0eef3cc8c9c8ac69/docs/api-and-storage.md#why-the-token-is-not-persisted-on-web)).
- **iOS reinstall keeps the Keychain token.** iOS keeps Keychain items when
  an app is deleted, so a reinstall can start with a token but no stored
  user ("Signed in as your account"). Tracked in
  [#44](https://github.com/koniz-dev/react-native-starter/issues/44) (P2).
- **Two allowlisted high advisories** in build-time dependencies (node-forge
  via `@expo/cli` and `@expo/code-signing-certificates`; braces via Metro and
  Jest's `micromatch`), not in the app bundles,
  reviewed in [issue 41](../issue-41/audit-review.md), allowlisted until
  2027-01-09 in `scripts/audit-allowlist.json`, tracked in
  [#43](https://github.com/koniz-dev/react-native-starter/issues/43).
- **Expo Go draws its own status bar on Android**, so the light-mode status
  bar is a black strip there; the starter's `StatusBar` style applies in
  native builds ([UI and Theming](https://github.com/koniz-dev/react-native-starter/blob/f3f4bd7bb2e8080c3c2b8fad0eef3cc8c9c8ac69/docs/ui-and-theming.md)).
- **iOS Back from Login** (left-edge swipe) is outside what Maestro can drive;
  it is checked with the XCUITest runner from issue 19.
