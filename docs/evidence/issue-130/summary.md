# Issue #130: Showcase snackbar stayed hidden after a repeat press; UI and session test LOWs

Found in the eighth deep audit (2026-10-18), auditors D and A. Fix: 18c5960 (Showcase), 1ff46e3 (LOWs); tests strengthened in 14033fb.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | A test with animations on a device's schedule fails before and passes after; the same text is shown and announced again | PASS | `test-before.log`: "keeps showing the snackbar after the same button is pressed again" fails on the old screen. `test-after.log`: 10/10. "announces the same message again…" still passes, and `announce-mutation.log` shows it fails without the repeat key. |
| 2 | Checked on the Android emulator after the fix | PASS | Before: `android-before.log` / `android-before.png`: Contained twice, then Outlined and Show Snackbar: no snackbar. (In an earlier timed loop in the same session, after Contained twice the snackbar was absent at three checks over about 7 s, and Outlined then showed nothing; the next double press brought it back, as the race predicts.) After: `android-after.log` (snackbar text present after the repeat and after Outlined) and `android-after.png` ("Contained pressed" shown right after the second tap). |
| 3 | Items 2–7 fixed or recorded | PASS | See below. |
| 4 | Gates, CI, e2e green | PASS | `gates.log`; CI on 18c5960 and later; e2e on c035b39 (Android Expo Go, Android native, iOS native). |

Jest doesn't run a native-driver animation on a device's schedule: a 100 ms fade ended after about 1.1 s in a probe. So the old "closes the snackbar with Dismiss" test passed only because the old screen cleared the text at once; it now runs with the device-timed animation too.

## Items 2–7

- **3 (renderWithProviders ignored setColorScheme): fixed** in 1ff46e3, tested in 14033fb (`__tests__/testing/render.test.tsx`).
- **4 (Todos assertion that couldn't fail): fixed.** `todos-mutation.log`: without `disabled` and the `toBeDisabled` line, the length check now fails (3 requests). Test-name wording: recorded.
- **7 (login ordering): a comment** explains why `startNewSession()` runs before the token write. A test for that interleaving and for the restore guard: recorded; the window is milliseconds and the comment guards a refactor.
- **2 (live region mounts with its text on Android/web): recorded.** Not checked with a screen reader; unchanged by this fix (Paper renders nothing while hidden, before and after).
- **5 (Card.Actions margin): recorded,** cosmetic.
- **6 (Profile hides a 401 that keeps the session): recorded.** The docs require authenticated endpoints not to redirect, and the client logs a warning.

## Confirmation round (R1)

No HIGH or MEDIUM. Mutants that survived (the remount key, the render default, the repeat key with no test outside the demo) are killed by 14033fb (`mutation-r1.log`): "shows a notice pressed while the last one fades out", `render.test.tsx`, `useAnnouncement.test.tsx`. After remove-demo, `useAnnouncement`'s repeat key has no caller but has its own test; it stays as part of the hook's API.

Code: [ShowcaseScreen.tsx](https://github.com/koniz-dev/react-native-starter/blob/14033fb/features/demo-showcase/screens/ShowcaseScreen.tsx), [useAnnouncement.ts](https://github.com/koniz-dev/react-native-starter/blob/14033fb/shared/ui/useAnnouncement.ts).
