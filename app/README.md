# app/

Expo Router routes. This folder holds only navigation: layouts, guards, and
one-line route files that re-export screens from `features/`.

- `_layout.tsx`: providers (theme, error boundary, session), the splash
  screen, and the session guards (`Stack.Protected`) for `(auth)` and `(app)`.
- `(tabs)/`: the tab bar; `index.tsx` is Home (`/`), `explore.tsx` the Todos
  demo.
- `(auth)/login.tsx`: shown only while signed out.
- `(app)/profile.tsx`: shown only while signed in.
- `showcase.tsx`: the component showcase demo.

See [Conventions](../docs/conventions.md#navigation).
