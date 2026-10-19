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
  not-found/screens/      the not-found screen (app/+not-found.tsx)
shared/                   foundation, no imports from features/
  config/                 validated environment (env.ts), feature flags
  http/                   createHttpClient, ApiError, the app API client
  session/                AuthAdapter + auth service, token store, SessionProvider
  storage/                AsyncStorage and SecureStore wrappers
  ui/                     theme, ErrorBoundary, LoadingScreen, ConfigErrorScreen,
                          DocumentTitle, useAnnouncement
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
  (`Stack.Protected`), so deep links into a guarded group land on Home (an
  in-app link to one does nothing; see
  [A link to a screen that needs sign-in](#a-link-to-a-screen-that-needs-sign-in));
- returns a user who signs in, signs out, or whose session ends to the
  screen below Login or Profile (`useNoExtraHome` in `app/_layout.tsx`
  undoes Expo Router's own redirect, which would put a second Home there;
  a new guarded group goes in its `GUARDED_GROUPS`);
- anchors the stack on `(tabs)` (`unstable_settings.anchor`), so
  Back from a deep-linked screen returns to Home;
- shows `app/+not-found.tsx` for a URL no route matches (an outdated deep
  link, a mistyped web address), with a way Home.

The root stack hides headers. `(app)` and `(auth)` show their own, with a
back button. Add your app's tabs as files in `app/(tabs)/`, next to Home's
`index.tsx`, and give each a `<Tabs.Screen name="<file>">` in
`app/(tabs)/_layout.tsx` with its `title` from `t()`, a `tabBarIcon`, and a
`tabBarButtonTestID` (copy Home's). A file without a `<Tabs.Screen>` is not a
tab at all: it has no button, and a link or deep link to it lands on Home.

Navigate with `router.navigate('/settings')`, `router.replace`, or `<Link>` from
`expo-router`. To go somewhere right after `signIn` or `signOut`, use
`router.replace`: the guards' redirect replaces whatever is on top then, so a
screen just pushed or navigated to is lost. Route groups export a route-level error boundary
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

Move its strings to `shared/i18n/en.ts` and read them with `t()` (the keys
are typed), add its tests under
`__tests__/features/<name>/`, and its endpoints in `api/` (see
[Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature)).

What the shipped screens do, so a new one fits in:

- **Header:** a screen directly under the root stack has none. For one with
  a back button, render
  `<Stack.Screen options={{ headerShown: true, title: t('…') }} />` from
  `expo-router` in the screen, and give its `SafeAreaView`
  `edges={['bottom', 'left', 'right']}` (the header covers the top); or put
  the screen in a group whose layout shows a header, like `(app)`.
- **Title:** mark the screen's title `accessibilityRole="header"`, and set
  the browser tab's title with `<DocumentTitle title={t('…')} />` from
  `@/shared/ui/DocumentTitle`.
- **Errors:** show a failed request with `errorMessage(error)` from
  `@/shared/http/errorMessage`: translated text, or the server's own message
  for a 4xx, never axios's or a developer message. Put it in a view with
  `accessibilityLiveRegion="polite"` that stays mounted, and call
  `useAnnouncement(text)` from `@/shared/ui/useAnnouncement`, so screen
  readers read it out (a live region on Android and the web, an announcement
  on iOS). Log an error whose `code` is `'unknown'` with `logger.error`: the
  user sees a generic message, and that is where the cause goes.
- **Navigation:** open a screen from a button with `router.navigate`, not
  `router.push`, so a double tap opens it once.
- **Width:** cap content on tablets and the web (`maxWidth: 720`, or `480`
  for a form, with `width: '100%'` and `alignSelf: 'center'`).

### A tab that needs sign-in

Tabs live in `app/(tabs)/`, not in `app/(app)/`, so the sign-in guard doesn't
cover them. Signed out, a tab that loads data would send its request without
a token, get a 401, and show a raw error. The 401 doesn't touch the session:
there was no token to reject. Instead, check the session in the screen, and
mount the part that loads data only when the user is signed in:

First add the prompt's strings to `shared/i18n/en.ts`:

```ts
export const en = {
  // ...
  'notes.signedOut': 'Sign in to see your notes',
  'notes.signIn': 'Sign in',
};
```

```tsx
// features/notes/screens/NotesScreen.tsx
import type { JSX } from 'react';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSession } from '@/shared/session/SessionProvider';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

// In your app: import { t } from '@/shared/i18n'; the keys above make it
// type-check.
declare function t(key: 'notes.signedOut' | 'notes.signIn'): string;
declare function NotesList(): JSX.Element; // loads with useFetch

export function NotesScreen() {
  const theme = useTheme();
  const { session } = useSession();
  if (session.status === 'loading') return <LoadingScreen />;
  if (session.status === 'signedOut') {
    return (
      <SafeAreaView
        style={[styles.prompt, { backgroundColor: theme.colors.background }]}
      >
        <Text>{t('notes.signedOut')}</Text>
        <Button mode="contained" onPress={() => router.navigate('/login')}>
          {t('notes.signIn')}
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

After sign-in, the Login screen returns to the tab, which now renders the
list.

### A link to a screen that needs sign-in

While the user is signed out, the `(app)` group isn't mounted, so
`router.navigate()` to one of its screens does nothing: no screen, no error.
(A deep link into it lands on Home instead.) A public screen that links to
one checks the session and sends a signed-out user to Login:

```tsx
// features/home/components/ProfileLink.tsx
import { router } from 'expo-router';
import { List } from 'react-native-paper';
import { useSession } from '@/shared/session/SessionProvider';

export function ProfileLink({ title }: { title: string }) {
  const { session } = useSession();
  const open = () =>
    router.navigate(session.status === 'signedIn' ? '/profile' : '/login');
  return <List.Item title={title} onPress={open} />;
}
```

After sign-in, Login returns to the screen with the link; the user taps it
again.

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
- **Exports:** named exports; only `app/` route files use default exports
  (a default export in `features/` or `shared/` is a lint error).
- **Imports:** `@/` for anything outside the current feature (or `shared/`
  area), relative within it; a relative path that leaves it is a lint error,
  and so is `@/` for a file in the same feature.
  `import type` for types (lint error otherwise). `shared/` doesn't import
  `features/` or `app/` (except `shared/integrations/setup.ts`), and a
  feature doesn't import another feature: both lint errors, by `@/` or by a
  relative path.
- **Types:** TypeScript strict with `noUncheckedIndexedAccess`; no `any`
  (lint error). App code has no Node or Jest types (`tsconfig.json`), so
  `fs`, `Buffer`, or `__dirname` in a screen is a type error; tests,
  scripts, and `app.config.ts` have them (`tsconfig.tools.json`).
  `npm run type-check` checks both. Validate data at the edges with zod: config, and API payloads
  in adapters and `api/` modules (examples in
  [Connect Your Backend](connect-your-backend.md#2-sign-in-write-an-authadapter)).
- **Styles:** `StyleSheet.create` at the bottom of the file; colors from the
  theme, never literals. Lint rejects a color in a style; any string (a
  name such as `'white'` too, not `'transparent'`) given to a prop or
  option named `*color` or `*colors` (`color`, `iconColor`,
  `colors={[...]}`, `tabBarActiveTintColor`), directly, in a template, a
  condition, or a list; and a `#hex`, `rgb()`, or `hsl()` string anywhere
  outside the palette in `shared/ui/theme.ts`. An unused style is a lint
  error too.
- **Text:** user-facing strings through `t()`.
- **Logging:** `logger` from `@/shared/lib/logger`, never `console` (lint
  error); see [Error Reporting](error-reporting.md).
- **Errors:** catch async errors where you can show something, and pass the
  rest to `logger.error`. Boundaries catch render errors. A promise that is
  neither awaited nor handled, or an async function passed where a callback
  returns nothing (such as `onPress`), is a lint error: handle it, or mark a
  promise that can't reject with `void`.
- **Comments:** say why, not what; keep doc comments on exported APIs.

## Commits

Small, single-purpose commits, each passing the local gate
(`npm run lint && npm run type-check && npm run test:ci`). There is no
commit-message convention here; use your team's.
