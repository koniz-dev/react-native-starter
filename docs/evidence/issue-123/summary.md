# Issue #123: Android signed out after a cross-origin redirect; adapter logout with a locked Keychain; IDN and OAuth follow-ups

Found in the second confirmation audit (c03d8df..main, 2026-10-17) by auditor X.
These are regressions and gaps in the #120 fixes.

Fixes:
- 67a39c4: http.
- 998e01b: the adapter example.
- 36ef2d9: logger.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Origins are compared on every platform, and only the path comparison is iOS-only. Test: on Android, a 401 from another origin keeps the session. The test fails before the fix. The comments and docs are corrected. | PASS | `before.log`: the Android cross-origin case fails (refresh, then sign-out), and so does the IDN-to-unrelated-host case. `after.log`: 264/264 in http, session and lib. API and Storage now says that every platform drops the token on a cross-origin redirect and that iOS also drops it on a same-origin one. The warning reads "got a 401 after a redirect that drops the token". |
| 2 | Every read in logout is caught. The test locks the Keychain for every read and expects the refresh token to be gone. | PASS | `before.log`: "…while the Keychain stays locked for reads" fails. The earlier test failed only one read; this one fails every read. It passes after the fix. |
| 3 | Items 3–5 are fixed, with tests. | PASS | See "Items 3–5" below. |
| 4 | Gates, CI and e2e on all three platforms are green. | PASS | `gates.log`: 675/675. e2e and CI on 36ef2d9 are recorded in the issue comment. |

## Items 3–5

- **Item 3:** a refresh that fails for good now clears the refresh token only if it is
  still its own. The test "a refresh rejected after a sign-out + sign-in keeps the new
  session's refresh token" fails before the fix.
- **Item 4:** a host that has an IDN form now matches the punycode form only when
  the other side is punycode. A redirect from an IDN host to an unrelated host is now
  seen; that test fails before the fix.
- **Item 5:** `oauth` now counts as a secret word, so `oauthCode`, `oauth_code`,
  `OAUTH_CODE` and `oauthState` are redacted. Those four tests fail before the fix.

## Third confirmation audit (d091228..36ef2d9): no HIGH or MEDIUM

Auditor Z checked the five #122 and #123 commits. They built
`redirect-table-87-cases.txt`: 29 URL pairs on iOS, Android and the web, run through
the real `createHttpClient` at HEAD, at d091228 and at c03d8df. Every case is right
at HEAD except two LOWs:

- **L1:** an IDN pair ignores scheme, port, and which `xn--` host it is.
- **L2:** a fullwidth or IDNA-to-ASCII host is never signed out.

Both need an API on an IDN host, or a mistyped `EXPO_PUBLIC_*` URL, and both are
false keeps or false sign-outs, not token leaks. They are recorded and left as they
are, because fixing them would mean a full IDNA implementation.

Z also checked:

- **Logger:** the `o?auth` change keeps `coauthor`, `oauthor` and `goauth`, and
  over-redacts `oauthProvider` and `oauthUrl`, in the same way `auth*` keys already
  were.
- **Adapter example:** both new tests fail on d091228's doc. One non-atomic
  get-then-clear window is left; it is theoretical.
- **run.sh** behaves correctly under `set -euo pipefail` on bash 3.2.

That round met the stop rule: no HIGH or MEDIUM.

## A flaky CI test found while closing this issue

On 36ef2d9, CI failed once in "without git, says it cannot check or undo"
(init-project). The rerun passed. My first guess was a repository in a folder above
the copy, so 3271d74 set `GIT_CEILING_DIRECTORIES`. CI failed again in the same way,
so that guess was wrong: git found a repository inside the copy itself.

The test commits in the copy and then deletes `.git`. After a commit, git may start a
gc or maintenance process in the background, and that process can write `.git` back.
That is the likely cause, but it was not reproduced locally.

ecf24d6 removes the race:
- the test copies the project without ever running git;
- the ceiling is reverted;
- git in the test copies runs with `gc.auto=0` and `maintenance.auto=false`.

CI on ecf24d6 passed twice (run 39039590505, attempts 1 and 2). e2e on 36ef2d9 passed
7/7 plus dark mode on iOS native, Android native and Android Expo Go
(`e2e-36ef2d9.txt`). The later commits change only tests.
