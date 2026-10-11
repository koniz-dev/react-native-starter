Tag `v1.1.2` (annotated) is on commit
`c78899b8fff43c611842fa763b97b383c1abae76`, verified on 2026-10-11 in
[issue 63](https://github.com/koniz-dev/react-native-starter/issues/63)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-63)).
This is a maintenance patch release on the `v1.1.1` baseline: no new
capability and no platform change.

## What changed: a clean template copy

**"Use this template" now gives a clean project.**

- The starter's own maintenance process (issue workflow, release gate,
  support policy, label script) moved off `main` to the `maintainers`
  branch ([#61](https://github.com/koniz-dev/react-native-starter/issues/61)).
- The security policy moved to the account's
  [`.github`](https://github.com/koniz-dev/.github) repository, and the
  monthly review workflow was removed.
- A new repository contains no maintainer files or blocks.

**After `npm run init-project`, the project reads as your app**
([#62](https://github.com/koniz-dev/react-native-starter/issues/62)):

- `README.md` becomes a short README for the app.
- The one-time checklist (`docs/make-it-yours.md`) is deleted. Identity,
  build variants, and icons and splash live in the new
  `docs/app-config.md`.
- The state-management recipes, the TanStack Query example, and CI's install
  of their libraries are removed unless you pass `--keep-recipes`.
- The docs describe "the app", and the audit allowlist names your project
  as owner.
- After `init-project --remove-demo`, nothing mentions the starter (outside
  tests and the lockfile), and every gate passes.

**Dependencies** ([#60](https://github.com/koniz-dev/react-native-starter/issues/60)):

- In-range updates: ESLint 9.39.5, typescript-eslint 8.71.1,
  eslint-plugin-react-hooks 7.1.1, Prettier 3.9.10, React Native Paper
  5.15.3, `@expo/vector-icons` 15.1.1, and react-native-web 0.21.4.
- `useFetch` now sets its loading state outside its effect, for the new
  `react-hooks/set-state-in-effect` rule. Its behavior is unchanged.

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

Fixed since v1.0.0: the iOS reinstall Keychain token (#44).

## Maintenance mode

The starter is in maintenance mode. It accepts security fixes, regressions,
compatibility updates, docs corrections, and narrow reliability fixes. Only
the latest Expo SDK is supported, and an upgrade follows within about 4
weeks of an Expo SDK release. To report a vulnerability, use the
repository's **Security** tab.
