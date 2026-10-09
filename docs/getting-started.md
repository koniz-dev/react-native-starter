# Getting Started

## Prerequisites

- Node.js 24 (the version in `.nvmrc`) or 22.13+, and npm.
- To run on a device: [Expo Go](https://expo.dev/go) for SDK 57.
- For simulators: Xcode (iOS Simulator, macOS only) or Android Studio (an
  Android emulator). Building the native iOS app yourself needs Xcode 26.4+,
  which Expo SDK 57 requires.

## Install and run

```bash
npm ci
cp .env.example .env
npm start
```

`npm ci` installs the exact versions in `package-lock.json`; keep the lockfile
(regenerating it can pull versions that don't match the Expo SDK).

`.env.example` sets `EXPO_PUBLIC_USE_DEMO_BACKENDS=true`, so the app talks to
the public demo backends (JSONPlaceholder and DummyJSON) without further
setup. Without a `.env`, the app opens on a configuration error screen that
lists what is missing; see [Environment Variables](environment-variables.md).

In the terminal Metro shows, press `i` (iOS Simulator), `a` (Android
emulator), or `w` (web), or scan the QR code with Expo Go. On Home, tap
**Sign in** and use `emilys` / `emilyspass`.

## Scripts

| Script                                                        | What it does                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm start`                                                   | Metro for the development variant                                                                             |
| `npm run ios` / `npm run android` / `npm run web`             | Metro and open that platform                                                                                  |
| `npm run start:preview`, `npm run start:production`           | Metro for another variant (production without dev mode); see [Make It Yours](make-it-yours.md#build-variants) |
| `npm run prebuild:development` (or `:preview`, `:production`) | Generate the native `ios/` and `android/` projects for a variant (gitignored)                                 |
| `npm run config:print`                                        | Print the resolved app config (`APP_VARIANT=preview npm run config:print` for another variant)                |
| `npm run lint` / `npm run lint:fix`                           | ESLint, failing on any warning                                                                                |
| `npm run format` / `npm run format:check`                     | Prettier                                                                                                      |
| `npm run type-check`                                          | `tsc --noEmit`                                                                                                |
| `npm test`                                                    | Jest in watch mode                                                                                            |
| `npm run test:ci`                                             | Jest once, with coverage and its threshold                                                                    |
| `npm run test:coverage`                                       | Jest with an HTML coverage report in `coverage/`                                                              |
| `npm run docs:check`                                          | Compile the docs' TypeScript snippets and check their paths and scripts                                       |
| `npm run remove-demo`                                         | Remove the demo features ([Remove the Demo](remove-demo.md))                                                  |

The local gate before a commit is
`npm run lint && npm run type-check && npm run test:ci`; CI also runs
`npm run format:check`, `npm run docs:check`, `npx expo-doctor`, and a web
export (`.github/workflows/ci.yml`).

The variant scripts use POSIX `VAR=value command` syntax (macOS, Linux, WSL).

## Where things are

`app/` holds only routes; screens live in `features/`, and the foundation in
`shared/`. See [Conventions](conventions.md#project-structure).

## Next

1. [Make It Yours](make-it-yours.md): app name, IDs, icons, theme, variants.
2. [Connect Your Backend](connect-your-backend.md).
3. [Remove the Demo](remove-demo.md).

## Troubleshooting

- **Stale bundle or odd Metro errors:** `npm start -- --clear`.
- **Dependency problems:** `npx expo-doctor`, then `npx expo install --check`.
  To reinstall, delete `node_modules` and run `npm ci`.
- **"Configuration error" screen:** a required `EXPO_PUBLIC_*` value is
  missing or invalid; the screen names it. Restart Metro after editing `.env`.
- **Port 8081 in use:** stop the other Metro process, or `npm start -- --port 8082`.
- More: [Expo troubleshooting](https://docs.expo.dev/troubleshooting/overview/).
