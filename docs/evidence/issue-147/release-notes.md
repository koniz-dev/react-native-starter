The annotated tag `v1.1.18` is on commit `c9bf09afbc508c0eb2c87e0e6abaf358fce2fca5`. It was
verified on 2026-11-01 in [issue 147](https://github.com/koniz-dev/react-native-starter/issues/147)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-147)).

This release supersedes `v1.1.17`. It brings dependency advisory fixes from
[#146](https://github.com/koniz-dev/react-native-starter/issues/146) and a rewritten README. The Expo SDK 58 upgrade
([#134](https://github.com/koniz-dev/react-native-starter/issues/134)) ships once the store's Expo Go runs SDK 58.

## Take this release if you started from an earlier one

High advisories published on 2026-10-29 and 2026-10-30 make `npm run audit:check`, and so
the weekly Audit workflow, fail in projects made from `v1.1.17` or earlier. None of them
reaches the app's code ([#146](https://github.com/koniz-dev/react-native-starter/issues/146)), so this is about keeping your
Audit green, not about an exposed app. To take the fixes:

- **follow-redirects GHSA-mrwp-f3q8-3g9p and node-forge (five advisories).** Run
  `npm update follow-redirects node-forge`; check with `npm ls follow-redirects node-forge`
  that they are 1.16.2 and 1.4.2 or later. follow-redirects comes through axios but is used
  only by its Node adapter, which React Native and the web don't load; node-forge is used
  only by Expo CLI on your machine. In `scripts/audit-allowlist.json`, remove the
  node-forge `GHSA-86w9-cpqp-85rv` entry: node-forge 1.4.2 fixes it too.
- **decode-uri-component GHSA-qr28-fpjm-wq7f.** It comes through expo-router's
  `query-string` 7 and has no compatible fix (the patched 0.5.1 is ESM-only, and
  `query-string` 7 loads it with `require`). Expo Router never calls the affected code: it
  reads query strings with `URL.searchParams` and uses `query-string` only to build URLs.
  Add the entry from this release's `scripts/audit-allowlist.json` and re-review it for
  your project. If your own code calls `query-string`'s `parse` on outside input, you are
  exposed. Expo Router 58 no longer uses `query-string`.

## What else changed

- **The README is a landing page** ([#144](https://github.com/koniz-dev/react-native-starter/issues/144)): badges, screenshots of the demo
  on iOS, what you get, the tech stack, quick start, project structure and quality
  gates. `init-project` still replaces it with your app's README, so a project made from
  the template doesn't inherit it.
- **Getting Started's advice on moderate advisories** no longer names
  decode-uri-component as an example of exposed code.
- **App Config** points to Expo's guides for building on CI (EAS Workflows, build on CI)
  instead of a workflow of the starter's own
  ([#137](https://github.com/koniz-dev/react-native-starter/issues/137), not planned).

`README.md`, `docs/getting-started.md`, `docs/app-config.md`, `package-lock.json` and
`scripts/audit-allowlist.json` are the only files changed since `v1.1.17`. 708 tests (579
after `init-project --remove-demo --remove-recipes`).

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
  dark mode in each, with no retry.
- **GitHub Actions, iOS:** the native debug build of the development variant on
  `macos-26-arm64` (Xcode 26.6, iOS 26.5 SDK), on the iPhone 17 simulator the
  workflow picks on the newest runtime. 7 flows plus dark mode. The first attempt
  failed at the first flow: the app couldn't reach the Metro dev server
  ("Could not connect to development server") while Metro was still building its
  cache. The workflow's whole-run retry then passed every flow.
- **iOS Expo Go:** an iPhone 16 Plus simulator on iOS 18.6, Expo Go 57.0.9
  (Xcode 16.4, macOS 15.8.1). 7 flows plus dark mode, with no retry.
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
- **iOS's request timeout is an idle one:** a response that keeps trickling in
  doesn't time out there, while Android and the web limit the whole request
  (API and Storage).
- **Authenticated endpoints should not redirect.** On iOS a redirect drops the
  token (and on every platform a cross-origin one does), so such a 401 keeps
  the session and only fails the request. Redirects between an IDN host and
  another host are not fully recognized (#123). Request the final URL.
- **Two allowlisted high advisories**, neither reached by the app:
  - decode-uri-component, through expo-router's `query-string` 7 (in the bundles, but
    the affected function is never called; [issue 146](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-146);
    allowlisted until 2027-02-01);
  - zod 3, through `@expo/cli`'s dev server
    ([issue 142](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-142);
    allowlisted until 2027-01-25). The app's own zod is patched.

  Both are in `scripts/audit-allowlist.json`. The weekly Audit workflow fails
  when npm can apply a fix or when a review date passes.
- **Moderate and low advisories** are in build and test tooling only, and the app never
  reaches them: uuid (prebuild tooling, [issue 89](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-89)),
  glob and minimatch (Expo config plugins, Jest, Expo fingerprint) and deepmerge (Expo
  config; the app's own deepmerge is outside the affected range)
  ([issue 146](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-146)). None has a fix within the
  versions the Expo SDK allows.
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
- **Expo SDK 58 was released on 2026-09-29.** The starter stays on SDK 57,
  the SDK that the store's Expo Go runs (on 2026-11-01), so the QR-code path
  on a phone keeps working. The upgrade is ready on the `sdk-58` branch
  ([#134](https://github.com/koniz-dev/react-native-starter/issues/134)) and is merged once the store's Expo Go runs SDK 58, with no
  set date. If your Expo Go updates before the starter does, an iPhone can't open an
  SDK 57 project in it (simulators and emulators install the matching Expo Go).

## Maintenance mode

The starter is in maintenance mode. It accepts:

- security fixes;
- regressions;
- compatibility updates;
- docs corrections;
- narrow reliability fixes.

The starter targets the stable Expo SDK that the store's Expo Go runs. It has no
set schedule for moving to a new SDK; to ask for an upgrade, open an issue. To
report a vulnerability, use the repository's **Security** tab.
