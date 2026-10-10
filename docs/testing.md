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
│   └── auth/  home/          screen tests
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

<!-- @demo remove-block-start -->

The demo's tests are in `__tests__/features/demo-*/`, and the tests of the
starter's own scripts in `__tests__/scripts/`; `npm run remove-demo` deletes
the demo tests and its own.

<!-- @demo remove-block-end -->

## Shared setup

`jest.setup.ts` runs for every test file (`setupFilesAfterEnv`) and mocks:

| Module                          | Mock                                                | Reset before each test               |
| ------------------------------- | --------------------------------------------------- | ------------------------------------ |
| AsyncStorage                    | the library's in-memory mock                        | cleared, then the install marker set |
| `expo-secure-store`             | an in-memory store (`secureStore` from `@/testing`) | emptied, defaults restored           |
| `useColorScheme` (React Native) | returns the scheme set with `setColorScheme()`      | back to `'light'`                    |

The install marker makes every test an app that has launched before, so a
token seeded in secure storage is restored. To test the first launch after an
install, remove it: `await removeItem(STORAGE_KEYS.INSTALL_MARKER)` (see
`__tests__/app/sessionRoutes.test.tsx`).

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
directly. One consequence: in tests the API and the auth backend are on
different origins, so requests through `api` never carry the token; see
[Requests that carry the token](#requests-that-carry-the-token).

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

### A seam or adapter in a full-app test

Rendering `./app` loads `app/_layout.tsx`, which calls
`configureIntegrations()`. Once you register your providers and auth adapter
there, that call replaces a mock the test set before rendering. Call
`configureIntegrations()` yourself first (it registers only once per test
file), then set the test's mock:

```tsx
import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';
import { configureIntegrations } from '@/shared/integrations/setup';

const provider: Analytics = {
  track: jest.fn(),
  screen: jest.fn(),
  identify: jest.fn(),
};

beforeEach(() => {
  configureIntegrations(); // the app's providers first
  analyticsSeam.set(provider); // then this test's mock
});
afterEach(() => analyticsSeam.reset());

it('reports a screen view for each route', async () => {
  renderRouter('./app', { initialUrl: '/' });
  await screen.findByText('Not signed in');
  expect(provider.screen).toHaveBeenLastCalledWith('/');

  act(() => router.push('/login'));
  await screen.findByText('Welcome Back');
  expect(provider.screen).toHaveBeenLastCalledWith('/login');
});
```

The same goes for `setAuthAdapter()` and the error reporter. The starter's
own full-app tests that set a seam do this
(`__tests__/shared/integrations/screenTracking.test.tsx`,
`__tests__/shared/integrations/i18n.test.tsx`,
`__tests__/shared/ui/ErrorBoundary.test.tsx`), so they keep passing when you
register real providers. A screen or component test that doesn't render
`./app` can set a mock directly.

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

To check a screen's states in order, hold each request open and answer it
from the test. For the `PostsScreen` in
[Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature):

```tsx
// __tests__/features/posts/PostsScreen.test.tsx
import type { ReactElement } from 'react';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/shared/http/api';
import { renderWithProviders } from '@/testing';

declare function PostsScreen(): ReactElement; // from features/posts/screens/

interface HeldRequest {
  config: InternalAxiosRequestConfig;
  resolve: (response: AxiosResponse) => void;
  reject: (error: unknown) => void;
}

/** Replaces the API's adapter: each request waits until the test answers. */
function holdRequests(): HeldRequest[] {
  const held: HeldRequest[] = [];
  api.defaults.adapter = (config =>
    new Promise((resolve, reject) =>
      held.push({ config, resolve, reject })
    )) as AxiosAdapter;
  return held;
}

const ok = (config: InternalAxiosRequestConfig, data: unknown) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

const unavailable = (config: InternalAxiosRequestConfig) =>
  new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    data: { message: 'Service unavailable' },
    status: 503,
    statusText: 'Service Unavailable',
    headers: new AxiosHeaders(),
    config,
  });

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

it('shows loading, then the error, and Retry loads the list', async () => {
  const requests = holdRequests();
  renderWithProviders(<PostsScreen />);

  expect(screen.getByText('Loading posts...')).toBeTruthy();
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0]?.config.url).toBe('/posts');

  await act(async () => requests[0]?.reject(unavailable(requests[0].config)));
  fireEvent.press(await screen.findByText('Service unavailable. Retry'));

  expect(await screen.findByText('Loading posts...')).toBeTruthy();
  await waitFor(() => expect(requests).toHaveLength(2));
  await act(async () =>
    requests[1]?.resolve(ok(requests[1].config, [{ id: 1, title: 'Hello' }]))
  );
  expect(await screen.findByText('Hello')).toBeTruthy();
  expect(screen.queryByText(/Retry/)).toBeNull();
});
```

### Requests that carry the token

`jest.setup.env.js` turns the demo backends on, so in tests `api` points at
one origin and the auth backend at another. The HTTP client sends the token
only to the auth backend's origin (and `EXPO_PUBLIC_API_TRUSTED_ORIGINS`), so
requests through `api` go out without it, and a 401 there is not refreshed.
If your API and auth backend share an origin, test the token and the 401
handling in one of two ways:

- send the request through `authClients.authenticated` from
  `shared/session/authService.ts`, which targets the auth origin; or
- give the test file the same origin for both, by mocking `getConfig()`
  (`jest.mock` runs before the imports):

```ts
// __tests__/shared/http/sameOrigin.test.ts
import { api } from '@/shared/http/api';
import { STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';

jest.mock('@/shared/config/env', () => {
  const actual = jest.requireActual<typeof import('@/shared/config/env')>(
    '@/shared/config/env'
  );
  const config = actual.getConfig();
  return {
    ...actual,
    getConfig: () => ({ ...config, apiUrl: config.authApiUrl }),
  };
});

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

it('sends the stored token to an API on the auth origin', async () => {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
  let authorization: unknown;
  api.defaults.adapter = async config => {
    authorization = config.headers.Authorization;
    return { data: [], status: 200, statusText: 'OK', headers: {}, config };
  };

  await api.get('/notes');

  expect(authorization).toBe('Bearer stored-token');
});
```

## Coverage

`collectCoverageFrom` covers every file in `app/`, `features/`, and `shared/`,
so untested files count as uncovered. `npm run test:ci` fails below the
global threshold in `package.json` (`coverageThreshold`): 95% statements, 88%
branches, 92% functions, 95% lines. The threshold was set on 2026-10-09 just
under the measured coverage (97.3 / 90.4 / 94.4 / 97.5), and it still passes
without the demo; raise it as coverage grows.

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

| Flow                 | Checks                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `01-cold-start.yaml` | a fresh start opens Home, signed out, with the Sign in button                 |
| `06-login-back.yaml` | Back from Login returns Home (Android system back; skipped on iOS, see below) |
| `dark-mode.yaml`     | screenshots with the device in dark mode                                      |

<!-- @demo remove-block-start -->

The demo adds flows that need it; `npm run remove-demo` deletes them with it:

| Flow                          | Checks                                                                    |
| ----------------------------- | ------------------------------------------------------------------------- |
| `02-tabs.yaml`                | the tab bar switches between Home and Explore                             |
| `03-auth-session.yaml`        | sign in, relaunch (still signed in), log out, relaunch (still signed out) |
| `04-login-keyboard.yaml`      | the username's return key moves to the password; the password's submits   |
| `05-explore-error-retry.yaml` | Explore shows the API error, then Retry loads the list (local mock API)   |

They sign in with the DummyJSON demo account (`subflows/sign-in.yaml`), so
they need network access, and `dark-mode.yaml` also screenshots Explore.

<!-- @demo remove-block-end -->

Run them with a booted device that has Expo Go:

```bash
npm run test:e2e:ios       # booted iOS Simulator
npm run test:e2e:android   # emulator or device on adb
```

`scripts/e2e/run.sh` starts a local mock API (`scripts/e2e/mock-api.js`, on
port 9999) and Metro with `EXPO_PUBLIC_API_URL` pointing at it, so a flow can
switch the API between success and failure (`.maestro/scripts/set-api-mode.js`).
Add the endpoints your flows need to the mock; sign-in flows need a test
account on your backend. On Android it sets up
`adb reverse` for both ports. It runs the numbered flows, then switches the
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
