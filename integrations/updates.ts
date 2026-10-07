/**
 * Over-the-air update seam. The default never finds an update, so the app
 * always runs the JavaScript bundled in the build. Plug in expo-updates (or
 * another OTA service) in integrations/setup.ts; see docs/integrations.md.
 */
import { createSeam } from './seam';

export type UpdateCheckResult =
  | { available: true; id?: string }
  | { available: false; reason?: 'not-configured' | 'up-to-date' };

export interface Updates {
  /** Checks whether a newer bundle is available. */
  checkForUpdate(): Promise<UpdateCheckResult>;
  /** Downloads and applies an available update (usually reloads the app). */
  apply(): Promise<void>;
}

export const noOpUpdates: Updates = {
  checkForUpdate: async () => ({ available: false, reason: 'not-configured' }),
  apply: async () => {},
};

export const updatesSeam = createSeam<Updates>(noOpUpdates);

/** The active updates implementation. */
export const getUpdates = (): Updates => updatesSeam.get();
