# Plug In a Provider

The starter ships typed **seams** for services most apps add later. Each has
a default that needs no account, key, or native setup, so the app runs as-is.
To use a provider, install its SDK, write a small adapter to the seam's
interface, and register it in `shared/integrations/setup.ts`, which runs
once from `app/_layout.tsx` before the first screen renders. No other code
changes.

| Seam               | Interface (module)                                               | Default                                            | Call it with                                 |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| Analytics          | `Analytics` (`shared/integrations/analytics.ts`)                 | logs at debug level (development builds only)      | `getAnalytics().track('event', props)`       |
| Feature flags      | `FeatureFlags` (`shared/integrations/featureFlags.ts`)           | static values from `shared/config/featureFlags.ts` | `getFeatureFlags().isEnabled('flag')`        |
| Push notifications | `PushNotifications` (`shared/integrations/pushNotifications.ts`) | "not configured": no permission, no token          | `getPushNotifications().requestPermission()` |
| OTA updates        | `Updates` (`shared/integrations/updates.ts`)                     | never finds an update                              | `getUpdates().checkForUpdate()`              |
| Error reporting    | `ErrorReporter` (`shared/integrations/errorReporter.ts`)         | one console line per report                        | `logger.error('message', error)`             |
| i18n               | `I18n` (`shared/i18n/index.ts`)                                  | English, from `shared/i18n/en.ts`                  | `t('login.title')`                           |

Each seam is a `createSeam(default)` with `set()` and `reset()`; tests set a
mock and call `reset()` afterwards. A full-app test (one that renders
`./app`) must call `configureIntegrations()` before setting its mock, or your
registered provider replaces it; see
[Testing](testing.md#a-seam-or-adapter-in-a-full-app-test).

The adapters below compile against the seams in this repo (`npm run
docs:check`). Each declares the part of the provider's SDK it uses, with the
real import in a comment; check the provider's current documentation for its
exact API.

## Analytics

Screen views are reported automatically: `useScreenTracking()` in
`app/_layout.tsx` calls `getAnalytics().screen(pathname)` on every route
change. Call `track` for events, and `identify` when the signed-in user
changes. The session is the place to watch: a hook that calls `identify` with
the user's id on sign-in (and on a restored session), and `identify(null)` on
sign-out. The session provider does the same for the error reporter.

```ts
// features/auth/hooks/useAnalyticsIdentity.ts
import { useEffect } from 'react';
import { getAnalytics } from '@/shared/integrations/analytics';
import { useSession } from '@/shared/session/SessionProvider';

/** Identifies the signed-in user to analytics; clears it on sign-out. */
export function useAnalyticsIdentity(): void {
  const { session } = useSession();
  const userId = session.user ? String(session.user.id) : null;
  useEffect(() => {
    if (session.status === 'loading') return;
    getAnalytics().identify(userId);
  }, [session.status, userId]);
}
```

Call it once, in a component inside `SessionProvider`, such as
`RootNavigator` in `app/_layout.tsx`. Send traits such as the email only if
your privacy policy and the user's consent allow it.

```ts
// shared/integrations/adapters/posthog.ts
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';

/** The part of a PostHog client (posthog-react-native) this adapter uses. */
interface PostHogClient {
  capture(event: string, properties?: Record<string, unknown>): void;
  screen(name: string, properties?: Record<string, unknown>): void;
  identify(distinctId: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

export function createPostHogAnalytics(client: PostHogClient): Analytics {
  return {
    track: (event, properties) => client.capture(event, properties),
    screen: (name, properties) => client.screen(name, properties),
    identify: (userId, traits) =>
      userId ? client.identify(userId, traits) : client.reset(),
  };
}

// In configureIntegrations():
declare const posthog: PostHogClient; // new PostHog('<key>', { host })
analyticsSeam.set(createPostHogAnalytics(posthog));
```

## Feature flags

Add a flag to `shared/config/featureFlags.ts`; its name and value type are
then checked everywhere it is read. A remote-config provider replaces the
static values and falls back to them:

```ts
import {
  featureFlagDefaults,
  type FeatureFlagName,
  type FeatureFlagValues,
} from '@/shared/config/featureFlags';
import {
  featureFlagsSeam,
  type FeatureFlags,
} from '@/shared/integrations/featureFlags';

/** Reads a fetched remote value, e.g. your SDK's getFeatureFlag(name). */
type ReadRemote = (name: FeatureFlagName) => unknown;

export function createRemoteFeatureFlags(read: ReadRemote): FeatureFlags {
  const value = <K extends FeatureFlagName>(flag: K): FeatureFlagValues[K] => {
    const remote = read(flag);
    return typeof remote === typeof featureFlagDefaults[flag]
      ? (remote as FeatureFlagValues[K])
      : featureFlagDefaults[flag];
  };
  return {
    isEnabled: flag => Boolean(value(flag)),
    getValue: value,
  };
}

declare const readRemoteFlag: ReadRemote;
featureFlagsSeam.set(createRemoteFeatureFlags(readRemoteFlag));
```

Fetch remote values before relying on them; the static defaults cover
offline starts.

## Push notifications

Needs `expo-notifications`, its config plugin, and push credentials, so it
only works in a development or store build, not Expo Go.

```ts
import {
  pushNotificationsSeam,
  type PushNotifications,
} from '@/shared/integrations/pushNotifications';

/** The part of expo-notifications this adapter uses
 * (import * as Notifications from 'expo-notifications'). */
declare const Notifications: {
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  getExpoPushTokenAsync(): Promise<{ data: string }>;
  addNotificationReceivedListener(
    listener: (notification: {
      request: {
        content: {
          title: string | null;
          body: string | null;
          data: Record<string, unknown>;
        };
      };
    }) => void
  ): { remove(): void };
};

export const expoPush: PushNotifications = {
  requestPermission: async () => {
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted ? { granted: true } : { granted: false, reason: 'denied' };
  },
  getToken: async () => (await Notifications.getExpoPushTokenAsync()).data,
  onNotification: listener => {
    const subscription = Notifications.addNotificationReceivedListener(n =>
      listener({
        title: n.request.content.title ?? undefined,
        body: n.request.content.body ?? undefined,
        data: n.request.content.data,
      })
    );
    return () => subscription.remove();
  },
};

pushNotificationsSeam.set(expoPush);
```

## OTA updates

Needs `expo-updates`, `runtimeVersion` and `updates.url` in `app.config.ts`,
and an update service such as EAS Update.

```ts
import { updatesSeam, type Updates } from '@/shared/integrations/updates';

/** The part of expo-updates this adapter uses
 * (import * as ExpoUpdates from 'expo-updates'). */
declare const ExpoUpdates: {
  isEnabled: boolean;
  checkForUpdateAsync(): Promise<{ isAvailable: boolean }>;
  fetchUpdateAsync(): Promise<unknown>;
  reloadAsync(): Promise<void>;
};

export const expoUpdates: Updates = {
  checkForUpdate: async () => {
    if (!ExpoUpdates.isEnabled) {
      return { available: false, reason: 'not-configured' };
    }
    const result = await ExpoUpdates.checkForUpdateAsync();
    return result.isAvailable
      ? { available: true }
      : { available: false, reason: 'up-to-date' };
  },
  apply: async () => {
    await ExpoUpdates.fetchUpdateAsync();
    await ExpoUpdates.reloadAsync();
  },
};

updatesSeam.set(expoUpdates);
```

## Error reporting

`logger.error` and the error boundaries report through this seam in every
build. A Sentry adapter and the logger's levels and redaction are in
[Error Reporting and Logging](error-reporting.md#plugging-in-a-provider).

## i18n

The shipped screens read every string through `t()` from `shared/i18n/en.ts`.
Keys are typed, and `Translations` requires a locale to define every key.
Placeholders like `{name}` are filled from the second argument:
`t('home.session.signedIn', { name })`.

To add a language with the built-in dictionary implementation:

```ts
import { createDictionaryI18n, i18nSeam } from '@/shared/i18n';
import { en } from '@/shared/i18n/en';
import type { Translations } from '@/shared/i18n';

// shared/i18n/vi.ts would define every key; spreading en keeps this short.
const vi: Translations = { ...en, 'tabs.home': 'Trang chủ' };

// Pick the locale from expo-localization or a user setting:
i18nSeam.set(createDictionaryI18n('vi', vi));
```

To use a library such as i18next, wrap it in the `I18n` interface (`locale`
and `t(key, params)`). The seam is read when a screen renders; if users
switch language at runtime, re-render the app afterwards.

## References

- [Expo: push notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo: EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Expo: localization](https://docs.expo.dev/guides/localization/)
