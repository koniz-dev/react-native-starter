Tag `v1.1.7` (annotated) is on commit
`d52709d6025799b03359dcd0d564b6914bb1d306`, verified on 2026-10-13 in
[issue 75](https://github.com/koniz-dev/react-native-starter/issues/75)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-75)).
It fixes everything a deep audit of the starter found on 2026-10-13
(#69–#74); no issue is open. The tags `v1.1.5` and `v1.1.6` were never
released: verifying them found two more problems, fixed here.

## Take this release if you started from an earlier one

**Security ([#69](https://github.com/koniz-dev/react-native-starter/issues/69)).**
These affect every earlier release. If your app calls other APIs through the
app's `api` client, or requests URLs that come from server data, copy
`shared/http/httpClient.ts`, `shared/http/apiError.ts`,
`shared/session/session.ts`, `shared/session/authService.ts`, and
`shared/lib/logger.ts` (and their tests):

- A 401 from a third-party origin that got its own `Authorization` header no
  longer refreshes the user's token, sends it to that origin, or signs the
  user out.
- A URL with a backslash, whitespace, or a control character in its host
  part (`https://evil\@auth.example.com`) is never trusted with the token.
- A refresh that fails offline, times out, or gets a 5xx keeps the session.
- A 401 for an older token retries with the current one.
- A refresh that finishes after sign-out can't bring the session back.
- Errors and logs carry no token, password, or query string, and log
  redaction matches secret key names by pattern.

## What else changed

- **Template scripts ([#70](https://github.com/koniz-dev/react-native-starter/issues/70)):**
  - `audit:check` fails when `npm audit` itself fails; it used to pass.
  - `init-project` writes names and owners literally, and validates bundle
    IDs and schemes the way iOS, Android, and Expo do.
  - The scripts run on Windows (no `npx` or shell needed), and
    `.gitattributes` keeps LF, so an autocrlf checkout passes the gates.
  - The e2e mock and runner check what they run; Expo Go's launcher ANR
    dialog is handled.
- **Build, CI, config ([#71](https://github.com/koniz-dev/react-native-starter/issues/71)):**
  - `npm run build:preview:*` / `build:production:*` give local native
    builds their variant's config. A plain run embedded the development
    config.
  - Lint now enforces the conventions in AGENTS.md: exports, the
    dependency direction, `import type`, color literals, and unhandled
    promises.
  - CI pins Node 24.21.0, ubuntu-24.04, actions by commit, and the recipe
    libraries through `docs/recipes/package-lock.json`.
  - Expo Go is pinned with a checksum, and the workflows have timeouts.
- **UI, accessibility, i18n ([#72](https://github.com/koniz-dev/react-native-starter/issues/72)):**
  - Navigation: a themed not-found screen, and Login has a back button.
  - Users see translated errors, never developer text.
  - Accessibility: screen titles are headings, fields are labeled, and
    icons are hidden from screen readers.
  - Content is capped on tablets and the web.
  - The light primary is `#07709a`, so text meets WCAG AA on every
    elevation level; elevation tints come from the brand.
  - The web build has no white flash in dark mode, sets per-screen tab
    titles, and builds with `npm run export:web`.
- **Docs ([#73](https://github.com/koniz-dev/react-native-starter/issues/73)):** every claim
  re-checked against the code. The step-1 env example now lists the API in
  `EXPO_PUBLIC_API_TRUSTED_ORIGINS`; without it, a copied config sent API
  requests without the token.
- **Tests ([#74](https://github.com/koniz-dev/react-native-starter/issues/74)):**
  - 376 tests.
  - Every mutant the audit found surviving is now killed.
  - Coverage is enforced per folder and per file, so an untested module
    fails.
  - A Maestro flow covers the protected Profile route.

## Supported

| Item     | Supported                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Expo SDK | 57 (React Native 0.86.3, React 19.2.3, Expo Router 57)                                                         |
| Node     | 24.21.0 (`.nvmrc`, what CI uses); 24.3+ or 22.13+ also work (`engines`, not 23); npm with the committed `package-lock.json` |
| Android  | Expo Go, and a native debug build of the development variant (`npm run prebuild:development`, `assembleDebug`); release builds of a variant with `npm run build:<variant>:android` (not part of the verification) |
| iOS      | Expo Go on the iOS Simulator                                                                                   |
| Web      | Static export (`npm run export:web`, production variant)                                                        |

Verified on:

- **GitHub Actions:** an Android emulator, API 34 `google_apis` x86_64, on
  `ubuntu-24.04` (Expo Go 57.0.9 and the native debug build), 7 flows each
  plus dark mode, against the local e2e mock only.
- **iOS:** an iPhone 16 Plus simulator, iOS 18.6, Expo Go 57.0.9 (Xcode
  16.4, macOS 15.8.1), 6 flows plus dark mode.
- **Web:** Google Chrome 154, headless, on the production export.

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
  has no fix yet (re-checked 2026-10-13). The weekly Audit workflow fails
  when npm can apply one or when the review date passes.

- **Expo Go draws its own status bar on Android**, so in light mode the
  status bar is Expo Go's black strip. The native debug build shows the
  app's own status bar.
- **Maestro writes `MAESTRO_*` values into `e2e-results/`.** For signed-in
  flows, use a test account (documented in #55).
- **After `--remove-demo`, few e2e flows remain** (cold start, Back from
  Login, dark mode): the sign-in flows use the demo account. Add your own
  against a test account (Remove the Demo, Testing).

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


