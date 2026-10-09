# Integrations

The starter ships typed **seams** for the services most apps add later. Each
seam has a default that works with no account, key, or native setup, so the
app runs as-is. To use a real provider, install it yourself and register an
adapter in [`shared/integrations/setup.ts`](../shared/integrations/setup.ts), which runs once
from `app/_layout.tsx` before the first screen renders. No other code changes.

| Seam               | Module                                     | Default                                                                       | Call it with                                                                 |
| ------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Analytics          | `shared/integrations/analytics.ts`         | Logs `track` / `screen` / `identify` at debug level (development builds only) | `getAnalytics().track('event', props)`                                       |
| Feature flags      | `shared/integrations/featureFlags.ts`      | Static values from `shared/config/featureFlags.ts`                            | `getFeatureFlags().isEnabled('flag')`                                        |
| Push notifications | `shared/integrations/pushNotifications.ts` | "Not configured": no permission, no token, no notifications                   | `getPushNotifications().requestPermission()`                                 |
| OTA updates        | `shared/integrations/updates.ts`           | Never finds an update                                                         | `getUpdates().checkForUpdate()`                                              |
| i18n               | `shared/i18n/index.ts`                     | English dictionary in `shared/i18n/en.ts`                                     | `t('login.title')`                                                           |
| Error reporting    | `shared/integrations/errorReporter.ts`     | One console line per report                                                   | `logger.error('message', error)` (see [Error reporting](error-reporting.md)) |

Every seam is created with `createSeam(default)` and exposes `set()` and
`reset()`; tests use `reset()` in `afterEach`.

The adapters below are examples. They are not installed or compiled in this
repository; check each provider's current documentation for its API.

## Analytics

Screen views are reported automatically: `useScreenTracking()` in
`app/_layout.tsx` calls `getAnalytics().screen(pathname)` on every route
change. Call `track` for events and `identify` after sign-in.

```ts
// shared/integrations/adapters/posthog.ts (example; requires posthog-react-native)
import type PostHog from 'posthog-react-native';
import type { Analytics } from '@/shared/integrations/analytics';

export function createPostHogAnalytics(client: PostHog): Analytics {
  return {
    track: (event, properties) => client.capture(event, properties ?? {}),
    screen: (name, properties) => client.screen(name, properties ?? {}),
    identify: (userId, traits) =>
      userId ? client.identify(userId, traits ?? {}) : client.reset(),
  };
}

// shared/integrations/setup.ts
analyticsSeam.set(createPostHogAnalytics(posthogClient));
```

## Feature flags

Add a flag to `shared/config/featureFlags.ts`; its name and value type are then
checked by TypeScript everywhere it is read. A remote-config provider
replaces the static default:

```ts
// shared/integrations/adapters/remoteFlags.ts (example)
import { featureFlagDefaults } from '@/shared/config/featureFlags';
import type { FeatureFlags } from '@/shared/integrations/featureFlags';

export function createRemoteFeatureFlags(
  read: (name: string) => unknown // e.g. your SDK's getFeatureFlag
): FeatureFlags {
  return {
    isEnabled: flag => Boolean(read(flag) ?? featureFlagDefaults[flag]),
    getValue: flag => (read(flag) ?? featureFlagDefaults[flag]) as never,
  };
}
```

Fetch remote values before relying on them, and keep the static defaults as the
fallback for offline starts.

## Push notifications

```ts
// shared/integrations/adapters/expoNotifications.ts
// (example; requires expo-notifications, its config plugin, and push credentials)
import * as Notifications from 'expo-notifications';
import type { PushNotifications } from '@/shared/integrations/pushNotifications';

export const expoPush: PushNotifications = {
  requestPermission: async () => {
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted ? { granted: true } : { granted: false, reason: 'denied' };
  },
  getToken: async () => (await Notifications.getExpoPushTokenAsync()).data,
  onNotification: listener => {
    const sub = Notifications.addNotificationReceivedListener(n =>
      listener({
        title: n.request.content.title ?? undefined,
        body: n.request.content.body ?? undefined,
        data: n.request.content.data,
      })
    );
    return () => sub.remove();
  },
};
```

## OTA updates

```ts
// shared/integrations/adapters/expoUpdates.ts
// (example; requires expo-updates and an update service such as EAS Update)
import * as ExpoUpdates from 'expo-updates';
import type { Updates } from '@/shared/integrations/updates';

export const expoUpdates: Updates = {
  checkForUpdate: async () => {
    if (!ExpoUpdates.isEnabled)
      return { available: false, reason: 'not-configured' };
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
```

`expo-updates` also needs `runtimeVersion` and `updates.url` in `app.config.ts`;
see the Expo documentation.

## i18n

All strings on the shipped screens come from `shared/i18n/en.ts` through `t()`.
Keys are typed, and `Translations` requires every locale to define every key.
`{name}` placeholders are filled from the second argument:

```tsx
<Text>{t('home.session.signedIn', { name: user.name })}</Text>
```

To add a language with the built-in dictionary implementation:

```ts
// i18n/vi.ts
import type { Translations } from './en';
export const vi: Translations = { 'tabs.home': 'Trang chủ' /* every key */ };

// shared/integrations/setup.ts (pick the locale from expo-localization, user settings, ...)
i18nSeam.set(createDictionaryI18n('vi', vi));
```

To use a library such as i18next, wrap it in the `I18n` interface
(`locale` and `t(key, params)`). The seam is read when a screen renders; if
users can change the language at runtime, re-render the app after switching
(for example with a context key or the library's React provider).

## References

- [Expo: push notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo: EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Expo: localization](https://docs.expo.dev/guides/localization/)
