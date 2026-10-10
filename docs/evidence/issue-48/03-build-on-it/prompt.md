You are a developer who just created this app ("Field Notes") from a React Native starter template and ran its init command. Build on it using ONLY what this repository's own docs (README.md, AGENTS.md, docs/) tell you. Read the code when the docs send you there, but don't rely on outside knowledge of this starter.

Tasks:

1. Our backend is not DummyJSON. Write a small local mock of it at `mock-backend/server.js` (plain Node `http`, no dependencies, port from `PORT`, default 4000) with this contract:
   - `POST /api/v1/sessions` body `{ "email", "password" }` → 201 `{ "data": { "access_token", "refresh_token", "expires_in": 900 } }`; wrong credentials → 422 `{ "error": { "code": "invalid_credentials", "message": "..." } }`. Valid user: `field@example.com` / `notes-123`.
   - `POST /api/v1/sessions/refresh` body `{ "refresh_token" }` → 200 same shape as sessions; unknown token → 401.
   - `GET /api/v1/me` with `Authorization: Bearer <access_token>` → 200 `{ "data": { "id": "u_1", "email", "display_name": "Field Tester" } }`; missing/expired token → 401.
   - `GET /api/v1/notes` (auth required) → 200 `{ "items": [{ "id", "title", "created_at" }, ...] }`. If the file `mock-backend/.fail` exists, every `/api/v1/notes` request returns 503, so the app's error and retry can be tested.
   - `DELETE /api/v1/sessions` → 204.
   Also add `npm run mock-backend` to start it.
2. Register an `AuthAdapter` for this backend (including refresh) the way the docs describe, and point `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AUTH_API_URL` at `http://localhost:4000` with the demo backends turned off. Update `.env.example` accordingly (keep `.env` uncommitted).
3. Add one feature: a "Notes" list screen that loads `GET /api/v1/notes`, with loading, error, and retry states, a route (a tab is fine), i18n strings, and tests, following docs/conventions.md.
4. Plug the analytics seam into a fake provider (an adapter that records events in memory and logs them), following docs/plug-in-a-provider.md, and track a screen view or an event from the Notes screen.
5. Run the gates the docs name and make them pass.

While you work, keep a friction log in `FRICTION.md` at the repo root:
- one row per step, with the start and end time (run `date '+%H:%M:%S'`), the doc section(s) you followed (file#heading), and what happened;
- every place the docs were wrong, missing, ambiguous, or out of date, quoted, with what you had to do instead;
- end with a short verdict: could you do this from the docs alone?

Do not start long-running processes and leave them running; if you start the mock backend to try it, stop it. Do not commit; leave the changes in the working tree. Do not install new npm dependencies.
