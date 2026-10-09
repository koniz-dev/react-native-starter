import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { TodosScreen } from '@/features/demo-todos/screens/TodosScreen';
import type { Todo } from '@/features/demo-todos/types';
import { api } from '@/shared/http/api';
import { renderWithProviders } from '@/testing';

const todos: Todo[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  userId: 1,
  title: `todo ${index + 1}`,
  completed: index === 0,
}));

function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function serverError(config: InternalAxiosRequestConfig) {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
    data: { message: 'Service unavailable' },
    status: 503,
    statusText: 'Service Unavailable',
    headers: new AxiosHeaders(),
    config,
  });
}

/** Lets a test decide, request by request, how the API answers. */
function controlledApi() {
  const pending: {
    config: InternalAxiosRequestConfig;
    resolve: (value: ReturnType<typeof ok>) => void;
    reject: (error: unknown) => void;
  }[] = [];
  api.defaults.adapter = (config =>
    new Promise((resolve, reject) =>
      pending.push({ config, resolve, reject })
    )) as AxiosAdapter;
  return pending;
}

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('<TodosScreen /> (Explore)', () => {
  it('goes from loading to an error, then Retry loads the list', async () => {
    const requests = controlledApi();
    renderWithProviders(<TodosScreen />);

    expect(screen.getByText('Loading todos...')).toBeTruthy();
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(requests[0]?.config.url).toBe('/todos');

    await act(async () => requests[0]?.reject(serverError(requests[0].config)));
    expect(await screen.findByText('Error')).toBeTruthy();
    expect(screen.getByText('Service unavailable')).toBeTruthy();
    expect(screen.queryByText(/^Todos \(/)).toBeNull();

    // With no data yet, retrying shows the full-screen loading state again.
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Loading todos...')).toBeTruthy();
    expect(screen.queryByText('Service unavailable')).toBeNull();
    await waitFor(() => expect(requests).toHaveLength(2));

    await act(async () => requests[1]?.resolve(ok(requests[1].config, todos)));
    expect(await screen.findByText('Todos (10)')).toBeTruthy();
    expect(screen.queryByText('Error')).toBeNull();
    expect(screen.getByText('todo 1')).toBeTruthy();
    expect(screen.getByText('todo 10')).toBeTruthy();
    expect(screen.queryByText('todo 11')).toBeNull();
    expect(screen.getAllByText('✓ Done')).toHaveLength(1);
    expect(screen.getByText('User ID: 1 • ID: 2')).toBeTruthy();
  });

  it('shows the empty state for an empty list', async () => {
    const requests = controlledApi();
    renderWithProviders(<TodosScreen />);
    await waitFor(() => expect(requests).toHaveLength(1));

    await act(async () => requests[0]?.resolve(ok(requests[0].config, [])));

    expect(await screen.findByText('No todos found')).toBeTruthy();
    expect(screen.queryByText(/^Todos \(/)).toBeNull();
  });
});
