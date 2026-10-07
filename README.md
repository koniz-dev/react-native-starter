# React Native Starter

A clean starter template for React Native with Expo Router, TypeScript, and file-based routing.

## Quick Start

```bash
# Install dependencies (Node 24 from .nvmrc, or 22.13+)
npm ci

# Configure (enables the public demo backends)
cp .env.example .env

# Start development server
npm start
```

Then press `a` (Android), `i` (iOS), or `w` (web), or scan the QR code with Expo Go.

**📖 For detailed setup instructions, see [Getting Started Guide](docs/getting-started.md)**

## Features

This starter includes everything you need to build a production-ready React Native app:

- ✅ **React Native Paper** - Material Design 3 components with dark/light mode
- ✅ **Dark/Light Mode** - Automatic system preference detection
- ✅ **API Client** - Axios with interceptors for authentication and error handling
- ✅ **Storage Service** - AsyncStorage wrapper with TypeScript support
- ✅ **Custom Hooks** - `useFetch` for data fetching with loading/error states
- ✅ **Error Boundary** - Global error handling component
- ✅ **Loading States** - Built-in loading screen component
- ✅ **Authentication Example** - Complete login flow with token management
- ✅ **TypeScript** - Full type safety throughout
- ✅ **ESLint + Prettier** - Code quality and formatting tools
- ✅ **Example Screens** - See features in action

## State Management Options

This starter template provides multiple state management solutions to choose from. Each option is available as a separate branch with a corresponding pull request for easy review and integration:

### 🔴 Redux Toolkit

**Branch:** [`state-management/redux`](https://github.com/koniz-dev/react-native-starter/tree/state-management/redux)  
**Pull Request:** [#2](https://github.com/koniz-dev/react-native-starter/pull/2)

A complete Redux Toolkit implementation with typed hooks, auth slice, and todos slice. Perfect for large-scale applications requiring predictable state management.

**Features:**

- Redux Toolkit with typed hooks
- Auth slice for authentication state
- Todos slice for todo management
- Full TypeScript support

### 🔵 React Context API

**Branch:** [`state-management/react-context`](https://github.com/koniz-dev/react-native-starter/tree/state-management/react-context)  
**Pull Request:** [#3](https://github.com/koniz-dev/react-native-starter/pull/3)

Built-in React Context API with `useReducer` for state management. No external dependencies required, perfect for smaller to medium-sized applications.

**Features:**

- AuthContext and TodosContext
- useReducer pattern for state updates
- Zero external dependencies
- Native React solution

### 🟢 Zustand

**Branch:** [`state-management/zustand`](https://github.com/koniz-dev/react-native-starter/tree/state-management/zustand)  
**Pull Request:** [#4](https://github.com/koniz-dev/react-native-starter/pull/4)

Lightweight and simple state management library with minimal boilerplate. Great balance between simplicity and power.

**Features:**

- Minimal boilerplate
- Simple API
- Small bundle size
- Easy to learn

### 🟡 Jotai

**Branch:** [`state-management/jotai`](https://github.com/koniz-dev/react-native-starter/tree/state-management/jotai)  
**Pull Request:** [#5](https://github.com/koniz-dev/react-native-starter/pull/5)

Atomic state management with fine-grained reactivity. Excellent for component-level state that needs to be shared across the app.

**Features:**

- Atomic state composition
- Fine-grained reactivity
- Great performance
- Flexible architecture

### How to Use

To try out any of these state management solutions:

1. **Checkout the branch:**

   ```bash
   git checkout state-management/redux  # or react-context, zustand, jotai
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Review the Pull Request** to see what changes were made

4. **Merge or cherry-pick** the changes you want into your project

Each branch includes complete implementation examples and updated documentation.

## Getting Started

For detailed installation and setup instructions, see the [Getting Started Guide](docs/getting-started.md).

**Quick overview:**

1. **Prerequisites:** Node.js 24 (`.nvmrc`) or 22.13+; iOS native builds also
   require Xcode 26.4+ for Expo SDK 57
2. **Install:** `npm ci`
3. **Configure:** `cp .env.example .env`
4. **Run:** `npm start`
5. **Code:** Start editing `app/(tabs)/index.tsx`

### Authentication demo

The starter uses DummyJSON for the runnable login example, separately from the
JSONPlaceholder Todos API. Sign in with username `emilys` and password `emilyspass`.
The Home tab then shows "Signed in as …" with a **Log out** button; the session
survives an app restart and logging out clears it. For a real backend, set `EXPO_PUBLIC_AUTH_API_URL` and adapt the request/response
mapping in `services/auth.ts` to the backend contract.

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

## Available Scripts

- `npm start` - Start Expo dev server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types without emitting files
- `npm test` - Run tests

## Project Structure

```
react-native-starter/
├── app/              # Expo Router screens (file-based routing)
│   ├── (tabs)/       # Tab navigation screens
│   └── _layout.tsx   # Root layout with theme provider
├── components/       # Reusable UI components
│   ├── ErrorBoundary.tsx
│   └── LoadingScreen.tsx
├── hooks/            # Custom React hooks
│   └── useFetch.ts   # Data fetching hook
├── services/         # API & storage services
│   ├── api.ts        # Axios client with interceptors
│   └── storage.ts    # AsyncStorage wrapper
├── types/            # TypeScript type definitions
│   └── api.ts        # API response types
├── constants/        # App constants
│   ├── Colors.ts     # Color definitions
│   └── Theme.ts      # React Native Paper theme
├── assets/           # Images, fonts, static files
└── docs/             # Documentation
```

**Key directories:**

- **`app/`** - All screens go here. Files automatically become routes (Expo Router).
- **`components/`** - Reusable UI components used across screens.
- **`hooks/`** - Custom React hooks for shared logic (e.g., `useFetch`).
- **`services/`** - API client and storage utilities.
- **`constants/`** - App-wide constants like colors and theme config.
- **`types/`** - TypeScript interfaces and types.

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

Configuration comes from validated `EXPO_PUBLIC_*` variables (`config/env.ts`); a missing or invalid value shows a configuration error screen at startup. Copy `.env.example` to `.env` (it enables the public demo backends) and adjust:

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

- `eas build --profile development|preview|production` - Build a variant using the profiles in `eas.json` (requires your own Expo account)
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

### Essential Guides

- **[Getting Started](docs/getting-started.md)** - Complete setup guide (start here!)
- **[How-To Guides](docs/how-to.md)** - Common development tasks
- **[Code Conventions](docs/conventions.md)** - Project standards and best practices

### Feature Guides

- **[API and Storage](docs/api-and-storage.md)** - Backend integration guide
- **[Integrations](docs/integrations.md)** - Analytics, feature flags, push, OTA updates, and i18n seams
- **[UI Library](docs/ui-library.md)** - React Native Paper components
- **[Color Themes](docs/color-themes.md)** - Theming and dark mode
- **[Error and Loading Handling](docs/error-and-loading.md)** - State management

### Additional Guides

- [Splash Screen and App Icon](docs/splash-screen-and-app-icon.md)
- [Safe Areas](docs/safe-areas.md)
- [System Bars](docs/system-bars.md)
- [Fonts](docs/fonts.md)
- [Assets](docs/assets.md)
- [Animation](docs/animation.md)
- [Store Data](docs/store-data.md)
- [Environment Variables](docs/environment-variables.md)

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Directory](https://reactnative.directory/) - Search for React Native libraries
- [Expo Discord](https://chat.expo.dev/) - Community support

## License

MIT License - See [LICENSE](LICENSE) for more information.
