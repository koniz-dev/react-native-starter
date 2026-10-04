# Issue 23 verification — no auth-token cookies in the native cookie store

Verified on 2026-10-04.

## Root cause

axios leaves `withCredentials` undefined unless configured, so React Native's
`XMLHttpRequest` keeps its default of `true`. iOS then sets
`HTTPShouldHandleCookies = YES` (`RCTNetworking.mm`) and Android keeps the
OkHttp cookie jar (`NetworkingModule.kt` installs `CookieJar.NO_COOKIES` only
when `withCredentials` is false). The DummyJSON login response sets
`accessToken` / `refreshToken` cookies, which were persisted outside secure
storage.

## Change

- `services/auth.ts`: `authApi` is created with `withCredentials: false`.
- `docs/api-and-storage.md`: new "Cookies from the auth server" section; also
  corrects the logout snippet, which removed the token from AsyncStorage
  instead of secure storage.

## Acceptance criteria

| #   | Criterion                                                                                                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                      | Result |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Auth client does not persist login-response cookies (or logout clears them); approach documented in `docs/api-and-storage.md` | `withCredentials: false` on `authApi`; documentation section above.                                                                                                                                                                                                                                                                                                                                           | PASS   |
| 2   | Jest test asserts the configured behavior                                                                                     | [05-auth-tests.log](05-auth-tests.log): "does not store or send cookies for auth requests" (`authApi.defaults.withCredentials === false`) and "sends the login request with withCredentials disabled" (captures the real request config through an adapter). Both fail without the change (checked locally).                                                                                                  | PASS   |
| 3   | iOS simulator: after login and after logout, no `accessToken` / `refreshToken` cookie for the auth host (human-only)          | [ios-cookie-store.log](uat/ios-cookie-store.log): the baseline from pre-fix code had both cookies; with the fix, after login ([signed in](uat/ios-01-signed-in-fixed-code.png)) and after logout ([signed out](uat/ios-02-after-logout-fixed-code.png)) the cookie file doesn't exist. A control run with the pre-fix client and the same steps recreated both cookies, so the inspection detects the defect. | PASS   |
| 4   | lint, type-check, test:ci, format:check                                                                                       | [01](01-lint.log) (0 errors; the 6 warnings are the existing ones in `components/ThemedText.tsx`), [02](02-type-check.log), [03](03-test-ci.log) (12 suites / 65 tests), [04](04-format-check.log)                                                                                                                                                                                                            | PASS   |

## Notes

- The "after logout" session came from the control run's login. Logout makes
  no network request, and the cookie file was cleared before relaunching with
  the fix, so the check confirms that nothing re-creates the cookies.
- Two earlier Log out taps after an app relaunch didn't register (the first
  click into a Simulator window that wasn't active); the third did, and the
  Expo Go Keychain item count dropped from 3 to 2.
- Android isn't part of criterion 3. The same flag disables the OkHttp cookie
  jar there (`NetworkingModule.kt`).
