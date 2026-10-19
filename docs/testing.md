# Testing Guide

Jest with the `jest-expo` preset and React Native Testing Library. Tests run
in Node with native modules mocked; they are the project's main verification
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
├── docs/                     tests that run the docs' snippets
├── features/
│   └── auth/  home/  ...     screen tests
├── scripts/                  tests of the Node scripts and the lint rules
├── shared/
│   ├── config/  http/  session/  storage/
│   ├── integrations/  lib/  ui/
└── testing/                  tests of the helpers below
testing/                      shared helpers
├── index.ts                  what '@/testing' exports: the four below
├── render.tsx                renderWithProviders
├── secureStore.ts            in-memory expo-secure-store
├── colorScheme.ts            setColorScheme
├── http.ts                   holdRequests, ok, httpError
└── projectCopy.ts            copies of the project, for script tests
                              (import from '@/testing/projectCopy')
jest.setup.env.js             env for every test file (URLs, log level)
jest.setup.ts                 shared mocks, reset before each test
```

<!-- @demo remove-block-start -->

The demo's tests are in `__tests__/features/demo-*/`, and the tests of the
template's setup scripts in `__tests__/scripts/`; `npm run remove-demo` deletes
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

`jest.setup.env.js` sets the API and auth URLs to placeholders
(`https://api.example.com`, `https://auth.example.com`), so the app's config
is valid in tests, and the log level to `warn`, so only warnings and errors
reach the output; to check a debug or info line, spy on `logger`. Tests of config validation call `parseEnv()`
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

await renderWithProviders(<HomeScreen />, { withSession: true }); // options: scheme, withSession
expect(await screen.findByText('Not signed in')).toBeTruthy();
```

**Full-app tests** render the real routes, layouts, and guards with
`renderRouter` from `expo-router/testing-library`, starting at a URL:

```tsx
import { renderRouter, screen } from 'expo-router/testing-library';

const app = await renderRouter('./app', { initialUrl: '/profile' });
expect(await screen.findByText('Not signed in')).toBeTruthy();
expect(app.getPathname()).toBe('/'); // the guard sent a signed-out user Home
```

Add a route just for a test with
`renderRouter({ appDir: './app', overrides: { '(auth)/boom': Bomb } })`, or
replace a screen with `overrides: { '(tabs)/index': Bomb }` (see
`__tests__/shared/ui/ErrorBoundary.test.tsx`). A tab must be declared in the
tabs layout to be a route, so an extra file in `(tabs)` isn't reachable.

`render`, `renderHook`, `renderRouter`, `fireEvent`, and `act` return
promises (React Native Testing Library 14): `await` each of them. An awaited
render has already run the effects and settled what was ready, so to see a
loading state, hold the request or the storage read first (`holdRequests()`,
or a promise the test resolves).

### A seam or adapter in a full-app test

Rendering `./app` loads `app/_layout.tsx`, which calls
`configureIntegrations()`. Once you register your providers and auth adapter
there, that call replaces a mock the test set before rendering. Call
`configureIntegrations()` yourself first (it registers only once per test
file), then set the test's mock:

```tsx
// __tests__/shared/integrations/analyticsProvider.test.tsx
import { act, waitFor } from '@testing-library/react-native';
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
  await renderRouter('./app', { initialUrl: '/' });
  await screen.findByText('Not signed in');
  // A screen view is reported just after navigation settles: wait for it.
  await waitFor(() => expect(provider.screen).toHaveBeenLastCalledWith('/'));

  await act(() => router.push('/login'));
  await screen.findByText('Welcome Back');
  await waitFor(() =>
    expect(provider.screen).toHaveBeenLastCalledWith('/login')
  );
});
```

`__tests__/docs/testingSnippets.test.tsx` runs this example from this page,
so it keeps passing.

The same goes for `setAuthAdapter()` and the error reporter. The
full-app tests that set a seam do this
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
from the test with the helpers in `@/testing` (`holdRequests`, `ok`,
`httpError`; `holdRequests(client)` for another client). Keep helpers of
your own in `testing/` too: Jest runs every file under `__tests__/` as a
test file. For the `PostsScreen` in
[Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature):

```tsx
// __tests__/features/posts/PostsScreen.test.tsx
import type { ReactElement } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/shared/http/api';
import { holdRequests, httpError, ok, renderWithProviders } from '@/testing';

declare function PostsScreen(): ReactElement; // from features/posts/screens/

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

it('shows loading, then the error, and Try again loads the list', async () => {
  const requests = holdRequests();
  await renderWithProviders(<PostsScreen />);

  expect(screen.getByTestId('loading-screen')).toBeTruthy();
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0]?.config.url).toBe('/posts');

  await act(async () =>
    requests[0]?.reject(
      httpError(requests[0].config, 503, { message: 'Service unavailable' })
    )
  );
  // A 5xx shows translated text, not the server's body.
  expect(
    await screen.findByText('The server had a problem. Please try again later.')
  ).toBeTruthy();
  expect(screen.queryByText('Service unavailable')).toBeNull();
  await fireEvent.press(screen.getByText('Try again'));

  expect(await screen.findByTestId('loading-screen')).toBeTruthy();
  await waitFor(() => expect(requests).toHaveLength(2));
  await act(async () =>
    requests[1]?.resolve(ok(requests[1].config, [{ id: 1, title: 'Hello' }]))
  );
  expect(await screen.findByText('Hello')).toBeTruthy();
  expect(screen.queryByText('Try again')).toBeNull();
});
```

### Requests that carry the token

`jest.setup.env.js` puts the API and the auth backend on different origins,
so in tests `api` points at one origin and the auth backend at another. The HTTP client sends the token
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
import type * as Env from '@/shared/config/env';
import { api } from '@/shared/http/api';
import { STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';

jest.mock('@/shared/config/env', () => {
  const actual = jest.requireActual<typeof Env>('@/shared/config/env');
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
so untested files count as uncovered. `npm run test:ci` fails below either
threshold in `package.json` (`coverageThreshold`):

- each folder as a whole (`./app/`, `./features/`, `./shared/`): 95%
  statements and lines, and branch and function levels a little under what
  the project starts with;
- each file on its own: at least 70% statements and lines and 50%
  functions, so a new module without tests fails even when the totals are
  high.

Raise them as coverage grows. (A `global` threshold would apply only to files
no other entry matches, which here is none, so there isn't one.)

<!-- @demo remove-block-start -->

The threshold still holds after `npm run remove-demo`.

<!-- @demo remove-block-end -->

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
| `06-login-back.yaml` | Back from Login returns Home (Login's back button; and Android's system back) |
| `dark-mode.yaml`     | screenshots with the device in dark mode                                      |

<!-- @demo remove-block-start -->

The demo adds flows that need it; `npm run remove-demo` deletes them with it:

| Flow                          | Checks                                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `02-tabs.yaml`                | the tab bar switches between Home and Explore                                                                                          |
| `03-auth-session.yaml`        | sign in, relaunch (still signed in), log out, relaunch (still signed out)                                                              |
| `04-login-keyboard.yaml`      | the username's return key moves to the password; the password's submits                                                                |
| `05-explore-error-retry.yaml` | Explore shows the API error, then Retry loads the list (local mock API)                                                                |
| `07-profile.yaml`             | View profile opens the protected screen, which reloads the user (the mock answers with another first name); Back, then Log out from it |

They sign in with the demo account, which the e2e mock serves (`run.sh`
defaults `MAESTRO_E2E_USERNAME` and `MAESTRO_E2E_PASSWORD` to it, each on
its own, so set both for another account), and `dark-mode.yaml` also
screenshots Explore.

<!-- @demo remove-block-end -->

Run them with a booted device that has Expo Go:

```bash
npm run test:e2e:ios       # booted iOS Simulator
npm run test:e2e:android   # emulator or device on adb
```

`scripts/e2e/run.sh` starts Metro and, by default, points
`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AUTH_API_URL` at the e2e mock API
(`scripts/e2e/mock-api.js`, on port 9999 unless `MOCK_PORT` is set), so a run needs no other server
and no network access. On Android it sets up `adb reverse` for Metro and for every
`localhost` URL it uses. It runs the numbered flows, then switches the device
to dark mode for `dark-mode.yaml` and back. Results, screenshots, and a JUnit
report go to `e2e-results/<platform>/` (gitignored).

On iOS, when a flow fails, it runs all the flows once more and prints
`E2E RETRY`; the second attempt's output has a `-retry` suffix. The
simulator and its XCTest driver fail a flow now and then on a busy machine
(a tap that never arrives, a driver that stops answering); a flow that
fails both times fails the run. Look at the first attempt's output too: a
flow that keeps needing the retry is worth fixing.

### Writing a flow

The subflows in `.maestro/subflows/` cover what most flows start with:

- `open-app.yaml` opens the app and waits for Home (the `tab-home` tab and
  the text "Session" on Home); keep both, or change the subflow, when you
  rewrite Home. With `CLEAR_STATE: 'true'` it starts from a fresh install,
  signed out.
- `open-login.yaml` opens Login from Home, and `sign-in.yaml` signs in on
  it with `MAESTRO_E2E_USERNAME` and `MAESTRO_E2E_PASSWORD`. It handles
  what iOS adds around a sign-in (the keyboard's Go key submitting the form,
  the "Save Password?" sheet), and ends once Login has closed.
- `tap-after-launch.yaml` taps an element (`TAP_ID`) and taps it once more
  if a text (`EXPECT`) hasn't appeared: use it for the first tap after
  `open-app.yaml`, which a slow iOS simulator can lose.

Signing in from a fresh install:

```yaml
- runFlow:
    file: subflows/open-app.yaml
    env:
      CLEAR_STATE: 'true'
- runFlow: subflows/open-login.yaml
- runFlow: subflows/sign-in.yaml
- assertVisible: Signed in as Ada Lovelace
```

Select elements by `testID` (`id:` in Maestro) rather than by text when the
text is inside a larger element: on iOS a Paper `List.Item` is one element
whose label joins its title and description, so `tapOn: <title>` doesn't
find it. Flows get `API_URL` and `AUTH_API_URL`, the backend's URLs for the
run, for a `runScript` that seeds or changes data on it.

The e2e mock is there so a flow can check an error state without a real
backend failing: a flow switches it between `ok` and `error`
(`.maestro/scripts/set-api-mode.js`), and in `error` mode it answers every
request with a 503. In `ok` mode it answers only the routes in its `ROUTES`
table; add the ones your error-state flows need. For anything more, such as
signed-in flows that load real data, use your own backend or mock.

<!-- @demo remove-block-start -->

The demo's flows use its `GET /todos`, `POST /auth/login`, and
`GET /auth/me` routes, which `remove-demo` deletes with the flows.

<!-- @demo remove-block-end -->

`06-login-back.yaml` taps Login's own back button (`auth-back`) on both
platforms, and on Android also checks the system Back. iOS's left-edge swipe
isn't triggered by Maestro's `swipe`; check it by hand on the Simulator, or
with an XCUITest UI test, which can drive it.

Setup:

- **Maestro CLI**: download `maestro.zip` from the
  [Maestro releases](https://github.com/mobile-dev-inc/maestro/releases),
  check it against `checksums_sha256.txt`, unzip it, and put `maestro/bin` on
  your `PATH` (or set `MAESTRO=/path/to/maestro/bin/maestro`). It needs Java
  17+ (`JAVA_HOME`).
- **Expo Go** for SDK 57 on the device (`npx expo start` offers to install it
  on a simulator or emulator).
- **iOS Simulator keyboard**: flows that type (such as a sign-in flow) use
  the software keyboard, so turn off Simulator's **I/O > Keyboard > Connect Hardware
  Keyboard** (or run
  `defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false`
  and restart the Simulator).
- To run against a native debug build instead, set `E2E_APP_ID` (its bundle
  / package ID) and `E2E_APP_URL` to its own scheme (such as
  `rnstarter-dev://`). The flows open the link only when it is an Expo Go
  `exp://` URL: a debug build loads the bundle from Metro when it launches.
  With `expo-dev-client`, set `E2E_APP_URL` to its dev-client URL: the flows
  open it when the dev client lists its development servers.
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
its bundle from Metro when it launches. The manual
**E2E (iOS, manual)** workflow (`.github/workflows/e2e-ios.yml`) does the
same on an iOS simulator with a native debug build (prebuild, then
`xcodebuild`): it covers what Expo Go on iOS doesn't, the app's own native
modules. To test another branch or tag, such as one from before a fix,
run the workflow on it (`gh workflow run e2e-ios.yml --ref <branch>`); the
branch needs the workflow file. Neither is part of the per-push checks, because a device run takes
much longer.

### Your backend or mock

Set these when you run the flows; with none set, the runner uses the e2e mock
as above.

| Variable           | Default       | What it does                                                                                                      |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `E2E_API_URL`      | the e2e mock  | `EXPO_PUBLIC_API_URL` for the run                                                                                 |
| `E2E_AUTH_API_URL` | `E2E_API_URL` | `EXPO_PUBLIC_AUTH_API_URL` for the run                                                                            |
| `E2E_BACKEND_CMD`  | none          | a command that starts your backend or mock; the runner waits until `E2E_API_URL` answers, and stops it at the end |
| `METRO_PORT`       | `8081`        | the port Metro runs on; the runner stops if something already answers there                                       |
| `MOCK_PORT`        | `9999`        | the port of the e2e mock API; the runner stops if something already answers there                                 |

For example, with a mock backend in `scripts/` (see
[Where code goes](conventions.md#where-code-goes)) that listens on port 4000:

```bash
E2E_API_URL=http://localhost:4000 E2E_BACKEND_CMD="node scripts/<your-mock>.js" \
  MAESTRO_E2E_USERNAME=tester@example.com MAESTRO_E2E_PASSWORD=test-password \
  npm run test:e2e:android
```

- **Signed-in flows** sign in through the Login screen with a test account,
  never a real user, using `subflows/sign-in.yaml` ([Writing a
  flow](#writing-a-flow)). Maestro passes `MAESTRO_*` variables to every
  flow, so the password never goes in the repository.
- **The results contain the test account.** Maestro writes the values of
  those variables into `e2e-results/` (`commands.json` and its logs), and the
  manual e2e workflows upload that folder as an artifact, which anyone who
  can read a public repository can download. Use an account that only
  reaches test data; on a public repository, don't upload `commands.json`
  (or the results at all) when flows sign in. To run signed-in flows in
  those workflows, pass the account from repository secrets in the run
  step's `env:` (`MAESTRO_E2E_USERNAME: ${{ secrets.E2E_USERNAME }}`), and
  your backend's URLs as `E2E_API_URL` / `E2E_AUTH_API_URL`.
- **A backend on another machine or HTTPS** works too: set the URL, and leave
  `E2E_BACKEND_CMD` unset. Only `localhost` URLs get `adb reverse`; see
  [A backend on your computer](connect-your-backend.md#a-backend-on-your-computer).
- **The e2e mock still runs** on port 9999, so flows that switch it keep
  working; they only affect screens that load from it.

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
