# Confirmation round R11 (2026-11-06)

On ff6918a (the reworked `useNoExtraHome`) and the dependency bumps since b6d6379
(expo 58.0.23, expo-router 58.0.30). Independent reviewer: read Expo Router's guard redirect
(`useScreens.js` renders `<Redirect>`; `link/Redirect.js` replaces in `useFocusEffect`;
`router.dismiss()` pops the root stack) and ran 21 `renderRouter` scenarios.

Result: **no HIGH or MEDIUM**.

Correct (root stack as expected): links to a refused group from Login, Profile, a nested
(app) screen and the Explore tab; a double push to /profile; sign-in followed at once by
`dismissTo('/explore')` or `back()`; sign-out on Profile followed at once by a replace; a
401 on a screen pushed over Profile; same-tick navigate+push pairs.

LOWs:

1. A `replace` from Home into a refused group made the hook dismiss a one-route stack
   (dev-only "POP not handled" error). Fixed in cc61fe8 (`length > 1`), with a test that
   fails without the condition.
2. A `replace` into a refused group lands on Home and the replaced screen is gone (not a
   regression: before ff6918a it left two Homes). Documented in 2d7f954 (Conventions).

Documented behaviour confirmed, not bugs: `await signIn(); router.push(X)` loses X and
leaves a second Home (Conventions says to navigate right after, with dismissTo or replace);
a 401 on Profile followed later by the app's own `replace('/')` from another screen.

Pre-existing, out of scope: `goHome()` in `shared/ui/ErrorBoundary.tsx` calls `dismissTo('/')`
and then `replace('/')` when neither throws (unchanged since b6d6379).
