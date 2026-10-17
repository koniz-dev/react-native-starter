The annotated tag `v1.1.14` is on commit `ecf24d6263cb0dc1d136ac87e1e19a38b4babf2e`. It was
verified on 2026-10-17 in [issue 124](https://github.com/koniz-dev/react-native-starter/issues/124)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-124)).

This release supersedes `v1.1.13`. It contains the fixes from a sixth deep audit of
every tracked file ([#114](https://github.com/koniz-dev/react-native-starter/issues/114)–[#119](https://github.com/koniz-dev/react-native-starter/issues/119)). Three confirmation audits
followed. The first two found problems in those fixes, which were fixed in
[#120](https://github.com/koniz-dev/react-native-starter/issues/120)–[#123](https://github.com/koniz-dev/react-native-starter/issues/123), and the third found no HIGH or MEDIUM issue.

## Take this release if you started from an earlier one

- **On iOS, a redirected authenticated request no longer signs the user out
  ([#114](https://github.com/koniz-dev/react-native-starter/issues/114), [#120](https://github.com/koniz-dev/react-native-starter/issues/120), [#123](https://github.com/koniz-dev/react-native-starter/issues/123)).**
  - iOS drops the `Authorization` header when it follows a redirect, even one to
    the same origin. Every platform drops it when a redirect goes to another
    origin. The 401 that comes back was treated as an expired session, so the
    user was signed out. A backend that redirects `/notes` to `/notes/` is a
    common example.
  - `shared/http/httpClient.ts` now keeps the session for a 401 after a redirect
    that dropped the token. It compares origins on every platform, and paths on
    iOS, the way iOS reports them.
  - A request also keeps the session it started in if the user signs out and back
    in while its token is being read.
  - To take this fix, copy `shared/http/httpClient.ts`.
- **If you copied the adapter example from Connect Your Backend, compare it with
  the new one ([#114](https://github.com/koniz-dev/react-native-starter/issues/114), [#120](https://github.com/koniz-dev/react-native-starter/issues/120), [#123](https://github.com/koniz-dev/react-native-starter/issues/123)).**
  - A locked Keychain during a refresh no longer signs the user out, and logout
    still clears the refresh token while the Keychain is locked.
  - It counts sign-ins and sign-outs, so a slow logout, a late refresh, or a
    refresh failure never deletes or keeps the wrong session's refresh token.
  - It revokes a rotated token that a refresh stored during sign-out.
- **If you copied the analytics recipe ([#116](https://github.com/koniz-dev/react-native-starter/issues/116)), copy the new
  `useAnalyticsIdentity`.** The old one called `identify(null)` on every launch
  that started signed out. With PostHog, that runs `reset()`, so each such launch
  counted as a new anonymous user.
- **Logger ([#116](https://github.com/koniz-dev/react-native-starter/issues/116), [#120](https://github.com/koniz-dev/react-native-starter/issues/120), [#123](https://github.com/koniz-dev/react-native-starter/issues/123)).**
  - Short secret words (`auth`, `oauth`, `otp`, `refresh`) are matched against
    the words of a key. So `authCode`, `TOTPCode`, `OTPs`, `oauth_code` and
    `sessionKey` are redacted, while `author`, `rootPath`, `footprint` and
    `refreshing` are kept.
  - To take this fix, copy `shared/lib/logger.ts`.

## What else changed

- **remove-demo ([#115](https://github.com/koniz-dev/react-native-starter/issues/115)).** It refuses an unknown argument and has
  `--help`. Before, `-- --help` or a typo ran the full removal.
- **init-project ([#115](https://github.com/koniz-dev/react-native-starter/issues/115), [#121](https://github.com/koniz-dev/react-native-starter/issues/121), [#122](https://github.com/koniz-dev/react-native-starter/issues/122)).**
  - It accepts emoji, flags, and Persian or Indic names that use joiners.
  - It refuses invisible characters, such as bidi controls, zero-width spaces, a
    word joiner, or a soft hyphen.
  - It refuses an `exp+` scheme and an owner with spaces around it.
  - It writes the name into the README as literal Markdown.
- **Gates ([#115](https://github.com/koniz-dev/react-native-starter/issues/115), [#119](https://github.com/koniz-dev/react-native-starter/issues/119), [#121](https://github.com/koniz-dev/react-native-starter/issues/121)).**
  - Mutation testing found 16 gate and leak checks that no test covered, and each
    now has one. The covered checks are in check-docs (json, anchors, tsx,
    `requires`, a tsconfig error, an ESLint crash, a silent or killed tsc),
    remove-demo (malformed or stray markers, leftover demo imports), init-project
    (a failed remove-demo), and leak tests that could not fail before.
  - check-docs fails when tsc fails without output.
  - The lint rules normalize `@/…/../` imports and catch `globalThis.process`
    and `global.process`.
  - The expo-secure-store test mock now checks keys the way the real module does.
- **App config and audit ([#118](https://github.com/koniz-dev/react-native-starter/issues/118)).** `APP_BUILD_NUMBER` must be digits,
  at most 2100000000. audit:check lists advisories by severity.
- **E2E ([#117](https://github.com/koniz-dev/react-native-starter/issues/117), [#122](https://github.com/koniz-dev/react-native-starter/issues/122)).**
  - Flow 07 proves that Profile reloaded the user, because the mock answers with
    another name.
  - open-app leaves a loaded Home alone.
  - `run.sh` restores the device's own appearance and checks the backend's port.
  - `E2E_APP_URL` is explained: a native build sets it to its own scheme.
- **Docs.**
  - The Keychain accessibility choice.
  - A complete web cookie-session sketch.
  - iOS local-network ATS for release variants.
  - Android themed icons.
  - The Zustand persist race.
  - Moderate advisories in shipped packages.
- 675 tests (556 after `init-project --remove-demo --remove-recipes`).

## Supported

| Item     | Supported                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Expo SDK | 57 (expo 57.0.30, React Native 0.86.3, React 19.2.3, Expo Router 57.0.28)                                       |
| Node     | 24.21.0 (`.nvmrc`, what CI uses); 24.3+ or 22.13+ also work (`engines`, not 23); npm with the committed `package-lock.json` |
| Android  | Expo Go, and a native debug build of the development variant (`npm run prebuild:development`, `assembleDebug`); release builds of a variant with `npm run build:<variant>:android` (not part of the verification) |
| iOS      | Expo Go on the iOS Simulator, and a native debug build of the development variant (`npm run prebuild:development`, `xcodebuild`; Xcode 26.4+); release builds are not part of the verification |
| Web      | Static export (`npm run export:web`, production variant)                                                        |

It was verified on:

- **GitHub Actions, Android:** an API 34 `google_apis` x86_64 emulator on
  `ubuntu-24.04`, in Expo Go 57.0.9 and in the native debug build. 7 flows plus
  dark mode in each.
- **GitHub Actions, iOS:** an iPhone 17 simulator on iOS 26.5, on `macos-26`,
  with the native debug build. 7 flows plus dark mode.
- **iOS Expo Go:** an iPhone 16 Plus simulator on iOS 18.6, Expo Go 57.0.9
  (Xcode 16.4, macOS 15.8.1). 7 flows plus dark mode.
- **Web:** headless Google Chrome, on the production export.

All flows run against the local e2e mock.

## Non-goals

These are unchanged since v1.0.0:

- **A production backend.** DummyJSON and JSONPlaceholder are demo
  endpoints for you to replace.
- **App-store or EAS builds and submission.**
- **Real third-party providers.** Analytics, crash reporting, push,
  feature-flag, and OTA providers are out of scope; the starter provides only
  the seams and their defaults.
- **A state-management library.** The starter has recipes only;
  `init-project` removes them unless you pass `--keep-recipes`.
- **Landscape layouts and testing on physical devices.**

## Known limitations

- **iOS native is verified only on GitHub Actions** (`macos-26`): the
  maintainers' machine has Xcode 16.4, and SDK 57 needs 26.4+. A run takes
  about 40 minutes. The iOS simulator there is flaky in ways #110 works
  around (link-open timeouts, dropped keystrokes, a late "Save Password?"
  sheet). If a run fails, read its artifacts before you rerun it. It tests
  only the branch or tag it runs on (#112); to test an older commit, run it
  on a branch at that commit that has the workflow file.
- **Web keeps the token in memory**, so reloading the page signs you out. This
  is documented in API and Storage.
- **Authenticated endpoints should not redirect.** On iOS a redirect drops the
  token (and on every platform a cross-origin one does), so such a 401 keeps
  the session and only fails the request. Redirects between an IDN host and
  another host are not fully recognized (#123). Request the final URL.
- **Two allowlisted high advisories** are in build-time dependencies only:
  - node-forge, through `@expo/cli`;
  - braces, through Metro and Jest's `micromatch` (on this release npm reports
    only node-forge).

  They were reviewed in [issue 41](https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md)
  and are allowlisted until 2027-01-09 in `scripts/audit-allowlist.json`. The
  weekly Audit workflow fails when npm can apply a fix or when the review date
  passes.
- **Three moderate advisories** were reviewed in
  [issue 89](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-89):
  - decode-uri-component, through expo-router;
  - uuid, through the prebuild tooling;
  - sprintf-js, in Jest coverage.

  The app never reaches the vulnerable code. If your own code calls
  `query-string`'s `parse` on outside input, you are exposed.
- **ESLint 9 is deprecated on npm.** `eslint-plugin-react` and
  `eslint-plugin-react-native` don't accept ESLint 10 yet. The upgrade will
  follow when they do.
- **Expo Go draws its own status bar on Android**, so in light mode the status
  bar is Expo Go's black strip. The native debug build shows the app's own
  status bar.
- **Maestro writes `MAESTRO_*` values into `e2e-results/`.** For signed-in
  flows, use a test account (#55).
- **After `--remove-demo`, few e2e flows remain:** cold start, Back from Login,
  and dark mode. The sign-in subflows stay, so your own signed-in flows need
  only a test account (see Testing, "Writing a flow").
- **On Android in Expo Go, an upload sent the moment the image picker closes
  can fail once** with a network error; a second try succeeds. The root cause
  is not known (#97). If you upload right after picking, retry once on
  `network`.
- **A signed-out deep link to a protected screen lands on Home** (see the guard
  in Conventions, Navigation). Signing in stays on Home instead of opening the
  screen the link asked for.
- **Expo SDK 58 is close.** Under the support policy, the starter moves to SDK 58
  within about 4 weeks of its release.

## Maintenance mode

The starter is in maintenance mode. It accepts:

- security fixes;
- regressions;
- compatibility updates;
- docs corrections;
- narrow reliability fixes.

Only the latest Expo SDK is supported, and an upgrade follows within about 4
weeks of an Expo SDK release. To report a vulnerability, use the repository's
**Security** tab.
