# Issue #134: upgrade to Expo SDK 58 (React Native 0.88, React 19.3)

Branch `sdk-58`, draft PR #135. Last runtime change: 050b01a. Head: b6d6379 (docs and comments after 050b01a). Not merged: criterion 8 is the maintainer's decision.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | SDK 58 versions; `expo install --check` and doctor pass; lockfile reproducible with `npm ci` | PASS | 3236556. `expo install --check`: up to date; doctor 20/20. `npm ci` in every CI run on the branch. Dependencies outside the SDK keep their versions (axios, zod, Paper, react-native-web, TypeScript, ESLint, Prettier). RNTL 14 (`test-renderer`) and Jest 30 because expo-router 58 has a peer `@testing-library/react-native >= 14`. |
| 2 | Every test passes on RNTL 14, none removed or weakened; docs' test snippets updated | PASS | b90bc84 and later. 708 → 732 tests (`gates.log`). Removed `UNSAFE_` queries replaced with a DocumentTitle stand-in, `prototype.render` spies for StatusBar and KeyboardAvoidingView, and held promises for loading states. R1 mutation-tested every rewritten assertion: all killed. `docs/testing.md` describes the async APIs. |
| 3 | App code compiles under the Strict TypeScript API without hiding casts | PASS | 3f6358e: the password ref is a `TextInputInstance`; tab icons take the tab bar's tint colors by `focused`. R1 checked focus still reaches the native input and the icon colors match on all platforms. |
| 4 | `web.output` explicit; still a single-page app | PASS | 1023154: `output: 'single'` (tested). The JavaScript is split per route; Getting Started's hosting note says to keep the previous deploy's `_expo/static/` (R1/R2 verified the on-demand loading in the export). |
| 5 | E2E with Expo Go 58: Android Expo Go, Android native, iOS native on Actions; iOS Expo Go locally | PASS | `e2e-actions-050b01a.txt`: Android Expo Go 39306435483 7/7 + dark; Android native 39306443113 7/7 + dark; iOS native 39306448903 7/7 + dark on the retry (see Notes). `e2e-ios-expogo58-local.txt`: 7/7 + dark, no retry. Earlier heads: c4ee546 green on all three. Screenshots in `sheets/` (15, 15, 14, 14), all looked at. Expo Go 58.0.4 pinned by the release's asset digest (9c34427). |
| 6 | Docs updated; init-project still passes every gate | PASS | 9c34427 (versions), conventions (anchor, undeclared tabs, the guards' behaviour and navigation after sign-in/out, returning to a tab), testing, getting-started. R6/R8 ran `init-project --remove-demo --remove-recipes` in committed copies: every gate passes (596–599 tests); the `@demo` blocks in the new tests come out cleanly. |
| 7 | Gates, format, docs:check, CI pass; a confirmation round finds no HIGH or MEDIUM | PASS | `gates.log` (732 tests). CI, Audit, CodeQL green on 050b01a and b6d6379. Confirmation rounds R1–R10 below; R10 found none. |
| 8 | (maintainer) merge when the store Expo Go supports SDK 58, or at the deadline | OPEN | The store Expo Go was still SDK 57 on 2026-10-19 (`api.expo.dev`). |

## Behaviour changes found by the upgrade

- **Expo Router 58 renders a guarded screen as `<Redirect>` → `replace('/')`** (`useScreens.js`, `link/Redirect.js`). Each sign-in and sign-out stacked a new Home (3, 5, 7 after each round; R1, HIGH), and a user signing in over another screen didn't return to it (R2). `useNoExtraHome` in `app/_layout.tsx` undoes only that redirect: right after the session changed, while a guarded group (`GUARDED_GROUPS`) was on top, the group replaced at the same length by Home on its first tab. Rounds R3–R8 narrowed it so it leaves the app's own navigation alone (navigate/push/Link to tabs, the app's own replace, moves between the groups). Each condition has a test; `audit/*` holds every round's scenario files and logs.
- **Tabs route only declared screens.** Conventions says so; the tab error-boundary tests replace the declared Home.
- **`useRouter()` returns a new imperative router**, and `router.dismissTo` throws before the navigator renders: (auth) uses the module router; "Go home" tries `replace` on its own.
- **Profile's back button**: its options are read once before the stack below settles; it now always shows on the group's first screen and decides when pressed.
- **jest-expo 58 doesn't mock the `AssetRegistry` expo-asset 58 reads**: `jest.setup.ts` mocks it (with a note to remove it when jest-expo does).
- **Navigating to a tab from a screen pushed over the tabs** pushes a second copy of the tabs (Expo Router's behaviour, with or without a session change): Conventions says to use `dismissTo('/<tab>')`.

## Confirmation rounds

| Round | On | HIGH/MEDIUM found | Fixed in |
|---|---|---|---|
| R1 | 3236556..9c34427 | HIGH duplicate Homes; MEDIUM undeclared-tab docs, web redeploy chunks, a Profile back test that didn't check its name | 51d8e04, b0c6098 |
| R2 | 51d8e04, b0c6098 | sign-in/out over another screen didn't return to it | 60e0c35 |
| R3 | 60e0c35 | navigate/push/Link to tabs from stacked screens did nothing | 83b66e5 |
| R4 | 83b66e5 | the app's own replace from Login/Profile was undone | c4ee546 |
| R5 | c4ee546 | no regression; test gaps (now covered) and a documented limitation | the test commit after c4ee546, c517314 |
| R6 | c517314 | docs: replace('/') after sign-in is undone (advice changed to dismissTo) | 5fb2731 |
| R7 | 5fb2731 | the dropped flag reset was needed; replace with a tab adds a Home (docs) | 050b01a |
| R8 | 050b01a | docs advice wrong on tabs | a93a9fe |
| R9 | a93a9fe | "navigate as usual" wrong on a pushed screen | ce5909e |
| R10 | ce5909e | none (3 LOWs on wording, fixed in b6d6379) | — |

## Recorded LOWs

- **Mutants that survive** in `useNoExtraHome`: the Home-tab check after remove-demo (only the Home tab remains then), `length <=`, the `tab` dependency, and the order of the same-top return; equivalent or unreachable in the scenarios (`audit/*mut*.log`).
- **The iOS native first attempt failed flow 04**: after the password and Enter, Login showed "Invalid credentials" (`ios-native-first-attempt-flow04.png`); the mock got two logins with no other failure. The masked password can't be checked by the flow, so this looks like the simulator dropping keystrokes (as #110 saw for the username). The retry passed 7/7. A follow-up could retype the password when "Invalid credentials" shows.
- **`await signIn(); router.push/navigate(X)` loses X**: Expo Router's behaviour; Conventions says to navigate right after, with dismissTo or replace.
- **A non-group screen pushed over Login/Profile**, with `back()` in the same tick as the sign-in, leaves a second Home (R10 LOW 1); rare.
- **A second guarded group** must be added to `GUARDED_GROUPS` (Conventions and the code comment say so).

## Notes

- The root cause is upstream (Expo Router 58.0.24, the latest on 2026-10-20): `Stack.Protected` redirects with `replace('/')`. Reporting it to expo/expo is the maintainer's decision.
- The disk on the maintainer's machine had about 3 GB free; downloads were deleted after use.
