# Issue 149: release v1.1.19 (tag on 28fac1a9f21ccbb5de9761d1525d7078b7498287)

`main` since `v1.1.18`: the Expo SDK 58 upgrade (#134, PR #135, merge commit 28fac1a), and
setup-java 6.1.0 (#145). The store's Expo Go runs SDK 58 (`pretag.txt`:
`expoGoSdkVersion` 58.0.0). The maintainer approved the release on 2026-11-07 ("ok, xong
thì báo tôi", in reply to the request to release v1.1.19), before the results, and asked to
be told when it was done.

28fac1a has the same tree as cfdc124 (887172f, `pretag.txt`): the merge commit changes no file. It only records
`main`'s previous head as a parent. cfdc124 was verified on 2026-11-06 for #134
([`issue-134/merge-2026-11-06/`](../issue-134/merge-2026-11-06/)), so those results are
the tagged code's; they are not repeated here. This issue adds the web smoke and the
pre-tag checks.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Annotated tag `v1.1.19` on 28fac1a, pushed | `tag-and-release.txt`: tag object 767ed1d points at 28fac1a, which is `origin/main`. Evidence after the tag went only to the `evidence` branch. | PASS |
| 2 | Only #134 and #148 open besides this one; 0/0/0 alerts | `pretag.txt` (12:43:45Z): open #149, #148, #134; code-scanning, Dependabot and secret-scanning 0/0/0 (Dependabot #11 dismissed in #148 at 12:43:33Z). | PASS |
| 3 | Clean-clone gates; CI, Audit, CodeQL green on 28fac1a | `issue-134/merge-2026-11-06/release-gates.txt` part 1 (clean clone at cfdc124, same tree, Node 24.21.0): lint, type-check, format, docs:check, 744 tests, audit:check, doctor 20/20, web export, iOS and Android bundles exit 0. On 2026-11-07 a clean clone of 28fac1a: `npm ci`, web and native exports, audit:check (0 high/critical) pass (`pretag.txt`). CI 42283047673, Audit 42283047263, CodeQL 42283043652 success on 28fac1a. | PASS |
| 4 | `init-project --remove-demo --remove-recipes`: no leftovers, every gate | `issue-134/merge-2026-11-06/release-gates.txt` part 2: leftover search exit 1 (nothing found), every gate exits 0, 611 tests. | PASS |
| 5 | Flows on the tagged tree; every screenshot checked against `v1.1.18`'s | See the table below. | PASS |
| 6 | Release published as latest with the notes the criterion asks for | `tag-and-release.txt`: releases/latest = v1.1.19, published 12:44:16Z; the notes are `release-notes.md` (GitHub adds one trailing blank line): SDK 58 and what adopters change when they upgrade, the rest of the changes, supported scope, non-goals, limitations. | PASS |
| 7 | Evidence and verdict; #134, #148 and #149 closed; no issue open | This folder; the issues are closed after this commit. | PASS |

| Platform | Run (on cfdc124 unless noted) | Result | Screenshots |
|----------|-----|--------|-------------|
| Android Expo Go 58.0.5 | Actions 42274667392 | 7/7 plus dark mode, no retry | 15 |
| Android native debug | Actions 42274672905 | 7/7 plus dark mode, no retry | 15 |
| iOS native, iOS 26 | Actions 42274677108 | 7/7 plus dark mode, no retry | 14 |
| iOS Expo Go 58.0.7, iOS 18.6 | local | 7/7 plus dark mode, no `E2E RETRY` | 14 |
| Web smoke | production export of 28fac1a with the demo backends, 2026-11-07 | passed (`web-smoke.log`) | 9, `sheets/web.png` |

The native sheets are in `issue-134/merge-2026-11-06/sheets/`; they were compared with
v1.1.18's screen by screen there, which is how the iOS 26 header overlap was found and
fixed (00c9677). The web sheet matches v1.1.18's `sheets/web.png` screen by screen; the
only difference is the showcase's Snackbar text wrapping onto a third line, because
headless Chrome here shows a scroll bar. All 67 screenshots were looked at, and each shows
the expected screen.

## Notes

- **The web smoke uses no npm package.** `tools/web-smoke-cdp.js` drives Google Chrome
  156 over the DevTools protocol with Node 24's built-in WebSocket and serves the export
  with `node:http`. It runs the same steps as issue-147's playwright-core script.
- **The component showcase is not verified on iOS 26** (no flow opens it); the release
  notes say so.
- **Tools.** Node 24.21.0 from nodejs.org (SHA256 checked) in the scratch folder.

Verdict: PASS.

Release: https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.19
