# Issue 51 verification — full-app seam tests and the two test origins

Verified on 2026-10-10 on `main` at
[`d29275d`](https://github.com/koniz-dev/react-native-starter/commit/d29275d).

## Change

- **Tests.** Three full-app tests set a seam mock and then render `./app`:
  `__tests__/shared/integrations/screenTracking.test.tsx` (analytics),
  `__tests__/shared/integrations/i18n.test.tsx` (i18n), and
  `__tests__/shared/ui/ErrorBoundary.test.tsx` (error reporter). Each now
  calls `configureIntegrations()` before setting its mock, as
  `tokenStore.test.tsx` already did. `configureIntegrations()` registers only
  once per module registry, so the later render no longer replaces the mock.
- **`docs/testing.md`.**
  - New "A seam or adapter in a full-app test" section, with a compiled
    example.
  - New "Requests that carry the token" section. It explains that
    `jest.setup.env.js` puts `api` and the auth backend on two origins, so
    `api` requests carry no token and a 401 there isn't refreshed. It gives two
    ways to test a same-origin setup: `authClients.authenticated`, or a
    compiled `jest.mock` of `getConfig()`.
  - "Shared setup" now states the consequence and links the new section.
- **`docs/plug-in-a-provider.md`** links the full-app section from its note
  on testing seams.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Result |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | The full-app seam tests keep passing when `configureIntegrations()` registers a real adapter for that seam                                                                                                     | [temp-real-providers.patch](temp-real-providers.patch) is a temporary edit to `setup.ts`, never committed. Its `configureIntegrations()` registers a new provider object for every seam: analytics, error reporter, feature flags, push, updates, and i18n (the demo already registers an auth adapter). With the patch and the old tests, 3 tests fail: screen tracking, the i18n "shipped screens" test, and the error-boundary route test ([before-fix-with-real-providers.log](before-fix-with-real-providers.log)). With the patch and the fixed tests, all 251 pass ([after-fix-with-real-providers.log](after-fix-with-real-providers.log)). The other `renderRouter` tests that set state (`sessionRoutes`, `tokenStore`) passed in both runs | PASS   |
| 2   | `docs/testing.md` says, with a compiled snippet, how to test a seam through the full app; that `jest.setup.env.js` uses two origins; and how to test token-carrying requests when API and auth share an origin | [Testing at d29275d](https://github.com/koniz-dev/react-native-starter/blob/d29275d/docs/testing.md#a-seam-or-adapter-in-a-full-app-test) and [#requests-that-carry-the-token](https://github.com/koniz-dev/react-native-starter/blob/d29275d/docs/testing.md#requests-that-carry-the-token). [docs:check](gate-docs-check.log) compiles both snippets. They were also run as real test files ([snippet-tests/run.log](snippet-tests/run.log)): both pass. Without its `jest.mock`, the same-origin test fails with `Authorization` undefined, which is the consequence the docs describe. The seam example also passes with the real-provider patch applied                                                                                          | PASS   |
| 3   | `docs/plug-in-a-provider.md` links that section                                                                                                                                                                | Its seam paragraph links `testing.md#a-seam-or-adapter-in-a-full-app-test`, and docs:check verified the anchor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | PASS   |
| 4   | Gates pass; CI green                                                                                                                                                                                           | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log) (251 tests). CI run 38065725421 on `d29275d`: success ([log](github-actions-ci-38065725421.log))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | PASS   |

## Notes

- **Why the first patch attempt is not used.** It set
  `{ ...seam.get() }`, which copied the test's own mock, so nothing failed.
  The patch kept here resets each seam to its default first, so it registers
  a really different object, as an app's provider would be.
- **`jest.setup.env.js` is unchanged.** The issue asked for docs, not a
  change to the test env. Switching every test to one origin would change
  what the existing token-origin tests check.
