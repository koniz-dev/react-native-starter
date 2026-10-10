# Testing Guide

Jest with the `jest-expo` preset and React Native Testing Library. Tests run
in Node with native modules mocked; they are the starter's main verification
harness, alongside the Maestro flows and manual runs on simulators.

## Commands

```bash
npm test               # watch mode
npm run test:ci        # once, with coverage and the coverage threshold (the CI gate)
npm run test:coverage  # once, with an HTML report in coverage/
npm run test:e2e:ios   # Maestro flows on a booted simulator (see below)
npx jest __tests__/features/auth   # one folder or file
```

The full local gate is `npm run lint && npm run type-check && npm run test:ci`.

## Layout

```
__tests__/                    mirrors the source tree
├── app/                      full-app routing tests: guards, initial route, theme, status bar
├── features/
│   ├── auth/  home/          screen tests
│   └── demo-*/               demo tests (deleted by npm run remove-demo)
└── shared/
    ├── config/  http/  session/  storage/
    ├── integrations/  lib/  ui/
testing/                      shared helpers (import from '@/testing')
├── render.tsx                renderWithProviders
├── secureStore.ts            in-memory expo-secure-store
└── colorScheme.ts            setColorScheme
jest.setup.env.js             env for every test file (demo backends on)
jest.setup.ts                 shared mocks, reset before each test
```

## Shared setup

`jest.setup.ts` runs for every test file (`setupFilesAfterEnv`) and mocks:

| Module                          | Mock                                                | Reset before each test     |
| ------------------------------- | --------------------------------------------------- | -------------------------- |
| AsyncStorage                    | the library's in-memory mock                        | cleared                    |
| `expo-secure-store`             | an in-memory store (`secureStore` from `@/testing`) | emptied, defaults restored |
| `useColorScheme` (React Native) | returns the scheme set with `setColorScheme()`      | back to `'light'`          |

So tests don't repeat these mocks. Seed or inspect state directly:

```ts
import * as SecureStore from 'expo-secure-store';
import { secureStore, setColorScheme } from '@/testing';
import { STORAGE_KEYS } from '@/shared/storage/storage';

secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token'); // "signed in"
setColorScheme('dark');
jest
  .mocked(SecureStore.getItemAsync)
  .mockRejectedValueOnce(new Error('Keychain unavailable'));
```

Anything else a test mocks (for example `expo-router` in a component test) is
local to that file.

`jest.setup.env.js` sets `EXPO_PUBLIC_USE_DEMO_BACKENDS=true`, so the app's
config is valid in tests. Tests of config validation call `parseEnv()`
directly.

## Two kinds of UI tests

**Screen or component tests** render one component with the providers the
root layout gives every screen:

```tsx
import { screen } from '@testing-library/react-native';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { renderWithProviders } from '@/testing';

renderWithProviders(<HomeScreen />, { withSession: true }); // options: scheme, withSession
expect(await screen.findByText('Not signed in')).toBeTruthy();
```

**Full-app tests** render the real routes, layouts, and guards with
`renderRouter` from `expo-router/testing-library`, starting at a URL:

```tsx
import { renderRouter, screen } from 'expo-router/testing-library';

const app = renderRouter('./app', { initialUrl: '/profile' });
expect(await screen.findByText('Not signed in')).toBeTruthy();
expect(app.getPathname()).toBe('/'); // the guard sent a signed-out user Home
```

Add a route just for a test with
`renderRouter({ appDir: './app', overrides: { '(tabs)/boom': Bomb } })` (see
`__tests__/shared/ui/ErrorBoundary.test.tsx`).

## Network

Tests never reach the network. Either stub a service
(`jest.spyOn(authService, 'login')`), or replace the client's axios adapter to
go through the real HTTP stack (`ApiError` mapping, 401 handling):

```ts
import { api } from '@/shared/http/api';

api.defaults.adapter = async config => ({
  data: [],
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});
```

`__tests__/features/demo-todos/TodosScreen.test.tsx` holds each request open
to check the loading, error, Retry, and list states in order.

## Coverage

`collectCoverageFrom` covers every file in `app/`, `features/`, and `shared/`,
so untested files count as uncovered. `npm run test:ci` fails below the
global threshold in `package.json` (`coverageThreshold`): 95% statements, 88%
branches, 92% functions, 95% lines. The threshold was set on 2026-10-09 just
under the measured coverage (97.3 / 90.4 / 94.4 / 97.5) and still passes after
`npm run remove-demo`; raise it as coverage grows.

## Writing good tests

- Assert behavior a user or caller can observe: text shown, navigation,
  stored values, requests sent. Avoid "renders without crashing" and
  `expect(result).toBeTruthy()` on a render result.
- Prefer `findBy*` / `waitFor` for anything async (session restore, requests).
- Name tests after the behavior: "logging out clears the session and returns
  to the signed-out state".
- When a fix guards against a regression, check that the test fails without
  the fix.

## End-to-end flows (Maestro)

[Maestro](https://maestro.dev) flows in `.maestro/` drive the app in Expo Go
on a simulator or emulator. No account is needed.

| Flow                          | Checks                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `01-cold-start.yaml`          | a fresh start opens Home, signed out                                          |
| `06-login-back.yaml`          | Back from Login returns Home (Android system back; skipped on iOS, see below) |
| `02-tabs.yaml`                | the tab bar switches between Home and Explore                                 |
| `03-auth-session.yaml`        | sign in, relaunch (still signed in), log out, relaunch (still signed out)     |
| `04-login-keyboard.yaml`      | the username's return key moves to the password; the password's submits       |
| `05-explore-error-retry.yaml` | Explore shows the API error, then Retry loads the list (local mock API)       |
| `dark-mode.yaml`              | screenshots of Home and Explore with the device in dark mode                  |

Run them with a booted device that has Expo Go:

```bash
npm run test:e2e:ios       # booted iOS Simulator
npm run test:e2e:android   # emulator or device on adb
```

`scripts/e2e/run.sh` starts a local mock API (`scripts/e2e/mock-api.js`, on
port 9999) and Metro with `EXPO_PUBLIC_API_URL` pointing at it, so the Explore
flow can switch the API between success and failure (the auth flows still use
the DummyJSON demo backend, which needs network access). On Android it sets
up `adb reverse` for both ports. It runs the numbered flows, then switches the
device to dark mode for `dark-mode.yaml` and back. Results, screenshots, and a
JUnit report go to `e2e-results/<platform>/` (gitignored).

On iOS, Back from Login is the left-edge swipe, which Maestro's `swipe` does
not trigger, so `run.sh` skips the `android-only` flow there. Check the edge
swipe by hand on the Simulator, or with an XCUITest UI test, which can drive
it.

Setup:

- **Maestro CLI**: download `maestro.zip` from the
  [Maestro releases](https://github.com/mobile-dev-inc/maestro/releases),
  check it against `checksums_sha256.txt`, unzip it, and put `maestro/bin` on
  your `PATH` (or set `MAESTRO=/path/to/maestro/bin/maestro`). It needs Java
  17+ (`JAVA_HOME`).
- **Expo Go** for SDK 57 on the device (`npx expo start` offers to install it
  on a simulator or emulator).
- **iOS Simulator keyboard**: the login flows type with the software
  keyboard, so turn off Simulator's **I/O > Keyboard > Connect Hardware
  Keyboard** (or run
  `defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false`
  and restart the Simulator).
- To run against a development build instead, set `E2E_APP_ID` (its bundle /
  package ID) and `E2E_APP_URL` (its dev-client URL).
- Slow emulators: the runner allows Maestro 180 s to start its driver
  (`MAESTRO_DRIVER_STARTUP_TIMEOUT`, in ms), builds the bundle before the
  flows start, and on Android turns off system animations and the "isn't
  responding" dialogs for background apps (test-device settings it leaves
  in place).

The Android flows can also run in GitHub Actions: the manual
**E2E (Android, manual)** workflow (`.github/workflows/e2e-android.yml`)
boots an emulator, installs the Maestro release and the app, and uploads
`e2e-results/android`. Its `app` input picks Expo Go (the default) or
`native-debug`: a debug build of the development variant
(`npm run prebuild:development`, then Gradle `assembleDebug`), which loads
its bundle from Metro and opens with `rnstarter-dev://`. It is not part of the per-push checks because an
emulator run takes much longer.

## Timeouts

`testTimeout` is 15 s rather than Jest's 5 s: the first
`renderRouter('./app')` in each test file loads every route module, which
takes about 1.5 s alone but can pass 5 s while several such files run in
parallel workers. Later renders in the same file take well under a second.

## Configuration

`package.json` → `jest`: preset `jest-expo`, `testTimeout`, `setupFiles`
(`jest.setup.env.js`), `setupFilesAfterEnv` (`jest.setup.ts`),
`collectCoverageFrom`, `coverageThreshold`, and `transformIgnorePatterns`
for React Native packages shipped untranspiled.

## Resources

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Router: testing](https://docs.expo.dev/router/reference/testing/)
- [Jest](https://jestjs.io/docs/getting-started)
