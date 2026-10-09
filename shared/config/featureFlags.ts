/**
 * Static feature flag defaults. The default FeatureFlags implementation reads
 * these values; a remote-config provider can override them at runtime (see
 * docs/integrations.md). Add a flag here to make it available, typed, to
 * `getFeatureFlags().isEnabled(...)` and `getValue(...)`.
 */
export const featureFlagDefaults = {
  /** Example boolean flag. */
  exampleNewFeature: false,
  /** Example non-boolean value. */
  exampleWelcomeMessage: '',
} as const satisfies Record<string, boolean | string | number>;

export type FeatureFlagName = keyof typeof featureFlagDefaults;
export type FeatureFlagValues = {
  [K in FeatureFlagName]: (typeof featureFlagDefaults)[K] extends boolean
    ? boolean
    : (typeof featureFlagDefaults)[K] extends number
      ? number
      : string;
};
