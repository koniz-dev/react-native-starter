The annotated tag `v1.1.15` is on commit `521a8535252ae7414d5636512aef5934f353297f`. It was
verified on 2026-10-18 in [issue 128](https://github.com/koniz-dev/react-native-starter/issues/128)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-128)).

This release supersedes `v1.1.14`. It contains the fixes from a seventh deep audit
([#125](https://github.com/koniz-dev/react-native-starter/issues/125), [#126](https://github.com/koniz-dev/react-native-starter/issues/126)). A confirmation audit of those fixes found no
HIGH or MEDIUM issue. It also handles the iOS e2e flakes found while verifying them
([#127](https://github.com/koniz-dev/react-native-starter/issues/127)).

## Take this release if you started from an earlier one

- **If you copied the adapter example from Connect Your Backend and your backend
  doesn't rotate refresh tokens, take the new `refresh`
  ([#125](https://github.com/koniz-dev/react-native-starter/issues/125)).**
  - This covers Cognito, Django SimpleJWT by default, and Auth0 or Keycloak
    without rotation.
  - The old example required a `refresh_token` in every refresh response. A
    backend that returns only a new access token made the refresh fail, so the
    user was signed out at the first access-token expiry.
  - The new `refresh` keeps the stored refresh token when the response has none.
- **If you copied the analytics test from Testing, add its `waitFor`
  ([#125](https://github.com/koniz-dev/react-native-starter/issues/125)).** Screen views are reported a tick after
  navigation, so the old example failed on every run. Jest now runs the example
  from the page, so it can't go stale again.
- **A link from a public screen to a signed-in one
  ([#125](https://github.com/koniz-dev/react-native-starter/issues/125)).** For a signed-out user, `router.navigate`
  to a screen in `(app)` does nothing: no screen, no error. Conventions now shows
  a link that checks the session and opens Login instead.
- **"Go home" on an error screen ([#126](https://github.com/koniz-dev/react-native-starter/issues/126)).** From a screen
  above the tabs, such as Profile or Login, it stacked a second Home, so Back
  showed Home again. It now returns to the Home below. To take this fix, copy
  `goHome` in `shared/ui/ErrorBoundary.tsx`.
- **OAuth2 error messages ([#126](https://github.com/koniz-dev/react-native-starter/issues/126)).** For a wrong password at
  an OAuth2 token endpoint, Login showed the code (`invalid_grant`). It now shows
  the `error_description`, such as Keycloak's "Invalid user credentials". To take
  this fix, copy `serverMessage` in `shared/http/apiError.ts`.

## What else changed

- **Tests ([#126](https://github.com/koniz-dev/react-native-starter/issues/126)).**
  - The web case of the redirect check now actually signs in. Before, it passed
    with no session at all.
  - The SecureStore mock rejects a value that isn't a string, as the module does.
  - Two refresh races are covered: one that succeeds after sign-out and sign-in,
    and one with a backend that doesn't rotate refresh tokens.
  - init-project's README escaping is tested.
- **remove-demo ([#126](https://github.com/koniz-dev/react-native-starter/issues/126)).** In a project that isn't a git
  repository, such as one downloaded as a ZIP, it says it can't check for changes
  or undo a failure, so keep a copy.
- **E2E on iOS ([#127](https://github.com/koniz-dev/react-native-starter/issues/127)).**
  - The iOS simulator and its XCTest driver fail a flow now and then on a busy
    runner. Three causes showed up: a tap that never arrives, a tap without a
    press, and a driver that becomes unreachable.
  - The first tap after a launch is tapped again if its effect doesn't appear
    (`.maestro/subflows/tap-after-launch.yaml`).
  - After a failure on iOS, `run.sh` runs the flows once more and prints
    `E2E RETRY`, keeping both attempts' output. A flow that fails twice still
    fails the run.
- **Docs ([#125](https://github.com/koniz-dev/react-native-starter/issues/125)).**
  - Getting Started: `npm ci`'s vulnerability line, and a warning against
    `npm audit fix --force`.
  - Connect Your Backend: "same origin" instead of "same server", and the
    refresh-token reuse grace interval.
  - API and Storage: answer rejections that aren't about the token with 400, 403
    or 422, not 401.
  - App Config: local builds take `APP_BUILD_NUMBER` at prebuild, and local
    Android release builds use the debug key.
  - Remove the Demo: a `.env` copied before remove-demo still has the demo's
    switch; copy it from `.env.example` again.
  - Conventions: a new tab needs a `Tabs.Screen` entry.
  - Testing: e2e against your own backend through secrets, and uploaded
    artifacts on a public repo are public.
- 684 tests (564 after `init-project --remove-demo --remove-recipes`).

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
  with the native debug build. 7 flows plus dark mode. Every flow passed on the first attempt; the retry wasn't needed.
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
  maintainers' machine has Xcode 16.4, and SDK 57 needs 26.4+.
  - A run takes about 40 minutes.
  - The iOS simulator there is flaky. #110 and #127 work around it with retries
    of link opens, keystrokes, the first tap after a launch, and, once, the whole
    run. A flow that keeps needing the retry is worth a look: read the first
    attempt's output.
  - In one of the #127 failures, a tap reached the app but no press followed.
    Its cause is not known.
  - The workflow tests only the branch or tag it runs on (#112). To test an
    older commit, run it on a branch at that commit that has the workflow file.
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
