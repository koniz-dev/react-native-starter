# Issue 124: release v1.1.14 (tag on ecf24d6263cb0dc1d136ac87e1e19a38b4babf2e)

This release ships the fixes from the sixth deep audit (#114–#119) and the three
confirmation audits that followed (#120–#123). The last confirmation audit found no
HIGH or MEDIUM.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | The annotated tag v1.1.14 is on the verified commit and pushed. | `tag-and-release.txt` | PASS |
| 2 | Before tagging, no issue was open and 0 code-scanning, Dependabot and secret-scanning alerts were open. | The check before the issue was opened showed 0 issues and 0/0/0 alerts. It was rerun before publishing (`actions-and-alerts.txt`). | PASS |
| 3 | A clean clone of the tag passes every gate. CI, Audit and CodeQL are green on the commit. | `release-gates.txt` part 1: every gate exits 0 (675 tests, 45 snippets, doctor 21/21, exports and bundles) and `git status` stays clean. `actions-and-alerts.txt`: CI and Audit pass, and both CodeQL analyses report `results=0`. | PASS |
| 4 | `init-project --remove-demo --remove-recipes` leaves nothing of the starter behind, and every gate passes there. | `release-gates.txt` part 2: every gate exits 0 (556 tests, 39 snippets), and the leftover `git grep` finds nothing (exit 1). | PASS |
| 5 | The flows pass on the tagged code, and every screenshot was checked. | See the table below. | PASS |
| 6 | The release v1.1.14 is published as latest. The notes say what to take, starting with the iOS redirect sign-out. | `tag-and-release.txt`, `release-notes.md` | PASS |
| 7 | Evidence and a verdict are recorded, and no issue is left open. | This folder. #124 is closed after this commit. | PASS |

| Platform | Run | Result |
|----------|-----|--------|
| Android Expo Go | Actions 39043252087 | 7/7 plus dark |
| Android native debug | Actions 39043254350 | 7/7 plus dark |
| iOS native | Actions 39043256528 | 7/7 plus dark |
| iOS Expo Go | local, `e2e-ios-expogo.txt` | 7/7 plus dark |
| Web smoke | production export | passed |

Every Actions run passed on its first attempt. The screenshots are in `sheets/`: 15
for Android Expo Go, 15 for Android native, 14 for iOS native, 14 for iOS Expo Go and
9 for web.

## Notes

- **Flow 07, Profile.** The screenshot shows the reloaded user, "Em Johnson", on all
  four device platforms. That is the check added in #117.
- **iOS native `04-password-focused.png`.** The Username label is caught mid-fade
  again, as explained in issue-111.
- **The local machine.** It had rebooted earlier in this session, so the simulator
  was booted again first. The iOS Expo Go run waited until the load average was below
  8.

Verdict: PASS.
