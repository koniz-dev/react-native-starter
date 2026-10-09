import type { AxiosInstance } from 'axios';
import {
  DEMO_CREDENTIALS,
  dummyJsonAuthAdapter,
} from '@/features/demo-auth/dummyJsonAdapter';
import type { AuthClients } from '@/shared/session/authService';

const dummyUser = {
  id: 1,
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
};

function clientsReturning(data: unknown) {
  const post = jest.fn(async () => ({ data }));
  const get = jest.fn(async () => ({ data }));
  const clients = {
    public: { post } as unknown as AxiosInstance,
    authenticated: { get } as unknown as AxiosInstance,
  } satisfies AuthClients;
  return { clients, post, get };
}

describe('DummyJSON auth adapter', () => {
  it('posts the credentials to /auth/login and returns the access token', async () => {
    const { clients, post } = clientsReturning({
      ...dummyUser,
      accessToken: 'demo-token',
    });

    const result = await dummyJsonAuthAdapter.login(DEMO_CREDENTIALS, clients);

    expect(post).toHaveBeenCalledWith('/auth/login', {
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 60,
    });
    expect(result.token).toBe('demo-token');
  });

  it('normalizes the DummyJSON user', () => {
    expect(dummyJsonAuthAdapter.normalizeUser(dummyUser)).toEqual({
      id: 1,
      email: 'emily.johnson@x.dummyjson.com',
      name: 'Emily Johnson',
    });
    expect(
      dummyJsonAuthAdapter.normalizeUser({ id: 2, email: 'x@y.z' })
    ).toEqual({ id: 2, email: 'x@y.z', name: 'x@y.z' });
  });

  it('rejects a payload without user information', () => {
    expect(() => dummyJsonAuthAdapter.normalizeUser({ id: 1 })).toThrow(
      'did not include user information'
    );
    expect(() => dummyJsonAuthAdapter.normalizeUser(undefined)).toThrow();
  });

  it('loads the current user from /auth/me with the authenticated client', async () => {
    const { clients, get } = clientsReturning(dummyUser);

    await expect(dummyJsonAuthAdapter.fetchUser?.(clients)).resolves.toEqual(
      dummyUser
    );
    expect(get).toHaveBeenCalledWith('/auth/me');
  });
});
