import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/** Avoid blocking UI on every tab focus — only show loading when scope has no cached data yet. */
export function useStaleLoadScope(scopeKey: string | null | undefined) {
  const scopeRef = useRef('');
  const hasLoadedRef = useRef(false);

  const shouldBlockUI = useCallback(() => {
    const key = scopeKey ?? '';
    if (scopeRef.current !== key) {
      scopeRef.current = key;
      hasLoadedRef.current = false;
    }
    return !hasLoadedRef.current;
  }, [scopeKey]);

  const markLoaded = useCallback(() => {
    hasLoadedRef.current = true;
  }, []);

  const reset = useCallback(() => {
    hasLoadedRef.current = false;
    scopeRef.current = '';
  }, []);

  return { shouldBlockUI, markLoaded, reset };
}

export function useFocusReload(reload: () => void | Promise<void>, enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        void reload();
      }
    }, [reload, enabled]),
  );
}
