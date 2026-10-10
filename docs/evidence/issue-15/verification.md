# Issue 15 verification — Expo SDK 57 migration

Verified on 2026-10-02 (Node v26.7.0, npm 11.x, macOS). This evidence was
created from a clean dependency tree using the committed lockfile.

## Dependency set

- Expo `57.0.26`, React Native `0.86.3`, React `19.2.3`, Expo Router
  `57.0.24`, and Jest Expo `57.0.5` are installed.
- `axios` was upgraded to `^1.20.0`; it is no longer among the production
  critical/high findings.
- Jest uses the React Native `0.86.3` preset and Hermes parser `0.36.0`.
  Version `0.36.1` declares but omits `dist/index.js`; pinning the compatible
  `0.36.0` artifact restores the Expo Babel transform without patching
  `node_modules`.

## Automated checks

| Command                                                                            | Result                                                                                             |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm ci --legacy-peer-deps`                                                        | PASS — 1,279 packages installed from the lockfile.                                                 |
| `npm run lint`                                                                     | PASS.                                                                                              |
| `npm run type-check`                                                               | PASS.                                                                                              |
| `npm run test:ci -- --runInBand`                                                   | PASS — 6 suites, 40 tests.                                                                         |
| `npm run format:check`                                                             | PASS — all matched files formatted.                                                                |
| `npx expo-doctor`                                                                  | PASS — 21/21 checks.                                                                               |
| `npx expo export --platform web --output-dir /tmp/react-native-starter-web-export` | PASS — bundled 1,058 modules and exported `index.html`, `metadata.json`, assets, and a web bundle. |

The initial default `npm ci` reports the Expo worklets optional-peer conflict;
the lockfile was created with npm's legacy peer resolver and reproducibly
installs with `npm ci --legacy-peer-deps`. This constraint is a follow-up item,
not a claim that a plain clean install works.

## Audit result and decision

`npm audit --omit=dev --json` after the axios update reports **1 critical and
6 high** findings (20 total findings across all severities). Remaining
critical/high package paths are transitive:

- `expo@57.0.26` -> `@expo/cli@57.0.27` -> `node-forge@1.4.0` and its
  `@expo/code-signing-certificates` path;
- Expo CLI/Metro resolver paths -> `picomatch`, `shell-quote`, and `ws`.

The audit tool's offered Expo remediation is an incompatible downgrade to Expo
`44.0.6`; it is not applied. **Decision: do not accept these findings as
release-ready risk.** They are tracked by [issue #16](https://github.com/koniz-dev/react-native-starter/issues/16), which requires supported remediation or an explicitly owned, time-bound risk decision. Therefore this migration does not establish MVP or maintenance readiness.

## Human UAT still required

Native interactions cannot be established by this environment. On both iOS and
Android, a human must install/launch the app, navigate tabs, sign in with the
documented demo credentials, log out and relaunch, toggle light/dark mode,
exercise keyboard input and safe areas/system bars, and verify an API failure
and retry state. Record device/simulator model and OS version with the result.

### iOS Expo Go runtime launch (2026-10-03)

Expo Go 57.0.9 was installed by Expo CLI on the available iPhone 16 Pro
simulator (iOS 18.6). Direct LAN and localhost connections failed from Expo Go,
but `npx expo start --ios --tunnel` connected and Metro reported:

```
Tunnel connected.
Tunnel ready.
iOS Bundled 11403ms index.ts (1486 modules)
```

The captured screen is [ios-simulator-expo-go-first-launch.png](ios-simulator-expo-go-first-launch.png).
It shows the React Native Paper home screen after the JavaScript bundle loaded.
Expo Go's first-launch Developer menu onboarding overlay is still on top and
requires tapping Continue; native tapping is not driveable in this environment.
Therefore this is evidence of iOS launch/bundle PASS only, not a substitute for
the remaining interaction UAT.

## iOS native-build preflight (2026-10-03)

An iPhone 16 Pro simulator running iOS 18.6 was available. To avoid modifying
the managed project's worktree, a temporary copy was generated with
`npx expo prebuild --platform ios --no-install`, followed by `pod install` and
an `xcodebuild` Debug build for that simulator. Prebuild and CocoaPods completed,
but the native build did **not** pass on the installed Xcode 16.4 (build 16F6):

```
[ExpoModulesJSI] Building framework slice for iphonesimulator...
xcodebuild: error: Could not resolve package dependencies:
  package 'apple' is using Swift tools version 6.2.0 but the installed version is 6.1.0
```

This is an unsupported toolchain, not a passing iOS UAT result. Expo's SDK
compatibility table requires Xcode 26.4+ for SDK 57, and lists iOS 16.4+ as the
minimum OS. The setup documentation now names those requirements so a clean
checkout does not claim that Xcode 16.4 can build the native project. Native UAT
remains pending on a supported Xcode/iOS simulator or device, plus Android.

Sources: [Expo SDK compatibility table](https://docs.expo.dev/versions/latest/)
and [Expo SDK 57 release notes](https://expo.dev/changelog/sdk-57).

## Closure (2026-10-04)

| Criterion                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                   | Result                                |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1. Supported Expo 57 dependency set                                                | Dependency set above.                                                                                                                                                                                                                                                                                                                                                      | PASS                                  |
| 2. `npx expo-doctor` without errors                                                | Automated checks above (21/21).                                                                                                                                                                                                                                                                                                                                            | PASS                                  |
| 3. Audit: zero critical/high, or documented non-upgradeable path and risk decision | The remaining Expo CLI transitive findings have a dependency path, owner, compensating controls, review cadence, and escalation triggers in [issue-16/audit-review.md](../issue-16/audit-review.md); #16 closed with that decision.                                                                                                                                        | PASS                                  |
| 4. iOS, Android, and web build/start                                               | Web export: PASS (above). Android: native debug build compiles with JDK 17 and runs ([native-android-build.md](native-android-build.md)); Expo Go runtime ([uat-android-emulator.md](uat-android-emulator.md)). iOS: Expo Go runtime on iOS 18.6 simulator ([uat-ios-simulator.md](uat-ios-simulator.md)); native iOS build not possible on this host, see decision below. | PASS with recorded iOS scope decision |
| 5. lint, type-check, test:ci, format:check                                         | Automated checks above; re-run green for #19 at e1c4bbe.                                                                                                                                                                                                                                                                                                                   | PASS                                  |

**iOS native build decision (owner, 2026-10-04):** Expo SDK 57's native iOS
project requires Xcode 26.4+ ([ios-xcode-16.4-build-failure.md](ios-xcode-16.4-build-failure.md)).
The verification host can't upgrade Xcode because of its macOS version. The
owner accepted Expo Go on the iOS simulator as the iOS start verification for
this issue. The Xcode 26.4+ requirement for native iOS builds is documented in
`docs/getting-started.md` and the README. A native iOS build remains
unverified and must be covered by the release-readiness issue on a host with
Xcode 26.4+ before iOS native support is claimed.

UX defects found during UAT are tracked separately and are not part of this
issue's criteria: #19 (closed), #20, #21, #22, #23, #24.
