# Conventions

How the code is organized and how to add to it. Lint (`npm run lint`, every
rule an error) and Prettier enforce the formatting details.

## Project structure

Routes are thin; features own their screens; `shared/` is the foundation that
every feature builds on.

```
app/                      Expo Router routes only: layouts and one-line route files
  _layout.tsx             providers, splash, session guards (Stack.Protected)
  (tabs)/index.tsx        export { HomeScreen as default } from '@/features/home/...'
  (auth)/login.tsx        signed-out only
  (app)/profile.tsx       signed-in only
features/                 one folder per feature
  home/screens/           Home: the session card
  auth/screens/           Login and Profile
  auth/<backend>Adapter.ts  your AuthAdapter (docs/connect-your-backend.md)
shared/                   foundation, no imports from features/
  config/                 validated environment (env.ts), feature flags
  http/                   createHttpClient, ApiError, the app API client
  session/                AuthAdapter + auth service, token store, SessionProvider
  storage/                AsyncStorage and SecureStore wrappers
  ui/                     theme, ErrorBoundary, LoadingScreen, ConfigErrorScreen
  lib/                    logger, useFetch
  integrations/           seams (analytics, flags, push, OTA, error reporting) and setup.ts
  i18n/                   t() and the English dictionary
__tests__/                mirrors the tree: app/, features/<name>/, shared/<area>/
testing/                  shared test helpers (see testing.md)
```

**Inside a feature**, use the folders it needs:
`features/<name>/{screens,components,api,hooks,types.ts}`. Export screens as
named exports and add a one-line route file in `app/` that re-exports it as
the default.

**Dependency direction:** `app/` → `features/` → `shared/`. `shared/` never
imports a feature, with one exception: `shared/integrations/setup.ts` is the
composition root that registers adapters. Features don't import each other's
internals.

<!-- @demo remove-block-start -->

**Demo code** lives in `features/demo-auth/` (the DummyJSON `AuthAdapter`
and the demo-credentials hint), `features/demo-todos/` (the Explore tab),
`features/demo-showcase/` (the component showcase and Home's example links),
the routes `app/(tabs)/explore.tsx` and `app/showcase.tsx`, and between
`@demo` block markers elsewhere (such as the demo adapter's registration in
`shared/integrations/setup.ts`).
`npm run remove-demo` deletes it; see [Remove the Demo](remove-demo.md).

<!-- @demo remove-block-end -->

## Navigation

Expo Router turns files in `app/` into routes: `app/<name>.tsx` is
`/<name>`, a `(group)` folder adds no URL segment, and `_layout.tsx` defines
the navigator for its folder. The root layout:

- keeps the native splash screen up until the stored session is read;
- shows `(auth)` only while signed out and `(app)` only while signed in
  (`Stack.Protected`), so deep links into a guarded group land on Home;
- anchors the stack on `(tabs)` (`unstable_settings.initialRouteName`), so
  Back from a deep-linked screen returns to Home.

Navigate with `router.push('/settings')`, `router.replace`, or `<Link>` from
`expo-router`. Route groups export a route-level error boundary
([Error Reporting](error-reporting.md#error-boundaries)). Typed routes
(`experiments.typedRoutes`) are not enabled. See
[Expo Router](https://docs.expo.dev/router/introduction/).

## Adding a screen

```tsx
// features/settings/screens/SettingsScreen.tsx
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';

export function SettingsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineMedium">Settings</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
```

Then the route: one line in `app/<name>.tsx` (for `/<name>`), or in
`app/(app)/<name>.tsx` to require sign-in, like Home's route
`app/(tabs)/index.tsx`:

```tsx
export { HomeScreen as default } from '@/features/home/screens/HomeScreen';
```

### A tab that needs sign-in

Tabs live in `app/(tabs)/`, not in `app/(app)/`, so the sign-in guard doesn't
cover them. Signed out, a tab that loads data would send its request without
a token, get a 401, and show a raw error. The 401 doesn't touch the session:
there was no token to reject. Instead, check the session in the screen, and
mount the part that loads data only when the user is signed in:

```tsx
// features/notes/screens/NotesScreen.tsx
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { t } from '@/shared/i18n';
import { useSession } from '@/shared/session/SessionProvider';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

declare function NotesList(): React.JSX.Element; // loads with useFetch

export function NotesScreen() {
  const { session } = useSession();
  if (session.status === 'loading') return <LoadingScreen />;
  if (session.status === 'signedOut') {
    return (
      <SafeAreaView style={styles.prompt}>
        <Text>{t('home.session.signedOut')}</Text>
        <Button mode="contained" onPress={() => router.push('/login')}>
          {t('home.session.signIn')}
        </Button>
      </SafeAreaView>
    );
  }
  return <NotesList />;
}

const styles = StyleSheet.create({
  prompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
```

Use your own strings for the prompt. After sign-in, the Login screen returns
to the tab, which now renders the list.

Move its strings to `shared/i18n/en.ts` and read them with `t()` (the keys
are typed), add its tests under
`__tests__/features/<name>/`, and its endpoints in `api/` (see
[Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature)).

## Where code goes

| Code                                         | Place                                                                             |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| A screen                                     | `features/<name>/screens/`, plus a route in `app/`                                |
| A component used by one feature              | `features/<name>/components/`                                                     |
| A component used by several features         | `shared/ui/`                                                                      |
| A hook for one feature / a generic hook      | `features/<name>/hooks/` / `shared/lib/`                                          |
| Endpoints                                    | `features/<name>/api/`, built on `shared/http/api.ts`                             |
| A third-party service                        | an adapter registered in `shared/integrations/setup.ts`                           |
| Sign-in against your backend                 | `features/auth/<backend>Adapter.ts`, registered in `shared/integrations/setup.ts` |
| Dev-only Node code (a mock backend, tooling) | `scripts/`, for example a mock backend in its own folder                          |

`scripts/` is Node code that the app never imports, so Metro doesn't bundle
it. Lint treats it as Node: it may use `console` and `process.env`, which
are lint errors in app code. Run it with `node`, or through an npm script.

## Code style

- **Names:** components and screens in PascalCase files (`LoginScreen.tsx`),
  hooks `useThing.ts`, other modules camelCase (`tokenStore.ts`).
- **Exports:** named exports; only `app/` route files use default exports.
- **Imports:** `@/` for anything outside the current feature, relative within
  it. `import type` for types.
- **Types:** TypeScript strict with `noUncheckedIndexedAccess`; no `any`
  (lint error). Validate data at the edges (config with zod, API payloads in
  adapters).
- **Styles:** `StyleSheet.create` at the bottom of the file; colors from the
  theme, never literals (both are lint errors).
- **Text:** user-facing strings through `t()`.
- **Logging:** `logger` from `@/shared/lib/logger`, never `console` (lint
  error); see [Error Reporting](error-reporting.md).
- **Errors:** catch async errors where you can show something, and pass the
  rest to `logger.error`. Boundaries catch render errors.
- **Comments:** say why, not what; keep doc comments on exported APIs.

## Commits

Small, single-purpose commits, each passing the local gate
(`npm run lint && npm run type-check && npm run test:ci`). The starter has
no commit-message convention; use your team's.
