# UAT: a link to a refused group while the app runs (iOS Simulator, Expo Go 58.0.7)

The case reported in expo/expo#51916 (comment of 2026-10-26): with the app open, a link to
a group the session guard refuses. On sdk-58 at 2d7f954 (the hook as merged; 00c9677 later
changed only scroll insets), iPhone 16 Plus, iOS 18.6, Metro with the e2e mock.

`refused-link.yaml` (Maestro 2.11.0): fresh state, open `/--/profile` signed out, sign in
through Login, then open `/--/login` signed in. Screenshots after each link.

`root-stack.log`: the root stack's routes logged by a temporary `console.log` in
`useNoExtraHome` (not committed), one line per stack change:

- lines 1-4: a first attempt, stopped by a wrong screenshot path after the Profile link;
- lines 5-8: the Profile link signed out: `(app)` pushed, replaced by a second Home by the
  guard, then the hook pops it: one Home;
- lines 9-12: signing in on Login: `(auth)` replaced by Home, popped: one Home;
- lines 13-15: the Login link signed in: the same, ending with one Home.

Both screenshots show Home (signed out, then signed in as Emily Johnson). Before ff6918a
the links left two Homes (`hook-tests.txt`).
