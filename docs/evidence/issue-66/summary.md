# Issue 66 verification: release v1.1.3

Verified on 2026-10-12 against tag **`v1.1.3`**, which is commit
**`be229099bab3d6dfb316e7bf2486d47ea153f80c`**. The release notes are in
[release-notes.md](release-notes.md), published as the
[GitHub Release](https://github.com/koniz-dev/react-native-starter/releases/tag/v1.1.3).

## Acceptance criteria

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Tag on the verified commit, pushed | `v1.1.3` → `be22909` ([01-clone.log](01-clone.log): `git describe` is `v1.1.3`; [github-release.log](github-release.log): `ls-remote`) | PASS |
| 2   | A clean clone of the tag passes every gate; CI green on the tagged commit | `git clone --branch v1.1.3`, Node 24.21.0: [02 npm ci](02-npm-ci.log), [03 .env](03-env.log), [04 lint](04-lint.log), [05 type-check](05-type-check.log), [06 test:ci](06-test-ci.log) (279 tests; coverage 97.57 / 91.66 / 95.12 / 97.75), [07 format](07-format-check.log), [08 audit:check](08-audit-check.log), [10 expo-doctor](10-expo-doctor.log) (21/21), [11 web export](11-expo-export-web.log), [12 docs:check](12-docs-check.log) (43 snippets, recipe libraries installed). CI run 38265639991 on `be22909`: success ([log](16-github-actions-ci-38265639991.log)) | PASS |
| 3   | `init-project --remove-demo --remove-recipes` on a clean clone of the tag: no starter, demo, or template wording, markers, or template docs; every gate passes | [13-init.log](13-init.log): the wording grep finds only the generic "`.env.example` is the committed template" and the i18n `template` parameter; the marker and template-doc grep exits 1; `docs/` and `scripts/` hold only the app's files. [14-init-gates.log](14-init-gates.log): lint, type-check, format, docs:check, test:ci (224 tests), audit:check, expo-doctor, and the web export all exit 0 | PASS |
| 4   | The baseline flows on the tag | **Android Expo Go**, run 38269365258 on `v1.1.3`: [report](android-expo-go/report.xml) `tests="6" failures="0"`, plus [dark](android-expo-go/maestro-dark.log); [screenshots](android-expo-go/screenshots-sheet.png). **Android native debug**, run 38269369640 on `v1.1.3`: [report](android-native-debug/report.xml) 6/6, plus dark; [screenshots](android-native-debug/screenshots-sheet.png). **iOS Expo Go** (iPhone 16 Plus, iOS 18.6, Expo Go 57.0.9, from the clean clone): [log](ios-expo-go/test-e2e-ios.log) 5/5, plus dark; [screenshots](ios-expo-go/screenshots-sheet.png). **Web** (Chrome 154, the tag's export): [web-smoke.log](web/web-smoke.log) "WEB SMOKE PASSED"; [screenshots](web-sheet.png). Every screenshot was checked | PASS |
| 5   | The GitHub Release is published as latest, with the changes and scope | [github-release.log](github-release.log): not a draft or prerelease; `releases/latest` is `v1.1.3`. The notes list #64 and #65 and repeat the supported scope, non-goals, known limitations, and maintenance mode | PASS |
| 6   | Evidence and verdict | This page | PASS |

## Notes

- **The first web smoke saw the configuration error screen; it was the
  verification host's Metro cache, not the release.** An earlier export of
  the same source (for issue 64, in a clone without `.env`) left
  `EXPO_PUBLIC_*` inlined as `undefined` in the shared Metro cache, and
  `expo export` reused it. The bundle showed `EXPO_PUBLIC_USE_DEMO_BACKENDS:void 0`;
  after `expo export --clear` it showed `"true"` and the smoke passed. A
  project's own CI starts from an empty cache.
- **One Android Expo Go flow took 23 minutes.** In "Back from Login returns
  Home", Maestro's `Clear state` of Expo Go (`pm clear` on the CI emulator)
  ran from 15:23:21 to 15:45:53 ([slow-clear-state.log](android-expo-go/slow-clear-state.log)),
  before the app opened; the flow's own steps then passed as usual. The same
  flow took 46 s in run 38266035038 on the same commit.
- **Expo SDK 58 is close.** Expo Go on Android shows that its next store
  version supports only SDK 58; the release notes say so. Per the support
  policy, the upgrade follows within about 4 weeks of the SDK 58 release.

Verdict: `v1.1.3` is the latest verified release. After `init-project
--remove-demo`, the project holds no demo backends, no demo or starter
wording, and no template docs, and every gate passes.
