# Issue #131: OTA updates missed the build-profile variables; the push adapter broke on the web; docs LOWs

Found in the eighth deep audit (2026-10-18), auditors C, G and F. Commits: ef39dd9 (the two MEDIUMs), 63b4159 (LOW wording), f35c0f3 (confirmation-round follow-ups).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Plug In a Provider's OTA section and Environment Variables say how updates get their variables, checked against eas-cli | PASS | [environment-variables.md](https://github.com/koniz-dev/react-native-starter/blob/14033fb/docs/environment-variables.md#files-and-precedence): `eas update` doesn't read a build profile's `env`; with `--environment` it uses that EAS environment and ignores `.env`; without it the local `.env` reaches the bundle, and the prompt doesn't load an environment. The OTA section links there. Checked twice in eas-cli 25.2.0 (`commands/update/index.js:150-220`, `EXPO_NO_DOTENV`, `exportApp.js:133`): by auditor C and by the docs confirmation round (`confirmation-r1-docs.md`). |
| 2 | The push adapter returns `unsupported`/`null` on the web; the snippet compiles; a test of its logic shows the web branch | PASS | `snippets.test.ts.txt` runs the doc's push and OTA snippets with stand-in modules. `snippets-before.log`: on web, permission granted, then `getToken` rejected, and `checkForUpdate` rejected. `snippets-after.log`: on web `unsupported`, `null`, `not-configured`; iOS unchanged. docs:check compiles the snippets (`gates.log`, `gates-r1.log`). |
| 3 | Items 3–10 fixed or recorded | PASS | See below. |
| 4 | docs:check, gates and CI green | PASS | `gates.log`, `gates-r1.log`; CI on 63b4159 and f35c0f3. |

## Items 3–10

- **3 (OTA adapter rejects in web development): fixed** (web branch, ef39dd9).
- **4 (TanStack mapping): fixed** by naming the differences (63b4159, f35c0f3).
- **5 (screen tracking, error reporter wording): fixed** (63b4159; the hook's comment in f35c0f3).
- **7 (ESLint warning, Conventions tree, recipe storage): fixed** (63b4159, f35c0f3: the recipe says why persist bypasses shared/storage: a failed read returns null and would rehydrate an empty store).
- **9 (EAS development profile, `__tests__/docs` in the trees): fixed** (63b4159).
- **6 (demo credentials hint with an own auth URL): recorded.** Demo code that remove-demo deletes.
- **8 (store Expo Go moving to SDK 58): recorded** for the maintainer: an SDK 58 upgrade is a separate decision (Support Policy).
- **10 (dummyJsonAdapter test gaps): recorded,** demo code.

## Confirmation round (R1)

No HIGH or MEDIUM (`confirmation-r1-docs.md`). Its LOWs 1–8 are fixed in f35c0f3; 9 (testingSnippets near its 15 s timeout under heavy parallel load) is recorded: it passes in about 1 s alone and is unrelated to these commits. Not fixed: `notification` is missing from SDK 57's `ExpoConfig` type, which only matters to an adopter who turns on web push; the doc names the keys.
