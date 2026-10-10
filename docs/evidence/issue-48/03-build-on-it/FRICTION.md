# Friction log: building Field Notes from the starter docs

Times are local (`date '+%H:%M:%S'`), 2026-10-10.

## Steps

| #   | Start    | End      | Doc sections followed                                                                                                                                                                                                                                                             | What happened                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | 18:51:32 | 18:51:59 | `README.md#documentation`, `AGENTS.md` (all), `docs/connect-your-backend.md`, `docs/conventions.md`, `docs/plug-in-a-provider.md`, `docs/environment-variables.md`, `docs/testing.md`, `docs/api-and-storage.md`, `docs/remove-demo.md`                                           | Read the docs and the code they point to (`shared/session/authService.ts`, `shared/integrations/setup.ts`, `shared/http/*`, `shared/lib/useFetch.ts`, `app/` layouts). The project was initialized with `--remove-demo`, so every "look at the demo" pointer is dead (see F1).                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1   | 18:51:59 | 18:54:38 | none cover it; modeled on `scripts/e2e/mock-api.js` (found via `docs/testing.md#end-to-end-flows-maestro`); `AGENTS.md#gates`                                                                                                                                                     | Wrote `mock-backend/server.js` and `npm run mock-backend`. Smoke-tested every route (422/201, 401/200 on `/me`, 200/503 on `/notes` with `.fail`, refresh rotation 200 then 401, `DELETE` 204, token revoked afterwards) on port 4123, then stopped it. `npm run lint` rejected `process.env.PORT` (F2); added `mock-backend/**` to the `no-restricted-properties` ignores in `eslint.config.js`. Added `mock-backend/.fail` to `.gitignore`.                                                                                                                                                                                                                                                                                            |
| 2   | 18:54:38 | 18:56:57 | `docs/connect-your-backend.md#1-point-the-app-at-your-servers`, `#2-sign-in-write-an-authadapter`, `docs/environment-variables.md#variables`, `docs/api-and-storage.md#errors`, `#token-store`, `#which-hosts-receive-the-token`, `docs/testing.md#network`                       | Wrote `features/auth/fieldNotesAuthAdapter.ts` (login, normalizeUser, fetchUser, refresh with rotation, logout) and registered it in `shared/integrations/setup.ts`. Needed three things the docs don't cover: an error-envelope message (F4, changed `shared/http/apiError.ts`), a sign-out hook to revoke the refresh token (F5, added optional `AuthAdapter.logout` in `shared/session/authService.ts`), and an email login field (F6). Set `.env` / `.env.example` to the mock backend with demo backends off. 10 adapter tests + 2 authService tests + 1 ApiError assertion. The first refresh tests failed because the docs' test env has API and auth on different origins (F9).                                                  |
| 3   | 18:56:57 | 18:58:48 | `docs/conventions.md#adding-a-screen`, `#where-code-goes`, `#navigation`, `docs/connect-your-backend.md#3-add-endpoints-for-a-feature`, `docs/api-and-storage.md#loading-data-in-screens`, `docs/plug-in-a-provider.md#i18n`, `docs/testing.md#two-kinds-of-ui-tests`, `#network` | Added `features/notes/` (`types.ts`, `api/notesApi.ts` with zod validation, `components/NotesList.tsx` with loading / error + Retry / empty / pull to refresh, `screens/NotesScreen.tsx` with a signed-out prompt), the one-line route `app/(tabs)/notes.tsx`, a Notes tab in `app/(tabs)/_layout.tsx`, and `notes.*` / `tabs.notes` strings. Tests: `__tests__/features/notes/NotesScreen.test.tsx` (held requests: loading → 503 error → Retry → list; empty; malformed payload; pull to refresh; signed out) and `__tests__/app/notesTab.test.tsx` (full app: tab → sign-in prompt → Login). Without the deleted Todos example (F1), and with a tab that needs sign-in, which the docs don't cover (F12).                             |
| 4   | 18:58:48 | 18:59:52 | `docs/plug-in-a-provider.md#analytics`, the comment in `shared/integrations/setup.ts`                                                                                                                                                                                             | Added `shared/integrations/adapters/memoryAnalytics.ts` (`createMemoryAnalytics()`: records track/screen/identify in a capped in-memory list, logs each at debug level) and registered it with `analyticsSeam.set()` in `configureIntegrations()`. Screen views come from `useScreenTracking()` automatically; the Notes list tracks `notes_loaded { count }` and `notes_retry { error }`. Tests in `__tests__/shared/integrations/memoryAnalytics.test.ts`.                                                                                                                                                                                                                                                                             |
| 5   | 18:59:52 | 19:02:53 | `AGENTS.md#gates`, `docs/testing.md#commands`, `.github/workflows/ci.yml` (for the web export command)                                                                                                                                                                            | `npm run lint && npm run type-check && npm run test:ci`: lint and types passed first time; one failure in the starter's `__tests__/shared/integrations/screenTracking.test.tsx` caused by registering an analytics provider (F11), fixed in the test. My pull-to-refresh test needed `waitFor` (the request starts after an async interceptor). Final: 26 suites, 212 tests pass, coverage threshold met. `format:check` (after formatting this file), `docs:check` ("No problems"), `audit:check` ("No unreviewed high or critical advisories") pass. `npx expo export --platform web` succeeded (output written to a temp dir, not `dist/`). Did not run the Maestro flows: no simulator here, and they no longer match the app (F10). |

## Where the docs were wrong, missing, ambiguous, or out of date

**F1. Docs still describe the demo after `init-project --remove-demo`.**
`docs/conventions.md#project-structure` lists `demo-auth/`, `demo-todos/`,
`demo-showcase/` as present folders; `docs/connect-your-backend.md#3-add-endpoints-for-a-feature`
says "as `features/demo-todos/api/todosApi.ts` does"; `docs/api-and-storage.md#loading-data-in-screens`
says "The Explore tab (`features/demo-todos/screens/TodosScreen.tsx`) uses both";
`docs/testing.md#network` says "`__tests__/features/demo-todos/TodosScreen.test.tsx`
holds each request open to check the loading, error, Retry, and list
states in order". All of those files were deleted by the init command, so
the one worked example of a list screen with loading/error/retry and its
test is gone. I wrote the Notes screen and its test from the snippets
alone. `docs:check` deliberately skips these paths after remove-demo, so
nothing flags them.

**F2. No guidance for Node tooling in the repo.** `AGENTS.md` says
"`shared/config/env.ts` is the only module that reads `process.env`", and
lint enforces it for every `**/*.js`, including a dev server. The existing
`scripts/e2e/mock-api.js` dodges it by taking the port from `argv`, but the
task needed `PORT`. I added `mock-backend/**` to the rule's ignores next to
`app.config.ts`. The docs could say where dev-only Node code goes and how
it's linted.

**F3. The "Then" step of remove-demo leaves `.env.example` pointing at the
demo.** `docs/remove-demo.md#then` says "turn off
`EXPO_PUBLIC_USE_DEMO_BACKENDS`", but after `--remove-demo` the committed
`.env.example` still says `EXPO_PUBLIC_USE_DEMO_BACKENDS=true` with "demo
login emilys / emilyspass", and `README.md#quick-start` still says
"`cp .env.example .env   # turns on the public demo backends`" and
"Demo sign-in (with the demo backends on): `emilys` / `emilyspass`", which no
longer works (no demo adapter). Updated `.env.example` myself.

**F4. Error envelopes aren't supported, and the docs don't say how to
adapt.** `docs/api-and-storage.md#errors`: "The message prefers the server's
own `message` (or `error`) field, so a failed login shows "Invalid
credentials"". Our backend returns `{ "error": { "code", "message" } }`;
`serverMessage()` only reads a string `error`, so a wrong password showed
axios's "Request failed with status code 422". There is no documented hook
for an error shape. I extended `serverMessage()` in `shared/http/apiError.ts`
to read `error.message` (and added an assertion to
`__tests__/shared/http/httpClient.test.ts`). The alternative (catch and
rethrow in every adapter/endpoint) seemed worse.

**F5. No way to end the session on the backend.** The `AuthAdapter` in
`docs/connect-your-backend.md#2-sign-in-write-an-authadapter` has `login`,
`normalizeUser`, `fetchUser`, `refresh`, but no `logout`, and the doc says
"Nothing in `shared/` changes". With a refresh token, sign-out has to
revoke it (`DELETE /api/v1/sessions`) and delete it from the device;
otherwise it outlives the session in the Keychain. The doc's own example
stores a refresh token (`saveRefreshToken`) but never deletes it. I added an
optional `logout?(clients)` to `AuthAdapter`, called by `authService.logout()`
before clearing the stored session (failures are logged, and the user is
still signed out), with two tests in `__tests__/shared/session/authService.test.ts`.

**F6. `LoginCredentials` is `{ username, password }` and the Login screen says
"Username".** The adapter doc maps credentials straight through
(`http.post('/sessions', credentials)`), which assumes a backend that takes
`username`. Ours takes `email`. Nothing says the type is fixed or how to
rename the field. I mapped `username` → `email` in the adapter and changed
the label to "Email" (`login.username` in `shared/i18n/en.ts`) and the input
to `keyboardType="email-address"`, keeping the key and test IDs so existing
tests and Maestro flows still match.

**F7. The adapter example assumes the login response includes the user.**
`login` returns `data.user` from `/sessions`. Ours returns tokens only, so
login has to call `/me`. The `authenticated` client would send the _stored_
token, which isn't stored until `login` returns, so I call `/me` on the
`public` client with an explicit `Authorization` header. Not covered by the
doc; worth one sentence.

**F8. "Placeholders for your own code: `loadRefreshToken` /
`saveRefreshToken`" leaves the important part unspecified.** Where should a
refresh token live? `docs/api-and-storage.md#storage` says "For secrets use
`shared/storage/secureStorage.ts` (Expo SecureStore; unavailable on web)",
and `setSecureItem` _throws_ on web, so following that advice breaks web
sign-in. I reused `createSecureTokenStore(key)` / `createMemoryTokenStore()`
from `shared/session/tokenStore.ts` (same platform rule as the access token),
which I found only by reading the code. Also, the example's
`{ refreshToken }` body and lack of rotation handling are just
placeholders, but rotation (store the new refresh token on every refresh) is
common enough to show.

**F9. Tests' config contradicts a same-origin backend.**
`docs/testing.md#shared-setup`: "`jest.setup.env.js` sets
`EXPO_PUBLIC_USE_DEMO_BACKENDS=true`". In tests the API is JSONPlaceholder
and auth is DummyJSON, two origins, so `api` requests never carry the token
and a refresh test through `api` can't work. My first two refresh tests
failed for that reason; I ran them through `authClients.authenticated`
instead. Not wrong, but surprising once your real API and auth share an
origin. The docs could mention it next to "replace the client's axios
adapter".

**F10. The Maestro suite is broken after `--remove-demo`, but the docs list
it as working.** `docs/testing.md#end-to-end-flows-maestro` lists
`02-tabs.yaml` ("the tab bar switches between Home and Explore"),
`05-explore-error-retry.yaml`, and `dark-mode.yaml` ("screenshots of Home and
Explore"); they tap `tab-explore`, which no longer exists.
`.maestro/subflows/sign-in.yaml` signs in as `emilys` / `emilyspass`, and
`scripts/e2e/run.sh` keeps auth on DummyJSON ("auth keeps the DummyJSON demo
backend"), which no longer has an adapter. `remove-demo` didn't touch
`.maestro/`, and `docs/remove-demo.md#what-you-get` doesn't mention it.
`AGENTS.md#gates` says "add a flow in `.maestro/` for a new user journey";
I didn't. Without a device I couldn't run one, and a Notes flow needs
`run.sh` to start `mock-backend/server.js` and the flow to switch failure on
and off. The contract's `.fail` file can't be created from a Maestro script
(`set-api-mode.js` only does HTTP). Reworking the e2e harness is its own task.

**F11. "No other code changes" isn't true for analytics.**
`docs/plug-in-a-provider.md`: "write a small adapter to the seam's
interface, and register it in `shared/integrations/setup.ts` ... No other
code changes." Registering one broke the starter's own
`__tests__/shared/integrations/screenTracking.test.tsx`: it sets a mock
provider, then `renderRouter('./app')` loads `app/_layout.tsx`, whose
`configureIntegrations()` replaces it. The fix ("run the app's own
registration first, then use this test's adapter") already existed in
`__tests__/shared/session/tokenStore.test.tsx`, but the docs don't mention
it. `docs/testing.md` could say: tests that set a seam and render the full
app must call `configureIntegrations()` first.

**F12. A tab that needs sign-in isn't covered.** `docs/conventions.md#adding-a-screen`
offers `app/<name>.tsx`, `app/(app)/<name>.tsx` "to require sign-in", or a tab
in `app/(tabs)/`. Tabs can't be in `(app)`, and the Notes endpoint requires
auth. Signed out, `api` sends no token, so the request would just 401
(`docs/api-and-storage.md#expired-sessions-401`: "a 401 ... on a request sent
without a token does not touch the session") and show a raw error.
I made `NotesScreen` check `useSession()` and show a sign-in prompt instead.
Fine, but it's a choice the docs could make for you.

**F13. Smaller gaps.**

- `docs/plug-in-a-provider.md#analytics` says "Call `track` for events and
  `identify` after sign-in" without saying where sign-in can be observed
  (there's no sign-in event, only `onSessionExpired`). I didn't wire
  `identify`.
- Android emulators and devices can't reach `localhost:4000`. Only the e2e
  section mentions `adb reverse`; `docs/connect-your-backend.md#1-point-the-app-at-your-servers`
  doesn't. I put a note in `.env.example`.
- `npx expo export` (the CI web export) builds with `__DEV__` false, so
  `EXPO_PUBLIC_APP_ENV` defaults to `production` and the `http://localhost`
  URLs from `.env` fail validation: the exported site opens on the
  Configuration error screen. The export _command_ passes, so CI won't
  notice. `docs/environment-variables.md#variables` explains the https rule
  but not this interaction.
- The AuthAdapter snippet's file location (`features/auth/myBackendAdapter.ts`,
  at the feature root) doesn't match the folder list in
  `docs/conventions.md#project-structure` (`screens,components,api,hooks,types.ts`).
  I followed the snippet.

## Changes outside the new feature (for review)

- `shared/http/apiError.ts`: reads `error.message` from an error envelope (F4).
- `shared/session/authService.ts`: optional `AuthAdapter.logout`, run by
  `authService.logout()` (F5).
- `shared/i18n/en.ts` / `features/auth/screens/LoginScreen.tsx`: "Email"
  label and email keyboard (F6).
- `eslint.config.js`: `mock-backend/**` may read `process.env` (F2).
- `__tests__/shared/integrations/screenTracking.test.tsx`: calls
  `configureIntegrations()` first (F11).
- `.gitignore`: `mock-backend/.fail`.

## Verdict

Mostly yes. The seams are where the docs say, and every snippet I copied
compiled. Registering an adapter, adding an endpoint, a screen, a tab, i18n
strings, and an analytics provider all went as described, and the gates are
well documented. It was not _entirely_ from the docs alone, for three reasons:

1. After `init-project --remove-demo`, the docs still point at the deleted
   demo for the list/loading/error/retry example and its test, and at
   demo credentials and Explore flows that no longer work (F1, F3, F10).
2. A realistic backend needed the docs' "nothing in `shared/` changes"
   promise broken twice: an error envelope (F4) and server-side sign-out with
   a refresh token (F5). Where a refresh token lives needed reading
   `tokenStore.ts` (F8).
3. Registering a provider broke a starter test, and the fix was only in
   another test file (F11).

I'd estimate 80% of the work was doc-driven. The rest came from reading
`shared/` code, which the docs do point to.
