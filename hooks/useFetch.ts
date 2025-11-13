/**
 * useFetch Hook
 * Generic custom hook for data fetching with loading and error states
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiError } from '@/types/api';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * useFetch is a generic hook for fetching data with automatic loading and error handling.
 * 
 * @param fetchFn - Function that returns a Promise with the data to fetch
 * @param deps - Optional dependency array to trigger refetch when values change
 * @returns Object with data, loading, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFetch<User[]>(() => userApi.getAll());
 * 
 * if (loading) return <LoadingScreen />;
 * if (error) return <Text>Error: {error}</Text>;
 * return <UserList users={data} />;
 * ```
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to fetch data');
        setData(null);
      }
    } finally {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

