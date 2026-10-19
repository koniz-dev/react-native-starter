# Issue 133: release v1.1.16 (tag on 14033fbaa048a34cfa4ee327b4c9017e24607fb0)

This release ships the fixes from the eighth deep audit (#129–#132), whose confirmation
round (with mutation testing of the new tests) found no HIGH or MEDIUM.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | The annotated tag v1.1.16 is on the verified commit and pushed. | `tag-and-release.txt`: the tag points at 14033fb, which is `origin/main`. | PASS |
| 2 | Before tagging, no other issue was open and 0 code-scanning, Dependabot and secret-scanning alerts were open. | `pretag.txt`: at 15:33:02Z only #133 was open and 0/0/0 alerts. Rerun after publishing (`actions-and-alerts.txt`). | PASS |
| 3 | A clean clone passes every gate. CI, Audit and CodeQL are green on the commit. | `release-gates.txt` part 1 (clean clone of `main` at 14033fb, before the tag was made on the same commit): every gate exits 0 (708 tests, 46 snippets, audit:check, doctor 21/21, web export, iOS and Android bundles), and `git status` stays clean. `actions-and-alerts.txt`: CI and Audit pass, and both CodeQL analyses report `results=0`. | PASS |
| 4 | `init-project --remove-demo --remove-recipes` leaves nothing of the starter behind, and every gate passes there. | `release-gates.txt` part 2: every gate exits 0 (579 tests, 40 snippets), and the leftover `git grep` finds nothing (exit 1). The 65 `git status` entries are init-project's own uncommitted changes, as in v1.1.15. | PASS |
| 5 | The flows pass on the tagged code, every screenshot was checked, and the iOS retry is reported. | See the table below. | PASS |
| 6 | The release v1.1.16 is published as latest. The notes say what to take, starting with the Android timeout fix and the OTA environment note. | `tag-and-release.txt` (latest = v1.1.16), `release-notes.md` | PASS |
| 7 | Evidence and a verdict are recorded, and no issue is left open. | This folder. #133 is closed after this commit. | PASS |

| Platform | Run | Result |
|----------|-----|--------|
| Android Expo Go | Actions 39270372940 | 7/7 plus dark mode, no retry |
| Android native debug | Actions 39270380227 | 7/7 plus dark mode, no retry |
| iOS native | Actions 39270385247 | 7/7 plus dark mode, no `E2E RETRY` |
| iOS Expo Go | local, `e2e-ios-expogo.txt` | 7/7 plus dark mode, no `E2E RETRY` |
| Web smoke | production export | passed (`web-smoke.log`) |

Every run passed on its first attempt (`e2e-actions.txt`, `e2e-ios-expogo.txt`). The screenshots are in `sheets/`:

| Platform | Screenshots |
|----------|-------------|
| Android Expo Go | 15 |
| Android native | 15 |
| iOS native | 14 |
| iOS Expo Go | 14 |
| Web | 9 |

All 67 were looked at.

## Notes

- **Flow 07, Profile.** The screenshot shows the reloaded user, "Em Johnson", on all four
  device platforms.
- **Known in the screenshots:** iOS native `04-password-focused.png` catches the Username
  label mid-fade (issue-111). Android Expo Go shows Expo Go's black status bar (a known
  limitation). The gear button on iOS Expo Go is Expo Go's own developer-tools overlay.
- **The 503 console errors in the web smoke log** are intended: the smoke stubs a 503 for
  Explore's first request.
- **Gates on a branch clone.** `tools/gates.sh` is v1.1.15's script with one change: it
  removes each clone's `node_modules` after its part, because the disk had about 5 GB
  free. It ran on a clean clone of `main` at 14033fb, the commit the tag was then made
  on, so the tag was created only after the gates had passed.
- **iOS Expo Go** ran in the maintainer checkout at 14033fb with a clean tree (not a third
  clone, for disk space). Maestro 2.11.0 (SHA256 matches the workflow) and JDK 17 were
  fetched again into the scratch folder.
- **Expo SDK 58** was released on 2026-09-29. Under the support policy the starter moves
  to it within about 4 weeks, so by about 2026-10-27; the release notes say so.

Verdict: PASS.

Release: https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.16
