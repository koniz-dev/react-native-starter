# Splash Screen and App Icon

Learn how to add a splash screen and app icon to your Expo project.

## Overview

A splash screen and an app icon are fundamental elements of a mobile app. They play an important role in the user experience and branding of the app.

## Splash Screen

A splash screen, also known as a launch screen, is the first screen a user sees when they open your app. It stays visible while the app is loading.

### Create a Splash Screen Icon

1. Use a **1024x1024** image
2. Use a **.png** file
3. Use a **transparent background**
4. You can use this [Figma template](https://www.figma.com/community/file/1155362909441341285) for design

### Export and Configure

1. Export the splash icon as `.png` and save it in `assets/images/` directory
2. By default, Expo uses `splash-icon.png` as the file name

3. Install `expo-splash-screen`:

```bash
npx expo install expo-splash-screen
```

4. Configure in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#232323",
          "image": "./assets/images/splash-icon.png",
          "dark": {
            "image": "./assets/images/splash-icon-dark.png",
            "backgroundColor": "#000000"
          },
          "imageWidth": 200
        }
      ]
    ]
  }
}
```

### Platform-Specific Configuration

You can configure splash screen separately for Android and iOS:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-splash-screen",
        {
          "ios": {
            "backgroundColor": "#ffffff",
            "image": "./assets/images/splash-icon.png",
            "resizeMode": "cover"
          },
          "android": {
            "backgroundColor": "#0c7cff",
            "image": "./assets/images/splash-android-icon.png",
            "imageWidth": 150
          }
        }
      ]
    ]
  }
}
```

### Testing

> **Important:** Do not use Expo Go or a development build to test your splash screen. Use a preview build or a production build instead.

For iOS SDK versions below 52, clear derived data before rebuilding:

```bash
npx expo run:ios --no-build-cache
```

## App Icon

An app's icon is what your app users see on their device's home screen and app stores.

### Create an App Icon

1. Use a **1024x1024** image (must be exactly square)
2. Use a **.png** file
3. The icon must fill the whole square, with no rounded corners or transparent pixels
4. You can use this [Figma template](https://www.figma.com/community/file/1155362909441341285) for design

### Export and Configure

1. Export the icon as `.png` and save it in `assets/images/` directory
2. By default, Expo uses `icon.png` as the file name

3. Add to `app.json`:

```json
{
  "expo": {
    "icon": "./assets/images/icon.png"
  }
}
```

### Android Adaptive Icon

For Android, you can customize the adaptive icon:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon-foreground.png",
        "backgroundColor": "#ffffff",
        "monochromeImage": "./assets/images/adaptive-icon-monochrome.png"
      }
    }
  }
}
```

**Guidelines:**
- Use `.png` files
- Follow [Android Adaptive Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- The default background color is white
- Background image must have the same dimensions as foreground image

### iOS Icon

For iOS, you can use the [Icon Composer](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/#icon-composer) app (SDK 54+) or provide images:

```json
{
  "expo": {
    "ios": {
      "icon": {
        "dark": "./assets/images/ios-dark.png",
        "light": "./assets/images/ios-light.png",
        "tinted": "./assets/images/ios-tinted.png"
      }
    }
  }
}
```

**Guidelines:**
- Follow [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- Test your icon on different wallpapers
- Avoid text beside your product's wordmark
- Provide an icon that's at least 512x512 pixels

## References

- [Expo: Splash Screen and App Icon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Android Adaptive Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [expo-splash-screen Documentation](https://docs.expo.dev/versions/latest/sdk/splash-screen/)

