/**
 * Demo auth adapter for DummyJSON (https://dummyjson.com/docs/auth), the
 * public backend used when EXPO_PUBLIC_USE_DEMO_BACKENDS=true. Replace it
 * with an adapter for your backend; see docs/how-to.md#how-to-add-authentication.
 */
import type { AuthAdapter, AuthUser } from '@/shared/session/authService';

interface DummyJsonUser {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface DummyJsonLoginResponse extends DummyJsonUser {
  accessToken?: string;
}

/** The demo account documented by DummyJSON. */
export const DEMO_CREDENTIALS = {
  username: 'emilys',
  password: 'emilyspass',
} as const;

export const dummyJsonAuthAdapter: AuthAdapter = {
  login: async (credentials, { public: http }) => {
    const { data } = await http.post<DummyJsonLoginResponse>('/auth/login', {
      ...credentials,
      expiresInMins: 60,
    });
    return { token: data.accessToken ?? '', user: data };
  },

  normalizeUser: (raw): AuthUser => {
    const data = (raw ?? {}) as DummyJsonUser;
    if (!data.id || !data.email) {
      throw new Error(
        'The authentication response did not include user information'
      );
    }
    return {
      id: data.id,
      email: data.email,
      name:
        [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email,
    };
  },

  fetchUser: async ({ authenticated }) => {
    const { data } = await authenticated.get<DummyJsonUser>('/auth/me');
    return data;
  },
};
