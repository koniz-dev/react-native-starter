import { createSeam } from '@/shared/integrations/seam';
import {
  analyticsSeam,
  debugAnalytics,
  getAnalytics,
  type Analytics,
} from '@/shared/integrations/analytics';
import {
  createStaticFeatureFlags,
  featureFlagsSeam,
  getFeatureFlags,
} from '@/shared/integrations/featureFlags';
import {
  getPushNotifications,
  notConfiguredPush,
} from '@/shared/integrations/pushNotifications';
import { getUpdates, noOpUpdates } from '@/shared/integrations/updates';
import { featureFlagDefaults } from '@/shared/config/featureFlags';
import { logger } from '@/shared/lib/logger';

describe('createSeam', () => {
  it('starts with the default, accepts a replacement, and resets', () => {
    const seam = createSeam('default');
    expect(seam.get()).toBe('default');
    seam.set('provider');
    expect(seam.get()).toBe('provider');
    seam.reset();
    expect(seam.get()).toBe('default');
  });
});

describe('analytics seam', () => {
  afterEach(() => {
    analyticsSeam.reset();
    jest.restoreAllMocks();
  });

  it('defaults to debug logging and sends nothing else', () => {
    const debug = jest.spyOn(logger, 'debug').mockImplementation(() => {});
    expect(getAnalytics()).toBe(debugAnalytics);

    getAnalytics().track('signed_in', { method: 'password' });
    getAnalytics().screen('/explore');
    getAnalytics().identify(null);

    expect(debug.mock.calls).toEqual([
      ['[analytics] track signed_in', { method: 'password' }],
      ['[analytics] screen /explore', null],
      ['[analytics] identify (anonymous)', null],
    ]);
  });

  it('routes calls to a registered provider', () => {
    const provider: Analytics = {
      track: jest.fn(),
      screen: jest.fn(),
      identify: jest.fn(),
    };
    analyticsSeam.set(provider);
    getAnalytics().track('purchase', { amount: 3 });
    expect(provider.track).toHaveBeenCalledWith('purchase', { amount: 3 });
  });
});

describe('feature flags seam', () => {
  afterEach(() => featureFlagsSeam.reset());

  it('defaults to the static values in shared/config/featureFlags.ts', () => {
    expect(getFeatureFlags().isEnabled('exampleNewFeature')).toBe(
      featureFlagDefaults.exampleNewFeature
    );
    expect(getFeatureFlags().getValue('exampleWelcomeMessage')).toBe(
      featureFlagDefaults.exampleWelcomeMessage
    );
  });

  it('treats truthy non-boolean values as enabled', () => {
    const flags = createStaticFeatureFlags({
      exampleNewFeature: true,
      exampleWelcomeMessage: 'Hi',
    });
    featureFlagsSeam.set(flags);
    expect(getFeatureFlags().isEnabled('exampleNewFeature')).toBe(true);
    expect(getFeatureFlags().isEnabled('exampleWelcomeMessage')).toBe(true);
    expect(getFeatureFlags().getValue('exampleWelcomeMessage')).toBe('Hi');
  });
});

describe('push notifications seam', () => {
  it('reports push as not configured by default', async () => {
    expect(getPushNotifications()).toBe(notConfiguredPush);
    await expect(getPushNotifications().requestPermission()).resolves.toEqual({
      granted: false,
      reason: 'not-configured',
    });
    await expect(getPushNotifications().getToken()).resolves.toBeNull();

    const listener = jest.fn();
    const unsubscribe = getPushNotifications().onNotification(listener);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('updates seam', () => {
  it('never finds an update by default and applying does nothing', async () => {
    expect(getUpdates()).toBe(noOpUpdates);
    await expect(getUpdates().checkForUpdate()).resolves.toEqual({
      available: false,
      reason: 'not-configured',
    });
    await expect(getUpdates().apply()).resolves.toBeUndefined();
  });
});
