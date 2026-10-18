# Issue #129: Android reported request timeouts as no connection; HTTP and logger LOWs

Found in the eighth deep audit (2026-10-18), auditor B. Fix: 12678ba; tests strengthened in 14033fb after the confirmation round.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | A test with the real Android error shape fails before and passes after; closed-port and web errors stay `network`; old-vs-new table | PASS | `test-before.log`: only "an Android call timeout" fails (received `network`). `test-after.log`: 107/107. `case-table.md`: only that row changes. |
| 2 | Checked on the Android emulator after the fix | PASS | Before: `android-before.png` ("No connection"), `android-probe.log` (`ERR_NETWORK rt= text="timeout" timedOut=false`, about 2.8 s after the request in the hang server's log). After: `android-after.png` ("The server took too long to answer"), `android-after.log` (`failed: timeout`). Backend: `hang-server.js.txt`, `EXPO_PUBLIC_API_TIMEOUT_MS=3000`, Expo Go 57 on API 37. |
| 3 | Items 2–9 fixed or recorded | PASS | See below. |
| 4 | Gates, CI, e2e green | PASS | `gates.log`, `gates-r1.log` (708 tests). CI on 12678ba and later. e2e on c035b39: Android Expo Go 39132609551, Android native 39132612550, iOS native 39132615440. |

A first probe on the emulator showed `responseText "unexpected end of stream on http://localhost:9999/..."`: the hang server had exited and the port was closed. That case is a network error and has its own test.

## Items 2–9

- **3 (iOS idle timeout): fixed.** `docs/api-and-storage.md` says the timeout is total on Android and the web, and without data on iOS (verified in RCTNetworking.mm:335 by the docs confirmation round).
- **9 (test gaps): fixed** for ETIMEDOUT and the 401 server message. Storage remove and the logger.test comment: recorded. `removeItem` passes the key straight to AsyncStorage (the test checks that call, and the failure path is tested); the logger.test item is a comment and a fixture argument, not behaviour.
- **2 (ECONNABORTED on abort): recorded.** On React Native an abort maps to `canceled` (axios rejects before `onabort`); only a browser cancelling on navigation reaches it, when the page is going away.
- **4 (useFetch one-task window): recorded.** The window is one scheduler task between a deps change and the effect cleanup.
- **5 (setItem undefined): recorded.** No caller passes undefined; the device throws loudly.
- **6, 7, 8 (logger hygiene, caller Authorization, ports/wildcards): recorded.** Each needs adopter code that does something unusual (a `bearer` key, credentials in a URL, an own Authorization header on the API, an invalid port), and each fails visibly or only in logs.
- A blob or arraybuffer request that times out on Android is still `network`: React Native keeps no message for those response types (tested as "a blob request").

## Confirmation round (R1)

No HIGH or MEDIUM. Mutants that survived the first tests (the 'text' type, an `includes` match, the no-response guard) are killed by 14033fb (`mutation-r1.log`). The auditor also checked every `ldc "timeout"` in OkHttp and every fixed string React Native passes to `onRequestError`: none other than the call timeout produces exactly "timeout".

Code: [apiError.ts](https://github.com/koniz-dev/react-native-starter/blob/14033fb/shared/http/apiError.ts), [httpClient.test.ts](https://github.com/koniz-dev/react-native-starter/blob/14033fb/__tests__/shared/http/httpClient.test.ts).
