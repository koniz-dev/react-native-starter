# Issue #117: dead E2E_APP_URL, flow 07 can't tell a reload happened, open-app taps on a loaded Home, run.sh cleanup

Found in the sixth deep audit (2026-10-17) by auditor D. Auditor D found workflow
security clean: every pin verified, no expression injection, least privilege, and no
cache poisoning.

Fixes:

- 9f9e108: workflows and docs.
- d37ed62: the mock and flow 07.
- f9b6fb6: open-app and run.sh.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `E2E_APP_URL` is removed from the workflows, or made true where it still applies, in the workflows, init-project and the docs. The initProject test is updated. | PASS (made true, after a regression) | See "A regression on the way" below. The workflows set `E2E_APP_URL=rnstarter-dev://` again, with the comment "Its own scheme, not exp://: the flows open the link only for Expo Go". The docs say a native build sets it to its own scheme, and a dev-client build to its dev-client URL. initProject asserts `E2E_APP_URL=acmenotes-dev://` again. |
| 2 | The mock's `/auth/me` returns a different user, and flow 07 asserts the reloaded name. | PASS | `mock-api.js`: `RELOADED_USER` has the first name "Em". Flow 07 asserts `(Name, )?Em Johnson` on Profile and `Signed in as Em Johnson` on Home after Back. The flow passes on every platform (see `e2e-c03d8df.txt`). |
| 3 | Items 2, 4 and 5 are fixed. | PASS | See the notes below. |
| 4 | E2E passes 7/7 plus dark mode on iOS native, Android native and Android Expo Go. Gates and CI are green. | PASS | `e2e-c03d8df.txt`: iOS native 39007926531 and Android native 39007928268, both 7/7 plus dark mode, on the commit with every fix. `e2e-f9b6fb6.txt`: Android Expo Go 39006069558 passed 7/7 plus dark mode; on the same commit iOS native failed from the regression above. CI and Audit pass on c03d8df. `gates.log`: 618/618. |

## A regression on the way

The audit called `E2E_APP_URL` dead config, and 9f9e108 removed it from both
workflows. That was wrong. `run.sh` defaults `APP_URL` to Expo Go's
`exp://127.0.0.1:8081`, and `open-app.yaml` opens every `exp://` URL. Without the
variable, the iOS native run tried to open an Expo Go link that the simulator had no
app for (`LSApplicationWorkspaceErrorDomain` code 115), and flow 01 failed (run
39006065357). The same runs on Android passed only because an unhandled link fails
silently there.

c03d8df puts the variable back, and the comments and docs now say what it is for.

## Notes

### What was fixed for items 2, 4 and 5

- **Item 2, testing docs:** they now say both e2e workflows upload the results.
- **Item 4, open-app:** the steps that dismiss dialogs now run only while
  `tab-home` isn't visible. The "crash fails fast" comment is corrected.
- **Item 5, run.sh:**
  - It stops if a server already answers on the backend's URL before
    `E2E_BACKEND_CMD` starts one.
  - Cleanup restores the device appearance it read at the start. That read is
    `simctl ui appearance` on iOS (checked locally; it returns `light`) and
    `cmd uimode night` on Android.
  - The docs say the username and password defaults are separate.

### Not verified

- The run.sh backend-port check and the appearance restore were checked with `bash -n`
  and by reading the code. They were not run with a real `E2E_BACKEND_CMD`, and not
  on a simulator that starts in dark mode.
- iOS Expo Go was not run locally for this change. Android Expo Go covers the
  open-app change on the Expo Go path.
