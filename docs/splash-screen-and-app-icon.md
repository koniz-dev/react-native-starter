# Splash Screen and App Icon

The splash screen and icons are configured in [`app.config.ts`](../app.config.ts)
from the images in `assets/`. All four images are placeholders: replace the files
(keeping their names and sizes) and adjust the colors in the `APP` block of
`app.config.ts`. No code changes are needed.

## Files

| File                       | Size                   | Used for                                                                                                            |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `assets/icon.png`          | 1024×1024, opaque      | iOS app icon and the default icon on other platforms (`icon`).                                                      |
| `assets/adaptive-icon.png` | 1024×1024, transparent | Android adaptive icon foreground (`android.adaptiveIcon.foregroundImage`); keep the artwork inside the center ~66%. |
| `assets/splash-icon.png`   | 1024×1024, transparent | Splash screen image, shown at 200 pt wide (`expo-splash-screen` plugin).                                            |
| `assets/favicon.png`       | 48×48                  | Web favicon (`web.favicon`).                                                                                        |

## Splash screen

`app.config.ts` configures the `expo-splash-screen` config plugin:

```ts
[
  'expo-splash-screen',
  {
    image: './assets/splash-icon.png',
    imageWidth: 200,
    resizeMode: 'contain',
    backgroundColor: APP.splashBackground.light,
    dark: { backgroundColor: APP.splashBackground.dark },
  },
],
```

- Use a transparent splash image that reads on both `APP.splashBackground.light`
  and `APP.splashBackground.dark`, or add `image` inside `dark` to use a separate
  dark-mode image.
- The splash screen is part of the native build. Expo Go shows its own loading
  screen, so check your splash in a development or release build
  (`npm run prebuild:preview`, then build with Android Studio/Xcode or
  `npx expo run:android --variant release`).

## App icon

- iOS uses `assets/icon.png` and masks the corners itself; supply a square image
  without transparency.
- Android uses the adaptive icon: `assets/adaptive-icon.png` over
  `APP.adaptiveIconBackground`. Launchers crop it to circles, squircles, and other
  shapes, so keep important artwork in the center.
- After changing icons or the splash screen, regenerate native projects with
  `npm run prebuild:<variant>` (it runs `expo prebuild --clean`).

## Variants

Each build variant (`development`, `preview`, `production`) gets its own name,
bundle ID, and scheme from `app.config.ts`, so all three install side by side.
They share these images; to tell them apart on a device, you can return a
different `icon` per variant from `app.config.ts`.

## References

- [Expo: splash screen and app icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Expo: app variants](https://docs.expo.dev/tutorial/eas/multiple-app-variants/)
