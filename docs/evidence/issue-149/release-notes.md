The annotated tag `v1.1.19` is on commit `28fac1a9f21ccbb5de9761d1525d7078b7498287`. It was
verified on 2026-11-06 and 2026-11-07 in [issue 149](https://github.com/koniz-dev/react-native-starter/issues/149)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-149)).

This release supersedes `v1.1.18`. It moves the starter to **Expo SDK 58** (React Native
0.88, React 19.3, Expo Router 58)
([#134](https://github.com/koniz-dev/react-native-starter/issues/134)). The store's Expo Go now
runs SDK 58, so the QR-code path on a phone needs this release: the store's Expo Go no longer
opens a project made from `v1.1.18` or earlier.

## Take this release if you started from an earlier one

Upgrade your project with Expo's guide (`npx expo install expo@^58.0.0 --fix`, then
`npx expo install --check` and `npx expo-doctor`). These are the starter-specific changes
that came with SDK 58; the commits are in [PR #135](https://github.com/koniz-dev/react-native-starter/pull/135).

- **Tests move to Jest 30 and React Native Testing Library 14**, because Expo Router 58
  needs RNTL 14 or later. `render`, `fireEvent` and the other APIs are async: await
  them. The `UNSAFE_` queries are gone. Testing describes the new APIs, and
  `jest.setup.ts` mocks the `AssetRegistry` that jest-expo 58 doesn't.
- **Expo Router 58's `Stack.Protected` stacks an extra Home.** A guarded screen now
  redirects with `replace('/')`. Without a fix, each sign-in and sign-out adds a Home to
  the stack, and a link to a group the guard refuses adds one too
  ([expo/expo#51916](https://github.com/expo/expo/issues/51916)). `useNoExtraHome` in
  `app/_layout.tsx` undoes that redirect. Copy it with `GUARDED_GROUPS`, and add any guarded
  group of your own to that map. After sign-in or sign-out, go Home with
  `router.dismissTo('/')` (Conventions, Navigation).
- **The root layout names its anchor.** Since Expo Router 58.0.26 a layout without
  `unstable_settings.anchor` no longer falls back to the group-named route, so
  `app/_layout.tsx` sets `anchor: '(tabs)'`.
- **iOS 26 headers are translucent.** Expo Router 58 gives stack headers the system's
  Liquid Glass appearance, and the screen runs under the header. Give a screen's
  `ScrollView` `contentInsetAdjustmentBehavior="automatic"` (Profile, Login and the
  showcase have it), or call `enableLegacyHeaderAppearance()` to keep the themed header
  (UI and Theming).
- **Tabs route only declared screens.** A file in `app/(tabs)/` needs its
  `<Tabs.Screen>` (Conventions).
- **Navigating to a tab from a screen pushed over the tabs** pushes a second copy of the
  tabs; use `router.dismissTo('/<tab>')`.
- **The web export is a single-page app explicitly** (`web.output: 'single'`). Its
  JavaScript is now split per route: when you redeploy, keep the previous deploy's
  `_expo/static/` files (Getting Started).
- **React Native 0.88's strict TypeScript API.** A `TextInput` ref is a
  `TextInputInstance`; the tab icons take the tab bar's colors by `focused`.
- **Audit allowlist.** `scripts/audit-allowlist.json` is empty: Expo 58.0.22 fixed the zod 3
  advisory under `@expo/cli`, and Expo Router 58 no longer uses `query-string`, so
  decode-uri-component is gone. Remove both entries if your copy still has them.

## What else changed

- The Android e2e workflow pins Expo Go 58.0.5, the store's version, by its SHA256.
- `actions/setup-java` 6.1.0 in the workflows.
- Conventions explains what the session guards do with links and replaces into a group the
  guard refuses, and how to navigate after sign-in and sign-out.

744 tests (611 after `init-project --remove-demo --remove-recipes`).

## Supported

| Item     | Supported                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Expo SDK | 58 (expo 58.0.23, React Native 0.88.1, React 19.3.0, Expo Router 58.0.30)                                       |
| Node     | 24.21.0 (`.nvmrc`, what CI uses); 24.3+ or 22.13+ also work (`engines`, not 23); npm with the committed `package-lock.json` |
| Android  | Expo Go, and a native debug build of the development variant (`npm run prebuild:development`, `assembleDebug`); release builds of a variant with `npm run build:<variant>:android` (not part of the verification) |
| iOS      | Expo Go on the iOS Simulator, and a native debug build of the development variant (`npm run prebuild:development`, `xcodebuild`; Xcode 26.4+); release builds are not part of the verification |
| Web      | Static export (`npm run export:web`, production variant)                                                        |

It was verified on:

- **GitHub Actions, Android:** an API 34 `google_apis` x86_64 emulator on
  `ubuntu-24.04`, in Expo Go 58.0.5 and in the native debug build. 7 flows plus
  dark mode in each, with no retry.
- **GitHub Actions, iOS:** the native debug build of the development variant on
  `macos-26-arm64` (Xcode 26.6), on the iPhone 17 simulator the workflow picks on the
  newest runtime (iOS 26). 7 flows plus dark mode, with no retry.
- **iOS Expo Go:** an iPhone 16 Plus simulator on iOS 18.6, Expo Go 58.0.7
  (Xcode 16.4, macOS 15.8.1). 7 flows plus dark mode, with no retry.
- **Web:** headless Google Chrome 156, on the production export.

All flows run against the local e2e mock. The flows ran on commit `cfdc124`, which has the
same tree as the tagged commit (the tag's commit only merges it into `main`).

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
  maintainers' machine has Xcode 16.4, and SDK 58 needs 26.4+.
  - A run takes about 40 minutes.
  - The iOS simulator there is flaky. #110 and #127 work around it with retries
    of link opens, keystrokes, the first tap after a launch, and, once, the whole
    run. A flow that keeps needing the retry is worth a look: read the first
    attempt's output.
  - In one of the #127 failures, a tap reached the app but no press followed.
    Its cause is not known.
  - The workflow tests only the branch or tag it runs on (#112). To test an
    older commit, run it on a branch at that commit that has the workflow file.
- **The component showcase is not verified on iOS 26.** No flow opens it; it has the
  same content inset as Profile and Login, which are.
- **`useNoExtraHome` works around Expo Router.** Remove it once Expo Router stops
  stacking a Home for `Stack.Protected` and drops links to a refused group, as Router 57
  did ([expo/expo#51916](https://github.com/expo/expo/issues/51916)). Known gaps:
  `await signIn()` followed by `router.push(X)` loses X (navigate right after, with
  `dismissTo` or `replace`), and a screen outside the groups pushed over Login or
  Profile, with `back()` in the same tick as the sign-in, leaves a second Home.
- **Links to a screen that needs sign-in, while signed out:** at launch the link lands on
  Home, and signing in stays there instead of opening the screen. While the app runs,
  the guard refuses the link and the user stays where they are; a `router.replace()`
  into the group lands on Home, since the replaced screen is gone (Conventions,
  Navigation).
- **Web keeps the token in memory**, so reloading the page signs you out. This
  is documented in API and Storage.
- **iOS's request timeout is an idle one:** a response that keeps trickling in
  doesn't time out there, while Android and the web limit the whole request
  (API and Storage).
- **Authenticated endpoints should not redirect.** On iOS a redirect drops the
  token (and on every platform a cross-origin one does), so such a 401 keeps
  the session and only fails the request. Redirects between an IDN host and
  another host are not fully recognized (#123). Request the final URL.
- **No allowlisted high advisories.** Moderate and low advisories are in build and
  test tooling only, and the app never reaches them: minimatch (Jest 30 coverage, Expo
  fingerprint, Expo CLI, typescript-eslint;
  [issue 148](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-148)),
  glob and deepmerge (Expo config and CLI, Jest; the app's own deepmerge is outside the
  affected range;
  [issue 146](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-146)).
  None has a fix within the versions the Expo SDK allows. The weekly Audit workflow
  fails when a high or critical advisory appears that isn't reviewed.
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
