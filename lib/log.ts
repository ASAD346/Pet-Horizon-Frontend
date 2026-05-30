/**
 * Lightweight dev logging — uses console.warn so messages stand out in Metro.
 * Stripped in production builds via __DEV__.
 */

type LogDetail = Record<string, unknown> | string | number | boolean | null | undefined;

function formatDetail(detail?: LogDetail): string {
  if (detail === undefined || detail === null) return '';
  if (typeof detail === 'string') return ` — ${detail}`;
  try {
    return ` — ${JSON.stringify(detail)}`;
  } catch {
    return ' — [detail]';
  }
}

function write(scope: string, message: string, detail?: LogDetail) {
  if (!__DEV__) return;
  console.warn(`[PetHorizon] ${scope}: ${message}${formatDetail(detail)}`);
}

export const log = {
  /** Successful or informational */
  ok(scope: string, message: string, detail?: LogDetail) {
    write(scope, `✓ ${message}`, detail);
  },
  /** Failures, validation issues */
  fail(scope: string, message: string, detail?: LogDetail) {
    write(scope, `✗ ${message}`, detail);
  },
  /** In-progress / skipped */
  info(scope: string, message: string, detail?: LogDetail) {
    write(scope, message, detail);
  },
  /** Non-fatal issues — missing data, fallbacks, empty results */
  warn(scope: string, message: string, detail?: LogDetail) {
    write(scope, `⚠ ${message}`, detail);
  },
};
