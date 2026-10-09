import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useFetch } from '@/shared/lib/useFetch';

describe('useFetch', () => {
  it('returns data, a failure message, and supports refetch', async () => {
    const fetchFn = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce('second');
    const { result } = renderHook(() => useFetch(fetchFn, []));

    await waitFor(() => expect(result.current.data).toBe('first'));

    await act(async () => result.current.refetch());
    expect(result.current.error).toBe('Offline');

    await act(async () => result.current.refetch());
    expect(result.current.data).toBe('second');
    expect(result.current.error).toBeNull();
  });
});
