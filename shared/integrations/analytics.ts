/**
 * Analytics seam. The default logs events at debug level (development builds
 * only) and sends nothing anywhere. Plug a provider in shared/integrations/setup.ts;
 * see docs/integrations.md.
 */
import { logger } from '@/shared/lib/logger';
import { createSeam } from './seam';

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null
>;

export interface Analytics {
  /** Records a named event. */
  track(event: string, properties?: AnalyticsProperties): void;
  /** Records a screen view; called automatically on route changes. */
  screen(name: string, properties?: AnalyticsProperties): void;
  /** Associates later events with a user, or clears it with null. */
  identify(userId: string | null, traits?: AnalyticsProperties): void;
}

export const debugAnalytics: Analytics = {
  track: (event, properties) =>
    logger.debug(`[analytics] track ${event}`, properties ?? null),
  screen: (name, properties) =>
    logger.debug(`[analytics] screen ${name}`, properties ?? null),
  identify: (userId, traits) =>
    logger.debug(
      `[analytics] identify ${userId ?? '(anonymous)'}`,
      traits ?? null
    ),
};

export const analyticsSeam = createSeam<Analytics>(debugAnalytics);

/** The active analytics implementation. */
export const getAnalytics = (): Analytics => analyticsSeam.get();
