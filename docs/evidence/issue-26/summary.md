# Issue 26 verification — release readiness (MVP baseline)

Verified on 2026-10-10 against tag **`v1.0.0-mvp`** = commit
**`f3f4bd7bb2e8080c3c2b8fad0eef3cc8c9c8ac69`**. Scope, non-goals, and known
limitations: [release.md](release.md).

## Preparation (before the tag)

Commits on `main` before tagging, all `Refs #26`:

- `264d64d` e2e flows: a Back-from-Login flow (Android); a fresh iOS
  simulator's prompts ("Open in Expo Go?", the developer menu, "Save
  Password?"); the Keychain cleared with the app state on iOS; an `app`
  input on the Android e2e workflow for a native debug build.
- `f54f89e` `docs/getting-started.md` "Supported platforms".
- `f3f4bd7` e2e: retry the sign-in tap only when Login has not opened (a race
  seen on the native debug build).

The criteria were revised before starting (issue comment of 2026-10-10) to
match the raised gate in AGENTS.md. Found and filed: #44 (iOS keeps the
Keychain token across a reinstall; P2, known limitation).

## Acceptance criteria

| #   | Criterion                                                  | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Kind                  | Result |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ------ |
| 1   | Scope recorded, consistent with README and getting-started | [release.md](release.md); `docs/getting-started.md#supported-platforms` (in the tag), README links it                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | docs                  | PASS   |
| 2   | Immutable baseline, tagged, SHA recorded                   | Tag `v1.0.0-mvp` → `f3f4bd7`; every log below records that HEAD ([01](01-clone.log))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | automated             | PASS   |
| 3   | Clean setup from the docs                                  | Fresh `git clone` from GitHub, Node 24.21.0 / npm 11.19.0: [01 clone](01-clone.log), [02 npm ci](02-npm-ci.log), [03 cp .env.example .env](03-env.log), `npm start` [Metro log](17-npm-start-metro.log) and [transcript](18-start-transcript.log): web served at :8081 ([screenshot](setup/npm-start-web-home.png)) and the iOS Simulator in Expo Go ([screenshot](setup/npm-start-ios.png)). Commands, imports, routes and scripts in the docs: [12 docs:check](12-docs-check.log). Demo credentials `emilys` / `emilyspass`: signed in on Android, iOS, and web below. | automated + agent UAT | PASS   |
| 4   | Automated gates on the clean clone; CI green on the tag    | [04 lint](04-lint.log) (0 warnings), [05 type-check](05-type-check.log), [06 test:ci](06-test-ci.log) (26 suites, 205 tests, coverage 97.31 / 91.28 / 94.55 / 97.49), [07 format](07-format-check.log), [12 docs:check](12-docs-check.log) (37 snippets, recipe libraries installed), [08 audit:check](08-audit-check.log), [10 expo-doctor](10-expo-doctor.log) (21/21), [11 web export](11-expo-export-web.log); CI run 38031824812 on `f3f4bd7`: [log](16-github-actions-ci-38031824812.log)                                                                          | automated             | PASS   |
| 5   | Tests cover baseline services and failure paths            | [Test suites](#test-suites) below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | automated             | PASS   |
| 6   | Dependency audit                                           | [09](09-npm-audit-omit-dev.json): 0 critical, 45 high, 16 moderate, 0 low records from 5 advisories. The highs are two advisories (braces, node-forge), build-tool only, reviewed in [issue 41](../issue-41/audit-review.md), allowlisted until 2027-01-09, tracked in #43 ([08](08-audit-check.log))                                                                                                                                                                                                                                                                    | automated             | PASS   |
| 7   | Codebase meets the positioning                             | [Codebase checks](#codebase-checks) below; remove-demo on a copy: [13](13-remove-demo-npm-ci.log), [14](14-remove-demo.log), [15](15-remove-demo-gates.log) (lint, type-check, 22 suites / 191 tests, docs:check, web export)                                                                                                                                                                                                                                                                                                                                            | automated             | PASS   |
| 8   | Every seam: default, unit test, docs                       | [Seams](#seams) below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | automated             | PASS   |
| 9   | Docs and recipes checked against the code                  | [12](12-docs-check.log): 17 files, 37 TypeScript snippets compiled with `zustand@5`, `@reduxjs/toolkit@2`, `react-redux@9`, `jotai@3`, `@tanstack/react-query@5` installed; links, anchors, paths, scripts. Spot checks: the setup steps (criterion 3), remove-demo's result (criterion 7), web sign-out on reload as documented (web smoke)                                                                                                                                                                                                                             | automated + agent UAT | PASS   |
| 10  | Native and visual UAT per platform                         | [UAT](#native-and-visual-uat) below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | agent UAT             | PASS   |
| 11  | Evidence and verdict                                       | This folder; the closing comment separates automated from agent-driven UAT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | —                     | PASS   |

"Agent UAT" means driven by the agent on a simulator, an emulator, or a
headless browser, with every screenshot opened and checked. It is not a
human's judgment of visual polish or a physical-device run; see
[Left for the owner](#left-for-the-owner).

## Test suites

[19](19-test-suites.log) (`jest --json` on the clean clone): 26 suites, 205
tests, all passing.

| Area               | Suites (tests)                                                                                                                          | Covers                                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HTTP client        | `shared/http/httpClient` (21), `shared/http/api` (16)                                                                                   | base URL and timeout, `timeout` / `network` / `server` / HTTP error mapping, 401 clears the session and emits session-expired, one refresh then retry, token sent only to trusted origins (with or without default port), no cookies |
| Config             | `shared/config/env` (13), `app/configError` (1), `app/appConfig` (8)                                                                    | validation of every variable, startup error screen, variants, IDs, splash                                                                                                                                                            |
| Auth and session   | `shared/session/authService` (12), `shared/session/tokenStore` (10), `app/sessionRoutes` (9), `features/demo-auth/dummyJsonAdapter` (4) | login success/failure, not-configured adapter, protected storage unavailable, logout, no cookies, SecureStore on native and memory on web, restore on cold start, protected group guard, 401 sign-out, refresh failure               |
| Storage            | `shared/storage/storage` (7)                                                                                                            | round trip, missing key, failures logged and rethrown or null                                                                                                                                                                        |
| `useFetch`         | `shared/lib/useFetch` (7), `features/demo-todos/TodosScreen` (2)                                                                        | abort on unmount / deps change / refetch, stale responses ignored, typed `ApiError`, effect re-run; loading, error, Retry, list                                                                                                      |
| Routing            | `app/initialRoute` (4), `app/sessionRoutes`                                                                                             | `/` opens Home, `/login`, Back from a deep-linked `/login` returns Home, protected screen back button                                                                                                                                |
| Theming            | `app/tabBarTheme` (4), `app/statusBar` (2), `shared/ui/theme` (19)                                                                      | tab bar colors from the theme in light and dark, status bar icon style per scheme, palette tokens and contrast                                                                                                                       |
| Errors and logging | `shared/ui/ErrorBoundary` (11), `shared/lib/logger` (19)                                                                                | root and route fallbacks, "Try again" / "Go home", reports to the reporter seam; levels, redaction                                                                                                                                   |
| Login form         | `features/auth/LoginScreen` (8)                                                                                                         | demo credentials sign in, request error shown, validation, next key moves to the password, the password's return key submits, keyboard-avoiding container                                                                            |
| Seams              | `shared/integrations/seams` (7), `i18n` (4), `screenTracking` (1)                                                                       | see [Seams](#seams)                                                                                                                                                                                                                  |
| Screens            | `features/home/HomeScreen` (7), `shared/ui/LoadingScreen` (3), demo hint (2), showcase (4)                                              | session card states, sign in / log out actions                                                                                                                                                                                       |

## Codebase checks

| Check                                              | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint, zero warnings                                | `eslint . --max-warnings 0` ([04](04-lint.log))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| One theming system, no dead code                   | Theme: `shared/ui/theme.ts` only (#35). [20 knip](20-knip.log) triage: the 5 "unused files" are run by Maestro (`.maestro/scripts/set-api-mode.js`), `scripts/e2e/run.sh` (`mock-api.js`) or are evidence scripts; `react-native-worklets` is a peer dependency of `expo-router` and reanimated; `expo-updates` is knip's Expo-plugin default (`app.config.ts` has no `updates` key). The unused exports are public types and seam APIs for adopters, helpers `jest.setup.ts` loads with `requireActual` (knip doesn't follow it: `getColorScheme`, `secureStoreModule`), and values used inside their own module. No unused component, hook, or utility. |
| Demo isolated                                      | `npm run remove-demo` on a copy: [14](14-remove-demo.log) removes 3 features, 2 routes, their tests, and the marked blocks; [15](15-remove-demo-gates.log) lint, type-check, test:ci (22 suites / 191 tests, coverage 97.47 / 90.93 / 95.08 / 97.68), docs:check (demo-removed mode, 32 snippets), web export pass                                                                                                                                                                                                                                                                                                                                        |
| No hard-coded environment values                   | No `process.env` and no URL outside `shared/config/` in `app/`, `features/`, `shared/` (only a docs link in a comment in `features/demo-auth/dummyJsonAdapter.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| No hand-written type shims                         | No `declare module` and no `.d.ts` outside generated Expo types                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Runs with `.env.example` only; no credentialed SDK | The clean clone used `cp .env.example .env` and nothing else; the dependency list has no account- or key-based SDK (seams have no-op / console defaults)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Seams

| Seam                         | Default                                                                                    | Unit test of the default                                   | Plug-in docs                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Auth backend (`AuthAdapter`) | not configured: sign-in reports "Sign-in is not configured" (the demo registers DummyJSON) | `authService` "reports that sign-in is not configured"     | [Connect Your Backend](../../connect-your-backend.md#2-sign-in-write-an-authadapter) |
| Token storage (`TokenStore`) | SecureStore on native, memory on web                                                       | `tokenStore` (10)                                          | [API and Storage](../../api-and-storage.md#token-store)                              |
| Error reporting              | console reporter through the logger                                                        | `ErrorBoundary`, `logger`                                  | [Error Reporting](../../error-reporting.md#plugging-in-a-provider)                   |
| Analytics                    | debug log only                                                                             | `seams` "defaults to debug logging and sends nothing else" | [Plug In a Provider](../../plug-in-a-provider.md#analytics)                          |
| Feature flags                | static values in `shared/config/featureFlags.ts`                                           | `seams` "defaults to the static values"                    | [Plug In a Provider](../../plug-in-a-provider.md#feature-flags)                      |
| Push notifications           | not configured                                                                             | `seams` "reports push as not configured by default"        | [Plug In a Provider](../../plug-in-a-provider.md#push-notifications)                 |
| OTA updates                  | never finds an update                                                                      | `seams` "never finds an update by default"                 | [Plug In a Provider](../../plug-in-a-provider.md#ota-updates)                        |
| i18n                         | English strings (`shared/i18n/en.ts`)                                                      | `i18n` (4)                                                 | [Plug In a Provider](../../plug-in-a-provider.md#i18n)                               |

## Native and visual UAT

All on the tagged commit with the [Maestro flows](../../testing.md#end-to-end-flows-maestro)
(`.maestro/`). Each screenshot below was opened and checked.

| Platform                    | Device / OS                                                                                              | Run                                                                                                                                                                                                                                                                                          | Result          |
| --------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Android, Expo Go            | Emulator API 34 `google_apis` x86_64, GitHub Actions run 38031826754 on `f3f4bd7`                        | [maestro.log](android-expo-go/maestro.log), [report.xml](android-expo-go/report.xml) `tests="6" failures="0"`, [dark](android-expo-go/maestro-dark.log), [run log](android-expo-go/github-actions-run-38031826754.log), [screenshots](android-expo-go/screenshots/)                          | PASS 6/6 + dark |
| Android, native debug build | Same emulator; `prebuild:development` + `assembleDebug` (BUILD SUCCESSFUL), run 38031825140 on `f3f4bd7` | [maestro.log](android-native-debug/maestro.log), [report.xml](android-native-debug/report.xml) `tests="6" failures="0"`, [dark](android-native-debug/maestro-dark.log), [run log](android-native-debug/github-actions-run-38031825140.log), [screenshots](android-native-debug/screenshots/) | PASS 6/6 + dark |
| iOS, Expo Go                | iPhone 16 Plus simulator, iOS 18.6, Expo Go 57.0.9, run from the clean clone                             | [maestro.log](ios-expo-go/maestro.log), [report.xml](ios-expo-go/report.xml) `tests="5" failures="0"`, [dark](ios-expo-go/maestro-dark.log), [screenshots](ios-expo-go/screenshots/)                                                                                                         | PASS 5/5 + dark |
| iOS, Back from Login        | Same simulator, XCUITest left-edge swipe (issue 19's runner)                                             | [Login](ios-back/ios-01-login.png) → [Home](ios-back/ios-02-after-edge-swipe.png), [xcuitest log](ios-back/xcuitest-edge-swipe.log)                                                                                                                                                          | PASS            |
| Web                         | Static export of the clean clone, Chrome 154 headless, 430×900                                           | [web-smoke.log](web/web-smoke.log), [script](web/web-smoke.js), [screenshots](web/)                                                                                                                                                                                                          | PASS            |

What the screenshots show, per gate item:

- **Install / launch, cold start Home**: `01-home` (signed out, Home tab) on
  every platform; `setup/npm-start-ios.png`.
- **Back from Login returns Home**: Android `06-login` → `06-back-home`; iOS
  edge swipe above; web `goBack()` from `/login` to `/` (log).
- **Tabs**: `02-explore-tab`.
- **Sign in, relaunch, log out, relaunch**: `03-signed-in`,
  `03-relaunch-signed-in` ("Signed in as Emily Johnson" after the app was
  stopped and relaunched), `03-relaunch-signed-out` ("Not signed in" after
  logout and relaunch). Web: signed in, reload signs out (documented), sign
  in again, log out.
- **Keyboard**: `04-password-focused` (the username's return key moved focus
  to Password); the password's return key then submitted and signed in.
  With the software keyboard up
  ([ios-keyboard/ios-login-keyboard-open.png](ios-keyboard/ios-login-keyboard-open.png),
  a `simctl` screenshot on the tag; Maestro's screenshots leave the keyboard
  out), Password is focused, Sign In stays visible above the keyboard, and
  the return key reads "go".
- **Safe areas and system bars**: content clears the status bar, notch /
  Dynamic Island, and home indicator in every iOS screenshot; Android native
  build shows dark status-bar icons on the light theme and light icons in
  dark mode. In Expo Go on Android the light-mode status bar is Expo Go's
  black strip (known limitation).
- **Light / dark theming incl. tab bar**: `dark-home`, `dark-explore` against
  the light screenshots; web `web-06`, `web-07`.
- **API failure and Retry**: `05-explore-error` ("Error / Service
  unavailable" from a 503) → `05-explore-after-retry` ("Todos (10)").
- **No crash on relaunch**: flow 03 relaunches twice; flows 02 and 05
  relaunch without clearing state; all reach Home.

## Left for the owner

Agent-driven UAT covers every item above. Not covered, and outside what the
agent may judge (CLAUDE.md "Acceptance verification"):

1. A human look at the screenshots in this folder for visual polish
   (spacing, contrast, dark-mode aesthetics).
2. Optional: one run on a physical Android or iOS device in Expo Go (sign in,
   relaunch, log out), since the advertised platforms were verified on a
   simulator and an emulator only.

## Notes

- **iOS runs that failed under host load.** Two earlier iOS runs on the tag
  ([run1](ios-load-failures/run1/), [run2](ios-load-failures/run2/)) failed in
  `openLink` with `NSPOSIXErrorDomain code=60` (timed out) while an unrelated
  workload held the host's load average at 180–360. With the load back under
  10 the same commit passed 5/5 without changes.
- **iOS harness fixes** (in `264d64d`) came from a fresh simulator: Expo Go
  was not installed (installed from the URL in Expo's versions API, as
  `npx expo start` does), the hardware keyboard was connected, and iOS
  showed "Open in Expo Go?", the developer menu, and "Save Password?". The
  Keychain finding became #44.
- **Maestro's swipe** does not trigger the iOS edge-back gesture (four
  variants tried), while the XCUITest drag does; `06-login-back` is tagged
  `android-only`.
- Node 24.21.0 was downloaded from nodejs.org (checksum checked against
  `SHASUMS256.txt`) for the clean clone; the host's own Node is 26.7.
- `npm ci` warns that `fsevents` (optional, macOS file watching) has an
  install script not approved by npm 11's `allowScripts`; it ships a
  prebuilt binary and nothing depends on the script.
