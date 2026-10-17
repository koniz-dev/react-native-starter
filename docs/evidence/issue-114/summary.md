# Issue #114: a redirected authenticated request signs the user out on iOS; adapter example and interceptor edge cases

Found in the sixth deep audit (2026-10-17) by auditor A. Fixes:

- aa3d55a: `shared/http/httpClient.ts`.
- e9c6910: the docs adapter example, plus notes in API and Storage.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | A 401 whose response URL differs from the requested one doesn't refresh or end the session. It fails the request and logs a warning naming the redirect. A 401 at the requested URL still ends the session. The test fails before the fix and passes after. | PASS | `redirect-before.log`: the refresh was called once. After the fix, 86/86 http tests pass, including "still ends the session for a 401 at the requested URL" (`gates.log`). |
| 2 | API and Storage says authenticated endpoints must not redirect, and why. | PASS | `docs/api-and-storage.md`, "Expired sessions (401)": iOS drops `Authorization` on redirects, the 401 keeps the session, and an endpoint should request the final URL. |
| 3 | Items 2–4 each have a test that fails before the fix and passes after. | PASS | `adapter-before.log`: three failures. A locked Keychain on read signs the user out, a locked Keychain on store signs the user out, and a sign-in during logout's token read loses `refresh-2`. `adapter-after.log`: 17/17. `generation-before.log`: A's request was replayed with `Bearer token-B`. After the fix, 132/132 http and session tests pass. |
| 4 | Items 5–8 are done. | PASS | See the notes below. |
| 5 | Gates and CI are green. | PASS | `gates.log`: 588/588 at e9c6910. CI and Audit pass on e9c6910 and every later commit. |

## Notes

- **The redirect check.** It compares the response's `XMLHttpRequest.responseURL`
  with `client.getUri(config)`. Both are reduced to the origin plus the path, without
  query or fragment. React Native sets `responseURL` from the final `NSURLResponse`
  URL. The cause is in React Native's source: `RCTHTTPRequestHandler`'s
  `willPerformHTTPRedirection` builds the next request with only cookie headers.
  Auditor A reproduced the dropped header with NSURLSession on macOS (the same
  CFNetwork stack). It was not reproduced on an iOS device.
- **Item 5, Keychain accessibility.** Documented, not changed. Changing the default
  in the template would apply only to tokens stored afterwards. The first draft of
  the note said existing items "aren't found" after a change. That was checked
  against expo-secure-store's iOS source before committing and corrected: the read
  query has no `kSecAttrAccessible`, and an update keeps the item's accessibility.
- **Item 6, cookie sketch.** It now ends a session only if one exists, and lists
  what else a cookie session needs: a placeholder login token, no Bearer header,
  and `withCredentials`.
- **Item 7, `TokenStore.persistent`.** Not removed. It is a public property that
  custom stores declare, including the docs' own cookie store. Removing it would
  break their compile in maintenance mode, which accepts no breaking API changes,
  and it fixes no runtime bug.
- **Item 8, the slow `tokenStore` web-flow test.** No change. It failed once at a
  load average of about 600, and the slowness comes from `findByText` waits, not
  the test timeout. It has passed in every gate run since (588–632 tests).
