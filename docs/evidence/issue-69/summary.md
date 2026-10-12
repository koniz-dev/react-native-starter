# Issue 69 verification: token safety, 401s, refresh, secrets

Fix: [`8432d07`](https://github.com/koniz-dev/react-native-starter/commit/8432d07),
verified at `caa938f` (CI run 38292179524, 376 tests).

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | A test reproduces each defect, fails before, passes after | `__tests__/shared/http/tokenSafety.test.ts` (15 tests) and new cases in logger.test.ts and realBackendAdapter.test.ts. Before the fix all 14 token-safety tests and 13 redaction tests failed for the expected reasons (e.g. the backslash URL resolved to `https://auth.example.com`; the stored token was `t2` after sign-out; the ApiError dump held `SECRET-TOKEN` and `hunter2`); the docs adapter's offline-refresh test failed with the refresh token deleted. After: [tests.log](tests.log), 123 passed | PASS |
| 2   | The token is attached, refreshed, retried, or cleared only for requests that carried the stored token to a trusted origin; a retry never sets Authorization itself | Test "ignores a 401 from an untrusted origin that got its own Authorization header": the third party sees only its own key; no refresh, no sign-out. The client records `_sentToken` and retries through the interceptor (origin checked again) | PASS |
| 3   | Backslash, whitespace, control characters in the authority are never trusted | `getOrigin` returns null for 5 such URLs, and no Authorization header is sent | PASS |
| 4   | Transient refresh failures keep the session; only "can't refresh" ends it; the docs example keeps its refresh token | Network, timeout, 5xx: session kept, request rejects with that code. Docs adapter (tested from the page): offline refresh keeps `access-1` and `refresh-1`, and the next request refreshes and succeeds | PASS |
| 5   | A 401 for an older token is retried with the current one without refreshing or clearing | Tests "retries with the current token..." and "does not end a newer session..." | PASS |
| 6   | A refresh after sign-out doesn't store its token | Test "does not store a refreshed token after the user signed out" (session generation) | PASS |
| 7   | ApiError keeps no headers/body; redaction by pattern, shared objects, arrays; logs drop the query | "ApiError cause keeps no headers or request body" (inspect with showHidden finds neither secret); 12 key-name cases; shared object logged twice in full; "API GET /reset failed: client (400)" for `/reset?token=...` | PASS |
| 8   | Docs match; gates and CI pass | API and Storage (401 steps, untrusted origins, cause), Connect Your Backend (refresh failures), Error Reporting (redaction). CI 38292179524 green; e2e: [iOS](../issue-74/verification/ios-expo-go/test-e2e-ios.log) 6/6, [Android Expo Go](../issue-74/verification/android-expo-go/report.xml) 7/7, [native debug](../issue-74/verification/android-native-debug/report.xml) 7/7 (sign-in, relaunch, profile, logout) | PASS |
