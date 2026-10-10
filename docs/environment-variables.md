# Environment Variables

The starter reads all configuration from `EXPO_PUBLIC_*` variables through one
module, [`shared/config/env.ts`](../shared/config/env.ts). It validates them with a zod schema
when the app starts and shows a **Configuration error** screen naming each
missing or invalid variable, instead of silently falling back to a demo backend.

## Quick start

```bash
cp .env.example .env
npm start
```

Then set your backend URLs in `.env`. While a required URL is missing, the app
starts on the configuration error screen.

<!-- @demo remove-block-start -->

With the demo, `.env.example` turns on the public demo backends
(JSONPlaceholder for the API, DummyJSON for sign-in), so the app runs without
any accounts. Without a `.env` (or with `EXPO_PUBLIC_USE_DEMO_BACKENDS` unset),
the app starts on the configuration error screen.

<!-- @demo remove-block-end -->

## Variables

| Variable                          | Required                         | Default                                                      | Purpose                                                                                                                                                                                   |
| --------------------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`             | Yes, unless demo backends are on | a public demo API when demo backends are on                  | Base URL of your API (`shared/http/api.ts`).                                                                                                                                              |
| `EXPO_PUBLIC_AUTH_API_URL`        | Yes, unless demo backends are on | a public demo auth backend when demo backends are on         | Base URL of your auth backend (`shared/session/authService.ts`). Its origin is the only one that receives the auth token by default.                                                      |
| `EXPO_PUBLIC_API_TRUSTED_ORIGINS` | No                               | none                                                         | Comma-separated extra origins allowed to receive the auth token, e.g. an API on a separate first-party host. See [API and Storage](api-and-storage.md#which-hosts-receive-the-token).     |
| `EXPO_PUBLIC_API_TIMEOUT_MS`      | No                               | `15000`                                                      | Request timeout for every HTTP client, in milliseconds (1000–120000).                                                                                                                     |
| `EXPO_PUBLIC_LOG_LEVEL`           | No                               | `debug` (development), `info` (preview), `warn` (production) | Minimum level the logger writes to the console: `debug`, `info`, `warn`, `error`, or `silent`. Errors reach the error reporter at every level; see [Error reporting](error-reporting.md). |
| `EXPO_PUBLIC_USE_DEMO_BACKENDS`   | No                               | `false`                                                      | `true` fills missing URLs with the public demo backends. Leave it unset or `false` in real builds so a missing URL fails loudly.                                                          |
| `EXPO_PUBLIC_APP_ENV`             | No                               | `development` in dev builds, else `production`               | `development`, `preview`, or `production`. Outside `development`, every URL must use `https`.                                                                                             |

Validation rules:

- URLs must be absolute `http(s)` URLs; an empty value (`KEY=`) counts as unset.
- Outside `development`, `http://` URLs and trusted origins are rejected.
- `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_USE_DEMO_BACKENDS`, and
  `EXPO_PUBLIC_LOG_LEVEL` accept only the values listed above.

## Reading configuration in code

Never read `process.env` directly; ESLint (`no-restricted-properties`) rejects it
outside `shared/config/env.ts`. Use the validated values:

```ts
import { getConfig } from '@/shared/config/env';

export function describeBackends(): string {
  const { apiUrl, authApiUrl, appEnv } = getConfig();
  return `${appEnv}: ${apiUrl}, ${authApiUrl}`;
}
```

Call `getConfig()` when you need a value (inside a function or request
interceptor), not at module top level. Expo Router imports every route module
at startup, so reading configuration during import would throw before the
configuration error screen can render.

To add a variable:

1. Add it to `readRawEnv()` by its full name (`process.env.EXPO_PUBLIC_MY_VAR`).
   Expo only inlines references written out in full, so
   `process.env[name]` doesn't work.
2. Add it to the zod schema and to `AppConfig` in `shared/config/env.ts`.
3. Add it to `.env.example` and to the table above, and add a test in
   `__tests__/shared/config/env.test.ts`.

## Files and precedence

Expo CLI loads `.env` files when it starts the bundler. Files listed first take
precedence:

1. `.env.$NODE_ENV.local`
2. `.env.local` (not loaded when `NODE_ENV` is `test`)
3. `.env.$NODE_ENV`
4. `.env`

`NODE_ENV` is `development` for `npx expo start` and `production` for
`npx expo export` and release builds. The repository's `.gitignore` keeps `.env`
and `.env*.local` out of git; `.env.example` is the committed template. Restart
the bundler with `npx expo start --clear` after changing variables.

For builds made with EAS Build, set the same variables in the build profile's
`env` (in `eas.json`) or with `eas env:create`; they are read at build time.

## Security

`EXPO_PUBLIC_*` values are compiled into the JavaScript bundle and can be read
by anyone who has the app. Put only public configuration here (URLs, feature
switches). Keep secrets such as API keys with write access on your server, and
store user tokens through the token store (`shared/session/tokenStore.ts`), never in
environment variables.

## Testing

`jest.setup.env.js` sets `EXPO_PUBLIC_USE_DEMO_BACKENDS=true` before each test
file, mirroring a fresh checkout with `.env.example`. Validation tests call
`parseEnv(raw, isDevBuild)` directly with explicit values.

## References

- [Expo: environment variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS: environment variables](https://docs.expo.dev/eas/environment-variables/)
