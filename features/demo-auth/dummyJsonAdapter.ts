/**
 * Demo auth adapter for DummyJSON (https://dummyjson.com/docs/auth), the
 * public backend used when EXPO_PUBLIC_USE_DEMO_BACKENDS=true. Replace it
 * with an adapter for your backend; see docs/connect-your-backend.md.
 */
import { z } from 'zod';
import type { AuthAdapter, AuthUser } from '@/shared/session/authService';

/** The fields of DummyJSON's user payload the app uses, checked with zod. */
const DummyJsonUserSchema = z.object({
  id: z.number(),
  email: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

interface DummyJsonLoginResponse {
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
    const result = DummyJsonUserSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(
        'The authentication response did not include user information',
        { cause: result.error }
      );
    }
    const data = result.data;
    return {
      id: data.id,
      email: data.email,
      name:
        [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email,
    };
  },

  fetchUser: async ({ authenticated }) => {
    const { data } = await authenticated.get<unknown>('/auth/me');
    return data;
  },
};
