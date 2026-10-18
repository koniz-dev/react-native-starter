# Issue 128: release v1.1.15 (tag on 521a8535252ae7414d5636512aef5934f353297f)

This release ships the fixes from the seventh deep audit (#125, #126), whose confirmation
audit found no HIGH or MEDIUM, and the iOS e2e retry (#127).

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | The annotated tag v1.1.15 is on the verified commit and pushed. | `tag-and-release.txt`: the tag points at 521a853, which is `origin/main`. | PASS |
| 2 | Before tagging, no issue was open and 0 code-scanning, Dependabot and secret-scanning alerts were open. | `pretag.txt`: the check at 10:42Z found only #128 open and 0/0/0 alerts. It was rerun after publishing (`actions-and-alerts.txt`). | PASS |
| 3 | A clean clone of the tag passes every gate. CI, Audit and CodeQL are green on the commit. | `release-gates.txt` part 1: every gate exits 0 (684 tests, 46 snippets, doctor 21/21, exports and bundles), and `git status` stays clean. `actions-and-alerts.txt`: CI and Audit pass, and both CodeQL analyses report `results=0`. | PASS |
| 4 | `init-project --remove-demo --remove-recipes` leaves nothing of the starter behind, and every gate passes there. | `release-gates.txt` part 2: every gate exits 0 (564 tests, 40 snippets), and the leftover `git grep` finds nothing (exit 1). The 65 `git status` entries are init-project's own uncommitted changes, as in v1.1.14. | PASS |
| 5 | The flows pass on the tagged code, every screenshot was checked, and the iOS retry is reported. | See the table below. | PASS |
| 6 | The release v1.1.15 is published as latest. The notes say what to take, starting with the adapter example for non-rotating backends. | `tag-and-release.txt`, `release-notes.md` | PASS |
| 7 | Evidence and a verdict are recorded, and no issue is left open. | This folder. #128 is closed after this commit. | PASS |

| Platform | Run | Result |
|----------|-----|--------|
| Android Expo Go | Actions 39120315573 | 7/7 plus dark mode |
| Android native debug | Actions 39120317873 | 7/7 plus dark mode |
| iOS native | Actions 39120320195 | 7/7 plus dark mode, no `E2E RETRY` |
| iOS Expo Go | local, `e2e-ios-expogo.txt` | 7/7 plus dark mode, no `E2E RETRY` |
| Web smoke | production export | passed (`web-smoke.log`) |

Every run passed on its first attempt. The screenshots are in `sheets/`:

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
- **Known in the screenshots:**
  - iOS native `04-password-focused.png` catches the Username label mid-fade, as
    explained in issue-111.
  - Android Expo Go shows Expo Go's black status bar, which is listed under known
    limitations.
- **The 503 console errors in the web smoke log** are intended: the smoke stubs a 503
  for Explore's first request.
- **Scratch tools.** The scratch folder had been purged again, so Maestro 2.11.0 (its
  SHA256 matches the workflow's) and JDK 17 were fetched again before the local iOS
  run. The local run started when the load average was 2.8.
- **Contact sheets.** On the first try, a filter meant to skip `-retry/` folders also
  dropped `05-explore-after-retry.png`, whose own name contains "retry". The sheets
  were rebuilt with all screenshots, and the counts match v1.1.14.

Verdict: PASS.
