# React Native Starter

A clean starter template for React Native with Expo Router, TypeScript, and file-based routing.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app on your mobile device (optional, for testing)

### Installation

```bash
npm install
```

### Start Development Server

```bash
npm start
```

Then:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Press `w` to open on web browser
- Scan QR code with Expo Go app on your device

## Navigation

This project uses **Expo Router** for navigation, which is the recommended approach for Expo projects. Expo Router provides:

- **File-based routing** - Files in the `app` directory automatically become routes
- **Built on React Navigation** - Full access to React Navigation APIs when needed
- **Type-safe routes** - Automatic TypeScript support for routes
- **Deep linking** - Automatic deep linking configuration
- **Web support** - Static rendering and optimized routing for web

React Native doesn't include built-in navigation, so you need a navigation library. Expo Router is built on top of React Navigation and integrates seamlessly with Expo CLI and bundling.

For more information, see:

- [Navigation in Expo](https://docs.expo.dev/develop/app-navigation/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [App Directory Guide](app/README.md)

## Project Structure

```
react-native-starter/
├── app/              # File-based routing (see app/README.md)
├── assets/           # Images, fonts, and other static files
├── components/       # Reusable React Native components (see components/README.md)
├── constants/       # App constants like colors (see constants/README.md)
├── docs/             # Additional documentation and guides
├── hooks/            # React Hooks (see hooks/README.md)
├── scripts/          # Utility scripts (see scripts/README.md)
├── app.json          # Expo configuration
└── package.json      # Dependencies and scripts
```

## User Interface

### Safe Areas

This project includes `react-native-safe-area-context` (installed with Expo Router) for handling safe areas on devices with notches and system bars.

**Quick example:**

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return <SafeAreaView style={{ flex: 1 }}>{/* Your content */}</SafeAreaView>;
}
```

See [Safe Areas Guide](docs/safe-areas.md) for more information.

### UI Components (React Native Paper)

This project includes **React Native Paper**, a Material Design 3 component library. Paper provides pre-built, accessible components that automatically adapt to light/dark mode.

**Quick example:**

```tsx
import { Button, Card, Text } from 'react-native-paper';

export default function Screen() {
  return (
    <Card>
      <Card.Content>
        <Text variant="titleLarge">Card Title</Text>
        <Button mode="contained" onPress={() => console.log('Pressed')}>
          Press me
        </Button>
      </Card.Content>
    </Card>
  );
}
```

See [UI Library Guide](docs/ui-library.md) for more information on using React Native Paper components and customizing themes.

### Assets

Assets (images, fonts, etc.) are stored in the `assets/` directory. Import them directly:

```tsx
import { Image } from 'react-native';

<Image source={require('./assets/icon.png')} />;
```

See [Assets Guide](docs/assets.md) for more information.

### Environment Variables

This project uses environment variables for configuration. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

All environment variables used in JavaScript must be prefixed with `EXPO_PUBLIC_`. See [Environment Variables Guide](docs/environment-variables.md) for more information.

## Development Tools

### Expo CLI

Expo CLI is installed automatically with the `expo` package. Common commands:

| Command                      | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `npx expo start`             | Start the development server                |
| `npx expo prebuild`          | Generate native Android and iOS directories |
| `npx expo run:android`       | Compile and run on Android                  |
| `npx expo run:ios`           | Compile and run on iOS                      |
| `npx expo install <package>` | Install a library with compatible versions  |
| `npx expo lint`              | Lint your project files                     |

See [Expo CLI documentation](https://docs.expo.dev/more/expo-cli/) for more commands.

### EAS CLI

EAS CLI is used for building, submitting, and managing your app. Install it globally:

```bash
npm install -g eas-cli
```

Common commands:

- `eas build` - Create development, preview, or production builds
- `eas submit` - Submit your app to app stores
- `eas update` - Create over-the-air (OTA) updates

See [EAS CLI documentation](https://docs.expo.dev/eas/) for more information.

### Expo Doctor

Diagnose issues in your Expo project:

```bash
npx expo-doctor
```

This command checks for common issues in app config, package.json, dependency compatibility, and overall project health.

### Expo Tools for VS Code

Install the [Expo Tools VS Code extension](https://marketplace.visualstudio.com/items?itemName=expo.vscode-expo-tools) for:

- Autocomplete and IntelliSense for app config files
- Debugging with breakpoints and variable inspection

### Orbit

Orbit is a macOS and Windows app for:

- Installing and launching builds from EAS
- Installing and launching updates
- Testing on physical devices and emulators

Install with Homebrew (macOS):

```bash
brew install expo-orbit
```

Or download from [GitHub releases](https://github.com/expo/orbit/releases).

### Snack

[Snack](https://snack.expo.dev) is an in-browser development environment for:

- Sharing code snippets
- Experimenting with React Native
- Testing prototypes without local setup

### Expo Go

Expo Go is a free app for testing your app on physical devices:

- Download from [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS)
- Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)

> **Note:** Expo Go is great for learning and prototyping, but not recommended for production apps. Use development builds instead.

## Documentation

Additional guides are available in the `docs/` directory:

- [Splash Screen and App Icon](docs/splash-screen-and-app-icon.md)
- [Safe Areas](docs/safe-areas.md)
- [System Bars](docs/system-bars.md)
- [Fonts](docs/fonts.md)
- [Assets](docs/assets.md)
- [Color Themes](docs/color-themes.md)
- [Animation](docs/animation.md)
- [Store Data](docs/store-data.md)
- [Environment Variables](docs/environment-variables.md)
- [API and Storage](docs/api-and-storage.md)

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Directory](https://reactnative.directory/) - Search for React Native libraries
- [Expo Discord](https://chat.expo.dev/) - Community support

## License

MIT
