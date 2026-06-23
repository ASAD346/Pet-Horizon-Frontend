import { useCallback } from 'react';
import { useFocusReload, useStaleLoadScope } from './useStaleLoadScope';

interface StaleFocusLoaderOptions<T> {
  scopeKey: string | null | undefined;
  enabled?: boolean;
  load: () => Promise<T>;
  onSuccess: (data: T) => void;
  onClear: () => void;
  onError?: (error: unknown, isFirstLoad: boolean) => void;
  setLoading: (loading: boolean) => void;
}

/** Standard stale-while-revalidate loader for tab screens. */
export function useStaleFocusLoader<T>({
  scopeKey,
  enabled = true,
  load,
  onSuccess,
  onClear,
  onError,
  setLoading,
}: StaleFocusLoaderOptions<T>) {
  const { shouldBlockUI, markLoaded, reset } = useStaleLoadScope(scopeKey);

  const reload = useCallback(async (force = false) => {
    if (!enabled) {
      reset();
      onClear();
      setLoading(false);
      return;
    }

    const block = shouldBlockUI();
    
    // Skip loading if already loaded and not forced (e.g. background focus refresh)
    if (!block && !force) {
      return;
    }

    if (block) setLoading(true);

    try {
      const data = await load();
      onSuccess(data);
      markLoaded();
    } catch (error) {
      onError?.(error, block);
      if (block) onClear();
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    load,
    markLoaded,
    onClear,
    onError,
    onSuccess,
    reset,
    setLoading,
    shouldBlockUI,
  ]);

  useFocusReload(reload, enabled);

  return reload;
}
