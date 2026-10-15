# Issue 102: session races and failure modes (fix 4bbc8ee)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | A slow sign-out that finishes after the session expired and B signed in leaves B's token and status | `SessionProvider.test.tsx` "does not end a session that started while an earlier sign-out was pending" and `authService.test.ts` "leaves a newer session alone…": both fail before (`tests-before.txt`), pass after | PASS |
| 1b | Same for the documented adapter's refresh token | `realBackendAdapter.test.ts` "keeps the next session when a slow logout finishes after the user signed in again": fails with the old doc snippet, passes after | PASS |
| 2 | Log out shows a pending state while the backend signs out | `signingOut` in the session; Home/Profile Log out `loading` + `disabled`; `HomeScreen.test.tsx` checks disabled and Paper's spinner (Paper's Button exposes no busy state; recorded in #105) | PASS |
| 3 | 408 and 429 refresh failures keep the session | `isTransient` in `shared/http/apiError.ts`; `tokenSafety.test.ts` rows for canceled, 408, 429 | PASS |
| 4 | Token-store failures in the 401 path | read failure: request rejects with its `ApiError`, warning logged, no refresh, no sign-out; store failure after refresh: token still returned, warning logged | PASS |
| 5 | env rejects URLs `getOrigin` can't read | `env.test.ts` (`https://@`, `https://user@/v1`, `https://:443`, `https://a@b@…`); `getOrigin('https://:443')` is null | PASS |
| 6 | Login: password as typed, username trimmed | `LoginScreen.test.tsx` "sends a password of spaces as typed…" | PASS |
| 7 | Sessions that end without a sign-out documented | Connect Your Backend, Refresh tokens | PASS |
| 8 | SessionProvider contracts tested | never rejects (logged), repeated calls share one, `useSession` outside a provider throws | PASS |
| 9 | Gates, CI, e2e | 556 tests at the fix; CI/Audit green on 4bbc8ee and later; e2e: Android Expo Go and native debug 7/7 + dark (runs 38768549833, 38768559956 on b42bfb2), iOS Expo Go 7/7 + dark locally (see issue-101) | PASS |
