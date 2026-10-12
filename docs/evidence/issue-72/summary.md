# Issue 72 verification: UI, accessibility, i18n

Fix: [`29787bc`](https://github.com/koniz-dev/react-native-starter/commit/29787bc)
(and the sign-out / login fixes in `ab8d19e`).

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Fixed with tests (behavior) and checked on devices and web (visual) | [tests.log](tests.log) (133): not-found route (fails without app/+not-found.tsx), Login back from a direct open, double submit (mutant killed), field labels and autocorrect, translated errors (network, developer error logged not shown), error boundary text outside development, keyboard behavior per platform, Profile placeholders and 401. Screens on devices: [iOS](../issue-74/verification/ios-expo-go/screenshots-sheet.png), [Android Expo Go](../issue-74/verification/android-expo-go/screenshots-sheet.png), [native](../issue-74/verification/android-native-debug/screenshots-sheet.png): Login header with back, "The server had a problem. Please try again later.", brand-tinted cards, Profile reloaded. Web: dark background before JS rgb(21, 23, 24) from public/index.html; release smoke in the release issue | PASS |
| 2   | Every user-visible string through t(); developer details to the logger | errorMessage() for requests; Showcase strings in en.ts; the not-configured adapter message is logged, users see "Login failed. Please try again." | PASS |
| 3   | Contrast ≥ 4.5:1 for primary on background and elevation 1–3 (all 5 tested), both themes | theme.test.ts: primary and onSurface on every elevation level, onSurfaceVariant, onSecondary; 7 of these failed on the old theme | PASS |
| 4   | Gates before and after init; e2e and web pass | CI 38292179524; [init-gates.log](../issue-74/verification/init-gates.log); e2e iOS 6/6, Android 7/7 ×2 | PASS |
