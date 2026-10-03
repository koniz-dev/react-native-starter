# Issue 19 verification — anchor the initial route

Verified on 2026-10-03.

## Root cause

On the Android emulator (API 37, Expo Go 57.0.9) temporary logging in
`app/_layout.tsx` showed `Linking.getInitialURL()` = `exp://localhost:8081`,
no `url` events, no press on the "Try authentication demo" button, and the
pathname going `/` → `/login` during the first render. The root stack had no
`initialRouteName`, so when the launch URL did not produce a matched state it
fell back to the alphabetically first child, `(auth)` → `login`. Jest's
`renderRouter` resolves `/`, `''`, and `exp://localhost:8081` to Home, so the
defect is specific to the Expo Go Android launch path.

## Change

- `app/_layout.tsx` exports `unstable_settings = { initialRouteName: '(tabs)' }`
  and declares `(tabs)` before `(auth)` in the root `Stack`.
- `package.json`: Jest `transformIgnorePatterns` also transforms
  `standard-navigation` (an ESM dependency of expo-router 57), which
  `renderRouter('./app')` needs.
- `app/README.md` explains why the root stack is anchored.

## Acceptance criteria

| #   | Criterion                                                                              | Evidence                                                                                                                                                                                                                                                                                                                                    | Result                                                             |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | `/` deterministically resolves to Home; Login only via `/login` or the button          | `app/_layout.tsx`; [05-navigation-tests.log](05-navigation-tests.log)                                                                                                                                                                                                                                                                       | PASS                                                               |
| 2   | Jest + RNTL routing tests: `/` → Home, `/login` → Login                                | [05-navigation-tests.log](05-navigation-tests.log): 4 tests, including "going back from a deep-linked /login returns to Home". With the anchor removed, the anchor and Back tests fail (checked locally).                                                                                                                                   | PASS                                                               |
| 3   | Cold start opens Home and Back from Login returns Home on Android and iOS (human-only) | Android: [cold start](uat/android-01-cold-start-home.png), [Login via button](uat/android-02-login-via-button.png) → [Back](uat/android-03-back-returns-home.png), [cold deep link /login](uat/android-04-deeplink-login-cold.png) → [Back](uat/android-05-back-from-deeplink-home.png). iOS: [cold start](uat/ios-01-cold-start-home.png). | Android PASS; iOS cold start PASS; **iOS back swipe not verified** |
| 4   | lint, type-check, test:ci, format:check                                                | [01](01-lint.log) (0 errors, 6 existing warnings in `components/ThemedText.tsx`), [02](02-type-check.log), [03](03-test-ci.log) (10 suites / 50 tests), [04](04-format-check.log)                                                                                                                                                           | PASS                                                               |

## iOS back gesture

Login has no header, so on iOS the only way back is the edge swipe. Synthetic
edge drags from the Simulator window (x = 0, 0.5, and 8 pt from the edge, slow
and fast) did not trigger it, while the same drag tool scrolls the Home screen
([screenshot after attempts](uat/ios-02-login-swipe-back-not-driven.png)).
Whether the gesture fails in the app or the synthetic mouse edge-swipe isn't
recognized is undetermined. Human check needed on iOS: open Login from "Try
authentication demo" and swipe from the left edge; it should return to Home.
