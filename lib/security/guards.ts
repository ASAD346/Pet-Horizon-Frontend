import { Platform } from 'react-native';

/**
 * Security checks to guard against tampering and unauthorized debugging in production.
 * This runs checks only when __DEV__ is false to avoid disrupting developers.
 */
export function runSecurityGuards() {
  if (__DEV__) {
    return;
  }

  try {
    // 1. Detect Debugger / Breakpoint attachment using execution latency
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      Math.sqrt(i);
    }
    const endTime = Date.now();
    if (endTime - startTime > 100) {
      // Latency spike indicates debugger stepping or console interception
      throw new Error('Security Violation');
    }

    // 2. Check for common React Native debugger/dev tools globals
    const isObviousDebug =
      (global as any).__REMOTEDEV__ ||
      (global as any).__v8debug__ ||
      (global as any).ChromeDevTools ||
      (global as any).atob?.toString().includes('native code') === false;

    if (isObviousDebug) {
      throw new Error('Security Violation');
    }
  } catch (e) {
    // Safely trigger JS thread halt on security exception
    while (true) {
      // Infinite loop to freeze JS thread if tampered/debugged in production
    }
  }
}
