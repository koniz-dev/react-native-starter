/**
 * The app's API client for EXPO_PUBLIC_API_URL. All HTTP rules (config,
 * timeout, token origins, ApiError, 401 handling) live in httpClient.ts.
 * Feature modules build their endpoints on it in features/<name>/api/.
 */
import { getConfig } from '@/shared/config/env';
import { createHttpClient } from './httpClient';

export { getOrigin, getTrustedTokenOrigins } from './httpClient';

export const api = createHttpClient({
  getBaseURL: () => getConfig().apiUrl,
  authenticated: true,
});

export default api;
