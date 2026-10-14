import { Activity } from 'react';
import { Text } from 'react-native';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError } from '@/shared/http/apiError';
import { useFetch } from '@/shared/lib/useFetch';

/** A request the test resolves or rejects by hand, recording its signal. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function controlledFetch<T>() {
  const calls: {
    signal: AbortSignal;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const fetchFn = jest.fn((signal: AbortSignal) => {
    const request = deferred<T>();
    calls.push({ signal, resolve: request.resolve, reject: request.reject });
    return request.promise;
  });
  return { fetchFn, calls };
}

describe('useFetch', () => {
  it('loads data, exposes a typed ApiError, and refetches', async () => {
    const fetchFn = jest
      .fn<Promise<string>, [AbortSignal]>()
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce('second');
    const { result } = renderHook(() => useFetch(fetchFn));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('first'));
    expect(result.current.loading).toBe(false);

    await act(async () => result.current.refetch());
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({
      message: 'Offline',
      code: 'unknown',
    });
    expect(result.current.data).toBeNull();

    await act(async () => result.current.refetch());
    expect(result.current.data).toBe('second');
    expect(result.current.error).toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('maps HTTP failures to ApiError codes', async () => {
    const config = {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig;
    const httpError = new AxiosError(
      'Request failed',
      'ERR_BAD_RESPONSE',
      config,
      null,
      {
        data: { message: 'Service unavailable' },
        status: 503,
        statusText: 'Service Unavailable',
        headers: new AxiosHeaders(),
        config,
      }
    );
    const { result } = renderHook(() =>
      useFetch(() => Promise.reject(httpError))
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatchObject({
      code: 'server',
      status: 503,
      message: 'Service unavailable',
    });
    expect(result.current.loading).toBe(false);
  });

  // (A result after unmount can't be observed: React drops the update. The
  // tests below cover ignoring stale results on a mounted component.)
  it('aborts the request on unmount', async () => {
    const { fetchFn, calls } = controlledFetch<string>();
    const { unmount } = renderHook(() => useFetch(fetchFn));

    unmount();

    expect(calls[0]?.signal.aborted).toBe(true);
  });

  it('aborts the previous request when deps change', async () => {
    const { fetchFn, calls } = controlledFetch<string>();
    const { rerender, result } = renderHook(
      ({ id }: { id: number }) => useFetch(fetchFn, [id]),
      { initialProps: { id: 1 } }
    );
    expect(fetchFn).toHaveBeenCalledTimes(1);

    rerender({ id: 2 });
    expect(calls[0]?.signal.aborted).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(calls[1]?.signal.aborted).toBe(false);

    await act(async () => calls[1]?.resolve('two'));
    expect(result.current.data).toBe('two');

    rerender({ id: 2 }); // same deps: no new request
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('goes back to loading without the old error on a deps change and on refetch', async () => {
    const { fetchFn, calls } = controlledFetch<string>();
    const { rerender, result } = renderHook(
      ({ id }: { id: number }) => useFetch(fetchFn, [id]),
      { initialProps: { id: 1 } }
    );
    await act(async () => calls[0]?.reject(new Error('down')));
    expect(result.current).toMatchObject({ loading: false, data: null });
    expect(result.current.error?.message).toBe('down');

    // The render with the new deps already shows loading, not the old error.
    rerender({ id: 2 });
    expect(result.current).toMatchObject({ loading: true, error: null });

    await act(async () => calls[1]?.reject(new Error('still down')));
    expect(result.current.error?.message).toBe('still down');

    await act(async () => {
      void result.current.refetch();
    });
    expect(result.current).toMatchObject({ loading: true, error: null });
    await act(async () => calls[2]?.resolve('back'));
    expect(result.current).toMatchObject({
      loading: false,
      error: null,
      data: 'back',
    });
  });

  it('keeps the latest response when an older one arrives later', async () => {
    const { fetchFn, calls } = controlledFetch<string>();
    const { rerender, result } = renderHook(
      ({ id }: { id: number }) => useFetch(fetchFn, [id]),
      { initialProps: { id: 1 } }
    );
    rerender({ id: 2 });

    await act(async () => calls[1]?.resolve('two'));
    // The server ignored the abort and answers the first request last.
    await act(async () => calls[0]?.resolve('one'));

    expect(result.current.data).toBe('two');
    expect(result.current.loading).toBe(false);
  });

  it('ignores an older request that fails after the newer one succeeded', async () => {
    const { fetchFn, calls } = controlledFetch<string>();
    const { rerender, result } = renderHook(
      ({ id }: { id: number }) => useFetch(fetchFn, [id]),
      { initialProps: { id: 1 } }
    );
    rerender({ id: 2 });

    await act(async () => calls[1]?.resolve('two'));
    // The aborted request rejects, as axios does with a CanceledError.
    await act(async () => calls[0]?.reject(new CanceledError()));

    expect(result.current).toMatchObject({
      data: 'two',
      error: null,
      loading: false,
    });
  });

  it("doesn't end the newer request's loading when an older one settles", async () => {
    const { fetchFn, calls } = controlledFetch<string>();
    const { rerender, result } = renderHook(
      ({ id }: { id: number }) => useFetch(fetchFn, [id]),
      { initialProps: { id: 1 } }
    );
    rerender({ id: 2 });

    await act(async () => calls[0]?.resolve('one'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('refetch aborts a request in flight and uses the newest fetchFn', async () => {
    const first = controlledFetch<string>();
    const second = controlledFetch<string>();
    const { rerender, result } = renderHook(
      ({ fetchFn }: { fetchFn: (signal: AbortSignal) => Promise<string> }) =>
        useFetch(fetchFn),
      { initialProps: { fetchFn: first.fetchFn } }
    );

    rerender({ fetchFn: second.fetchFn }); // a new function alone doesn't refetch
    expect(second.fetchFn).not.toHaveBeenCalled();

    await act(async () => {
      void result.current.refetch();
    });
    expect(first.calls[0]?.signal.aborted).toBe(true);
    expect(second.fetchFn).toHaveBeenCalledTimes(1);

    await act(async () => second.calls[0]?.resolve('fresh'));
    expect(result.current.data).toBe('fresh');
  });

  it('keeps working when its effect is cleaned up and run again', async () => {
    // <Activity mode="hidden"> runs effect cleanups and showing it again
    // re-runs them on the same component (as StrictMode does in development).
    const fetchFn = jest
      .fn<Promise<string>, [AbortSignal]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');
    function Probe() {
      const { data, loading } = useFetch(fetchFn);
      return <Text testID="probe">{`${loading}:${data}`}</Text>;
    }
    const view = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Probe />
      </Activity>
    );
    const { rerender } = render(view('visible'));
    await waitFor(() =>
      expect(
        screen.getByTestId('probe', { includeHiddenElements: true })
      ).toHaveTextContent('false:v1')
    );

    await act(async () => rerender(view('hidden')));
    await act(async () => rerender(view('visible')));

    await waitFor(() =>
      expect(
        screen.getByTestId('probe', { includeHiddenElements: true })
      ).toHaveTextContent('false:v2')
    );
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('drops the old error when its effect runs again and succeeds', async () => {
    const fetchFn = jest
      .fn<Promise<string>, [AbortSignal]>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce('ok');
    function Probe() {
      const { data, loading, error } = useFetch(fetchFn);
      return (
        <Text testID="probe">{`${loading}:${data}:${error?.message}`}</Text>
      );
    }
    const view = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <Probe />
      </Activity>
    );
    const probe = () =>
      screen.getByTestId('probe', { includeHiddenElements: true });
    const { rerender } = render(view('visible'));
    await waitFor(() => expect(probe()).toHaveTextContent('false:null:down'));

    await act(async () => rerender(view('hidden')));
    await act(async () => rerender(view('visible')));

    await waitFor(() =>
      expect(probe()).toHaveTextContent('false:ok:undefined')
    );
  });
});
