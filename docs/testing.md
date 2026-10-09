# Testing Guide

Jest with the `jest-expo` preset and React Native Testing Library. Tests run
in Node with native modules mocked; they are the starter's main verification
harness, alongside manual runs on simulators (see the evidence folders).

## Commands

```bash
npm test               # watch mode
npm run test:ci        # once, with coverage and the coverage threshold (the CI gate)
npm run test:coverage  # once, with an HTML report in coverage/
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
  the fix (the evidence folders record these mutation checks).

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
