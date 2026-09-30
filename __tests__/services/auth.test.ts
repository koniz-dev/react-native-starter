jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

import { authApi, authService } from '@/services/auth';
import * as storage from '@/services/storage';

describe('authService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(storage, 'setItem').mockResolvedValue(undefined);
  });

  it('normalizes the demo response and persists the session after a successful login', async () => {
    jest.spyOn(authApi, 'post').mockResolvedValue({
      data: {
        accessToken: 'demo-token',
        id: 1,
        email: 'emily.johnson@x.dummyjson.com',
        firstName: 'Emily',
        lastName: 'Johnson',
      },
    });

    await expect(
      authService.login({ username: 'emilys', password: 'emilyspass' })
    ).resolves.toEqual({
      token: 'demo-token',
      user: {
        id: 1,
        email: 'emily.johnson@x.dummyjson.com',
        name: 'Emily Johnson',
      },
    });

    expect(authApi.post).toHaveBeenCalledWith('/auth/login', {
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 60,
    });
    expect(storage.setItem).toHaveBeenNthCalledWith(
      1,
      'auth_token',
      'demo-token'
    );
    expect(storage.setItem).toHaveBeenNthCalledWith(2, 'user_data', {
      id: 1,
      email: 'emily.johnson@x.dummyjson.com',
      name: 'Emily Johnson',
    });
  });

  it('rejects an incomplete response without persisting a session', async () => {
    jest.spyOn(authApi, 'post').mockResolvedValue({ data: { id: 1 } });

    await expect(
      authService.login({ username: 'emilys', password: 'wrong-password' })
    ).rejects.toThrow('access token');

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('does not persist a session when the login request fails', async () => {
    jest
      .spyOn(authApi, 'post')
      .mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      authService.login({ username: 'emilys', password: 'wrong-password' })
    ).rejects.toThrow('Invalid credentials');

    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
