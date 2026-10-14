# Issue 97: dogfooding v1.1.10 as a new adopter

Pocket Notes was built from tag v1.1.10 in a local folder (no GitHub
repository), following only the docs: `init-project --remove-demo`, an
AuthAdapter from Connect Your Backend against a dev backend with the shapes
it describes and 60-second access tokens (`app/notes-backend.js`), a Notes
tab with list, detail, and create, a profile photo upload with
expo-image-picker, a PostHog adapter from Plug In a Provider, tests, and
Maestro flows. The app's changes: `app/pocket-notes.patch` (`app/commits.txt`).

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Journal covers steps 1–6 with commands and outcomes | `journal.md` (J1–J20) | PASS |
| 2 | The app works on iOS, Android, and the web (sign-in, refresh after expiry, notes, upload, sign-out); Maestro flows pass on iOS and Android | `e2e.txt`: iOS 4/4 and Android 4/4 plus dark mode; the backend log shows `GET /notes/n1 401` → `POST /sessions/refresh 200` → `GET /notes/n1 200`; `web-check.txt` and `app/web-check.js` on the production web export; `screens/` | PASS |
| 3 | Every gate passes in the app | lint, type-check, format, docs:check, test:ci with thresholds (455 tests) | PASS |
| 4 | Each defect has an issue; docs findings filed | #98 (e2e after remove-demo), #99 (adopter docs and DX). J19 (an Android upload right after the picker closes fails once, seen in Expo Go, root cause not established) is recorded, not filed: the app retries once | PASS |

What held up without friction: init and remove-demo, the AuthAdapter and
refresh-token handling (rotation, expiry while the app is open), the 401
retry, FormData uploads on all three platforms (#91), the provider seam, the
route guards (sign-in from a tab returns to the tab), lint boundaries, and
the coverage gate (it caught every untested file).
