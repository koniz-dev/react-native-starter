# Issue 78: CI and build (verified on main 8c1c912 and 69afacb)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Current action majors pinned by SHA; no Node 20 / setup-java deprecation annotations | checkout v7.0.1, setup-node v7.1.0, setup-java v6.0.1, upload-artifact v7.0.2 (SHAs resolved from the release tags); `ci-annotations.txt`: CI and Audit on 69afacb have no annotations (before: "Node.js 20 is deprecated…"); `native-debug-69afacb-run.log` (setup-java, upload-artifact) | PASS |
| 2 | Dependabot updates GitHub Actions; documented | `.github/dependabot.yml` (github-actions, monthly, grouped); docs/getting-started.md, Scripts | PASS |
| 3 | CI exports web with npm run export:web | `ci-annotations.txt`: the step runs `npm run export:web -- --output-dir dist`, "Exported: dist" | PASS |
| 4 | No unused permissions in production; documented | `prebuild-permissions.txt`: production prebuild removes VIBRATE, READ/WRITE_EXTERNAL_STORAGE, SYSTEM_ALERT_WINDOW (`tools:node="remove"`), no NSFaceIDUsageDescription; development keeps SYSTEM_ALERT_WINDOW only. Test "asks for no permission the app does not use" (`tests-before-after.txt`). docs/app-config.md, Permissions. The development native build with these settings runs 7/7 flows (issue-79/android-native-debug) | PASS |
| 5 | public/index.html has no httpEquiv | removed in 8c1c912; web export and smoke pass (issue-79/web) | PASS |
| 6 | CI, Audit, both e2e-android jobs pass | CI/Audit green on 8c1c912 and 69afacb; Expo Go 7/7 (run 38411865340), native debug 7/7 (run 38411870810 attempt 2, and 38414725085 on 69afacb). Attempt 1 of 38411870810 failed downloading the NDK (`native-debug-c65c808-attempt1-ndk-download.log`, "Archive is not a ZIP archive"), so 69afacb retries the build once after a failed download | PASS |

Not actionable now: eslint 9 is deprecated on npm; eslint-plugin-react 7.37.5 and eslint-plugin-react-native 5.0.0 don't accept ESLint 10 yet.
