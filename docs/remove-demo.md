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

1. deletes the folders and routes above, the demo tests in
   `__tests__/features/demo-*`, and the Maestro flows that need the demo
   (below);
2. removes what is marked as demo in the remaining code, docs, and config:
   - in `app/`, `features/`, `shared/`, and `__tests__/`: the Explore tab
     entry, the Login hint, Home's example links, the demo strings in
     `shared/i18n/en.ts`, the demo adapter registration in
     `shared/integrations/setup.ts`, and the test assertions about them;
   - in `README.md`, `AGENTS.md`, `docs/`, and `scripts/README.md`: the
     passages about the demo, its credentials, and this page;
   - in `.env.example`: the demo backends switch, which becomes
     `EXPO_PUBLIC_USE_DEMO_BACKENDS=false` with a note to set your URLs;
   - in `.maestro/` and `scripts/e2e/run.sh`: the demo flows' entries, and
     the demo sign-in backend;
3. deletes itself: this page, `scripts/remove-demo.js`, its test, and the
   `remove-demo` npm script, since there is nothing left to remove;
4. formats the changed files with Prettier;
5. fails if a `@demo` marker, an import of a removed demo, or a doc or flow
   that names a deleted file is left.

It is meant to run once on a fresh project; commit first so you can review
the diff.

## What you get

- Home with the session card only, a single tab, and the Login and Profile
  screens.
- `npm run lint`, `npm run type-check`, `npm run test:ci`, and
  `npm run docs:check` pass, and the app starts in Expo Go.
- Sign-in reports **"Sign-in is not configured: register an AuthAdapter in
  shared/integrations/setup.ts."** until you register an adapter for your
  backend; see [Connect Your Backend](connect-your-backend.md).
- With `.env` copied from `.env.example`, the app opens on the configuration
  error screen until you set `EXPO_PUBLIC_API_URL` and
  `EXPO_PUBLIC_AUTH_API_URL`.
- The docs keep a worked list screen (endpoint, loading, error with Retry)
  in [Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature)
  and its test in [Testing](testing.md#network).

### Maestro flows

| Flow                          | After removal                                     |
| ----------------------------- | ------------------------------------------------- |
| `01-cold-start.yaml`          | kept: a fresh start opens Home, signed out        |
| `06-login-back.yaml`          | kept: Back from Login returns Home (Android)      |
| `dark-mode.yaml`              | kept, without its Explore screenshot              |
| `02-tabs.yaml`                | deleted: there is one tab                         |
| `03-auth-session.yaml`        | deleted: signs in with the DummyJSON demo account |
| `04-login-keyboard.yaml`      | deleted: signs in with the DummyJSON demo account |
| `05-explore-error-retry.yaml` | deleted: the Explore tab                          |

`subflows/sign-in.yaml` (the demo account) is deleted too. The e2e runner
keeps the local mock API (`scripts/e2e/mock-api.js`) and points both URLs at
it. Add your own sign-in flows against a test account on your backend.

## Then

1. Register your `AuthAdapter` and set `EXPO_PUBLIC_AUTH_API_URL`.
2. Set `EXPO_PUBLIC_API_URL` (see
   [Environment Variables](environment-variables.md)).
3. Add your features under `features/` with thin routes in `app/` (see
   [Conventions](conventions.md#project-structure)).

## Marking your own demo code

If you add example code or docs you want the script to remove with the demo,
wrap them the way `features/home/screens/HomeScreen.tsx` wraps Home's example
links. In Markdown, the markers are HTML comments on their own lines
(`<!-- @demo remove-block-start -->`); in YAML, shell, and `.env` files,
`#` comments.

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
