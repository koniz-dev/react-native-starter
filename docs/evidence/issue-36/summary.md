# Issue 36 verification — feature folders and a removable demo

Verified on 2026-10-09.

## Change

- **Layout.** `app/` holds only layouts and one-line route files, each
  re-exporting a screen. `features/` has `home`, `auth`, and the demos
  (`demo-auth`, `demo-todos`, `demo-showcase`). `shared/` is the
  foundation: `config`, `http`, `session`, `storage`, `ui`, `lib`,
  `integrations`, `i18n`. The old `services/`, `components/`, `hooks/`,
  `utils/`, `types/`, `constants/`, `providers/`, `config/`, `integrations/`,
  and `i18n/` top-level folders are gone, and `__tests__/` mirrors the new
  tree. `docs/conventions.md` "Project Structure" describes it, including the
  dependency direction (`app` → `features` → `shared`).
- **Auth is backend-agnostic.** `shared/session/authService.ts` defines
  `AuthAdapter` (`login`, `normalizeUser`, optional `fetchUser` and
  `refresh`) and `setAuthAdapter()`. The service validates the token and
  stores the token and the normalized user; an adapter's `refresh` becomes
  the HTTP client's refresh handler. With no adapter registered, sign-in fails
  with "Sign-in is not configured". The DummyJSON contract moved to
  `features/demo-auth/dummyJsonAdapter.ts`, registered in
  `shared/integrations/setup.ts`.
- **Demos isolated.**
  - The shipped Home (`features/home`) is a session card plus "Examples"
    links.
  - The Paper showcase is its own route, `/showcase`
    (`features/demo-showcase`), with a header and back button.
  - Todos is the Explore tab (`features/demo-todos`, with its own
    `api/todosApi.ts` and `types.ts`).
  - The Login demo-credentials hint is `DemoCredentialsHint`, which renders
    only when `EXPO_PUBLIC_USE_DEMO_BACKENDS=true`.
  - `shared/http/api.ts` is just the API client.
- **Removal path.** `npm run remove-demo` (`scripts/remove-demo.js`) deletes
  the demo folders, routes, and tests, strips the `@demo
remove-block-start/end` markers, formats the changed files, and fails if a
  marker or a demo import is left. `--dry-run` previews it. The guide is
  `docs/remove-demo.md`, linked from the README, `docs/README.md`, and
  `scripts/README.md`.
- **Found while verifying.**
  - The first run on a copy failed lint: blank lines were left behind (the
    script now runs Prettier), and two imports went unused (Home's `List`,
    now in `ExampleLinks`; `setAuthAdapter` in `setup.ts`, now inside the
    marker block). A screen-tracking test also navigated to `/explore`; it
    now uses `/login`.
  - On iOS the showcase's back button read "(tabs)"; the root stack now
    titles the tabs screen "Home".
- **Docs.** Updated for the new paths and the adapter: `docs/how-to.md`
  (screens, components, APIs, hooks, authentication with an adapter
  example), `docs/api-and-storage.md` (refresh through the adapter), the
  README and getting-started trees, `app/README.md`, `docs/testing.md`, and
  the epic table in `docs/issue-workflow.md`. The `epic:ui` and
  `epic:services` label descriptions in `scripts/bootstrap-issue-labels.sh`
  were updated and the script was run.

## Acceptance criteria

| #   | Criterion                                                                                                                            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Thin `app/` routes; `features/<name>/{screens,components,api,hooks,types}`; `shared/` foundation; `docs/conventions.md` describes it | Tree as above; `docs/conventions.md#project-structure`; [03](03-test-ci.log) (25 suites / 189 tests on the new layout)                                                                                                                                                                                                                                                                                                                                                                                  | PASS   |
| 2   | `AuthAdapter` (`login`, `refresh?`, `normalizeUser`), DummyJSON as one adapter under the demo; a real backend = adapter + config     | `shared/session/authService.ts`, `features/demo-auth/dummyJsonAdapter.ts`; [05](05-adapter-and-feature-tests.log): `authService` tests use a non-DummyJSON fake adapter (login, validation, storage, `fetchUser`, `refresh` as the refresh handler, not configured), plus DummyJSON adapter tests; `docs/how-to.md` adapter guide                                                                                                                                                                       | PASS   |
| 3   | Demos isolated; Home is a session card + links; showcase a separate removable route; demo hint only with the demo-backends flag      | iOS: [Home](ios/ios-01-home.png), [showcase with back to Home](ios/ios-02-showcase.png), [login with hint](ios/ios-03-login-demo-hint.png), [signed in through the adapter](ios/ios-04-signed-in.png), [profile](ios/ios-05-profile.png), [Explore](ios/ios-06-explore.png); [web smoke](web/web-smoke.log) with screenshots; `DemoCredentialsHint` tests "shows the demo account with the demo backends on" / "renders nothing without the demo backends"                                              | PASS   |
| 4   | Documented removal path that leaves an app that builds, passes lint/type-check/tests, and starts                                     | `docs/remove-demo.md`, `scripts/remove-demo.js`, `@demo` markers; [06](06-remove-demo-dry-run.log) dry run on this repo; removal results below                                                                                                                                                                                                                                                                                                                                                          | PASS   |
| 5   | Evidence: removal on a scratch copy, then lint, type-check, test:ci, and an Expo Go launch                                           | [removal/](removal/): [01 remove-demo](removal/01-remove-demo.log), [02 lint](removal/02-lint.log), [03 tsc](removal/03-type-check.log), [04 tests](removal/04-test-ci.log) (22 suites / 176 tests), [05 format](removal/05-format-check.log), [06 what is left](removal/06-remaining-files.log); Expo Go on iOS: [Home, one tab](removal/ios-01-home-after-removal.png), [Login without hint](removal/ios-02-login-no-hint.png), [sign-in "not configured"](removal/ios-03-sign-in-not-configured.png) | PASS   |
| 6   | Gates pass locally and in CI                                                                                                         | [01](01-lint.log) (0 problems, `--max-warnings 0`), [02](02-type-check.log), [03](03-test-ci.log), [04](04-format-check.log); CI run in the closing comment                                                                                                                                                                                                                                                                                                                                             | PASS   |

## Notes

- The scratch copy is the working tree without `.git` and `node_modules`,
  with `npm ci` run in it. The removal ran on the final code; the copy's
  Metro bundled 1600 modules for iOS.
- The iOS run of the full app used the simulator's hardware keyboard through
  AppleScript; the earlier XCUITest driver build had been cleaned from the
  temporary directory. Android was not run for this issue. Nothing
  platform-specific changed: files moved, and the screens use the same Paper
  components as before.
