# Make It Yours

A one-time checklist for turning the template into your app. Most of it is
configuration; the code changes are an auth adapter and your own features.

Start with `npm run init-project`
([Getting Started](getting-started.md#make-it-your-project-first)). It sets
the first row (name, slug, scheme, bundle ID, version) along with the
`package.json` name, README, and LICENSE holder, removes the demo if you
choose to and the state-management recipes unless you keep them, and
deletes this page: what you need
later is in [App Config](app-config.md) and the other guides.

## Checklist

| What                                                          | Where                                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| App name, slug, URL scheme, bundle / package ID, version      | the `APP` block in `app.config.ts` ([App Config](app-config.md#identity))                |
| Store build number (iOS `buildNumber`, Android `versionCode`) | `APP_BUILD_NUMBER` at build time ([App Config](app-config.md#identity))                  |
| Icon, Android adaptive icon, splash image, favicon            | replace the files in `assets/` ([App Config](app-config.md#icons-and-splash-screen))     |
| Splash and adaptive-icon background colors                    | `APP.splashBackground`, `APP.adaptiveIconBackground` in `app.config.ts`                  |
| Brand colors                                                  | `palette` in `shared/ui/theme.ts` ([UI and Theming](ui-and-theming.md))                  |
| Fonts                                                         | [UI and Theming](ui-and-theming.md#fonts)                                                |
| Backend URLs, timeout, log level                              | `EXPO_PUBLIC_*` variables ([Environment Variables](environment-variables.md))            |
| Sign-in against your backend                                  | an `AuthAdapter` ([Connect Your Backend](connect-your-backend.md))                       |
| Analytics, flags, push, OTA, crash reporting                  | adapters in `shared/integrations/setup.ts` ([Plug In a Provider](plug-in-a-provider.md)) |
| UI strings                                                    | `shared/i18n/en.ts` (and more locales via the i18n seam)                                 |
| Build variants and EAS Build profiles                         | `app.config.ts`, `eas.json` ([App Config](app-config.md#build-variants))                 |

<!-- @demo remove-block-start -->

The demo screens and the DummyJSON adapter: `npm run remove-demo`
([Remove the Demo](remove-demo.md)).

<!-- @demo remove-block-end -->

## After the checklist

- Run `npm run config:print` to see the resolved config for a variant.
- Run the gate: `npm run lint && npm run type-check && npm run test:ci`.
