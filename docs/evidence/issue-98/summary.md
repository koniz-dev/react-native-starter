# Issue 98: e2e after remove-demo (fix 623f3c2; verified on main 22e433a)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | A sign-in subflow with `MAESTRO_E2E_USERNAME`/`PASSWORD` and the iOS workarounds survives remove-demo; the demo flows use it; documented | `tests-before-after.txt`: the remove-demo test (subflows kept, sign-in uses the variables, no demo account in run.sh) fails before, passes after; Testing "Writing a flow", Remove the Demo | PASS |
| 2 | run.sh passes the API URL to flows; documented | same test (`-e "API_URL=$API_URL"`); run.sh header, Testing | PASS |
| 3 | Testing mentions selecting list items by testID | Testing "Writing a flow" | PASS |
| 4 | Gates and e2e green; after remove-demo a signed-in flow written as Testing says passes on iOS without extra workarounds | `e2e-ios.txt`: template 7/7 plus dark on iOS; Pocket Notes (init --remove-demo, #97) with the template's subflows copied verbatim 4/4 on iOS. `e2e-android.txt`: Android Expo Go and native debug 7/7 each on 22e433a. CI, Audit, CodeQL green on 22e433a | PASS |
