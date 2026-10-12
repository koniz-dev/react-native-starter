# Issue 67 verification: the same commit gets the same CI result

Done on 2026-10-12 on `main` at
[`637a898`](https://github.com/koniz-dev/react-native-starter/commit/637a898)
(CI and audit) and
[`887f634`](https://github.com/koniz-dev/react-native-starter/commit/887f634)
(e2e without third-party servers), verified at `887f634`.

## Acceptance criteria

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | `npm run doctor` (pinned expo-doctor 1.20.4, `EXPO_OFFLINE=1`) checks against the installed SDK; passes on the `v1.1.2` lockfile; fails on a real mismatch | [doctor-v1.1.2-lockfile.log](doctor-v1.1.2-lockfile.log): on a clone of `v1.1.2` (expo 57.0.27), online doctor exits 1 (newer patches exist), the new command exits 0. [doctor-real-mismatch.log](doctor-real-mismatch.log): with the installed `expo` asking for expo-router ~57.0.99, the new command exits 1 and names it. The script also sets `npm_config_loglevel=notice`: under `npm run -s`, doctor misread `npm explain` and failed 3 checks | PASS |
| 2   | Recipe libraries installed at exact versions in CI | `.github/workflows/ci.yml`: zustand 5.0.15, @reduxjs/toolkit 2.13.0, react-redux 9.3.0, jotai 3.0.1, @tanstack/react-query 5.104.2; the docs:check step passes in [CI](github-actions-ci-38275172530.log) | PASS |
| 3   | Verify has no network- or date-dependent step; audit in its own workflow; audit fails when npm can fix an allowlisted advisory; tests | [CI run 38275172530](github-actions-ci-38275172530.log): no audit step, `npm run doctor` 21/21, 285 tests. [Audit run 38275172551](github-actions-audit-38275172551.log) (push): success, both entries allowlisted until 2027-01-09. `scripts/check-audit.js` exports `evaluate()`; [check-audit-tests.log](check-audit-tests.log): 6 tests (unreviewed, allowlisted, fix within ranges for `true` and a non-major fix, expired review, moderate not gated, stale entry). Today npm's `fixAvailable` for both advisories is a major downgrade (`expo@44`, `react-native@0.72`), so no fix is within range | PASS |
| 4   | Maestro flows use only the local mock; Expo Go for the installed SDK | `mock-api.log` in each run: `POST /auth/login` served by the mock (iOS, Android Expo Go, native debug). [iOS](ios-expo-go/test-e2e-ios.log) (clean clone of `main`, no `.env`): 5/5 + dark. Android Expo Go run 38275197018: [report](android-expo-go/report.xml) 6/6 + dark; the workflow resolved Expo Go for SDK 57.0.0 from the installed `expo`. Native debug run 38275201360: [report](android-native-debug/report.xml) 6/6 + dark. Screenshots checked ([iOS](ios-expo-go/screenshots-sheet.png), [Expo Go](android-expo-go/screenshots-sheet.png), [native](android-native-debug/screenshots-sheet.png)); on Android the workflow copies `.env.example`, so the demo hint shows, but both URLs point at the mock | PASS |
| 5   | Docs | Getting Started (scripts table, CI paragraph, `npm run doctor`, `npx expo install --check` on demand, the Audit workflow, dependency advisories), Testing (e2e mock serves the demo sign-in), AGENTS.md (gates), scripts/README.md (check-audit). docs:check passes | PASS |
| 6   | Gates before and after init; CI, Audit, e2e green | Before init: CI run 38275172530 (lint, format, type-check, 285 tests, doctor, web export, docs:check). After `init-project --remove-demo --remove-recipes` on a clone of `887f634`: [init.log](init.log) (only generic "template" words; markers grep exits 1; `.github` holds audit.yml, ci.yml, e2e-android.yml) and [init-gates.log](init-gates.log): lint, type-check, format, docs:check, test:ci (230), audit:check, `npm run doctor` 21/21, web export, all exit 0 | PASS |

## Also

- #43 is closed by this issue: the weekly Audit run now fails when npm can
  apply an upstream fix for `node-forge` or `braces`, or when the
  `reviewBy` date (2027-01-09) passes. Re-checked today: neither advisory has
  a patched release (`patched: null`; node-forge 1.4.0 and braces 3.0.3 are
  the latest).
- The maintainer docs (`dependency-review.md`, `release-gate.md` on
  `maintainers`) describe the Audit workflow instead of the tracking issue.
