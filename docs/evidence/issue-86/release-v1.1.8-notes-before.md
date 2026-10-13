Tag `v1.1.8` (annotated) is on commit
`69afacb54b13db9850eda942420d79a386bf9b10`, verified on 2026-10-13 in
[issue 81](https://github.com/koniz-dev/react-native-starter/issues/81)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-81)).
It fixes everything a second review of `v1.1.7` found on 2026-10-13
(#76–#80); no issue is open.

## Take this release if you started from an earlier one

**Session races ([#76](https://github.com/koniz-dev/react-native-starter/issues/76)).**
These affect every earlier release. Work that starts in one session can
finish after the user signs out, or after another user signs in on the same
device. Copy `shared/http/httpClient.ts` and `shared/session/authService.ts`
(and `__tests__/shared/http/tokenSafety.test.ts`):

- A request sent with user A's token that gets a 401 after B signed in is no
  longer replayed with B's token (a `POST` would have run on B's account).
- A refresh that finishes after A signed out and B signed in no longer
  clears B's token and signs B out.
- A profile that loads after sign-out is no longer stored, or written over
  the next user's profile.
- A retry never carries an old `Authorization` header; a retry whose
  session ended before it was sent is canceled.
- A sign-in whose profile can't be stored leaves no token behind.

## What else changed

- **Template scripts ([#77](https://github.com/koniz-dev/react-native-starter/issues/77)):**
  - `remove-demo` checks every change before it touches a file, so a
    malformed marker changes nothing and names the file. It used to delete
    the demo, and itself, first.
  - `init-project` rejects a slug that is a dependency's name (`react`
    broke `npm run doctor`) and an option followed by a flag instead of a
    value. With `--force` after a hand-edited `APP` block, it also replaces
    the template's identity (the e2e workflow targeted the wrong app). After
    a failure on uncommitted changes it no longer suggests a command that
    discards them.
  - `audit:check` fails on an allowlist entry without an id, package,
    tracking link, or a `YYYY-MM-DD` `reviewBy`; such an entry never
    expired.
  - `docs:check` compiles indented snippets, and checks `.maestro/` and
    `public/` paths and source references into `docs/` subfolders.
  - The e2e runner stops when the Metro or mock port is already in use,
    instead of running the flows against your own `npm start`.
- **CI and build ([#78](https://github.com/koniz-dev/react-native-starter/issues/78)):**
  - Actions are pinned to their current majors (Node 24). Runs no longer
    carry the Node 20 deprecation warnings.
  - Dependabot proposes updates to the action pins once a month.
  - CI exports the web app with `npm run export:web`, the production
    variant.
  - Builds no longer ask for vibration or shared storage on Android
    (release variants also drop "draw over other apps"), or carry a Face ID
    prompt on iOS. See App Config, Permissions.
  - The native debug e2e build retries once after a failed download.
- **UI and tests ([#79](https://github.com/koniz-dev/react-native-starter/issues/79)):**
  - A double tap on Sign in or View profile opens one screen
    (`router.navigate`).
  - Errors on Login, Profile, and Explore are read out by VoiceOver on iOS
    (`useAnnouncement`) and from live regions on Android and the web.
  - Explore keeps its list while it reloads, and labels the button Reload
    or Retry. Errors that aren't server answers are logged.
  - The demo hint meets AA contrast.
  - Unused exports are removed, and tests now catch the surviving mutants
    the review found (409 tests).
  - The Back-from-Login flow taps Login's back button, so it runs on iOS
    too.
- **Docs ([#80](https://github.com/koniz-dev/react-native-starter/issues/80)):**
  - Errors are shown with `errorMessage(error)`, never `error.message`, in
    the text and in every example.
  - The no-adapter message, which refresh failures keep the session, and
    log redaction now match the code.
  - The e2e port variables are documented.

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
  allowlisted until 2027-01-09 in `scripts/audit-allowlist.json`. Upstream
  has no fix yet (re-checked 2026-10-13). The weekly Audit workflow fails
  when npm can apply one or when the review date passes.

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

