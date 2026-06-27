import { useCallback, useEffect, useRef } from 'react';
import { useFocusReload, useStaleLoadScope } from './useStaleLoadScope';

interface StaleFocusLoaderOptions<T> {
  scopeKey: string | null | undefined;
  enabled?: boolean;
  load: () => Promise<T>;
  onSuccess: (data: T) => void;
  onClear: () => void;
  onError?: (error: unknown, isFirstLoad: boolean) => void;
  setLoading: (loading: boolean) => void;
  focusReload?: boolean;
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
  focusReload = true,
}: StaleFocusLoaderOptions<T>) {
  const { shouldBlockUI, markLoaded, reset } = useStaleLoadScope(scopeKey);

  // Use refs for transient callback parameters to keep the callback reference stable.
  const loadRef = useRef(load);
  loadRef.current = load;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const setLoadingRef = useRef(setLoading);
  setLoadingRef.current = setLoading;

  const reload = useCallback(async (force = false) => {
    if (!enabled) {
      reset();
      onClearRef.current();
      setLoadingRef.current(false);
      return;
    }

    const block = shouldBlockUI() || force;

    if (block) {
      if (shouldBlockUI()) {
        onClearRef.current();
      }
      setLoadingRef.current(true);
    }

    try {
      const data = await loadRef.current();
      onSuccessRef.current(data);
      markLoaded();
    } catch (error) {
      onErrorRef.current?.(error, block);
      if (block) onClearRef.current();
    } finally {
      setLoadingRef.current(false);
    }
  }, [
    enabled,
    markLoaded,
    reset,
    shouldBlockUI,
  ]);

  useEffect(() => {
    if (enabled && scopeKey) {
      void reload(true);
    } else {
      reset();
      onClearRef.current();
      setLoadingRef.current(false);
    }
  }, [scopeKey, enabled, reload, reset]);

  if (focusReload) {
    useFocusReload(reload, enabled);
  }

  return reload;
}


