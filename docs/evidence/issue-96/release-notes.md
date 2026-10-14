Tag `v1.1.10` (annotated) is on commit
`a222f45b305ca08706a3de3fb53a849288adac34`, verified on 2026-10-14 in
[issue 96](https://github.com/koniz-dev/react-native-starter/issues/96)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-96)).
It fixes everything a fourth deep audit of `v1.1.9` found on 2026-10-14,
in which all 161 tracked files were read (#90–#95); no issue is open.

## Take this release if you started from an earlier one

**Session ([#90](https://github.com/koniz-dev/react-native-starter/issues/90)).**
Copy `shared/session/authService.ts`, `shared/session/SessionProvider.tsx`,
and `shared/http/httpClient.ts` (and their tests). If you based your
adapter on the example in Connect Your Backend, update its `refresh` and
`logout`.

- A `refresh` that calls the `authenticated` client and gets a 401 no longer
  waits for itself: before, every later request with a 401 hung until the
  app restarted. `refresh` now gets clients where that 401 signs the user out.
- The example `logout` revokes the refresh token through the `public`
  client, so sign-out works after the access token has expired, and clears
  it in `finally`.
- The example `refresh` revokes a rotated token from a refresh that
  finished after the user signed out, instead of leaving it on the device.
- A failed session restore at launch is logged and reported.

**Uploads ([#91](https://github.com/koniz-dev/react-native-starter/issues/91)).**
Copy `shared/http/httpClient.ts`. Every client sent a `FormData` body as
JSON, so uploads failed on iOS, Android, and the web. A `FormData` now goes
out as `multipart/form-data` (verified on all three).

## What else changed

- **Config ([#91](https://github.com/koniz-dev/react-native-starter/issues/91)):**
  `EXPO_PUBLIC_APP_ENV=` counts as unset and is trimmed. A URL with a space
  or backslash is rejected at startup; before, it passed validation but
  never received the token.
- **Foundation ([#92](https://github.com/koniz-dev/react-native-starter/issues/92)):**
  - A provider that throws while it is registered (for example one that
    reads invalid config) is logged, and the configuration error screen
    still shows.
  - An analytics provider that throws no longer crashes navigation.
    Screen names are route patterns (`/orders/[id]`), so ids and tokens in
    URLs aren't sent.
  - `useFetch` clears an old error when a re-run succeeds.
  - `logger.error` never throws. It logs `Date`, `Map`, `Set`, and `URL`
    values, and doesn't hand reporters the response body as an error field.
  - The default reporter is silent in release builds.
  - The error boundary catches `throw undefined`.
  - The light primary is `#066a92`, for 4.5:1 contrast on more surfaces.
- **UI ([#93](https://github.com/koniz-dev/react-native-starter/issues/93)):**
  - Login says which field is missing, and repeats the message to screen
    readers.
  - The password field uses `current-password` autocomplete, valid on the
    web.
  - Empty names fall back to "your account" or "Not available".
  - The demo adapter validates with zod.
  - New tests: Back to the screen that opened Login, and tab titles.
- **Template scripts ([#94](https://github.com/koniz-dev/react-native-starter/issues/94)):**
  - `init-project` and `remove-demo` format in memory and delete themselves
    last, so a Prettier failure changes nothing.
  - `remove-demo` refuses uncommitted changes unless `--force`, and neither
    script ever suggests `git checkout`/`clean` over uncommitted work.
  - Without git, `init-project` says it can't check or undo.
  - `audit:check` requires the package and severity to match, and a review
    date at most 183 days out.
  - `docs:check` also checks doc links in shell, YAML, and `.env.example`.
- **Tooling ([#95](https://github.com/koniz-dev/react-native-starter/issues/95)):**
  - Lint rejects color names, lists, navigator options, and hex constants;
    `require()` of a local image or font is allowed.
  - CI bundles for iOS and Android, which catches broken platform-file
    imports.
  - Splash colors are tested against the theme.
  - `.gitignore` covers `*.keystore`, `CLAUDE.local.md`, and a symlinked
    `node_modules`.
  - `extra.appVariant` is removed (the EAS docs say where the projectId
    goes).
- 529 tests (440 after `init-project --remove-demo`).

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
- **Android, locally:** an API 37 emulator in Expo Go, 7 flows plus dark
  mode, and uploads checked against an echo server (also on iOS and the web).
- **iOS:** an iPhone 16 Plus simulator, iOS 18.6, Expo Go 57.0.9 (Xcode
  16.4, macOS 15.8.1), 7 flows plus dark mode.
- **Web:** Google Chrome 155, headless, on the production export.

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
  allowlisted until 2027-01-09 in `scripts/audit-allowlist.json`
  (`check-audit` now also requires the package and severity to match what
  npm reports). Upstream
  has no fix yet (re-checked 2026-10-14). The weekly Audit workflow fails
  when npm can apply one or when the review date passes.

- **Three moderate advisories** (decode-uri-component through expo-router,
  uuid through the prebuild tooling, sprintf-js in Jest coverage) were
  reviewed in [issue 89](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-89):
  the app never reaches the vulnerable code. If your own code calls
  `query-string`'s `parse` on outside input, it is exposed.
- **ESLint 9 is deprecated on npm.** `eslint-plugin-react` and
  `eslint-plugin-react-native` don't accept ESLint 10 yet; the upgrade
  follows when they do.
- **Expo Go draws its own status bar on Android**, so in light mode the
  status bar is Expo Go's black strip. The native debug build shows the
  app's own status bar.
- **Maestro writes `MAESTRO_*` values into `e2e-results/`.** For signed-in
  flows, use a test account (documented in #55).
- **After `--remove-demo`, few e2e flows remain** (cold start, Back from
  Login, dark mode): the sign-in flows use the demo account. Add your own
  against a test account (Remove the Demo, Testing).
- **A signed-out deep link into a protected screen lands on Home** (the
  guard in Conventions, Navigation), and signing in stays on Home rather
  than opening the screen the link asked for.

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


