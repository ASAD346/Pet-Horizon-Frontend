import { useCallback, useRef } from 'react';
import { useRouter as useExpoRouter, type Href } from 'expo-router';

// Global singleton timestamp to lock navigation across all components & hooks
let globalLastNavTime = 0;
const GLOBAL_NAV_COOLDOWN_MS = 1000;

export function isNavigationLocked(cooldownMs = GLOBAL_NAV_COOLDOWN_MS): boolean {
  const now = Date.now();
  if (now - globalLastNavTime < cooldownMs) {
    return true;
  }
  globalLastNavTime = now;
  return false;
}

/**
 * Creates a debounced callback that triggers immediately on the first invocation (leading edge)
 * and ignores subsequent calls within the specified cooldown window (default: 800ms).
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T | undefined | null,
  cooldownMs = 800
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    (...args: Parameters<T>) => {
      if (!callbackRef.current) return;
      const now = Date.now();
      if (now - lastCallRef.current < cooldownMs) {
        return;
      }
      lastCallRef.current = now;
      callbackRef.current(...args);
    },
    [cooldownMs]
  );
}

/**
 * Non-hook helper that wraps a function with leading-edge throttling.
 */
export function throttleLeading<T extends (...args: any[]) => any>(
  callback: T,
  cooldownMs = 800
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall < cooldownMs) {
      return;
    }
    lastCall = now;
    callback(...args);
  };
}

/**
 * A debounced router hook that prevents multiple screen pushes or rapid back navigation
 * using a shared global lock across the entire application.
 */
export function useDebouncedRouter() {
  const router = useExpoRouter();

  const safePush = useCallback(
    (href: Href, options?: any) => {
      const targetStr = typeof href === 'string' ? href : (href as any)?.pathname || '';
      if (isNavigationLocked(1000)) {
        return;
      }
      if (targetStr.includes('notifications') && (router as any).navigate) {
        (router as any).navigate(href as any, options);
        return;
      }
      try {
        (router as any).navigate?.(href as any, options) ?? router.push(href as any, options);
      } catch {
        router.push(href as any, options);
      }
    },
    [router]
  );

  const safeNavigate = useCallback(
    (href: Href, options?: any) => {
      if (isNavigationLocked(1000)) {
        return;
      }
      try {
        (router as any).navigate?.(href as any, options) ?? router.push(href as any, options);
      } catch {
        router.push(href as any, options);
      }
    },
    [router]
  );

  const safeReplace = useCallback(
    (href: Href, options?: any) => {
      if (isNavigationLocked(1000)) {
        return;
      }
      router.replace(href as any, options);
    },
    [router]
  );

  const safeBack = useCallback(() => {
    const now = Date.now();
    if (now - globalLastNavTime < 500) {
      return;
    }
    globalLastNavTime = now;
    router.back();
  }, [router]);

  return {
    ...router,
    push: safePush,
    navigate: safeNavigate,
    replace: safeReplace,
    back: safeBack,
  };
}

