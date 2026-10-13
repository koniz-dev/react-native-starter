# Issue 82: session and storage (main 473cea4; devices on 5268598)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Tests reproduce each defect, fail before, pass after | `tests-before-after.txt`: 18 tests fail on 473cea4^, 110/110 pass on 473cea4 | PASS |
| 2 | A storage read failure at launch never deletes the token | "keeps the token when the store cannot be read at launch" (signed out for that launch, token kept, next launch signed in); "hasItem rejects instead of reporting an unreadable key as absent" | PASS |
| 3 | A throwing unauthorized handler: ApiError, logged, session-expired still fires | "rejects with an ApiError and ends the session even if clearing it fails" | PASS |
| 4 | A new session's 401 never joins an earlier refresh | "doesn't let the next user's 401 join an earlier user's refresh" | PASS |
| 5 | Listed key names redacted | "redacts credential / idCredential / pin / totp / mfaCode / refresh / code_verifier / accessKeyId / access_key / cvv / signature" | PASS |
| 6 | Corrupt stored values never quoted | "getItem logs a malformed value without quoting it, and returns null" | PASS |
| 7 | An invalid stored profile is not used | "restores a session whose stored profile is not valid without that profile" (setUser(null), "Signed in as your account") | PASS |
| 8 | Docs, gates, CI, e2e | API and Storage (hasItem, profile validation), Error Reporting (redaction list); `gates.log` (425 tests); CI green; e2e iOS 7/7, Android Expo Go 7/7, native debug 7/7, each + dark (issue-85) | PASS |
