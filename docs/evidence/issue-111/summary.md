# Issue 111: release v1.1.12 (tag on cb566e4293f5b41f0021575e3491dbaab092c91f)

The release happened only after #101–#110 were closed; #111 was the only open issue.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Annotated tag v1.1.12 is on the verified commit and pushed. | `tag-and-release.txt` | PASS |
| 2 | A clean clone of the tag passes every gate, and CI and Audit are green on the commit. The clone used Node 24.21.0, `npm ci`, and the recipe libraries linked the way CI links them. The gates were lint, type-check, test:ci with thresholds (582 tests), format, docs:check (45 snippets), audit:check, doctor (21/21), a web export, and the iOS and Android bundles. | `release-gates.txt` part 1: every gate exits 0 and `git status` stays clean. `actions.txt`: CI and Audit succeed on cb566e4. | PASS |
| 3 | `init-project --remove-demo --remove-recipes` on a clean clone leaves no starter, demo, template, or recipe wording, markers, or template docs, and every gate passes (488 tests, 39 snippets). | `release-gates.txt` part 2: every gate exits 0. `git grep` for starter, demo, and recipe words outside tests and the lockfile finds nothing (exit 1). `docs/` holds only the app's pages, and `.maestro/subflows/` keeps open-app, open-login, sign-in, and type-username. | PASS |
| 4 | The flows pass on the tagged code, and every screenshot was checked. | See the flow table below. | PASS |
| 5 | Release v1.1.12 is published as latest. The notes cover the changes since v1.1.11, what earlier adopters should take (#101 first for iOS native builds, then the session and adapter fixes), the iOS native support now verified, the scope, non-goals, and known limitations. | `tag-and-release.txt`, `release-notes.md` | PASS |
| 6 | Evidence and a verdict are recorded, and no issue is left open. | This folder. #111 is closed after this commit. | PASS |

Flow results for criterion 4. Screenshots are in `sheets/`: 15 for Android Expo Go, 15 for Android native, 14 for iOS native, 14 for iOS Expo Go, and 9 for web.

| Platform | Where | Run | Result |
|----------|-------|-----|--------|
| Android Expo Go | Actions | 38937391551 | 7/7 plus dark mode |
| Android native debug | Actions | 38937395558, attempt 2 | 7/7 plus dark mode |
| iOS native debug | Actions (iPhone 17, iOS 26.5, macos-26) | 38937399956, attempt 2 | 7/7 plus dark mode |
| iOS Expo Go | Locally (iPhone 16 Plus, iOS 18.6, Expo Go 57.0.9) | `e2e-ios-expogo.txt` | 7/7 plus dark mode |
| Web smoke | Production export | `web-smoke.log` | Passed |

## Notes

- **First attempts on Actions.** Both failures were in the test harness and happened
  before the app ran a step; `actions.txt` records them, and only the failed jobs were
  rerun, on the same tag.
  - Android native debug: all 7 flows passed. In the dark-mode flow, Maestro then made
    no progress for 2 minutes and wrote no debug output.
  - iOS native: the Maestro driver didn't start within 10 minutes
    (`IOSDriverTimeoutException`). This runner flake was seen before, in #101.
- **iOS native `04-password-focused.png`: the Username label isn't visible.** The
  outline still shows the gap for the floating label, and three iOS native runs
  (`sheets/ios-native-04-label-fade.png`) show the same thing. The screenshot is taken
  right after the Return key moves focus to Password, so it catches the label in the
  middle of its fade. In the same state a few seconds later, iOS 26.5 native shows the
  label (`../issue-110/2-username-typed-e.png`), and so do iOS Expo Go and Android.
  The app has no defect here.
- **Web smoke export.** The gate script's web export uses placeholder URLs
  (`api.example.com`), so Retry has no backend to reach and the smoke test can't pass
  on it. The web smoke test ran on a second export of the tag that uses `.env.example`
  (demo backends), the same way as for v1.1.11. In `web-smoke.log`, the `ERR_FAILED`
  console error is expected: the script blocks the JS bundle on purpose to check the
  dark background before the app renders.

Verdict: PASS.
