/**
 * Feature flag seam. The default returns the static values in
 * shared/config/featureFlags.ts. A remote-config provider replaces it in
 * shared/integrations/setup.ts; see docs/plug-in-a-provider.md.
 */
import {
  featureFlagDefaults,
  type FeatureFlagName,
  type FeatureFlagValues,
} from '@/shared/config/featureFlags';
import { createSeam } from './seam';

export interface FeatureFlags {
  /** True when a flag is on. Non-boolean flags are on when truthy. */
  isEnabled(flag: FeatureFlagName): boolean;
  /** The typed value of a flag. */
  getValue<K extends FeatureFlagName>(flag: K): FeatureFlagValues[K];
}

export function createStaticFeatureFlags(
  values: FeatureFlagValues = featureFlagDefaults
): FeatureFlags {
  return {
    isEnabled: flag => Boolean(values[flag]),
    getValue: flag => values[flag],
  };
}

export const featureFlagsSeam = createSeam<FeatureFlags>(
  createStaticFeatureFlags()
);

/** The active feature flag implementation. */
export const getFeatureFlags = (): FeatureFlags => featureFlagsSeam.get();
