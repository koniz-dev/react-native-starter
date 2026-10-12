# Issue 64 verification: remove-demo removes the demo-backends switch

Done on 2026-10-12 on `main` at
[`ae0abb4`](https://github.com/koniz-dev/react-native-starter/commit/ae0abb4)
(the fix) and verified on a fresh clone at `be22909`, which adds only the
Expo patch releases of #65.

## Change

- `shared/config/env.ts`: `EXPO_PUBLIC_USE_DEMO_BACKENDS`, `DEMO_BACKENDS`,
  and `useDemoBackends` are inside `@demo` blocks. The URL check is an
  uncomment block, so after `remove-demo` it reads `const value =
  env[variable];` ([post-env-requireUrl.txt](post-env-requireUrl.txt)). The
  missing-URL message no longer names the demo switch.
- `scripts/remove-demo.js`: uncomment blocks also drop a leading `// `.
- `jest.setup.env.js` sets placeholder API and auth URLs (different origins)
  instead of turning the demo backends on.
- `.env.example`, `scripts/e2e/run.sh`, and the docs (environment variables,
  testing, connect your backend, remove the demo) keep the switch only in
  `@demo` blocks; `scripts/check-docs.js` has a demo-only comment marked.
- "template" wording: `docs/getting-started.md` and the allowlist
  `$comment` that init-project writes now speak of "the dependencies the
  project started with".
- Tests: `removeDemo.test.ts` greps for `demo.backend|use_?demo` too
  (including `shared/config/env.ts` and `jest.setup.env.js`) and checks the
  config, `.env.example`, and the runner; `initProject.test.ts` greps for
  `starter|demo|the template|template's` after `--remove-demo`.

## Acceptance criteria

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | After `init-project --remove-demo --remove-recipes` no demo-backend or template wording outside tests and the lockfile; tests assert it | [init.log](init.log); [post-leftovers.log](post-leftovers.log): `git grep -i -E "demo\|jsonplaceholder\|dummyjson\|template\|starter\|koniz"` finds only the generic "`.env.example` is the committed template" (`.gitignore`, environment-variables.md) and the i18n `template` parameter. The removeDemo and initProject tests pass in [pre-test-ci.log](pre-test-ci.log) | PASS |
| 2   | After init, `env.ts` has no demo-backend code; a missing URL is a config error that doesn't name a demo switch; tests and e2e use their own URLs | [post-env-requireUrl.txt](post-env-requireUrl.txt), [post-env-example-head.txt](post-env-example-head.txt). The env test asserts the message `is required (set it in .env; see .env.example)`. Tests use `jest.setup.env.js` placeholders; the runner sets `APP_ENV=(EXPO_PUBLIC_API_URL="$API_URL")` and adds the switch only in a demo block (asserted in removeDemo.test.ts) | PASS |
| 3   | Before init, the demo works as documented; Android e2e Expo Go 6/6 plus dark | Run 38266035038 (Expo Go): [report](android-expo-go/report.xml) 6/6 SUCCESS, [dark](android-expo-go/maestro-dark.log), [screenshots](android-expo-go/screenshots-sheet.png): DummyJSON sign-in ("Signed in as Emily Johnson"), the demo account hint on Login, Explore error and Retry, dark mode. Also native debug, run 38266040630: [report](android-native-debug/report.xml) 6/6, [dark](android-native-debug/maestro-dark.log), [screenshots](android-native-debug/screenshots-sheet.png). Every screenshot was checked | PASS |
| 4   | Gates pass on `main` and after init; CI green | Fresh clone at `be22909` ([01-clone.log](01-clone.log), Node 24.21.0). Before init: lint, type-check, test:ci (279 tests), format:check, docs:check, audit:check, expo-doctor 21/21, web export, all exit 0 (`pre-*.log`). After init: the same, test:ci 224 tests (`post-*.log`; the web export with https placeholder URLs). CI run 38265639991 on `be22909`: success ([log](github-actions-ci-38265639991.log)). CI on `ae0abb4` alone failed only at expo-doctor, from Expo's new patch releases (#65) | PASS |
