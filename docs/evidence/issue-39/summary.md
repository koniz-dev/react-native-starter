# Issue 39 verification — docs rewritten around the starter and checked against the code

Verified on 2026-10-09.

## Change

- **Cut.** Twelve paraphrased Expo guides are removed: `how-to`,
  `color-themes`, `ui-library`, `fonts`, `system-bars`, `safe-areas`,
  `animation`, `assets`, `splash-screen-and-app-icon`, `store-data`,
  `error-and-loading`, and `expo-debugging-notes`. What was specific to the
  starter moved into the pages below; the rest is a link to the Expo or Paper
  docs. Markdown went from 5,327 to 2,242 lines
  ([07](07-line-counts.log)).
- **New guides.**
  - `docs/make-it-yours.md`: the checklist of everything to change, plus
    variants, icons, and splash.
  - `docs/connect-your-backend.md`: URLs, an `AuthAdapter` with
    login/normalize/fetchUser/refresh, registration, `useSession`, feature
    endpoints, and `useFetch`.
  - `docs/plug-in-a-provider.md`: seams for analytics, flags, push, OTA,
    errors, and i18n, replacing `integrations.md`.
  - `docs/remove-demo.md`: from #36.
  - `docs/ui-and-theming.md`: theme, Paper, fonts, safe areas, and dark mode
    checks, merging five old pages.
- **Rewritten.**
  - The README is now the pitch, quick start, feature list with links, and a
    reading path. It repeats no trees, script lists, or variant tables, and
    makes no typed-routes claim.
  - `getting-started.md` is the one place for scripts and troubleshooting.
  - `conventions.md` covers structure, navigation (states that typed routes
    are not enabled), adding a screen, where code goes, and code style.
  - `api-and-storage.md` is a reference with no how-to duplication.
  - `docs/README.md` is the index.
  - `app/README.md` went from a 383-line generic tutorial to the folder's
    real contents in 14 lines.
- **Snippets.**
  - Every `ts / `tsx block compiles against the repo.
  - Adapters for SDKs that are not installed (PostHog, Sentry,
    expo-notifications, expo-updates) declare the part of the SDK they use,
    with the real import in a comment.
  - Placeholders are `declare`d inline.
  - The old examples that stored the token in AsyncStorage, used outdated
    APIs, or wouldn't compile are gone.
- **`npm run docs:check`** (`scripts/check-docs.js`, and a new CI step):
  - compiles every TS/TSX snippet as its own module with `tsc` against the
    repo's tsconfig;
  - parses JSON blocks;
  - checks every `npm run` script, every relative link and `#anchor`, every
    repo path in inline code, and every `docs/*.md#anchor` mentioned in
    source comments.
  - After `npm run remove-demo` it skips demo paths and snippets, so it still
    passes on a demo-free app.
  - Code comments that pointed at removed pages (`how-to.md`, `fonts.md`,
    `integrations.md`, "Make it yours" in getting-started) now point at the
    new pages.

## Acceptance criteria

| #   | Criterion                                                                                                        | Evidence                                                                                                                                                                                                                                                                                                     | Result |
| --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | Generic Expo guides cut to short "how this starter does X" pages linking to Expo; folder READMEs real or removed | 12 pages removed, five merged into `ui-and-theming.md`; `app/README.md` 14 lines; `scripts/README.md` describes its two scripts; the `components/`, `constants/`, `hooks/` READMEs went in #36. External links all return HTTP 200 ([06](06-external-links.log))                                             | PASS   |
| 2   | New guides: Make it yours, Connect your backend, Remove the demo, Plug in a provider                             | `docs/make-it-yours.md`, `docs/connect-your-backend.md`, `docs/remove-demo.md`, `docs/plug-in-a-provider.md`                                                                                                                                                                                                 | PASS   |
| 3   | Every snippet a link or verified: extracted into a scratch TS project and compiled with `tsc`, log saved         | [03-snippets-tsc.log](03-snippets-tsc.log): 31 snippet modules, `tsc` exit 0; [02](02-docs-check-after.log); before: [01](01-docs-check-before.log) (20 problems at the syntax level alone); [04](04-checker-probe.log): a planted typo, broken link, wrong path, and missing script are all caught (exit 1) | PASS   |
| 4   | Every command and path in README and `docs/` checked; feature claims match the code (typed routes)               | `docs:check` checks scripts, links, anchors, and paths ([02](02-docs-check-after.log)); the "Type-safe routes" claim is removed and `conventions.md` says typed routes are not enabled; [05](05-docs-check-after-remove-demo.log) passes after `npm run remove-demo` too                                     | PASS   |
| 5   | One canonical location per topic; README links instead of repeating                                              | Scripts: `getting-started.md`; variants, icons: `make-it-yours.md`; env vars: `environment-variables.md`; structure: `conventions.md`; auth adapter: `connect-your-backend.md`; HTTP/token/storage behavior: `api-and-storage.md`; the README links to each                                                  | PASS   |
| 6   | `npm run format:check` and the full gate pass; CI green                                                          | [08 lint](08-lint.log), [09 tsc](09-type-check.log), [10 tests](10-test-ci.log) (199, coverage threshold met), [11 format](11-format-check.log); CI (now with the docs step) in the closing comment                                                                                                          | PASS   |

## Not in scope

`AGENTS.md`, `CLAUDE.md`, and `docs/issue-workflow.md` are process documents
for agents and maintainers; their paths were updated in #36, and
`docs:check` covers `docs/issue-workflow.md`'s links and paths.
