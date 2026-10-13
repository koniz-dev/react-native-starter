Tag `v1.1.9` (annotated) is on commit
`52685987a2623656ac13e686216bd6d158e2c0d0`, verified on 2026-10-13 in
[issue 87](https://github.com/koniz-dev/react-native-starter/issues/87)
([evidence](https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-87)).
It fixes everything a third review of `v1.1.8` found on 2026-10-13
(#82–#86); no issue is open.

## Take this release if you started from an earlier one

**Session and storage ([#82](https://github.com/koniz-dev/react-native-starter/issues/82)).**
Copy `shared/storage/storage.ts`, `shared/session/session.ts`,
`shared/session/authService.ts`, `shared/http/httpClient.ts`, and
`shared/lib/logger.ts` (and their tests). Projects from v1.1.7 or earlier
should take v1.1.8's session fixes too; these files include them.

- A failed AsyncStorage read at launch (a locked database, a disk error) no
  longer looks like a fresh install, which deleted a valid token from the
  Keychain/Keystore and signed the user out for good.
- If the unauthorized handler throws, the request still rejects with its
  `ApiError` and the session still ends; the app used to stay "signed in"
  without a token.
- A 401 in a new session starts its own refresh instead of joining one from
  the previous user's session (which could sign the new user out).
- Log redaction also covers `credential`, `pin`, `otp`/`totp`, `mfa`,
  `refresh`, `verifier`, access keys, `cvv`/`cvc`, and `signature`.
- A malformed stored value is logged without its content; a stored profile
  that fails validation is not used.

## What else changed

- **Lint and TypeScript ([#83](https://github.com/koniz-dev/react-native-starter/issues/83)):**
  - Lint enforces the dependency direction for relative imports too
    (`../../features/...` from `shared/`, one feature into another), and a
    relative path can't leave its module.
  - Color literals are rejected under any `*Color` prop, inside expressions
    and template literals, and in `app/`.
  - App code no longer gets Node or Jest types (`fs`, `Buffer` would crash
    on Hermes); `tsconfig.tools.json` gives them to tests and scripts, and
    `type-check` checks both. ESLint runs from any directory.
  - iOS builds declare exempt-only encryption; `.gitignore` covers EAS
    credentials and build outputs.
  - Docs: EAS first-time setup, hosting the web export, tablets rotating,
    scheduled workflows pausing after 60 days.
- **Template scripts ([#84](https://github.com/koniz-dev/react-native-starter/issues/84)):**
  - `remove-demo` writes before it deletes and deletes itself last; a
    failure says how to restore. It works with Windows paths, and markers
    work in every text file it can edit.
  - The script tests run in a project that isn't a git repository.
  - `init-project`: a restore command for the project root; `| tee` works;
    apostrophes don't split the slug.
- **UI and tests ([#85](https://github.com/koniz-dev/react-native-starter/issues/85)):**
  - Profile logs unknown errors.
  - Home's example links are buttons to screen readers, and Showcase names
    the browser tab.
  - The error fallback's buttons wrap at large text.
  - Start/end styles flip in RTL on the web.
  - Tests now catch 22 more mutants, among them the masked password,
    retrying sign-in, and the busy button (466 tests).
- **Docs ([#86](https://github.com/koniz-dev/react-native-starter/issues/86)):**
  - `docs:check` also lints every snippet with the project's rules, at the
    path it names, and every snippet passes.
  - The v1.1.8 notes now say to copy `session.ts` as well.

## Supported

| Item     | Supported                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Expo SDK | 57 (React Native 0.86.3, React 19.2.3, Expo Router 57)                                                         |
| Node     | 24.21.0 (`.nvmrc`, what CI uses); 24.3+ or 22.13+ also work (`engines`, not 23); npm with the committed `package-lock.json` |
| Android  | Expo Go, and a native debug build of the development variant (`npm run prebuild:development`, `assembleDebug`); release builds of a variant with `npm run build:<variant>:android` (not part of the verification) |
| iOS      | Expo Go on the iOS Simulator                                                                                   |
| Web      | Static export (`npm run export:web`, production variant)                                                        |

Verified on:

- **GitHub Actions:** an Android emulator, API 34 `google_apis` x86_64, on
  `ubuntu-24.04` (Expo Go 57.0.9 and the native debug build), 7 flows each
  plus dark mode, against the local e2e mock only.
- **iOS:** an iPhone 16 Plus simulator, iOS 18.6, Expo Go 57.0.9 (Xcode
  16.4, macOS 15.8.1), 7 flows plus dark mode.
- **Web:** Google Chrome 155, headless, on the production export.

## Non-goals

These are unchanged from v1.0.0:

- **A production backend.** DummyJSON and JSONPlaceholder are demo
  endpoints that you replace.
- **App-store or EAS builds and submission.**
- **Real third-party providers.** Analytics, crash reporting, push,
  feature-flag, and OTA providers are out of scope; only the seams and their
  defaults are.
- **A state-management library.** Recipes only; `init-project` removes them unless `--keep-recipes`.
- **Landscape layouts and physical-device testing.**

## Known limitations

- **Native iOS builds are not verified.** Expo SDK 57 needs Xcode 26.4+, and
  the verification host has Xcode 16.4. For this release, iOS is supported
  in Expo Go only.
- **Web keeps the token in memory**, so a page reload signs you out
  (documented in API and Storage).
- **Two allowlisted high advisories** are in build-time dependencies only:
  - node-forge, through `@expo/cli`;
  - braces, through Metro and Jest's `micromatch`.

  They were reviewed in [issue 41](https://github.com/koniz-dev/react-native-starter/blob/evidence/docs/evidence/issue-41/audit-review.md) and are
  allowlisted until 2027-01-09 in `scripts/audit-allowlist.json`. Upstream
  has no fix yet (re-checked 2026-10-13). The weekly Audit workflow fails
  when npm can apply one or when the review date passes.

- **ESLint 9 is deprecated on npm.** `eslint-plugin-react` and
  `eslint-plugin-react-native` don't accept ESLint 10 yet; the upgrade
  follows when they do.
- **Expo Go draws its own status bar on Android**, so in light mode the
  status bar is Expo Go's black strip. The native debug build shows the
  app's own status bar.
- **Maestro writes `MAESTRO_*` values into `e2e-results/`.** For signed-in
  flows, use a test account (documented in #55).
- **After `--remove-demo`, few e2e flows remain** (cold start, Back from
  Login, dark mode): the sign-in flows use the demo account. Add your own
  against a test account (Remove the Demo, Testing).
- **A signed-out deep link into a protected screen lands on Home** (the
  guard in Conventions, Navigation), and signing in stays on Home rather
  than opening the screen the link asked for.

- **Expo SDK 58 is close.** Expo Go already announces that its next store
  version supports only SDK 58. Under the support policy the starter moves
  to SDK 58 within about 4 weeks of its release; until then, run SDK 57
  projects in an Expo Go build for SDK 57 or in a development build.

Fixed since v1.0.0: the iOS reinstall Keychain token (#44).

## Maintenance mode

The starter is in maintenance mode. It accepts security fixes, regressions,
compatibility updates, docs corrections, and narrow reliability fixes. Only
the latest Expo SDK is supported, and an upgrade follows within about 4
weeks of an Expo SDK release. To report a vulnerability, use the
repository's **Security** tab.

