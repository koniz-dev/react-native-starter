// __tests__/features/posts/PostsScreen.test.tsx
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { api } from '@/shared/http/api';
import { renderWithProviders } from '@/testing';

import { PostsScreen } from '@/features/posts/screens/PostsScreen';

interface HeldRequest {
  config: InternalAxiosRequestConfig;
  resolve: (response: AxiosResponse) => void;
  reject: (error: unknown) => void;
}

/** Replaces the API's adapter: each request waits until the test answers. */
function holdRequests(): HeldRequest[] {
  const held: HeldRequest[] = [];
  api.defaults.adapter = (config =>
    new Promise((resolve, reject) =>
      held.push({ config, resolve, reject })
    )) as AxiosAdapter;
  return held;
}

const ok = (config: InternalAxiosRequestConfig, data: unknown) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

const unavailable = (config: InternalAxiosRequestConfig) =>
  new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    data: { message: 'Service unavailable' },
    status: 503,
    statusText: 'Service Unavailable',
    headers: new AxiosHeaders(),
    config,
  });

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

it('shows loading, then the error, and Retry loads the list', async () => {
  const requests = holdRequests();
  renderWithProviders(<PostsScreen />);

  expect(screen.getByText('Loading posts...')).toBeTruthy();
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(requests[0]?.config.url).toBe('/posts');

  await act(async () => requests[0]?.reject(unavailable(requests[0].config)));
  fireEvent.press(await screen.findByText('Service unavailable. Retry'));

  expect(await screen.findByText('Loading posts...')).toBeTruthy();
  await waitFor(() => expect(requests).toHaveLength(2));
  await act(async () =>
    requests[1]?.resolve(ok(requests[1].config, [{ id: 1, title: 'Hello' }]))
  );
  expect(await screen.findByText('Hello')).toBeTruthy();
  expect(screen.queryByText(/Retry/)).toBeNull();
});
