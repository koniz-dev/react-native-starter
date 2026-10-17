# Documentation

Guides for this app's code base. Each topic has one page; for general Expo and React
Native topics, the pages link to the official documentation.

## Start here

- [Getting Started](getting-started.md): install, run, scripts, troubleshooting.

<!-- @init remove-block-start -->

- [Make It Yours](make-it-yours.md): the checklist for a new project.

<!-- @init remove-block-end -->

- [App Config](app-config.md): app identity, build variants, icons and splash.
- [Connect Your Backend](connect-your-backend.md): URLs, an auth adapter, and
  endpoints.

<!-- @demo remove-block-start -->

- [Remove the Demo](remove-demo.md): strip the demo features.

<!-- @demo remove-block-end -->

## Guides

- [Plug In a Provider](plug-in-a-provider.md): analytics, feature flags, push,
  OTA updates, i18n.
- [Error Reporting and Logging](error-reporting.md): logger, error reporter,
  error boundaries.
- [UI and Theming](ui-and-theming.md): Paper, the brand theme, dark mode,
  fonts, safe areas.

<!-- @recipes remove-block-start -->

## Recipes

- [State Management](recipes/state-management.md): Zustand, Redux Toolkit,
  Jotai, or React Context next to the session provider.

<!-- @recipes remove-block-end -->

## Reference

- [Conventions](conventions.md): project structure, navigation, where code
  goes, code style.
- [API and Storage](api-and-storage.md): HTTP clients, errors, token handling,
  401s, storage.
- [Environment Variables](environment-variables.md): every `EXPO_PUBLIC_*`
  variable and its validation.
- [Testing](testing.md): test layout, shared setup, coverage, end-to-end
  flows.

`npm run docs:check` compiles every TypeScript snippet (`ts`, `tsx`, or
`typescript` blocks) in these pages against the code, lints it with the
project's rules as the file its first line names
(`// features/posts/api/postsApi.ts`; otherwise as a test if it reads like
one, a route if it only re-exports a default, or else a module in a feature), parses every `json` block, and checks every
relative link and anchor, repo path in inline code, and `npm run` script
they mention; CI runs it. Blocks in other languages (`sh`, `js`, `yaml`)
aren't checked. Write anchors in lowercase, as GitHub generates them.

When a page names something the reader will create, which doesn't exist yet,
write it so the check skips it:

- a path with a placeholder, such as `features/<name>/api/` or
  `scripts/<your-mock>.js`;
- or a comment on a snippet's first line, such as
  `// features/posts/api/postsApi.ts`: a path inside a code block isn't
  checked, only one in inline code is.

A snippet that uses code from another snippet declares it, for example
`declare const postsApi: ...` (see
[Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature)).

<!-- @recipes remove-block-start -->

The recipe snippets need their libraries, which the app doesn't install.
They are pinned in `docs/recipes/package.json` and its lockfile; CI installs
and links them before `docs:check`. Locally, `docs:check` skips those
snippets with a note unless you run the same two steps as the "Check docs"
step in `.github/workflows/ci.yml`.

<!-- @recipes remove-block-end -->
