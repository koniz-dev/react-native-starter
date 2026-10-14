# Issue 95: tooling (fix a222f45)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | The color lint catches names, lists, options, constants; transparent, function args, and the palette are allowed | `tests-before-after.txt`: 7 rejected cases fail before, all pass after | PASS |
| 2 | require() of a local asset lints clean; a module require still fails | same file ("allows require() of an image…" fails before) | PASS |
| 3 | .gitignore: *.keystore, CLAUDE.local.md, symlinked node_modules | commit a222f45 / 9dbe37d | PASS |
| 4 | CI bundles iOS and Android and catches a broken platform-file import | `native-bundle-catches.txt`: type-check and web export pass, the native bundle fails ("Unable to resolve module ./badge.png"); the new CI step is green on a222f45 | PASS |
| 5 | Splash colors tied to the theme | `splash-mutant.txt`: changing the theme background fails the test | PASS |
| 6 | extra.appVariant removed; docs say where the EAS projectId goes | commit a222f45, docs/app-config.md | PASS |
| 7 | react-native-gesture-handler | Kept, with the reason recorded: it is a required peer of expo-router's react-native-drawer-layout, so `npm uninstall` leaves it installed (tried: `npm ls` still lists it) and only loses the SDK pin; docs/ui-and-theming.md says why it is installed | PASS (recorded) |
| 8 | Doc fixes (doc-driven test, type-check, no-console, color rule) | commit a222f45; docs:check green | PASS |
| 9 | ESLint 9 deprecation recorded | maintainers README, "Dependencies held back" | PASS (recorded) |
| 10 | Gates, CI, e2e | Gates on a clean clone of a222f45 and after both init paths (lint, type-check, format, docs, 529/440/440 tests, audit, doctor 21/21, web and iOS+Android exports: `../issue-90/verification/gates-clean-clone-and-init.txt`); Maestro iOS 7/7, Android Expo Go 7/7, Android native debug 7/7 (Actions run 38572469509), dark mode on both; web smoke passed (`../issue-90/verification/`); CI, Audit, CodeQL green on a222f45 | PASS |
