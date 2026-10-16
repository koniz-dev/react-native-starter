# Issue #108: a late sign-out retries a failed expiry clear; the adapter's logout contract

Fix: f00339a (`shared/session/session.ts`, `shared/session/authService.ts`,
`docs/connect-your-backend.md`, `__tests__/shared/session/authService.test.ts`).

## Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Sign-out is pending, the expiry's clear fails, then the sign-out finishes: the token is cleared. Fails before, passes after. The "newer session" tests still pass. | PASS | `test-before.log` comes from the new test file run on 6870cdc: the stored token is still `"token-a"`. `test-after.log`: 17/17, including "leaves a newer session alone…". The SessionProvider and realBackendAdapter "signed in again" tests pass in `gates.log`. |
| 2 | The `logout` contract (doc comment and docs) says this. | PASS | The `AuthAdapter.logout` doc comment and `docs/connect-your-backend.md` ("On sign-out it calls `logout`…") both say it can outlive its session and must leave a newer sign-in's tokens alone. |
| 3 | Gates and CI are green. | PASS | `gates.log`: 582/582 tests pass. CI and Audit pass on cb74c16. E2E for sign-in, relaunch, and sign-out passes: iOS native 7/7 on cb566e4 (runs 38929767737 and 38929783717) and Android native-debug 7/7 on aa9b4c0 (38924222252). The earlier iOS failures were harness flakes, fixed in #110. |

## The fix

`authService.logout` used to skip its clear whenever the session generation changed.
An expiry also changes it, so if the expiry's own clear failed (for example a locked
Keychain), the pending sign-out didn't clear either, and the token was still there at
the next launch.

`session.ts` now also counts session starts (`getSessionStarts`, which only
`startNewSession` changes). `logout` skips the clear only if a sign-in happened while
the adapter ran. A second clear after an expiry that did clear is harmless. The
generation itself is unchanged, and refresh and fetchProfile still use it.
