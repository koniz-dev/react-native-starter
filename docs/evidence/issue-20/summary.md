# Issue 20 verification — theme the tab bar for dark mode

Verified on 2026-10-04.

## Change

- `constants/Theme.ts`: `getNavigationTheme(theme)` derives a React Navigation
  theme (`background`, `card`, `text`, `border`, `primary`, `notification`)
  from the active Paper theme; `getTabBarColors(theme)` returns the tab bar
  background (`surface`), border (`outlineVariant`), and active/inactive tints
  (`Colors.*.tabIconSelected` / `tabIconDefault`).
- `app/_layout.tsx` wraps the root stack in expo-router's `ThemeProvider` with
  the derived navigation theme.
- `app/(tabs)/_layout.tsx` reads the Paper theme and sets `tabBarStyle`,
  `tabBarActiveTintColor`, and `tabBarInactiveTintColor` from
  `getTabBarColors`.
- `docs/color-themes.md` explains how navigator chrome is themed.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Tab bar background, border, active and inactive tint derive from the active theme in light and dark                                                                      | Code above; [05-tab-bar-theme-tests.log](05-tab-bar-theme-tests.log)                                                                                                                                                                                                                                                                                                                                                                                                                                                | PASS   |
| 2   | Jest + RNTL test renders the tab layout under light and dark and asserts tab bar style and tints against theme tokens, with the active tint distinct from the background | [05-tab-bar-theme-tests.log](05-tab-bar-theme-tests.log): 4 tests (token mapping + full `renderRouter('./app')` render per scheme, checking the tab bar's `backgroundColor`/`borderTopColor` and the Home/Explore label colors). Against the previous layouts both render tests fail (checked locally).                                                                                                                                                                                                             | PASS   |
| 3   | iOS simulator and Android emulator in dark mode: tab bar dark, both tabs visible (human-only)                                                                            | iOS 18.6 (iPhone 16 Pro, Expo Go): [dark Home](uat/ios-01-dark-home.png), [dark Explore](uat/ios-02-dark-explore.png); light regression: [Explore](uat/ios-03-light-explore.png), [Home](uat/ios-04-light-home.png). Android 17 / API 37 (Expo Go): [dark Home](uat/android-01-dark-home.png), [dark Explore](uat/android-02-dark-explore.png); light regression: [Explore](uat/android-03-light-explore.png). In every dark screenshot the tab bar is dark, the active tab is white, and the inactive tab is grey. | PASS   |
| 4   | lint, type-check, test:ci, format:check                                                                                                                                  | [01](01-lint.log) (0 errors; the 6 warnings are the existing ones in `components/ThemedText.tsx`), [02](02-type-check.log), [03](03-test-ci.log) (11 suites / 54 tests), [04](04-format-check.log)                                                                                                                                                                                                                                                                                                                  | PASS   |
