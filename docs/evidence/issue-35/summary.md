# Issue 35 verification — dead code, one theme system, zero lint warnings

Verified on 2026-10-09.

## Change

- **One theme.** `constants/Theme.ts` holds a brand `palette` per mode merged
  over Paper's MD3 themes: primary and containers, secondary container,
  inverse primary, background, surface, text. Dark mode gets a real primary
  (`#78d1f5` with `#003549` text) instead of `#fff`. `getTabBarColors` now
  uses `primary` / `onSurfaceVariant`. The empty `fontConfig` and the
  template comments are gone. Removed: `components/ThemedText.tsx`,
  `components/ThemedView.tsx`, `hooks/useThemeColor.ts`,
  `constants/Colors.ts`, and their docs (`components/`, `constants/`,
  `hooks/` READMEs and `docs/color-themes.md` rewritten).
- **Dead code.** Removed `utils/sum.ts` and its test, `userApi`,
  `todosApi.getById` / `getByUserId`, `storage.clear`,
  `STORAGE_KEYS.SETTINGS` / `TODOS`, the unused `User` type, and
  `types/expo-secure-store.d.ts`. `todosApi.getAll` is now typed
  (`Promise<Todo[]>`). Docs that used these now use `todosApi` or show the
  reader's own endpoint.
- **Template leftovers.** The Home showcase buttons, which had no-op
  handlers, show what was pressed in the snackbar; the useNativeDriver comment
  is gone; the error-fallback stack trace uses `Menlo` on iOS, where
  `monospace` is not a font.
- **Dependencies.** Removed `react-native-vector-icons` (never imported; icons
  come from `@expo/vector-icons`); `@types/react` moved to devDependencies;
  removed the `hermes-parser` / `babel-plugin-syntax-hermes-parser` pins added
  in the SDK 57 upgrade. Nothing referenced them, and Expo and React Native
  bring the versions they need. `expo` was already pinned with `~57.0.27`
  (fixed by #25).
- **ESLint.** One shared rule block for JS and TS, with a TS block on top.
  Every rule is an error (`react-hooks/*`, `no-explicit-any`, the React
  Native style rules), `npm run lint` runs with `--max-warnings 0`, config
  files (`app.config.ts`, `eslint.config.js`, `jest.setup.env.js`) are
  linted, and `docs/evidence/**` stays ignored.
- **tsconfig.** `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`. The fixes it needed: `getOrigin` in
  `services/httpClient.ts` handles missing regex groups, `ErrorBoundary`
  members are marked `override`, and a test checks for a missing tab bar.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                     | Evidence                                                                                                                                                                                                                                                                                                                | Result |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | One theming system: Paper theme in `constants/Theme.ts` is the single source (tab bar folded in, real dark primary); Themed\*, `useThemeColor`, `Colors.ts` removed with docs | Files removed; `__tests__/constants/theme.test.ts` (brand primary, not white, WCAG AA contrast for the brand pairs in both modes) and tab bar tests in [08](08-theme-and-home-tests.log); [web screenshots](web/) in light and dark ([log](web/theme-shots.log), no console errors); no references left in code or docs | PASS   |
| 2   | Dead files/exports removed or used; `types/expo-secure-store.d.ts` deleted and `tsc` passes on the package's types                                                            | Removed as listed above; [02](02-type-check.log)                                                                                                                                                                                                                                                                        | PASS   |
| 3   | Dependencies: vector-icons removed, `@types/react` in devDependencies, `expo` with `~`, hermes-parser pins removed or documented                                              | [06-dependencies.log](06-dependencies.log) (diff, `npm ci`, `expo install --check`: "Dependencies are up to date", `npm ls`); [07-exports.log](07-exports.log): iOS and Android Hermes bundles and the web export build without the pins                                                                                | PASS   |
| 4   | `npm run lint` 0 warnings / 0 errors with `--max-warnings 0`; `no-explicit-any` and `react-hooks/*` are errors; config files linted; rule blocks deduplicated                 | [01-lint.log](01-lint.log); [05](05-lint-and-tsconfig-probes.log): a probe file gets 5 errors (`any`, set-state-in-effect, missing effect dependency, inline style, color literal) and eslint exits 1; all 17 `react-hooks/*` rules and `no-explicit-any` at severity 2; the three config files are linted              | PASS   |
| 5   | `tsconfig.json` adds `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`; the code compiles                                                        | `tsconfig.json`; [02](02-type-check.log); [05](05-lint-and-tsconfig-probes.log): an unchecked `list[0]` fails `tsc`                                                                                                                                                                                                     | PASS   |
| 6   | Gates pass locally and in CI                                                                                                                                                  | [01](01-lint.log), [02](02-type-check.log), [03](03-test-ci.log) (22 suites / 178 tests), [04](04-format-check.log); CI run in the closing comment                                                                                                                                                                      | PASS   |

## Notes

- The iOS/Android bundle export ran after the dependency change and before
  the final ESLint, tsconfig, and `inversePrimary` edits, none of which change
  the dependency graph. The web export and screenshots use the final code.
- Cards and surfaces keep MD3's neutral elevation tints (slightly lavender in
  light mode). The palette covers the brand roles; a full generated MD3
  palette is described in `docs/color-themes.md` ("Rebranding").
- How the new dark primary looks on a device is a visual judgment; the
  screenshots are from the web build.
