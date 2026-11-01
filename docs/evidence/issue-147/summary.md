# Issue 147: release v1.1.18 (tag on c9bf09afbc508c0eb2c87e0e6abaf358fce2fca5)

`main` since `v1.1.17`: the #146 advisory fixes (abda04e, 12cd706), the #144 README
(da948c1, 1a3015a) and App Config's CI-build links (c9bf09a). None of the advisories
reaches the app, so this release keeps adopters' Audit green rather than fixing an exposed
app. #134 (SDK 58) stays open: the store's Expo Go is still on SDK 57 (`pretag.txt`).

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Annotated tag `v1.1.18` on the verified commit, pushed. | `tag-and-release.txt`: the annotated tag (object 94b64e8) points at c9bf09a, which is `origin/main`. Evidence after the tag went only to the `evidence` branch. | PASS |
| 2 | Before tagging, the only other open issues are #134 and #146; 0/0/0 alerts. | `pretag.txt` (14:36Z): open #147, #146, #134; code-scanning, Dependabot and secret-scanning alerts 0/0/0 (the four Dependabot alerts were dismissed with reasons, issue-146 `dependabot-dismissals.txt`). Rechecked right before the tag (`tag-and-release.txt`): unchanged. | PASS |
| 3 | Clean clone passes every gate; follow-redirects 1.16.2 and node-forge 1.4.2; CI, Audit and CodeQL green. | `release-gates.txt` part 1 (clean clone of `main` at c9bf09a, Node 24.21.0 from nodejs.org, SHA256 checked): lint, type-check, format, docs:check (46 snippets), 708 tests, audit:check, doctor 21/21, web export, iOS and Android bundles all exit 0; `git status` clean. `pretag.txt`: `npm ls` shows follow-redirects 1.16.2 and node-forge 1.4.2; CI 41298074685, Audit 41298074723, CodeQL 41298074520 success on c9bf09a. | PASS |
| 4 | `init-project --remove-demo --remove-recipes` leaves nothing of the starter; every gate passes there. | `release-gates.txt` part 2: leftover `git grep` exit 1 (nothing found); every gate exits 0 (40 snippets, 579 tests). The 65 `git status` entries are init-project's own uncommitted changes, as in v1.1.17. | PASS |
| 5 | Flows pass on the code, every screenshot checked, retries reported. | See the table below. | PASS |
| 6 | Release published as latest after approval, with the notes the criterion asks for. | The maintainer approved on 2026-11-01 after reviewing the results and the draft. `tag-and-release.txt`: releases/latest = v1.1.18, published 14:53:35Z; the published notes are `release-notes.md` unchanged (changes since v1.1.17 and who should take them, the SDK 58 position, scope, non-goals, limitations). | PASS |
| 7 | Evidence and verdict recorded; #146 closed with the release; only #134 open. | This folder. #146 and #147 are closed after this commit. | PASS |

| Platform | Run | Result | Screenshots |
|----------|-----|--------|-------------|
| Android Expo Go | Actions 41304313223 | 7/7 plus dark mode, no retry | 15, `sheets/android-expogo-41304313223.png` |
| Android native debug | Actions 41304315522 | 7/7 plus dark mode, no retry | 15, `sheets/android-native-debug-41304315522.png` |
| iOS native | Actions 41304317751 | 7/7 plus dark mode **on the retry** (first attempt failed, see Notes) | 14, `sheets/ios-native-41304317751.png` |
| iOS Expo Go | local, `e2e-ios-expogo.txt` | 7/7 plus dark mode, no `E2E RETRY` | 14, `sheets/ios-expogo.png` |
| Web smoke | production export with the demo backends | passed (`web-smoke.log`) | 9, `sheets/web.png` |

All 67 screenshots were looked at, and each shows the expected screen.

## Notes

- **iOS native needed the retry.** The first attempt failed at the first step of the first
  flow: `subflows/open-app.yaml` never saw `tab-home`, and the app showed "Could not connect
  to development server" for `localhost:8081` (`ios-native-first-attempt.png`). Metro had
  started with an empty cache in CI mode. The workflow's whole-run retry passed all seven
  flows and dark mode. Nothing in this release touches the app's start or the e2e setup, so
  this is the runner flakiness the release notes already describe.
- **Android native debug: a LogBox toast on `01-home.png`** ("Can't perform a React state
  update on a component that hasn't mounted yet"), not in v1.1.17's screenshot of the same
  step. Metro's log (`android-native-logbox-warning.txt`) places it in
  `expo-router/build/fork/useLinking.native.js:127`: a `setState` when the initial URL
  resolves before the navigator mounts. It is a development-build warning about timing in
  Expo Router; this release changes no code that runs in the app. The flow passed.
- **Android emulator "Failed to find ColorBuffer"** messages (12 in Expo Go, 3 in native
  debug) are the emulator's, as in v1.1.17; every step and screenshot completed.
- **iOS Expo Go under load.** Another session's Flutter tests pushed load1 to 463. The run
  waited until load1 stayed below 20, then load1 reached up to 196 during the run
  (`load.log`); it still passed on the first attempt.
- **The 503 and `ERR_FAILED` console errors in the web smoke log** are intended (the smoke
  stubs a 503 for Explore's first request).
- **Tools.** `tools/` is v1.1.17's (issue-143) unchanged. Maestro 2.11.0 (SHA256 matches the
  workflow), JDK 17.0.21 (Temurin cask, expanded) and Node 24.21.0 were fetched into the
  scratch folder. iOS Expo Go ran in a clean detached worktree of `main` at c9bf09a.
- **My e2e wait loop** failed to read the run statuses and ran to its 150-minute deadline;
  the iOS run had finished green at 12:43Z. The results above come from the runs
  themselves.

Verdict: PASS.

Release: https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.18
