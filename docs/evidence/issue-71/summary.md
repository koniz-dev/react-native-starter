# Issue 71 verification: build, CI, config

Fixes: [`7bf6af0`](https://github.com/koniz-dev/react-native-starter/commit/7bf6af0),
[`ab8d19e`](https://github.com/koniz-dev/react-native-starter/commit/ab8d19e),
[`cefe3df`](https://github.com/koniz-dev/react-native-starter/commit/cefe3df).

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Local variant builds get their config and app env | [variant-config.log](variant-config.log): expo-constants' getAppConfig (what the native build runs) reports Dev / Preview / production per APP_VARIANT; `build:preview:*` / `build:production:*` set APP_VARIANT and EXPO_PUBLIC_APP_ENV for the whole build | PASS |
| 2   | Lint enforces the conventions AGENTS.md lists | [lint-fixtures.log](lint-fixtures.log): 7 violations, 7 errors (feature→feature import, shared→feature import, value import of a type, color literal on an icon, default export, floating promise, async onPress). What they found in the app was fixed (sign-out promise, login double submit, unused default export). AGENTS.md and Conventions say exactly what lint checks | PASS |
| 3   | CI pins its toolchain | .nvmrc 24.21.0, ubuntu-24.04, actions by commit SHA, recipe libraries from docs/recipes/package-lock.json (14 packages); CI runs since are green (38292179524) | PASS |
| 4   | Generated folders ignored; tsconfig excludes; @types/node; type-aware rules use the project | eslint ignores .docs-check and web-build; tsconfig excludes dist, coverage, nested node_modules, ...; @types/node ~24.10.0; no-floating-promises / no-misused-promises use parserOptions.project | PASS |
| 5   | getVariant own keys | [variant-config.log](variant-config.log): `APP_VARIANT=toString` → "must be one of development, preview, production" | PASS |
| 6   | Expo Go pinned with SHA-256 | e2e-android.yml: EXPO_GO_VERSION 57.0.9, SHA-256 14c18828...; checked against the installed SDK; runs 38290463775 (7/7) | PASS |
| 7   | Workflow hygiene | timeouts (CI 30, Audit 15 min), PR-only cancel-in-progress, Audit concurrency, artifact retention 14 days, persist-credentials false | PASS |
| 8   | .gitignore .env.*; test renderer = react | `.env.*` with `!.env.example`; react-test-renderer 19.2.3 | PASS |
| 9   | Gates before and after init; CI, Audit, e2e green | CI 38292179524, Audit 38292179491; [init-gates.log](../issue-74/verification/init-gates.log); e2e as in #74 | PASS |
