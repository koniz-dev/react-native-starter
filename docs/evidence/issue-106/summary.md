# Issue #106: a refresh that rotates during sign-out leaves a live refresh token

Found in the confirmation audit of v1.1.11..main (2026-10-16). It is a regression
from the #102 fix to the docs' example adapter.

Fix: 1e331f8 (the example adapter in `docs/connect-your-backend.md` and a regression
test). 6870cdc fixes the LOWs.

## Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Refresh rotates while logout revokes: after sign-out no refresh token is stored and the backend has none valid. Fails before, passes after; the slow-logout/new-session test still passes. | PASS | `test-before.log`: on the old snippet the stored token is `"refresh-2"`. `test-after.log`: 14/14, including "keeps the next session when a slow logout finishes after the user signed in again". |
| 2 | The Revocation bullet describes the new rule. | PASS | `docs/connect-your-backend.md`, "Revocation": it counts sign-ins, doesn't compare tokens, and revokes the rotated one. |
| 3 | The LOWs are done. | PASS | The HomeScreen session tests reset the adapter in `afterEach`. `api-and-storage.md`: a failed request sets `data` to null. `testing.md`: the e2e-ios `ref` input. |
| 4 | Gates, docs:check and CI are green. | PASS | `gates.log` (Node 24.21.0): lint, type-check, format and docs:check are clean, and 580/580 tests pass. CI and Audit pass on 6870cdc. |

## The fix

Before, the example's `logout` cleared the refresh token in `finally` only if it was
still the one it had revoked. That check stood in for "the user signed in again", and
rotation breaks it:

1. A 401 starts a refresh, and the backend rotates refresh-1 to refresh-2.
2. Logout revokes refresh-1.
3. The refresh answer stores refresh-2. The stored token was still refresh-1, so the
   refresh's own check passed.
4. `finally` sees refresh-2, which is not refresh-1, so it keeps it.

The example now uses a module-level `signIns` counter instead. It goes up in `login`
before the token is stored, so a logout's `finally` can't run between storing the
token and counting the sign-in. If the count hasn't changed, `finally` revokes a
rotated token (failures are ignored) and then clears.

This is a docs-only change: `shared/` didn't change, and the generation check in
`authService.logout` (#102) still handles the access token and profile.
