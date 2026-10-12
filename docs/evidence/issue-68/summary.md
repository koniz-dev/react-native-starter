# Issue 68 verification: release v1.1.4

Verified on 2026-10-12/13 against tag **`v1.1.4`**, commit
**`887f634068cb2563ef4f4edc753be2169f56c014`**. Notes:
[release-notes.md](release-notes.md), published as the
[GitHub Release](https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.4).

## Acceptance criteria

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Tag on the verified commit, pushed | [01-clone.log](01-clone.log) (`git describe` = `v1.1.4`), [github-release.log](github-release.log) | PASS |
| 2   | Clean clone of the tag passes every gate; CI and Audit green | Node 24.21.0: [02 npm ci](02-npm-ci.log), [03 .env](03-env.log), [04 lint](04-lint.log), [05 type-check](05-type-check.log), [06 test:ci](06-test-ci.log) (285 tests; 97.57 / 91.66 / 95.12 / 97.75), [07 format](07-format-check.log), [08 audit:check](08-audit-check.log), [09 doctor](09-doctor.log) (21/21), [10 web export](10-expo-export-web.log), [11 docs:check](11-docs-check.log) (pinned recipe libraries, 43 snippets). CI run 38275172530 on `887f634`: success ([log](16-github-actions-ci-38275172530.log)). Audit run 38278420151 on `v1.1.4`: success ([log](17-github-actions-audit-38278420151.log)) | PASS |
| 3   | `init-project --remove-demo --remove-recipes` on a clean clone of the tag: no starter, demo, or template wording, markers, or template docs; gates pass | [12-init.log](12-init.log): only generic "template" words (`.env.example` as the committed env template, the i18n `template` parameter); the markers grep exits 1. [13-init-gates.log](13-init-gates.log): lint, type-check, format, docs:check, test:ci (230), audit:check, doctor 21/21, web export, all exit 0 | PASS |
| 4   | Baseline flows on the tag | **Android Expo Go**, run 38278409483: the first attempt failed in the cold-start flow because Android showed a system "Pixel Launcher isn't responding" dialog over the app (the app had loaded; [screenshots](android-expo-go-attempt1/failed-cold-start-sheet.png), [log](android-expo-go-attempt1/failure.log)). This harness gap is tracked in #70 (item 9). The rerun (attempt 2) passed: [report](android-expo-go/report.xml) 6/6, plus dark; [screenshots](android-expo-go/screenshots-sheet.png). **Android native debug**, run 38278415221: [report](android-native-debug/report.xml) 6/6, plus dark; [screenshots](android-native-debug/screenshots-sheet.png). **iOS Expo Go**, from the clean clone: [log](ios-expo-go/test-e2e-ios.log) 5/5, plus dark; [screenshots](ios-expo-go/screenshots-sheet.png). **Web** (Chrome 154): [web-smoke.log](web/web-smoke.log) passed; [screenshots](web-sheet.png). Every run's `mock-api.log` shows the sign-in served by the local mock. Every screenshot was checked | PASS |
| 5   | Release published as latest with changes and scope | [github-release.log](github-release.log): latest, not a draft or prerelease. The notes list #67, the supported scope, non-goals, and known limitations, and a "Known issues" section for #69–#74 | PASS |
| 6   | Evidence and verdict; no issue left open | This page. #43 and #67 are closed. **Not met as written:** the deep audit the owner asked for on 2026-10-13 opened #69–#74. They are listed in the release notes and will ship in the next release | PARTIAL |

Verdict: `v1.1.4` is verified and published as latest. It is better than
`v1.1.3` (CI is deterministic, e2e is offline). The audit's findings (#69–#74,
including two security defects present in every release) are open and are
the next release's scope.
