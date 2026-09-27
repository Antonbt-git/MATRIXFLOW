/** useFetch sobre TanStack Query (§8.1): caché, reintentos y estados. */
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useFetch<T>(fn: (signal?: AbortSignal) => Promise<T>, deps: unknown[] = []) {
  const qc = useQueryClient();
  const query = useQuery<T>({
    queryKey: ['data', String(fn), ...deps],
    queryFn: ({ signal }) => fn(signal),
  });
  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : '',
    reload: () => qc.invalidateQueries(),
  };
}
