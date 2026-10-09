/**
 * Loads data for a screen: runs an async function on mount and whenever
 * `deps` change, and tracks loading, data, and a typed error.
 *
 * - `fetchFn` gets an AbortSignal; pass it to the request
 *   (`api.get(url, { signal })`). The previous request is aborted when deps
 *   change, on refetch, and on unmount.
 * - Only the latest request updates state, so a slow, outdated response can't
 *   overwrite a newer one (even if the server ignores the abort).
 * - `error` is an ApiError (`code`, `status`, `message`), or null.
 *
 * For caching, background refetching, and mutations, use a data library
 * instead; see docs/api-and-storage.md#loading-data-in-screens.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from 'react';
import { toApiError, type ApiError } from '@/shared/http/apiError';

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** Runs the request again (aborting one in flight). */
  refetch: () => Promise<void>;
}

function sameDeps(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * @example
 * const { data, loading, error, refetch } = useFetch(
 *   signal => postsApi.list({ signal }),
 *   [userId]
 * );
 */
export function useFetch<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Re-run when deps change, compared item by item like a hook's deps. The
  // previous deps are kept in state (React's "information from previous
  // renders" pattern) so callers can pass their own dependency list.
  const [trackedDeps, setTrackedDeps] = useState(deps);
  const [depsVersion, setDepsVersion] = useState(0);
  if (!sameDeps(trackedDeps, deps)) {
    setTrackedDeps(deps);
    setDepsVersion(version => version + 1);
  }

  // The latest fetchFn, without making it a dependency (callers usually pass
  // an inline function).
  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  });

  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const isCurrent = () =>
      controllerRef.current === controller && !controller.signal.aborted;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current(controller.signal);
      if (isCurrent()) setData(result);
    } catch (caught) {
      if (isCurrent()) {
        setError(toApiError(caught));
        setData(null);
      }
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run();
    return () => {
      // Unmount or deps change: drop the request and its result.
      controllerRef.current?.abort();
    };
  }, [run, depsVersion]);

  return { data, loading, error, refetch: run };
}
