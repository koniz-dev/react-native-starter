# Getting Started

Get up and running with React Native Starter in under 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 24 (pinned in `.nvmrc`; run `nvm use`) or 22.13+, matching React
  Native 0.86's supported range - [Download](https://nodejs.org/)
- **npm** - comes with Node.js; the repository ships a `package-lock.json`
- **Expo Go app** (optional) - For testing on physical devices
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### For iOS Development (macOS only)

- **Xcode 26.4 or later** - required by Expo SDK 57 for native iOS builds; verify
  with `xcodebuild -version` before running a native build. [Download from App Store](https://apps.apple.com/app/xcode/id497799835)
- **iOS Simulator** - Included with Xcode

Expo SDK 57 supports iOS 16.4 and later. An older Xcode can still provide a
simulator, but it cannot compile this SDK's native iOS project. With an older
Xcode you can still run the app in Expo Go on the simulator (`npm start`, then
press `i`); for a native iOS build (`npx expo run:ios`), upgrade Xcode first.

### For Android Development

- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** - Installed via Android Studio
- **Android Emulator** - Set up via Android Studio
- **JDK 17** - required for native Android builds (`npx expo run:android`).
  Point `JAVA_HOME` at a JDK 17 install. The JDK 25 bundled with recent Android
  Studio releases fails the native CMake configure step ("A restricted method in
  java.lang.System has been called"). Expo Go doesn't need a JDK.

## Installation

1. **Clone or fork the repository:**

```bash
git clone https://github.com/koniz-dev/react-native-starter.git
cd react-native-starter
```

2. **Install dependencies:**

```bash
npm ci
```

`npm ci` installs exactly what `package-lock.json` records. Use `npx expo install
<package>` to add Expo-related packages so their versions match SDK 57.

3. **Set up environment variables (required):**

```bash
cp .env.example .env
```

`.env.example` sets `EXPO_PUBLIC_USE_DEMO_BACKENDS=true`, so the starter uses
JSONPlaceholder for its todos example and DummyJSON for its authentication demo
(username `emilys`, password `emilyspass`). Without a `.env`, the app opens on a
**Configuration error** screen that lists the missing variables.

To use your own backends, set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AUTH_API_URL`
and turn the demo flag off; then adapt the request and response mapping in
`services/auth.ts` to your backend's authentication contract. See
[Environment Variables](environment-variables.md) for every variable and its rules.

## Running the App

### Start Development Server

```bash
npm start
```

This starts the Expo development server. You'll see a QR code and options to:

- Press `a` - Open on Android emulator/device
- Press `i` - Open on iOS simulator (macOS only)
- Press `w` - Open in web browser (the auth demo works on web, but a page
  reload signs you out: the token is kept in memory only; see
  [API and Storage](api-and-storage.md#why-the-token-is-not-persisted-on-web))
- Scan QR code - Open in Expo Go app on your device

### Platform-Specific Commands

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web
npm run web
```

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

### Key Directories Explained

- **`app/`** - All screens go here. Files automatically become routes (Expo Router).
- **`components/`** - Reusable UI components used across screens.
- **`hooks/`** - Custom React hooks for shared logic (e.g., `useFetch`).
- **`services/`** - API client and storage utilities.
- **`constants/`** - App-wide constants like colors and theme config.
- **`types/`** - TypeScript interfaces and types.

## Make It Yours

Everything below is configuration; no source code changes are needed to ship
your own app identity and backends.

| What                                                             | Where                                                                                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App name, slug, URL scheme, bundle/package ID, marketing version | `APP` block at the top of `app.config.ts`                                                                                                                                      |
| Store build number (iOS `buildNumber`, Android `versionCode`)    | `APP_BUILD_NUMBER` environment variable at build time (default `1`)                                                                                                            |
| App icon, Android adaptive icon, splash image, favicon           | Replace the files in `assets/` (see [Splash Screen and App Icon](splash-screen-and-app-icon.md))                                                                               |
| Splash and adaptive-icon background colors                       | `APP.splashBackground` and `APP.adaptiveIconBackground` in `app.config.ts`                                                                                                     |
| API and auth backends                                            | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_AUTH_API_URL` in `.env` / build profile; set `EXPO_PUBLIC_USE_DEMO_BACKENDS=false` (see [Environment Variables](environment-variables.md)) |
| Extra hosts allowed to receive the auth token                    | `EXPO_PUBLIC_API_TRUSTED_ORIGINS`                                                                                                                                              |
| Per-variant build settings and environment                       | `eas.json` build profiles                                                                                                                                                      |

### Build variants

`APP_VARIANT` selects one of three variants. Each has its own name, bundle ID, and
scheme, so they install side by side:

| Variant                 | Name                   | Bundle/package ID               | Scheme              | `EXPO_PUBLIC_APP_ENV` |
| ----------------------- | ---------------------- | ------------------------------- | ------------------- | --------------------- |
| `development` (default) | `RN Starter (Dev)`     | `com.example.rnstarter.dev`     | `rnstarter-dev`     | `development`         |
| `preview`               | `RN Starter (Preview)` | `com.example.rnstarter.preview` | `rnstarter-preview` | `preview`             |
| `production`            | `RN Starter`           | `com.example.rnstarter`         | `rnstarter`         | `production`          |

- `npm start` runs the development variant; `npm run start:preview` and
  `npm run start:production` run the others (production without dev mode).
- `npm run prebuild:<variant>` generates the native `android/` and `ios/`
  projects for a variant (both directories are gitignored), which you can build
  locally with Android Studio / Xcode or `npx expo run:android|ios`.
- `npm run config:print` shows the resolved configuration; prefix it with
  `APP_VARIANT=preview` to inspect another variant.
- `eas.json` defines matching `development`, `preview`, and `production` build
  profiles for EAS Build. Using EAS requires your own Expo account; nothing else
  in the starter does.
- Preview and production builds use `https` URLs only; set the backend URLs in
  the build profile's `env` or with `eas env:create`, because `.env` is not
  committed.

The scripts use POSIX `VAR=value command` syntax (macOS, Linux, WSL). On Windows
without WSL, set the variables in your shell first.

## Next Steps

Now that you're running, here's where to start coding:

1. **Explore existing screens** - Check `app/(tabs)/index.tsx` to see example usage
2. **Add a new screen** - See [How to Add a New Screen](how-to.md#how-to-add-a-new-screen)
3. **Customize theme** - Edit `constants/Theme.ts` and `constants/Colors.ts`
4. **Connect to your API** - Update `EXPO_PUBLIC_API_URL` in `.env` and modify `services/api.ts`
5. **Read the guides** - Check out [How-To Guides](how-to.md) for common tasks

## Available Scripts

- `npm start` - Start Expo dev server (development variant)
- `npm run start:preview` / `npm run start:production` - Start another variant
- `npm run prebuild:development|preview|production` - Generate native projects for a variant
- `npm run config:print` - Print the resolved app configuration
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Kill process on port 8081 (default Expo port)
npx kill-port 8081
npm start
```

**Metro bundler cache issues:**

```bash
npm start -- --clear
```

**Node modules issues:**

```bash
rm -rf node_modules
npm ci
npx expo-doctor
```

Keep `package-lock.json`; regenerating it can pull peer versions that don't match
the Expo SDK.

**iOS build issues (macOS):**

```bash
cd ios
pod install
cd ..
npm run ios
```

## What's Included

This starter comes with:

- ✅ **React Native Paper** - Material Design 3 components
- ✅ **Dark/Light mode** - Automatic system preference detection
- ✅ **API client** - Axios with interceptors for auth & errors
- ✅ **Storage service** - AsyncStorage wrapper with TypeScript
- ✅ **Custom hooks** - `useFetch` for data fetching
- ✅ **Error boundary** - Global error handling
- ✅ **Loading states** - Built-in loading screen component
- ✅ **Authentication example** - Complete login flow with token management
- ✅ **TypeScript** - Full type safety
- ✅ **ESLint + Prettier** - Code quality tools
- ✅ **Example screens** - See it in action

## Learn More

- [How-To Guides](how-to.md) - Common development tasks
- [Code Conventions](conventions.md) - Project standards and best practices
- [API and Storage](api-and-storage.md) - Backend integration guide
- [UI Library Guide](ui-library.md) - React Native Paper components
- [Expo Documentation](https://docs.expo.dev/) - Official Expo docs

## Need Help?

- Check the [How-To Guides](how-to.md) for common questions
- Review [Code Conventions](conventions.md) for project standards
- Visit [Expo Discord](https://chat.expo.dev/) for community support
