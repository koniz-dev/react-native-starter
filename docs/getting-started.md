# Getting Started

<!-- @init remove-block-start -->

## Make it your project first

Right after creating your repository from the template, run:

```bash
npm ci
npm run init-project
```

It asks for your app name, slug, URL scheme, bundle / package ID, and LICENSE
holder (or takes them as flags: `npm run init-project -- --help` lists them),
whether to remove the demo, and whether to keep the state-management recipes.
Then it:

- sets the identity in `app.config.ts`, `package.json`, `package-lock.json`,
  `LICENSE`, and the docs' examples, and resets the version to `1.0.0`;
- replaces `README.md` with a short README for your app;
- makes you the owner of the advisory review in `scripts/audit-allowlist.json`;
- removes the demo if you chose to;
- removes the state-management recipes (`docs/recipes/`) unless you keep
  them (`--keep-recipes`);
- deletes the template's onboarding page and itself.

`npm run init-project -- --dry-run` lists every change first. It refuses to
run on uncommitted changes or a second time unless you pass `--force`. It
formats its changes before writing any, and deletes itself last, so a
problem (such as a syntax error in a file it rewrites) changes nothing. With
`--remove-demo`, the demo is removed first; if a later step fails, it prints
the command that undoes both. Without git (a downloaded ZIP), keep a copy
first, since it can't check for or undo changes.
[Make It Yours](make-it-yours.md) lists what it changes and what is left for
you (icons, colors, backend, providers).

<!-- @init remove-block-end -->

## Prerequisites

- Node.js 24.21.0 (the version in `.nvmrc`; any 24.3+ or 22.13+ works, but
  not 23), and npm.
- To run on a device: [Expo Go](https://expo.dev/go) for SDK 57.
- For simulators: Xcode (iOS Simulator, macOS only) or Android Studio (an
  Android emulator). Building the native iOS app yourself needs Xcode 26.4+,
  which Expo SDK 57 requires.

## Platforms

| Platform | Runs in                                                                                       | Notes                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Android  | Expo Go, and native builds (`npm run prebuild:preview`, then `npm run build:preview:android`) | The [Maestro flows](testing.md#end-to-end-flows-maestro) run on an emulator; a release build needs `https` backend URLs      |
| iOS      | Expo Go on the iOS Simulator, and native builds (EAS Build or Xcode 26.4+)                    | See below for native builds                                                                                                  |
| Web      | A static export (`npm run export:web`, into `dist/`)                                          | The sign-in token is kept in memory, so a reload signs out ([Connect Your Backend](connect-your-backend.md#sessions-on-web)) |

<!-- @init remove-block-start -->

What each template release was verified on (devices, OS versions, and
builds) is in its
[release notes](https://github.com/koniz-dev/react-native-starter/releases).
Since v1.1.12 that includes native iOS and Android debug builds.

<!-- @init remove-block-end -->

**Native iOS builds:** with EAS Build
(`eas build --platform ios --profile preview`, with your Expo and Apple
accounts; the profiles are in `eas.json`), or locally with Xcode 26.4+:
`npm run prebuild:preview`, then `npm run build:preview:ios`. See
[App Config](app-config.md#build-variants).

Expo SDK 57 (React Native 0.86, React 19.2). Not included: a production
backend, store builds and submission, and real analytics, crash-reporting,
push, feature-flag, or update providers (the app has
[seams](plug-in-a-provider.md) with no-op or console defaults). Landscape
layouts are not designed. Phones stay in portrait (`orientation`), but
iPads (`supportsTablet`) and Android 16 on large screens rotate anyway, so
check your screens there, or set `supportsTablet: false` in
`app.config.ts`.

**Hosting the web export:** `dist/` is a single-page app. Serve it at the
root of a domain, and have the host answer every unknown path with
`index.html` (for example `/profile` after a reload), or links into the app
return 404. Under a subpath, set
[`experiments.baseUrl`](https://docs.expo.dev/guides/publishing-websites/)
first. Since the web build keeps the sign-in token in memory, also send a
Content-Security-Policy header that allows only your own scripts and your
API origins.

## Install and run

```bash
npm ci
cp .env.example .env
npm start
```

`npm ci` installs the exact versions in `package-lock.json`; keep the lockfile
(regenerating it can pull versions that don't match the Expo SDK).

npm's output looks worse than it is. These are expected:

- **Deprecation warnings** (`inflight`, `glob`, `uuid`, `eslint`, ...) come
  from Expo's, Metro's, and Jest's own dependencies; they go away as those
  tools update them.
- **"1 package has install scripts not yet covered by allowScripts:
  fsevents"**: fsevents ships its prebuilt binary, so it works without its
  install script.
- **"N vulnerabilities (… high)"** after `npm ci`, `npm install`, or `npx
expo install` counts every advisory in the tree, including development
  tools. `npm run audit:check` is the check that matters: it fails on an
  unreviewed high or critical advisory in the app's runtime dependencies,
  and lists the reviewed ones (see
  [Dependency advisories](#dependency-advisories)). Don't run the suggested
  `npm audit fix --force`: it moves packages off the versions the Expo SDK
  needs; `npx expo install --fix` is the way to update them.

Set your backend URLs in `.env` (`EXPO_PUBLIC_API_URL`,
`EXPO_PUBLIC_AUTH_API_URL`); see
[Connect Your Backend](connect-your-backend.md). While they are missing, the
app opens on a configuration error screen that lists them; see
[Environment Variables](environment-variables.md).

<!-- @demo remove-block-start -->

Until then, the demo runs without any setup: `.env.example` sets
`EXPO_PUBLIC_USE_DEMO_BACKENDS=true`, so the app talks to the public demo
backends (JSONPlaceholder and DummyJSON). On Home, tap **Sign in** and use
`emilys` / `emilyspass`.

<!-- @demo remove-block-end -->

In the terminal Metro shows, press `i` (iOS Simulator), `a` (Android
emulator), or `w` (web), or scan the QR code with Expo Go.

## Scripts

| Script                                                            | What it does                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm start`                                                       | Metro for the development variant                                                                                                    |
| `npm run ios` / `npm run android` / `npm run web`                 | Metro and open that platform                                                                                                         |
| `npm run start:preview`, `npm run start:production`               | Metro for another variant (production without dev mode); see [App Config](app-config.md#build-variants)                              |
| `npm run prebuild:development` (or `:preview`, `:production`)     | Generate the native `ios/` and `android/` projects for a variant (gitignored)                                                        |
| `npm run build:preview:android` (or `:ios`, `build:production:*`) | Build and run a release build of that variant on a device or emulator, after its prebuild                                            |
| `npm run export:web`                                              | Export the web app (production variant) to `dist/`                                                                                   |
| `npm run config:print`                                            | Print the resolved app config (`APP_VARIANT=preview npm run config:print` for another variant)                                       |
| `npm run lint` / `npm run lint:fix`                               | ESLint, failing on any warning                                                                                                       |
| `npm run format` / `npm run format:check`                         | Prettier                                                                                                                             |
| `npm run type-check`                                              | `tsc --noEmit` for the app, then for tests and TypeScript config (`tsconfig.tools.json`; `.js` scripts are parsed, not type-checked) |
| `npm test`                                                        | Jest in watch mode                                                                                                                   |
| `npm run test:ci`                                                 | Jest once, with coverage and its threshold                                                                                           |
| `npm run test:coverage`                                           | Jest with an HTML coverage report in `coverage/`                                                                                     |
| `npm run test:e2e:ios` / `npm run test:e2e:android`               | Maestro end-to-end flows on a simulator or emulator ([Testing](testing.md#end-to-end-flows-maestro))                                 |
| `npm run docs:check`                                              | Compile and lint the docs' TypeScript snippets, and check their paths and scripts                                                    |
| `npm run doctor`                                                  | Expo Doctor against the installed Expo SDK (see below)                                                                               |
| `npm run audit:check`                                             | `npm audit --omit=dev`, failing on a high or critical advisory not reviewed in `scripts/audit-allowlist.json`                        |

<!-- @demo remove-block-start -->

`npm run remove-demo` removes the demo features, and then itself
([Remove the Demo](remove-demo.md)).

<!-- @demo remove-block-end -->

The local gate before a commit is
`npm run lint && npm run type-check && npm run test:ci`; CI
(`.github/workflows/ci.yml`) also runs `npm run format:check`,
`npm run docs:check`, `npm run doctor`, a web export, and an iOS and
Android bundle (`expo export`, which catches a broken import in an `.ios`
or `.android` file that Jest and the web export don't load). CI uses what the
repository pins (the lockfiles, the Node version in `.nvmrc`, the runner
image, and actions by commit), so a commit that passes keeps passing when new
versions of its dependencies are published. Dependabot
(`.github/dependabot.yml`) opens one pull request a month that moves the
action pins to their latest releases, so they don't fall behind; CI runs on
it like on any change.

`npm run doctor` checks the installed packages against the Expo SDK in the
lockfile (Expo Doctor with `EXPO_OFFLINE=1`), not against Expo's newest
patch releases. To see whether newer patches for your SDK exist, run
`npx expo install --check` when you want to update; `npx expo install --fix`
applies them.

`npm run audit:check` runs in its own workflow (`.github/workflows/audit.yml`,
on pushes to `main`, on pull requests, and weekly), because advisories
change over time; see [Dependency advisories](#dependency-advisories).
GitHub turns off scheduled runs in a public repository after 60 days without
activity; turn the workflow back on in the Actions tab
([GitHub: disabling and enabling a workflow](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/disabling-and-enabling-a-workflow)).

The variant scripts and `npm run doctor` use POSIX `VAR=value command`
syntax (macOS, Linux, WSL).
`npm run android` and `npm run ios` use `expo start -a` and `expo start -i`
because `expo prebuild` rewrites the long forms (`--android`, `--ios`) to
`expo run:*`. With the short forms, a prebuild leaves `package.json`
unchanged. To build and run the generated native project, use
`npx expo run:android` or `npx expo run:ios` for the development variant,
and the `build:preview:*` / `build:production:*` scripts for the others
([App Config](app-config.md#build-variants)).

## Dependency advisories

`npm run audit:check` fails on a high or critical advisory in the
production dependency tree (`npm audit --omit=dev`, which also holds build
tools such as Expo CLI) unless `scripts/audit-allowlist.json` has a review of it
whose `reviewBy` date has not passed. Its first entries are the review of
the dependencies the project started with (build tools only, not in the app
bundles), so the Audit workflow starts green. Make the review yours:

1. For each entry, read the advisory (`tracking`) and check that `path` and
   `exposure` still hold for your dependencies (`npm ls <package>`).
2. Upgrade when a fix is released, and delete the entry. `audit:check` fails
   once npm can apply a fix within your dependency ranges, and notes entries
   npm no longer reports.
3. Otherwise set `owner` to your team, `reviewed` to today, `reviewBy` to
   your next review (at most 183 days out), and `tracking` to your own
   issue if you track it. An entry without an `id`, `package`, `severity`
   (`high` or `critical`), `tracking`, or a `reviewBy` date written
   YYYY-MM-DD fails the check, and so does one whose `package` differs from
   what npm reports or whose `severity` npm has raised (an advisory
   re-scored to critical needs a new review).

Moderate and low advisories are listed as `reported (not gated)` and never
fail the check. Read the ones in packages your app ships (not only build
tools): `decode-uri-component`, for example, comes through expo-router and
parses deep-link URLs.

New advisories fail the check until you fix or review them the same way. The
Audit workflow fails, and CI doesn't, so a new advisory doesn't block work on
unrelated changes; treat a red Audit run as a task.

## Where things are

`app/` holds only routes; screens live in `features/`, and the foundation in
`shared/`. See [Conventions](conventions.md#project-structure).

## Next

<!-- @init remove-block-start -->

- [Make It Yours](make-it-yours.md): the checklist for a new project.

<!-- @init remove-block-end -->

- [App Config](app-config.md): app name, IDs, icons, variants.
- [Connect Your Backend](connect-your-backend.md).

<!-- @demo remove-block-start -->

- [Remove the Demo](remove-demo.md).

<!-- @demo remove-block-end -->

## Troubleshooting

- **Stale bundle or odd Metro errors:** `npm start -- --clear`.
- **Dependency problems:** `npm run doctor`, then `npx expo install --check`.
  To reinstall, delete `node_modules` and run `npm ci`.
- **"Configuration error" screen:** a required `EXPO_PUBLIC_*` value is
  missing or invalid; the screen names it. Restart Metro after editing `.env`.
  In a web export or a preview or production build, `http` URLs count as
  invalid ([Environment Variables](environment-variables.md#variables)).
- **Port 8081 in use:** stop the other Metro process, or `npm start -- --port 8082`.
- More: [Expo troubleshooting](https://docs.expo.dev/troubleshooting/overview/).
