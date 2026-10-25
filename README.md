# readme-assets

Images for the starter's README on `main`, which links them by URL. They live
on this orphan branch so that projects made from the template don't receive
them (a template copy has only the default branch, and `npm run init-project`
replaces the README).

| File | Screen |
|---|---|
| `ios-home-light.png` | Home, light mode |
| `ios-explore-light.png` | Explore (Todos API example, JSONPlaceholder data), light mode |
| `ios-showcase-dark.png` | Component showcase, dark mode |
| `ios-login-dark.png` | Sign-in, dark mode |

Captured on 2026-10-25 from `main` at 1ecec29 (v1.1.17) with the demo backends
on: iPhone 16 Plus simulator, iOS 18.6, Expo Go 57.0.9, status bar set to
9:41 with `xcrun simctl status_bar`, then resized to 600 px wide with rounded
corners and a thin border by `tools/frame.swift`
(`swiftc -O tools/frame.swift -o frame && ./frame in.png out.png 600`).
Refs koniz-dev/react-native-starter#144.

When the screens change, retake them the same way, replace the files under the
same names, and the README picks them up.
