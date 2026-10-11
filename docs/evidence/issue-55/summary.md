# Issue 55 verification — e2e flows against your own backend or mock

Verified on 2026-10-11 on `main` at
[`d04e9ba`](https://github.com/koniz-dev/react-native-starter/commit/d04e9ba)
and [`de8bc38`](https://github.com/koniz-dev/react-native-starter/commit/de8bc38)
(a docs note added after the run).

## Change

- **`scripts/e2e/run.sh`.**
  - `E2E_API_URL` sets the app's API URL; the default is still the e2e mock.
  - `E2E_AUTH_API_URL` sets the auth URL. While the demo is in place it
    defaults to the DummyJSON demo backend, as before. After `remove-demo` it
    defaults to `E2E_API_URL`, which keeps the old behavior (both URLs on the
    mock) when nothing is set.
  - `E2E_BACKEND_CMD` is a command that starts the backend or mock in the
    background. The runner waits until `E2E_API_URL` answers over HTTP, writes
    its output to `e2e-results/<platform>/backend.log`, and stops it at the
    end.
  - On Android, every `localhost` / `127.0.0.1` port among the mock, API, and
    auth URLs gets `adb reverse`, not only 9999.
  - The auth URL is passed to Metro only when it is set, so a `.env` value is
    still used in demo mode, as before.
- **`scripts/e2e/mock-api.js`.** It is now generic. `error` mode answers
  every request with a 503. `ok` mode serves a `ROUTES` table. The demo's
  `GET /todos` sits between `@demo` markers, so `remove-demo` deletes it and
  leaves `const ROUTES = {};` ([after-remove-demo/](after-remove-demo/)).
- **`docs/testing.md`.**
  - The runner paragraph says what the e2e mock is for: error states that a
    flow switches.
  - A new "Your backend or mock" section has the three variables, an example
    command, and how signed-in flows use a test account through `MAESTRO_*`
    variables.
  - It also covers remote or HTTPS backends.
  - Added in `de8bc38`: the results contain the test account's values (found
    in this run), so use a test-only account.
- **`docs/remove-demo.md`** says the mock's demo route goes, and links the new
  section.
- **`__tests__/scripts/removeDemo.test.ts`** checks the stripped runner
  (`DEMO_BACKENDS=false`, auth URL defaulting to `$API_URL`) and the empty
  `ROUTES`.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                                                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `run.sh` accepts the API URL and forwards the ports it needs with `adb reverse`, so `npm run test:e2e:android` runs against a project's own backend or mock; with nothing set, unchanged                                     | **Own mock:** [adopter-run/](adopter-run/), below; the backend on port 4000 was reached through the new `adb reverse`. **Unchanged:** the starter's own suite with no variables set, `npm run test:e2e:android`: 6/6 flows plus dark mode, exit 0 ([log](starter-default/test-e2e-android.log), [report](starter-default/report.xml)). The mock served `/todos` in both modes as before ([mock log](starter-default/mock-api.log))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | PASS   |
| 2   | `docs/testing.md` explains the e2e mock's role and how to use your own backend or mock, including signed-in flows with a test account; after `remove-demo` the mock serves no demo-only data, or the docs say what it is for | [Testing → Your backend or mock](https://github.com/koniz-dev/react-native-starter/blob/de8bc38/docs/testing.md#your-backend-or-mock). After `remove-demo` on a copy of the tree, the mock's `ROUTES` is empty, and the docs section reads without the demo ([testing-e2e-section.md](after-remove-demo/testing-e2e-section.md), [run.sh](after-remove-demo/run.sh), [mock-api.js](after-remove-demo/mock-api.js)). `docs:check` passes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | PASS   |
| 3   | A signed-in flow against a local mock runs green through `npm run test:e2e:android` on the emulator                                                                                                                          | **Setup.** A copy of the #53 trial project (`init-project --remove-demo`, then the Site Notes adapter, Notes tab, and `scripts/mock-backend/`). Its `run.sh`, `mock-api.js`, and `testing.md` were replaced with the `remove-demo` output above ([changes.txt](adopter-run/changes.txt)). New flow: [03-notes-signed-in.yaml](adopter-run/03-notes-signed-in.yaml). **Command:** `E2E_API_URL=http://localhost:4000 E2E_BACKEND_CMD="npm run mock-backend" MAESTRO_E2E_USERNAME=… MAESTRO_E2E_PASSWORD=… npm run test:e2e:android`. **Result:** 4/4 flows plus dark mode, exit 0 ([log](adopter-run/test-e2e-android.log), [report](adopter-run/report.xml)). The flow signs in as Field Tester, the Notes list loads, the session survives a relaunch, and log out works. [Backend log](adopter-run/backend.log): `POST /api/v1/sessions 201`, `GET /api/v1/me 200`, `GET /api/v1/notes 200`, `DELETE /api/v1/sessions 204`. [Screenshots](adopter-run/screenshots-sheet.png), each checked | PASS   |
| 4   | Gates pass; CI is green                                                                                                                                                                                                      | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log) (268 tests). CI run 38140867680 on `de8bc38` (which includes `d04e9ba`): success ([log](github-actions-ci-38140867680.log)). The run for `d04e9ba` was cancelled by the newer push (concurrency)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | PASS   |

## Notes

- **Credentials in Maestro's results.** Maestro writes the values of
  `MAESTRO_*` variables into `commands.json` and its logs in `e2e-results/`.
  The test account here is the trial mock's made-up account. Only the
  runner's summary log, the JUnit report, the backend log, and screenshots
  are kept here; Maestro's own result folders are not. The docs warning was
  added in `de8bc38`.
- **Not changed:** the manual `e2e-android` GitHub workflow. It runs the
  default (the e2e mock). A project that wants signed-in flows there would
  pass the `E2E_*` and `MAESTRO_*` values from repository secrets; nothing in
  the workflow blocks that.
- **The trial copy** lives in the session scratchpad only, so deleting
  `koniz-dev/rns-adopter-trial-2` and its clone doesn't affect this evidence.
