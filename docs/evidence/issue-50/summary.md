# Issue 50 verification — real-backend auth shapes

Verified on 2026-10-10 on `main` at
[`94defee`](https://github.com/koniz-dev/react-native-starter/commit/94defee).
The shapes come from the #48 trial: its adapter and its two `shared/` changes
are in `docs/evidence/issue-48/03-build-on-it/step3.diff`.

## Change

- **`shared/http/apiError.ts`.** `serverMessage()` also reads
  `{ "error": { "message" } }`. A string `message` or `error` still comes
  first.
- **`shared/session/authService.ts`.** `AuthAdapter` gets an optional
  `logout(clients)`. `authService.logout()` calls it while the access token
  is still stored, so the `authenticated` client can send it. A failure is
  logged with `logger.warn` (usually just offline, so no error report), and
  the stored session is cleared anyway.
- **`docs/connect-your-backend.md` §2.** The example adapter now targets a
  backend with these shapes:
  - a tokens-only `POST /sessions` with `{ email, password }`, then `GET /me`
    with the new token;
  - a rotating refresh token kept in `createSecureTokenStore('refresh_token')`
    on native and `createMemoryTokenStore()` on web;
  - revocation in `logout`.

  New sections: "Your backend's field names" (mapping, plus the i18n label
  and the keyboard and autofill props), "A login response without the user",
  "Refresh tokens" (storage, rotation, revocation), and "Error messages".

- **`docs/api-and-storage.md`.** The storage note points web-safe tokens to
  `tokenStore.ts`.
- **`SessionProvider`.** The `signOut` doc comment now says it calls the
  adapter's logout.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                                                                                                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `ApiError` reads a nested `error.message`, and still a string `message` or `error`; tested                                                                                                                                                                                                  | `toApiError › reads the message of an error envelope`: a 422 envelope gives "Wrong email or password", and an envelope without a usable message falls back to axios's message. The existing test for a string `message` or `error` still passes. Both are in [new-and-changed-tests.log](new-and-changed-tests.log)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | PASS   |
| 2   | Optional `AuthAdapter.logout(clients)`, called by `authService.logout()` before the session is cleared; a failure is logged and the user is still signed out; both paths tested                                                                                                             | `authService.test.ts`: "calls the adapter's logout while the token is still stored, then clears the session" checks that the token is readable inside `logout` and not deleted yet. "logs a failed adapter logout and signs out anyway" checks the `logger.warn` call and that the token and profile are removed. With the old `apiError.ts` and `authService.ts`, these two tests and the envelope test fail ([tests-without-fix.log](tests-without-fix.log))                                                                                                                                                                                                                                                                                                                                                    | PASS   |
| 3   | Connect Your Backend covers the credentials mapping (and i18n relabel), a login without the user (`/me` with the new token), refresh-token storage and rotation with `createSecureTokenStore` / `createMemoryTokenStore` (works on web), and revocation in `logout`; every snippet compiles | [§2 at 94defee](https://github.com/koniz-dev/react-native-starter/blob/94defee/docs/connect-your-backend.md#2-sign-in-write-an-authadapter): the example adapter and the four new subsections. [docs:check](gate-docs-check.log): 34 snippets compile, no problems                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | PASS   |
| 4   | An adapter test exercises a non-DummyJSON shape (tokens-only login plus `/me`, rotation, logout) so the documented path keeps working                                                                                                                                                       | `__tests__/shared/session/realBackendAdapter.test.ts` reads the example adapter **from the doc page**, loads it, and runs it through the real auth clients, session service, and token stores against a fake backend. Six tests: tokens-only login plus `/me` with the new token; the envelope message on a wrong password, with nothing stored; refresh on a 401 with rotation, twice; a rejected refresh signs out and drops the refresh token; logout revokes the refresh token, sending the access token; and logout while the backend is unreachable still signs out. Deleting the rotation line from the doc's example makes the rotation test fail ([doc-mutation.log](doc-mutation.log)). The tests and docs:check also pass after `npm run remove-demo` ([after-remove-demo.log](after-remove-demo.log)) | PASS   |
| 5   | Gates pass; CI green                                                                                                                                                                                                                                                                        | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log) (251 tests, coverage 97.5 / 91.5 / 95.0 / 97.7). CI run 38064792961 on `94defee`: success ([log](github-actions-ci-38064792961.log))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | PASS   |

## Notes

- **Not changed.** `LoginCredentials` keeps `username`. The docs show how
  to map it, because renaming it would break every existing adapter. The
  Login screen's label and keyboard stay as they are; the docs say which
  string and which props to change.
- **Session expiry.** When a 401 can't be refreshed, the session is cleared
  without calling `logout`. The example drops the refresh token itself when
  a refresh is rejected.
