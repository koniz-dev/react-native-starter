# Issue 34 verification — auth on web with an in-memory token store

Verified on 2026-10-09.

## Change

- `services/tokenStore.ts`: `TokenStore` (`get`, `set`, `clear`,
  `persistent`), `createSecureTokenStore()` (expo-secure-store, as before),
  `createMemoryTokenStore()`, and `createTokenStore(platform)`, which picks
  memory on web and secure storage elsewhere. `getTokenStore()` /
  `setTokenStore()` let an app register another store (for example a cookie
  session on web).
- `services/auth.ts`, `services/session.ts`, `services/httpClient.ts` read and
  write the token only through `getTokenStore()`. On web, login used to fail
  because `setSecureItem` throws there.
- `providers/SessionProvider.tsx`: when the restore finds no token (always
  the case after a reload on web), it also clears the stored profile, which on
  web lives in `localStorage`, so no user data outlives the session.
- Docs: `docs/api-and-storage.md` (token store per platform, why the token is
  not persisted on web, the httpOnly-cookie alternative, refresh example),
  README feature list, `docs/getting-started.md` (web note),
  `docs/environment-variables.md` (token reference).
- `eslint.config.js` ignores `docs/evidence/**`: the web smoke script kept
  there as evidence is a Node script, not app code.

## Acceptance criteria

| #   | Criterion                                                                                                     | Evidence                                                                                                                                                                                                                                                                                                                                        | Result |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `TokenStore` interface with a native SecureStore implementation and a web in-memory one, selected by platform | `services/tokenStore.ts`; callers in `services/auth.ts`, `services/session.ts`, `services/httpClient.ts`                                                                                                                                                                                                                                        | PASS   |
| 2   | On web: sign-in succeeds, the session is shown, logout works; a reload returns to signed out                  | Web smoke below; Jest "signs in, shows the session, logs out, and a reload returns to signed out" (memory store, real login path with the HTTP call stubbed)                                                                                                                                                                                    | PASS   |
| 3   | Jest tests cover both implementations and platform selection                                                  | [05-token-store-tests.log](05-token-store-tests.log): `__tests__/services/tokenStore.test.tsx` (10 tests: secure store incl. unavailable, memory store, `web`/`ios`/`android` selection, default from `Platform.OS`, `setTokenStore`, web flow); [07](07-mutation-secure-store-on-web.log): with the secure store selected on web, 3 tests fail | PASS   |
| 4   | Web smoke: export, serve `dist/`, sign in with the demo credentials, screenshots                              | [06-web-export.log](06-web-export.log); [web/web-smoke.log](web/web-smoke.log) and screenshots; script [web/web-smoke.js](web/web-smoke.js) (Playwright-core driving the system Chrome, headless)                                                                                                                                               | PASS   |
| 5   | README, `docs/getting-started.md`, `docs/api-and-storage.md` state the web behavior and why                   | README "Authentication Example"; getting-started "Press `w`"; api-and-storage "Authentication" → "Why the token is not persisted on web"                                                                                                                                                                                                        | PASS   |
| 6   | Gates pass locally and in CI                                                                                  | [01](01-lint.log) (0 errors; 6 existing `ThemedText.tsx` warnings, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (22 suites / 159 tests), [04](04-format-check.log); CI run in the closing comment                                                                                                                             | PASS   |

## Web smoke

`npx expo export --platform web` with this repo's `.env`
(`EXPO_PUBLIC_USE_DEMO_BACKENDS=true`, so the real DummyJSON backend over
https; a production build, since `EXPO_PUBLIC_APP_ENV` is unset), served
with `npx serve -s` on port 5050, driven by `web/web-smoke.js`
([log](web/web-smoke.log)):

| Step                                                  | Result                                                                                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open `/`                                              | "Not signed in" ([screen](web/web-01-home-signed-out.png))                                                                                            |
| Try authentication demo, type `emilys` / `emilyspass` | Login form filled ([screen](web/web-02-login-filled.png))                                                                                             |
| Sign In                                               | `POST /auth/login` 200; Home "Signed in as Emily Johnson" at `/` ([screen](web/web-03-signed-in.png))                                                 |
| Inspect web storage                                   | The token from the response is in none of `localStorage`, `sessionStorage`, or `document.cookie`; `localStorage` holds only `user_data` (the profile) |
| View profile                                          | `/profile` shows the user, loaded with the in-memory token via `GET /auth/me` ([screen](web/web-04-profile.png))                                      |
| Reload                                                | "Not signed in"; `localStorage` is empty: the leftover profile was cleared ([screen](web/web-05-after-reload-signed-out.png))                         |
| Sign in again, Log out                                | "Not signed in"; `localStorage` empty ([screen](web/web-06-logged-out.png))                                                                           |
| Browser console                                       | No errors                                                                                                                                             |

A first version of the script filled the inputs with Playwright's `fill`
and took the screenshot immediately, which caught Paper's floating labels
mid-animation (label over the value). Typing key by key and waiting 0.8 s
shows the labels in place; it was not an app defect.

## Native

iOS and Android keep the SecureStore-backed store, so their behavior is
unchanged (covered by the secure-store tests and the session-route tests).
No device run was made for this issue.
