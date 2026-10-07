/**
 * Push notification seam. The default reports that push is not configured:
 * permission is never granted, there is no token, and no notifications
 * arrive. Plug in a provider (for example expo-notifications) in
 * integrations/setup.ts; see docs/integrations.md.
 */
import { createSeam } from './seam';

export type PushPermissionResult =
  | { granted: true }
  | { granted: false; reason: 'denied' | 'not-configured' | 'unsupported' };

export interface PushNotification {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export interface PushNotifications {
  /** Asks the user for permission to show notifications. */
  requestPermission(): Promise<PushPermissionResult>;
  /** The device push token to register with your server, or null. */
  getToken(): Promise<string | null>;
  /** Subscribes to notifications received while the app runs. */
  onNotification(
    listener: (notification: PushNotification) => void
  ): () => void;
}

export const notConfiguredPush: PushNotifications = {
  requestPermission: async () => ({ granted: false, reason: 'not-configured' }),
  getToken: async () => null,
  onNotification: () => () => {},
};

export const pushNotificationsSeam =
  createSeam<PushNotifications>(notConfiguredPush);

/** The active push notification implementation. */
export const getPushNotifications = (): PushNotifications =>
  pushNotificationsSeam.get();
