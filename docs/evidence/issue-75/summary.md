# Issue 75 verification: release v1.1.7

Verified on 2026-10-13 against tag **`v1.1.7`**, commit
**`d52709d6025799b03359dcd0d564b6914bb1d306`**. Notes:
[release-notes.md](release-notes.md), published as the
[GitHub Release](https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.7).

## Why v1.1.7, not v1.1.5

Verification is what found the last two problems; each one moved the release
to a new tag, because pushed tags are never moved:

- **`v1.1.5` (`72fb94a`):** the web smoke found that "Go to Home" on the new
  not-found screen pushed a second Home over the anchored one
  ([log](superseded/v1.1.5-web-smoke-two-homes.log)). The fix
  (`369ab5c`) uses `router.dismissTo('/')`, and the routing test, which now
  counts hidden screens, fails with the old code
  ([mutation](superseded/not-found-mutation.log)).
- **`v1.1.6` (`369ab5c`):** iOS Maestro failed 2 of 6
  ([log](superseded/v1.1.6-ios-e2e.log)). The app behaved correctly, but
  two flows were brittle:
  - hiding the keyboard pressed Go, which had already signed in
    ([screenshot](superseded/v1.1.6-ios-signin-already-submitted.png));
  - iOS reads each Profile row as one element, "Name, Emily Johnson"
    ([screenshot](superseded/v1.1.6-ios-profile-row-grouped.png)).

  Fixed in `d52709d`; two full iOS runs then passed 6/6 ([4](superseded/ios-e2e-with-fixed-flows-4.log),
  [5](superseded/ios-e2e-with-fixed-flows-5.log)). The first native-debug attempt on
  `v1.1.6` failed to download a Gradle plugin
  ([log](superseded/v1.1.6-native-debug-attempt1-gradle-plugin.log)); its
  rerun passed.

## Acceptance criteria

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Tag on the verified commit, pushed | [01-clone.log](01-clone.log) (`git describe` = `v1.1.7`), [github-release.log](github-release.log) (`ls-remote`; v1.1.5 and v1.1.6 remain as unreleased tags) | PASS |
| 2   | Clean clone of the tag passes every gate; CI and Audit green | Node 24.21.0 (.nvmrc): [02 npm ci](02-npm-ci.log), [04 lint](04-lint.log), [05 type-check](05-type-check.log), [06 test:ci](06-test-ci.log) (376 tests; 98.02 / 94.17 / 96.49 / 98.04, per-folder and per-file thresholds), [07 format](07-format-check.log), [08 audit:check](08-audit-check.log), [09 doctor](09-doctor.log) (21/21), [10 export:web](10-export-web.log) (production variant, title "RN Starter"), [11 docs:check](11-docs-check.log) (pinned recipe libraries installed as ci.yml does, 43 snippets). CI on `d52709d`: success, 376 tests ([log](16-github-actions-ci-d52709d.log)); Audit on `v1.1.7`, run 38299913251: success ([log](17-github-actions-audit-38299913251.log)) | PASS |
| 3   | `init-project --remove-demo --remove-recipes` on a clean clone of the tag: no leftovers; gates pass | [12-init.log](12-init.log): the wording grep (starter, demo, template, recipe, koniz, ...) finds only generic uses (`.env.example` and `public/index.html` as templates, the i18n parameter); the markers grep exits 1; docs, scripts, flows, and workflows hold only the app's. [13-init-gates.log](13-init-gates.log): lint, type-check, format, docs:check, test:ci (309), audit:check, doctor 21/21, web export, all exit 0 | PASS |
| 4   | Baseline flows on the tag | **Android Expo Go**, run 38299906172: [report](android-expo-go/report.xml) 7/7, plus dark; [screenshots](android-expo-go/screenshots-sheet.png). **Android native debug**, run 38299909759: [report](android-native-debug/report.xml) 7/7, plus dark; [screenshots](android-native-debug/screenshots-sheet.png). **iOS Expo Go** from the clean clone: [log](ios-expo-go/test-e2e-ios.log) 6/6, plus dark; [screenshots](ios-expo-go/screenshots-sheet.png). Every run's `mock-api.log` shows sign-in and `GET /auth/me` served by the local mock. **Web** (Chrome 154, production export): [web-smoke.log](web/web-smoke.log) passed: per-screen tab titles, Login's header back and browser back, the not-found screen leading to the one Home, translated error then Retry, demo sign-in, reload signs out, dark background before the app renders; [screenshots](web-sheet.png). Every screenshot was checked | PASS |
| 5   | Release published as latest with changes, what to take, scope | [github-release.log](github-release.log): latest, not a draft or prerelease. The notes say which files adopters of earlier releases should take for the security fixes, list #69–#74, and repeat supported scope, non-goals, and known limitations. The v1.1.4 notes' "Known issues" heading now points to v1.1.7 | PASS |
| 6   | Evidence and verdict; no issue open | This page; `gh issue list --state open` is empty after this issue closes | PASS |

Verdict: `v1.1.7` is the latest verified release. Every finding of the
2026-10-13 deep audit is fixed and verified, no issue is open, and a project
made from the template keeps a green CI and reads as the adopter's own app
after `init-project`.
