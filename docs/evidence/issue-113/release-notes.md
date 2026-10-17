The annotated tag `v1.1.13` is on commit `16cc770b80ece010a8ca658f1769cbf87a34db81`. It was
verified on 2026-10-17 in
[issue 113](https://github.com/koniz-dev/react-native-starter/issues/113)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-113)).

This release supersedes `v1.1.12`. It is a security fix to one CI workflow.
The app (`app/`, `features/`, `shared/`) is unchanged from v1.1.12.

## Security fix: cache poisoning in the iOS e2e workflow ([#112](https://github.com/koniz-dev/react-native-starter/issues/112))

`v1.1.12` added a manual **E2E (iOS, manual)** workflow
(`.github/workflows/e2e-ios.yml`). It had a `ref` input that checked out any
commit, branch, or tag and ran that code: `npm ci`, the native build, and the
flows. Because a run is dispatched on the default branch, that code ran with
the default branch's Actions cache token. It could therefore write poisoned
entries into the cache that `main`'s other workflows restore. CodeQL reported
this as three **high** alerts (`actions/cache-poisoning/poisonable-step`).
Turning off `setup-node`'s npm cache does not fix it, because any code in the
job can use the cache token.

**You are affected if** your repository has the `e2e-ios.yml` from v1.1.12.
Only people with write access can dispatch it, so an attack needs a maintainer
to run it with an untrusted `ref`, such as a fork PR's `refs/pull/N/head`.

**What to do:** copy `.github/workflows/e2e-ios.yml` from this release, or
delete the `ref` input and the `ref: ${{ inputs.ref }}` line from the checkout
step. The workflow now runs only the branch or tag it is dispatched on, and
that ref keeps its own cache scope. To test another branch, run the workflow
on it:

```sh
gh workflow run e2e-ios.yml --ref <branch>
```

`docs/testing.md` says the same. The flows, the app, and every other workflow
are unchanged. For everything else since v1.1.11 (the audit fixes, including
the iOS native `DocumentTitle` crash), see the
[v1.1.12 notes](https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.12).

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
