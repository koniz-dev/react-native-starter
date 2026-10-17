# Remove the Demo

The project ships three demos so you can see the foundation working:

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

`-- --help` lists the options; any other argument is refused and changes
nothing.

`scripts/remove-demo.js`:

1. deletes the folders and routes above, the demo tests in
   `__tests__/features/demo-*`, and the Maestro flows that need the demo
   (below);
2. removes what is marked as demo in the remaining code, docs, and config:
   - in `app/`, `features/`, `shared/`, and `__tests__/`: the Explore tab
     entry, the Login hint, Home's example links, the demo strings in
     `shared/i18n/en.ts`, the demo adapter registration in
     `shared/integrations/setup.ts`, and the test assertions about them;
   - in `README.md`, `AGENTS.md`, `app/README.md`, `docs/`, and
     `scripts/README.md`: the passages about the demo, its credentials, and
     this page;
   - the demo backends switch (`EXPO_PUBLIC_USE_DEMO_BACKENDS`): in
     `shared/config/env.ts` and its test, `.env.example` (which then says to
     set your URLs), and the docs;
   - in `.maestro/` and `scripts/e2e/mock-api.js`: the demo flows' entries,
     and the mock's demo routes (todos and sign-in);
3. deletes itself: this page, `scripts/remove-demo.js`, its test, and the
   `remove-demo` npm script, since there is nothing left to remove;
4. formats the changed files with Prettier;
5. checks the result before it changes any file: if a `@demo` marker is
   malformed (a block without its end) or would be left, Prettier can't
   format a result, or an import of a removed demo or a doc or flow that
   names a deleted file would remain, it names the file and changes
   nothing.

It refuses to run on uncommitted changes unless you pass `--force`, so you
can review and undo it with git. It writes its edits before it deletes
anything, and deletes itself last, so if a step fails part way (a read-only
file, say), the script is still there and you can run it again. It then
says how to restore: on a clean tree, the `git` command that restores your
last commit; on uncommitted changes (`--force`), to restore by hand, since
that command would discard them too.

## What you get

- Home with the session card only, a single tab, and the Login and Profile
  screens.
- `npm run lint`, `npm run type-check`, `npm run test:ci`, and
  `npm run docs:check` pass, and the app starts in Expo Go.
- Sign-in shows "Login failed. Please try again." and logs **"Sign-in is not
  configured: register an AuthAdapter in shared/integrations/setup.ts."**
  until you register an adapter for your backend; see
  [Connect Your Backend](connect-your-backend.md).
- With `.env` copied from `.env.example`, the app opens on the configuration
  error screen until you set `EXPO_PUBLIC_API_URL` and
  `EXPO_PUBLIC_AUTH_API_URL`.
- The docs keep a worked list screen (endpoint, loading, error with Try again)
  in [Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature)
  and its test in [Testing](testing.md#network).

### Maestro flows

| Flow                          | After removal                              |
| ----------------------------- | ------------------------------------------ |
| `01-cold-start.yaml`          | kept: a fresh start opens Home, signed out |
| `06-login-back.yaml`          | kept: Back from Login returns Home         |
| `dark-mode.yaml`              | kept, without its Explore screenshot       |
| `02-tabs.yaml`                | deleted: there is one tab                  |
| `03-auth-session.yaml`        | deleted: signs in with the demo account    |
| `04-login-keyboard.yaml`      | deleted: signs in with the demo account    |
| `05-explore-error-retry.yaml` | deleted: the Explore tab                   |
| `07-profile.yaml`             | deleted: signs in with the demo account    |

The e2e mock's demo routes (`GET /todos`, `POST /auth/login`,
`GET /auth/me`) go too; the runner keeps the mock and points both URLs at
it, and stops defaulting the test account to the demo's. The subflows stay:
`open-login.yaml` and `sign-in.yaml` sign in with `MAESTRO_E2E_USERNAME`
and `MAESTRO_E2E_PASSWORD`, so your signed-in flows use them against a test
account on your backend or mock
([Writing a flow](testing.md#writing-a-flow),
[Your backend or mock](testing.md#your-backend-or-mock)).

## Then

1. Register your `AuthAdapter` and set `EXPO_PUBLIC_AUTH_API_URL`.
2. Set `EXPO_PUBLIC_API_URL` (see
   [Environment Variables](environment-variables.md)).
3. Add your features under `features/` with thin routes in `app/` (see
   [Conventions](conventions.md#project-structure)).

## Marking your own demo code

If you add example code or docs you want the script to remove with the demo,
wrap them the way `features/home/screens/HomeScreen.tsx` wraps Home's example
links. Markers work in every `.ts`, `.tsx`, `.js`, `.jsx`, `.md`, `.yml`,
`.yaml`, `.sh`, and `.html` file in the project, and in `.env.example`
(not in `node_modules` or generated folders such as `android/` and `dist/`).
In Markdown and HTML, the markers are comments on their own lines
(`<!-- @demo remove-block-start -->`); in YAML, shell, and `.env` files,
`#` comments.

- `@demo remove-block-start` … `@demo remove-block-end`: deletes both lines
  and everything between them.
- `@demo remove-current-line`: deletes the line it is on.
- `@demo uncomment-block-start` … `@demo uncomment-block-end`: for text that
  applies only once the demo is gone. It deletes the two marker lines and
  uncomments the lines between them (drops a leading `# ` or `// `), as in
  `.env.example` and `shared/config/env.ts`.

```tsx
// features/home/components/HomeExtras.tsx
import { View } from 'react-native';
// @demo remove-block-start
// eslint-disable-next-line project/import-boundaries -- the demo is removable (npm run remove-demo)
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
