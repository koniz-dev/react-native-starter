# Issue 86: docs corrections (main 5268598)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Claims match the code; every snippet passes lint and type-check at its stated path | docs:check now lints every snippet with the project's ESLint config as the file it names (`tests-before-after.txt`: the check-docs test catches a snippet with a default export in features/); `gates.log`: docs:check "No problems" (44 snippets compiled and linted). Fixed: remove-demo markers (with #84), Redux recipe .tsx, EAS setup (with #83), AccountRow, env mock, Banner, NotesScreen, HomeExtras, PostsScreen logging, lint claims (with #83), navigate, fonts, theme roles, flow 06, ApiError example, fragment, secureStorage, canceled, no-console, recipe layout, scripts tests, Node range, Home/Login comments | PASS |
| 2 | v1.1.8 release notes corrected | `release-v1.1.8-notes-before.md` / `-after.md`: also copy session.ts | PASS |
| 3 | docs:check, gates, CI, after init | `gates.log` (all exit 0); CI green on 5268598; post-init in issue-87 | PASS |
