# Remove the Demo

The starter ships three demos so you can see the foundation working:

| Demo            | What it is                                                           | Where                                                  |
| --------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| `demo-auth`     | DummyJSON sign-in adapter and the demo-credentials hint on Login     | `features/demo-auth/`                                  |
| `demo-todos`    | The Explore tab: todos from JSONPlaceholder with loading/error/retry | `features/demo-todos/`, route `app/(tabs)/explore.tsx` |
| `demo-showcase` | The Component showcase and Home's "Examples" links                   | `features/demo-showcase/`, route `app/showcase.tsx`    |

Everything else (routes, session, the auth flow, HTTP, storage, theme, error
reporting, integrations, i18n) is the foundation and stays.

## Run it

```bash
npm run remove-demo -- --dry-run   # list what would change
npm run remove-demo
```

`scripts/remove-demo.js`:

1. deletes the folders and routes above, and the demo tests in
   `__tests__/features/demo-*`;
2. removes code between `@demo remove-block-start` and `@demo remove-block-end`
   markers (and any line marked `@demo remove-current-line`) in `app/`,
   `features/`, `shared/`, and `__tests__/`: the Explore tab entry, the Login
   hint, Home's example links, the demo strings in `shared/i18n/en.ts`, the
   demo adapter registration in `shared/integrations/setup.ts`, and the test
   assertions about them;
3. formats the changed files with Prettier;
4. fails if a `@demo` marker or an import of a removed demo is left.

It is meant to run once on a fresh project; commit first so you can review
the diff.

## What you get

- Home with the session card only, a single tab, and the Login and Profile
  screens.
- `npm run lint`, `npm run type-check`, and `npm run test:ci` pass, and the
  app starts in Expo Go (verified in
  [the evidence for issue 36](evidence/issue-36/)).
- Sign-in reports **"Sign-in is not configured: register an AuthAdapter in
  shared/integrations/setup.ts."** until you register an adapter for your
  backend; see [Connect Your Backend](connect-your-backend.md).

## Then

1. Register your `AuthAdapter` and set `EXPO_PUBLIC_AUTH_API_URL`.
2. Set `EXPO_PUBLIC_API_URL` and turn off `EXPO_PUBLIC_USE_DEMO_BACKENDS`
   (see [Environment Variables](environment-variables.md)).
3. Add your features under `features/` with thin routes in `app/` (see
   [Conventions](conventions.md#project-structure)).

## Marking your own demo code

If you add example code you want the script to remove later, wrap it the
way `features/home/screens/HomeScreen.tsx` wraps Home's example links:

```tsx
import { View } from 'react-native';
// @demo remove-block-start
import { ExampleLinks } from '@/features/demo-showcase/components/ExampleLinks';
// @demo remove-block-end

export function HomeExtras() {
  return (
    <View>
      {/* @demo remove-block-start */}
      <ExampleLinks />
      {/* @demo remove-block-end */}
    </View>
  );
}
```

Prefer block markers over `remove-current-line` for imports: Prettier may
split a long import over several lines.
