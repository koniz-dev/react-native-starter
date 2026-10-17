# Issue #120: the redirect check fired on URLs that weren't redirected and hid real expiries on Android and web

The confirmation audit of v1.1.13..main (2026-10-17) found this regression from #114.
The same audit's re-check (auditor R2) then found more problems, so it was fixed in
two rounds:

- **First round:** ca19c32 (http), a91e040 (logger), 3464020 (the adapter example).
- **Second round:** 13af4f7 (a logger regression from a91e040), 45a4f68 (paths
  compared the way iOS serializes them), 8dd68b2 (adapter example follow-ups).

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The check runs on iOS only. It compares percent-decoded, dot-resolved paths, and an IDN host is not treated as different from its `xn--` form. Tests fail before the fix and pass after: encoded paths still refresh on iOS, a same-origin redirect on Android still ends the session, a real redirect on iOS keeps it. The docs are corrected. | PASS | `first-fix-before.log`: on c03d8df, 4 encoded-path cases and the Android same-origin case fail. `nsurl-before.log` covers the second round: tests now use real NSURL strings (`%5C`, dot segments kept, emoji), and the backslash case fails until `\` is no longer turned into `/`; the IDN case passes. `nsurl-after.log`: 95/95. API and Storage now says the check is iOS-only and that Android and the web handle such a 401 like any other. |
| 2 | Items 2–5 are fixed, with tests where they are code. | PASS | See "Items 2–5" below. |
| 3 | Gates, CI and e2e (iOS native, Android native, Android Expo Go) are green. | PASS | `gates.log`: 651/651. `e2e.txt`: all three platforms pass 7/7 plus dark on 3464020 (first round) and on d091228 (everything). CI and Audit pass, with 0 code-scanning alerts. |

## Items 2–5

- **Item 2, logger.** First round:
  - a91e040 split runs of capitals, so `TOTPCode` and `SMSOTP` were redacted
    again, and `sessionKey` was added.
  - R2 found that this split broke `OTPs`, `backupOTPs`, `OTPcode` and `AUTHcode`
    (`logger-regression-before.log`: 4 failures).

  Second round:
  - 13af4f7 checks the words from both splits.
  - `logger-regression-after.log`: 98/98.
- **Item 3, orphaned doc comments.** Fixed in httpClient.ts and app.config.ts.
- **Item 4, analytics.** The docs note that a session that ends while the app isn't
  running keeps the provider's last user. The test also checks that sign-out resets
  only once.
- **Item 5, adapter example.** First round:
  - 3464020 counts sign-outs, so a refresh that stores after a sign-out revokes
    the token and drops it.

  Second round:
  - R2 showed that a refresh which starts while logout is running still kept its
    token, and that a locked Keychain skipped logout's clear.
  - 8dd68b2 raises the count again after clearing and makes the first read
    non-throwing.
  - `adapter-followup-before.log`: 2 failures. `adapter-followup-after.log`:
    20/20.

## Recorded, not changed

R2's L3 and L4 are not changed:

- a redirect that changes only the query;
- `%2F` decoding into `/`;
- `/a/b/..` resolving to `/a`;
- a redirect between an IDN host and a different host.

All are contrived, and they only matter on iOS. The code comment says that a redirect
of only the query isn't detected, and the docs say authenticated endpoints shouldn't
redirect.
