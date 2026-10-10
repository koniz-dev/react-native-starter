# Friction log: building on the starter from its docs

Times come from `date '+%H:%M:%S'`, taken at the step boundaries marked
"(recorded)". I wrote the analytics adapter in the same pass as the auth
adapter, so steps 2 and 4 share a window.

## Steps

| #   | Start     | End      | Doc sections followed                                                                                                                                                                                                       | What happened                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | 23:40:15  | 23:40:31 | README.md, AGENTS.md, docs/README.md, all of docs/ (recorded)                                                                                                                                                               | Read everything first. The docs were dense but on point: conventions.md even has a "Notes" tab example, and connect-your-backend.md has a non-DummyJSON adapter that almost matches our backend.                                                                                                                                                                                                                                                                                                          |
| 1   | 23:40:31  | 23:41:25 | conventions.md#where-code-goes ("Dev-only Node code (a mock backend, tooling)"), connect-your-backend.md#a-backend-on-your-computer                                                                                         | Wrote `scripts/mock-backend/server.js` plus `npm run mock-backend`. Lint treats `scripts/` as Node, as documented. Smoke-tested every endpoint (login 201/422, me 200/401, notes 200/401/503 with `.fail`, refresh 200 then 401 on reuse, DELETE 204) on a spare port with a throwaway script, then stopped the server (checked with `pgrep`). Added the `.fail` file to `.gitignore`.                                                                                                                    |
| 2   | 23:41:25  | 23:42:18 | connect-your-backend.md#2-sign-in-write-an-authadapter, #refresh-tokens, #a-login-response-without-the-user, #your-backends-field-names, #1-point-the-app-at-your-servers; environment-variables.md#variables (recorded)    | Wrote `features/auth/siteNotesAdapter.ts`, based on the doc's example: rotating refresh tokens, revoke on logout, user from `/me`. I added `{ data }` unwrapping and zod validation. Registered it in `shared/integrations/setup.ts`. Pointed both URLs at `http://localhost:4000` in `.env.example`, with demo backends off, and created a local `.env` (git-ignored). Changed the login label to "Email" and set the email keyboard/autofill, as the doc suggests. The existing 203 tests still passed. |
| 4   | ~23:41:40 | 23:42:18 | plug-in-a-provider.md#analytics, setup.ts header comment                                                                                                                                                                    | Wrote `shared/integrations/adapters/memoryAnalytics.ts`, which records calls in memory (capped) and logs them at debug level. Registered it with `analyticsSeam.set(...)` in `configureIntegrations()`. The screen does the tracking: `notes_loaded {count}` and `notes_retry {error}`. Screen views were already automatic (`useScreenTracking`).                                                                                                                                                        |
| 3   | 23:42:18  | 23:44:35 | conventions.md#adding-a-screen, #a-tab-that-needs-sign-in, #code-style; connect-your-backend.md#3-add-endpoints-for-a-feature; testing.md#network, #two-kinds-of-ui-tests, #a-seam-or-adapter-in-a-full-app-test (recorded) | `features/notes/{types.ts, api/notesApi.ts, components/NotesList.tsx, screens/NotesScreen.tsx}`, route `app/(tabs)/notes.tsx`, a tab in `app/(tabs)/_layout.tsx`, and strings in `en.ts`. Tests: NotesScreen (signed-out prompt; loading → 503 error → Retry → list; empty; malformed payload), the adapter against a fake backend, the memory analytics plus its registration, and a full-app Notes tab test. Everything passed on the first run.                                                        |
| 5   | 23:44:35  | 23:45:55 | AGENTS.md#gates, getting-started.md#scripts, .github/workflows/ci.yml (recorded)                                                                                                                                            | `lint`, `type-check`, `test:ci` (27 suites, 221 tests, coverage 97.99/91.48/96.15/98.17) passed. CI extras: `format:check` passed. `docs:check` failed once (see F6), then passed. `audit:check` and `expo-doctor` passed (21/21), and so did `expo export --platform web` (to a temp dir).                                                                                                                                                                                                               |
| 6   | 23:45:55  | 23:46:36 | AGENTS.md#gates ("add a flow in `.maestro/` for a new user journey"), testing.md#end-to-end-flows-maestro (recorded)                                                                                                        | Added `.maestro/02-notes-signed-out.yaml` (the signed-out Notes tab, then Login) and listed it in `.maestro/config.yaml` and testing.md. **I did not run it**: there was no booted simulator, and the task allowed no long-running Metro. Documented `npm run mock-backend` in scripts/README.md and getting-started.md#scripts. Re-ran format:check and docs:check, which passed.                                                                                                                        |

## Where the docs were wrong, missing, ambiguous, or out of date

**F1. Success envelopes aren't covered.** connect-your-backend.md lists how
backends usually differ ("`POST /sessions` ... returns only tokens:
`{ "access_token", "refresh_token" }`"), and #error-messages handles an
`{ "error": { ... } }` envelope. Nothing mentions a **success** envelope like
our `{ "data": { ... } }`. The example's `http.post<Tokens>(...)` would
type-check fine against our backend and then fail at runtime with "did not
include an access token".

- _What I did:_ unwrapped `data` in the adapter. A one-line note would help:
  "if your backend wraps responses, unwrap them in the adapter".

**F2. "Validate API payloads in adapters," but the example doesn't.**
AGENTS.md / conventions.md#code-style say: "Validate data at the edges
(config with zod, API payloads in adapters)". The documented adapter only
casts (`raw as Partial<MyUser>`, `http.post<Tokens>`). The endpoint example
(`postsApi`) and `useFetch` don't validate either.

- _What I did:_ added zod schemas in `siteNotesAdapter.ts` and `notesApi.ts`.
  There's no recommended pattern, so it's a guess at the intended style.

**F3. Base URL with or without the path prefix?** The example uses
`/sessions` and `/me` relative to `EXPO_PUBLIC_AUTH_API_URL`. Our backend
lives under `/api/v1`, and the task fixed the URL at `http://localhost:4000`.
The docs never say whether the variable may contain a path, such as
`http://localhost:4000/api/v1`. The validation rules only say "absolute
`http(s)` URLs", and the token goes by origin, so a path would probably work.

- _What I did:_ kept the origin-only URL and wrote `/api/v1/...` in every
  call.

**F4. Two mock servers, and the docs point at the stale one.**
testing.md#end-to-end-flows-maestro says `run.sh` "starts a local mock API
(`scripts/e2e/mock-api.js`, on port 9999)" and "Add the endpoints your flows
need to the mock". After `init-project --remove-demo`, that mock still serves
only the demo's `GET /todos`, which no screen uses any more. conventions.md
says a dev mock backend goes "in `scripts/`, ... in its own folder". The docs
never say whether a project's own mock backend should replace the e2e mock,
extend it, or live beside it.

- _What I did:_ kept them separate. `run.sh` still points the app at the e2e
  mock, so a signed-in e2e flow would need `E2E_AUTH_API_URL` plus the notes
  endpoints added to `mock-api.js`, or `run.sh` changed to use the new mock.

**F5. Signed-in e2e flows are only half documented.** testing.md: "sign-in
flows need a test account on your backend"; `run.sh`: "For sign-in flows, set
E2E_AUTH_API_URL to your backend". `EXPO_PUBLIC_API_URL` is still forced to
the e2e mock, so a signed-in Notes flow can't reach `/api/v1/notes` without
editing the runner.

- _What I did:_ wrote only a signed-out flow. Even that one is unverified.

**F6. `docs:check` rejects a path that is meant not to exist.** I first wrote
"Create `scripts/mock-backend/.fail`" in scripts/README.md, and `docs:check`
failed with "path does not exist: scripts/mock-backend/.fail". docs/README.md
says it "checks every path", but not how to mention a file the reader is
supposed to create.

- _What I did:_ reworded it to "an empty file named `.fail` next to
  `server.js`".

**F7. The tab example reuses Home's strings, and its signed-out wrapper has
no theme background.** The snippet in conventions.md#a-tab-that-needs-sign-in
calls `t('home.session.signedOut')` (it does say "Use your own strings"), and
its `SafeAreaView` lacks the `theme.colors.background` that #adding-a-screen
uses. The same snippet declares `NotesList` as a stub ("loads with
useFetch"), so you have to merge it with the PostsScreen example from another
page yourself. That's minor, but it's the one place where copying the doc
gives you a slightly wrong screen.

- _What I did:_ added my own `notes.*` keys, kept one themed `SafeAreaView`
  for both states, and used a plain `View` for the prompt.

**F8. Tests can't see the token on `api` requests.** testing.md#requests-that-carry-the-token
explains this well: with demo backends on in Jest, `api` and the auth backend
sit on different origins. So the Notes screen test can't assert that
`Authorization: Bearer` is sent to `/api/v1/notes`, even though in our real
setup both URLs share one origin. The `getConfig()` mock recipe exists, but
it's opt-in for each file.

- _What I did:_ left the token check to the adapter tests and the manual curl
  smoke test.

**F9. Small inconsistencies.**

- AGENTS.md lists the CI extras as `format:check`, `docs:check`,
  `audit:check`, "and a web export". getting-started.md#scripts and ci.yml
  also run `npx expo-doctor`.
- testing.md#layout listed only `auth/ home/` under `__tests__/features/`,
  which was expected for the starter. I updated it.
- `expires_in` is in our contract, but the docs only describe refresh on 401.
  Proactive refresh isn't mentioned, which is acceptable.

**F10. Registering a provider is quiet in tests, but not silent.** Once the
memory analytics is registered, every full-app test logs `[analytics] screen`
lines. The debug default did the same, so this isn't new noise, and nothing in
the docs is wrong. It's just something to know.

**What worked well:** the "Where code goes" table answered every placement
question. The `holdRequests()` test recipe in testing.md#network worked
unchanged for the Notes screen. ApiError's envelope parsing meant our
`{ "error": { "message" } }` showed up in the UI without any mapping. The
"call `configureIntegrations()` before setting a mock" warning meant
registering real adapters broke none of the 203 existing tests.

## Verdict

**Yes, mostly from the docs alone.** Each task mapped to a specific doc
section, and the examples are close to copy-paste for a backend like ours.
The gaps I had to fill with my own judgment were:

- success envelopes (F1);
- what "validate payloads in adapters" should look like (F2);
- whether the base URL may contain a path (F3);
- how a project's own mock backend relates to the e2e mock and runner (F4,
  F5).

None of them blocked me for long. The e2e side is the weakest part: a
signed-in Maestro flow against our backend would mean editing
`scripts/e2e/run.sh`, which the docs don't cover. The flow I added has not
been run.
