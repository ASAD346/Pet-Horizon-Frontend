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
    // Check for common React Native remote debugger globals
    const isObviousDebug =
      Boolean((global as any).__REMOTEDEV__) ||
      Boolean((global as any).__v8debug__) ||
      Boolean((global as any).ChromeDevTools);

    if (isObviousDebug) {
      log.warn('Security', 'Remote debugger attached in production environment');
    }
  } catch (e) {
    log.warn('Security', 'Security check caught error', e instanceof Error ? e.message : String(e));
  }
}
