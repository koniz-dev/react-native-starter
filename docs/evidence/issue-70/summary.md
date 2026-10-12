# Issue 70 verification: template scripts

Fixes: [`ab51c61`](https://github.com/koniz-dev/react-native-starter/commit/ab51c61),
[`22f242d`](https://github.com/koniz-dev/react-native-starter/commit/22f242d),
[`97dc5d6`](https://github.com/koniz-dev/react-native-starter/commit/97dc5d6);
verified at `caa938f`.

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Each defect reproduced before, fixed after | Script tests: [tests.log](tests.log) (58). Reproductions recorded while fixing: `npm_config_registry=http://127.0.0.1:9/ node scripts/check-audit.js` exited 0 before and now prints "npm audit did not complete: ... ECONNREFUSED" and exits 1; 13 init-project tests failed before the fix (validators, `$&` owner, `--force` rewrite); a busy MOCK_PORT now stops run.sh with "The e2e mock did not start on port 19991"; a `null` body to the mock returns 400 instead of killing it; a pasted answer sequence completes the dry run instead of hanging | PASS |
| 2   | audit:check fails with npm's message when the audit fails | checkAudit tests "fails on an npm error / a report without results" | PASS |
| 3   | Literal replacements; platform-valid IDs, schemes, names | initProject tests: `Cash$&App` / `Acme $' Inc $\`` written literally (LICENSE has one MIT text); `io.acme.notes_app`, `com.acme.new`, `com.example`, schemes exp/https/file rejected; an empty name names the name | PASS |
| 4   | Tools run without npx/shell; failures say how to restore | prettier, tsc, npm run through `process.execPath`; init prints "git checkout -- . && git clean -fd" after a failure once files changed | PASS |
| 5   | LF everywhere; a core.autocrlf=true clone passes | [crlf-clone-gates.log](crlf-clone-gates.log): format, lint, type-check, docs:check, test:ci, `bash -n run.sh` all exit 0 (only the 4 PNGs, binary, contain CR) | PASS |
| 6   | Mock and runner robust | Mock: 127.0.0.1, 400/500 instead of crashing, clear EADDRINUSE exit, `GET /__mode`. run.sh checks its own processes and both URLs | PASS |
| 7   | `--force` scheme only as scheme; pasted answers | Test "on --force, changes the old scheme only where it is the scheme" | PASS |
| 8   | No demo wording after remove-demo, tests included | [init.log](../issue-74/verification/init.log): after `--remove-demo --remove-recipes`, `git grep -i demo` in `__tests__` finds nothing | PASS |
| 9   | ANR dialog and Go home handling | open-app subflow closes a launcher ANR and ignores "Go home" when "Try again" is shown; e2e runs since: Expo Go 7/7, native 7/7 (run 38290463775, 38290467724) | PASS |
| 10  | Gates before and after init; CI green | CI 38292179524; [init-gates.log](../issue-74/verification/init-gates.log): all exit 0, 309 tests | PASS |
