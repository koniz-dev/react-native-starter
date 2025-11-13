# Getting Started

Get up and running with React Native Starter in under 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo Go app** (optional) - For testing on physical devices
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### For iOS Development (macOS only)

- **Xcode** (latest version) - [Download from App Store](https://apps.apple.com/app/xcode/id497799835)
- **iOS Simulator** - Included with Xcode

### For Android Development

- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** - Installed via Android Studio
- **Android Emulator** - Set up via Android Studio

## Installation

1. **Clone or fork the repository:**

```bash
git clone https://github.com/koniz-dev/react-native-starter.git
cd react-native-starter
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables (optional):**

```bash
cp .env.example .env
```

Edit `.env` and add your API URL if needed:

```bash
EXPO_PUBLIC_API_URL=https://api.example.com
```

## Running the App

### Start Development Server

```bash
npm start
```

This starts the Expo development server. You'll see a QR code and options to:

- Press `a` - Open on Android emulator/device
- Press `i` - Open on iOS simulator (macOS only)
- Press `w` - Open in web browser
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

## Next Steps

Now that you're running, here's where to start coding:

1. **Explore existing screens** - Check `app/(tabs)/index.tsx` to see example usage
2. **Add a new screen** - See [How to Add a New Screen](how-to.md#how-to-add-a-new-screen)
3. **Customize theme** - Edit `constants/Theme.ts` and `constants/Colors.ts`
4. **Connect to your API** - Update `EXPO_PUBLIC_API_URL` in `.env` and modify `services/api.ts`
5. **Read the guides** - Check out [How-To Guides](how-to.md) for common tasks

## Available Scripts

- `npm start` - Start Expo dev server
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
rm -rf node_modules package-lock.json
npm install
```

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
