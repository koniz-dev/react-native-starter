/**
 * API Service
 * The app's API client and the demo endpoints that use it. All HTTP rules
 * (config, timeout, token origins, ApiError, 401 handling) live in
 * services/httpClient.ts.
 */
import { getConfig } from '@/config/env';
import type { Todo } from '@/types/api';
import { createHttpClient } from './httpClient';

export { getOrigin, getTrustedTokenOrigins } from './httpClient';

const api = createHttpClient({
  getBaseURL: () => getConfig().apiUrl,
  authenticated: true,
});

/** Demo endpoint used by the Explore tab (JSONPlaceholder). */
export const todosApi = {
  getAll: async (): Promise<Todo[]> => {
    const response = await api.get<Todo[]>('/todos');
    return response.data;
  },
};

// Export the configured Axios instance for custom requests
export default api;
