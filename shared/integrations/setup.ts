/**
 * The one place to plug real providers into the integration seams.
 *
 * Every seam already has a default that works without accounts or native
 * setup: analytics logs at debug level, feature flags read
 * shared/config/featureFlags.ts, push and OTA updates report "not configured",
 * i18n serves English, and the error reporter writes to the console. To use
 * a provider, install it and register an adapter in configureIntegrations(),
 * for example:
 *
 *   import { analyticsSeam } from './analytics';
 *   import { createPostHogAnalytics } from './adapters/posthog';
 *
 *   analyticsSeam.set(createPostHogAnalytics(client));
 *
 * docs/integrations.md has an example adapter for each seam, and
 * docs/error-reporting.md one for the error reporter. This function
 * runs once, from app/_layout.tsx, before the first screen renders.
 */
// @demo remove-block-start
import { setAuthAdapter } from '@/shared/session/authService';
import { dummyJsonAuthAdapter } from '@/features/demo-auth/dummyJsonAdapter';
// @demo remove-block-end

let configured = false;

export function configureIntegrations(): void {
  if (configured) return;
  configured = true;

  // Register provider adapters here. Without them the defaults stay active.

  // Sign-in: register the adapter for your auth backend, e.g.
  //   setAuthAdapter(myBackendAuthAdapter);
  // with setAuthAdapter from '@/shared/session/authService' (see
  // docs/how-to.md#how-to-add-authentication). Until one is set, sign-in
  // reports that it is not configured.
  // @demo remove-block-start
  setAuthAdapter(dummyJsonAuthAdapter);
  // @demo remove-block-end
}
