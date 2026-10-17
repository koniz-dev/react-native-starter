# Issue 113: release v1.1.13 (tag on 16cc770b80ece010a8ca658f1769cbf87a34db81)

This release ships the #112 fix, the CodeQL cache-poisoning alerts in the iOS e2e
workflow, which v1.1.12 shipped with. Nothing in `app/`, `features/`, or `shared/`
changed since v1.1.12: only `.github/workflows/e2e-ios.yml` and `docs/testing.md`
changed.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Annotated tag v1.1.13 is on the verified commit and pushed. | `tag-and-release.txt` | PASS |
| 2 | Before tagging, no issue is open and 0 code-scanning, Dependabot, or secret-scanning alerts are open. | The check before the issue was opened found 0 issues and 0/0/0 alerts. It was rerun before publishing (`actions-and-alerts.txt`). | PASS |
| 3 | A clean clone of the tag passes every gate: lint, type-check, test:ci (582), format, docs:check (45 snippets), audit:check, doctor (21/21), the web export, and the iOS and Android bundles. CI, Audit, and CodeQL are green on the commit. | `release-gates.txt` part 1: every gate exits 0 and `git status` stays clean. `actions-and-alerts.txt`: CI and Audit succeeded, and both CodeQL analyses (actions, javascript-typescript) report `results=0`. | PASS |
| 4 | `init-project --remove-demo --remove-recipes` leaves nothing of the starter, and every gate passes there (488 tests, 39 snippets). | `release-gates.txt` part 2: every gate exits 0, and the leftover `git grep` finds nothing (exit 1). | PASS |
| 5 | The flows pass on the tagged code, and every screenshot was checked. | See the flow table below. | PASS |
| 6 | Release v1.1.13 is published as latest. The security fix comes first in the notes: what it was, who is affected, and what to copy. | `tag-and-release.txt`, `release-notes.md` | PASS |
| 7 | Evidence and a verdict are recorded, and no issue is left open. | This folder. #113 is closed after this commit. | PASS |

Flow results for criterion 5. Screenshots are in `sheets/`: 15 for Android Expo Go, 15
for Android native, 14 for iOS native, 14 for iOS Expo Go, and 9 for web.

| Platform | Where | Run | Result |
|----------|-------|-----|--------|
| Android Expo Go | Actions | 39000160143 | 7/7 plus dark mode |
| Android native debug | Actions | 39000162342 | 7/7 plus dark mode |
| iOS native | Actions | 39000164677 | 7/7 plus dark mode |
| iOS Expo Go | Locally | `e2e-ios-expogo.txt` | 7/7 plus dark mode |
| Web smoke | Production export with demo backends | `web-smoke.log` | Passed |

All three Actions runs passed on the first attempt.

## Notes

- **iOS Expo Go first attempt.** Flow 06 failed on `openLink` with code 60. The host
  had just rebooted, and the load average was 90. Expo Go needs the link, so this
  timeout can't be skipped (see #110). After the 1-minute load average dropped below
  8, the rerun passed 7/7.
- **iOS native `04-password-focused.png`.** This time it shows the "Username" label.
  In v1.1.12 the label was missing from the same screenshot. That supports the
  explanation recorded in issue-111: the screenshot had caught the label mid-fade.
- **Tools.** The gate script and the contact-sheet tool are saved in `tools/`. Earlier
  copies were lost when the scratch folder was purged.

Verdict: PASS.
