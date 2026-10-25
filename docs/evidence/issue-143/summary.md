# Issue 143: release v1.1.17 (tag on 1ecec296f761ff98b0be8f8a5b61fbb09bd79f8b)

This is a security release. It ships only the zod fix from #142 (GHSA-mrhx-c7xc-m3w5, high),
within the Support Policy's 14 days (due 2026-11-08). #134 (SDK 58) and #137 stay open by the
maintainer's decision of 2026-10-25; the SDK 58 upgrade becomes the next release.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | The annotated tag v1.1.17 is on the verified commit and pushed. | `tag-and-release.txt`: the tag points at 1ecec29, which is `origin/main`. Evidence after the tag went only to the `evidence` branch. | PASS |
| 2 | Before tagging, the only other open issues were #134 and #137, and 0 code-scanning, Dependabot and secret-scanning alerts were open. | `pretag.txt`: at 12:03:23Z the open issues were #143, #142, #137 and #134, with 0/0/0 alerts. Rechecked right before the tag (0/0/0) and after publishing (`actions-and-alerts.txt`). | PASS |
| 3 | A clean clone passes every gate; the app's zod is 4.6.7; CI, Audit and CodeQL are green on the commit. | `release-gates.txt` part 1 (clean clone of `main` at 1ecec29, before the tag was made on the same commit): every gate exits 0 (708 tests, 46 snippets, audit:check, doctor, web export, iOS and Android bundles), and `git status` stays clean. `npm-ls-zod.txt`: zod 4.6.7, plus `@expo/cli`'s allowlisted zod 3.25.76. `actions-and-alerts.txt`: CI 40182489225 and Audit 40182489172 pass, and both CodeQL analyses report `results=0`. | PASS |
| 4 | `init-project --remove-demo --remove-recipes` leaves nothing of the starter behind, and every gate passes there. | `release-gates.txt` part 2: every gate exits 0 (579 tests, 40 snippets), and the leftover `git grep` finds nothing (exit 1). The 65 `git status` entries are init-project's own uncommitted changes, as in v1.1.16. | PASS |
| 5 | The flows pass on the tagged code, every screenshot was checked, and retries are reported. | See the table below. | PASS |
| 6 | The release v1.1.17 is published as latest after the maintainer's approval, with notes on the zod fix, who should take it, the SDK 58 plan, and the supported scope. | The maintainer approved on 2026-10-25 after reviewing the pre-tag results. `tag-and-release.txt` (latest = v1.1.17), `release-notes.md` (published unchanged). | PASS |
| 7 | Evidence and a verdict are recorded; #142 is closed with this release; only #134 and #137 stay open. | This folder. #142 and #143 are closed after this commit. | PASS |

| Platform | Run | Result |
|----------|-----|--------|
| Android Expo Go | Actions 40191398896 | 7/7 plus dark mode, no retry |
| Android native debug | Actions 40191401336 | 7/7 plus dark mode, no retry |
| iOS native | Actions 40191403612 | 7/7 plus dark mode, no `E2E RETRY` |
| iOS Expo Go | local, `e2e-ios-expogo.txt` | 7/7 plus dark mode, no `E2E RETRY` (run 3; see Notes) |
| Web smoke | production export | passed (`web-smoke.log`) |

The screenshots are in `sheets/`:

| Platform | Screenshots |
|----------|-------------|
| Android Expo Go | 15 |
| Android native | 15 |
| iOS native | 14 |
| iOS Expo Go | 14 |
| Web | 9 |

All 73 were looked at, and each shows the expected screen.

## Notes

- **iOS Expo Go took three runs.** Runs 1 and 2 failed, each including its built-in retry,
  while unrelated jobs on the host (Rust and Flutter builds) pushed load1 to about 100–150.
  Every failed flow stopped at the same step, before the app loaded: `subflows/open-app.yaml`
  `openLink`, "Simulator device failed to open exp://127.0.0.1:8081. Operation timed out"
  (code 60). Run 3, at load1 up to 23.91 (`load.log`), passed 7/7 plus dark mode on its
  first attempt. Nothing in the release touches navigation or the app's start, and the
  three Actions runs passed with no retry, so this is a host limit, not a regression.
- **Android native debug** logged "Failed to find ColorBuffer: 513" from the emulator while
  taking `dark-explore`; the step completed, and the screenshot is correct.
- **The 503 and `ERR_FAILED` console errors in the web smoke log** are intended: the smoke
  stubs a 503 for Explore's first request, as in v1.1.16.
- **Gates and tools.** `tools/` is v1.1.16's (issue-133) unchanged. iOS Expo Go ran in a
  worktree of `main` at 1ecec29 with a clean tree. Maestro 2.11.0 (SHA256 matches the
  workflow) and JDK 17 were fetched again into the scratch folder after macOS purged it.
- **Expo SDK 58.** On 2026-10-25 the store's Expo Go was still on SDK 57
  (`expoGoSdkVersion` 57.0.0). `release-notes.md` is the notes as published at 14:11Z, which
  said the starter moves within about 1 week of the store supporting SDK 58. Later that day
  the maintainer dropped every SDK schedule from the Support Policy (maintainers b944f26:
  the starter targets the stable SDK the store's Expo Go runs, with no date), and the
  published notes of v1.1.17 and v1.1.16 were edited to match: the SDK 58 bullet and the
  closing paragraph no longer promise a date.

Verdict: PASS.

Release: https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.17
