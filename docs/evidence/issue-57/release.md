# Release v1.1.1: MVP baseline after the adopter trials

Tag `v1.1.1` (annotated) is on commit
`ea6e2a4e1c7c7bb55116654f47e38e6e7a52da96`, verified on 2026-10-11 in
[issue 57](https://github.com/koniz-dev/react-native-starter/issues/57).
The verification evidence is in [summary.md](summary.md).

`v1.1.0` (`281be40`) was tagged first. It failed one check, filed as
[#58](https://github.com/koniz-dev/react-native-starter/issues/58): `test:ci`
failed after a standalone `npm run remove-demo`. The fix is a test-only
change. The `v1.1.0` tag stays where it is, because pushed tags are never
moved, and it is not a verified baseline.

## What this release is

This is a React Native starter, not a finished app. It is the same product
as [`v1.0.0-mvp`](../issue-26/release.md): an opinionated structure whose
production concerns already work, with third-party services behind seams
that have no-op or console defaults. This release makes the path from "Use
this template" to your own app work from the docs alone. Two adopter trials
(#48 and #53) checked that path.

## Changes since v1.0.0-mvp

| Issue | Change                                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #44   | A token left in the iOS Keychain by a previous install is cleared on first launch (install marker). This was a v1.0.0 known limitation.                                                          |
| #49   | `npm run remove-demo` removes every demo reference (docs, README, `.env.example`, Maestro flows), and then removes itself. `init-project` runs it first.                                         |
| #50   | `AuthAdapter.logout(clients)`, nested error envelopes in `ApiError`, and an example adapter for a real backend (tokens-only login plus `/me`, refresh rotation, logout).                         |
| #51   | Full-app seam tests keep passing when providers are registered. Testing documents the two test origins.                                                                                          |
| #52   | Lint treats `scripts/` as Node (dev-only code such as a mock backend). `npm run android`/`ios` survive `expo prebuild`. Docs: a sign-in tab, analytics identify, local backends, the web export. |
| #54   | Request failures that the server answers (4xx/5xx) log at `info`, so in development no LogBox toast covers the UI.                                                                               |
| #55   | The e2e runner can target your own backend or mock (`E2E_API_URL`, `E2E_AUTH_API_URL`, `E2E_BACKEND_CMD`). The e2e mock is now generic.                                                          |
| #56   | The backend examples unwrap a `{ data }` envelope and validate payloads with zod. Base URLs may include a path. Small docs fixes.                                                                |
| #58   | `test:ci` passes after a standalone `remove-demo`.                                                                                                                                               |

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
- **Local Android emulator:** Android 17 (API 37), `sdk_gphone64_x86_64`,
  for the adopter project.
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
- **A state-management library.** The repository has recipes only.
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

  They were reviewed in [issue 41](../issue-41/audit-review.md) and are
  allowlisted until 2027-01-09 in `scripts/audit-allowlist.json`. Upstream
  has no fix yet; this is tracked in
  [#43](https://github.com/koniz-dev/react-native-starter/issues/43)
  (blocked).

- **Expo Go draws its own status bar on Android**, so in light mode the
  status bar is Expo Go's black strip. The native debug build shows the
  app's own status bar.
- **Maestro writes `MAESTRO_*` values into `e2e-results/`.** For signed-in
  flows, use a test account (documented in #55).

Fixed since v1.0.0: the iOS reinstall Keychain token (#44).
