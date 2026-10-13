# Issue 79: UI and tests (verified on main 261157e; devices on c65c808 / 69afacb)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Double taps open one screen | tests "opens Login once for a double tap…", "opens Profile once for a double tap, and loads it once" fail on 261157e^ (router.push) and pass after (`tests-before-after.txt`) | PASS |
| 2 | Errors announced on iOS and Android | Login (ios announces, android uses the live region), Profile and Explore live regions + announcements: tests in `tests-before-after.txt` | PASS |
| 3 | Demo hint meets 4.5:1 | opacity removed: onSurfaceVariant #40484c on white is 9.3:1 (was ~4.06:1 with 0.7 opacity); visible in `web/sheet.png` (web-04) | PASS |
| 4 | Explore keeps the list while reloading, titles loading, logs unknown errors | tests "keeps the list on screen while it reloads", "logs a response that fails validation…", DocumentTitle in the loading test; `web/smoke.log`: Retry after the 503, Reload after success | PASS |
| 5 | Dead exports removed; listed mutations caught | ErrorFallback, TEST_SAFE_AREA_METRICS, ProvidersOptions unexported, `import React` removed; new tests catch: Login missing reset and trim, Retry disabled/Loading label, snackbar Dismiss (handler made non-redundant), ErrorBoundary dev stack, route boundary Go home retry, (auth) back fallback, tab accessibility labels | PASS |
| 6 | Gates, CI, e2e (Android, iOS, web) | `gates.log` (all exit 0, 409 tests); iOS 7/7 + dark (`ios/`, flow 06 now runs on iOS with auth-back); Android Expo Go 7/7 + dark (`android-expo-go/`); Android native debug 7/7 + dark (`android-native-debug/`); web smoke passed (`web/`). Screenshots reviewed | PASS |
