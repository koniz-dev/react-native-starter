# Issue 91: uploads, APP_ENV, URL validation, dead exports (fix ee03aa4; verified on main a222f45)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | FormData goes out as multipart, objects as JSON; documented | `tests-before-after.txt` (FormData test fails before). On devices, `upload/`: a temporary route posts a text part and a PNG to an echo server (`upload-server.js`, `upload-check.tsx`, `upload.yaml`, `web-upload-91.js`). Old client (e4742f2): iOS, Android, and web all send `application/json` and no parts (`*-before*`, `server-all.txt`, `sent-*.txt`). New client: `multipart/form-data` with a boundary, `title=hello` and a PNG part on iOS, Android (Expo Go), and Chrome (`*-after*`). docs/api-and-storage.md "Uploading files" | PASS |
| 2 | APP_ENV empty is unset, padded is trimmed | `tests-before-after.txt` | PASS |
| 3 | URLs the origin check can't read are rejected at startup; documented | `tests-before-after.txt` (5 cases fail before); docs/environment-variables.md | PASS |
| 4 | Dead exports removed or internal | commit ee03aa4; lint and type-check green | PASS |
| 5 | Gates and CI green | Gates on a clean clone of a222f45 and after both init paths (lint, type-check, format, docs, 529/440/440 tests, audit, doctor 21/21, web and iOS+Android exports: `../issue-90/verification/gates-clean-clone-and-init.txt`); Maestro iOS 7/7, Android Expo Go 7/7, Android native debug 7/7 (Actions run 38572469509), dark mode on both; web smoke passed (`../issue-90/verification/`); CI, Audit, CodeQL green on a222f45 | PASS |
