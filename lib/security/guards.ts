import { Platform } from 'react-native';
import { log } from '@/lib/log';

/**
 * Security checks to guard against tampering and unauthorized debugging in production.
 * This runs checks only when __DEV__ is false to avoid disrupting developers.
 */
export function runSecurityGuards() {
  if (__DEV__) {
    return;
  }

  try {
    // Check for common React Native debugger/dev tools globals
    const isObviousDebug =
      (global as any).__REMOTEDEV__ ||
      (global as any).__v8debug__ ||
      (global as any).ChromeDevTools ||
      (global as any).atob?.toString().includes('native code') === false;

    if (isObviousDebug) {
      throw new Error('Security Violation');
    }
  } catch (e) {
    log.fail('Security', 'Security checks failed', e instanceof Error ? e.message : String(e));
    throw e;
  }
}
