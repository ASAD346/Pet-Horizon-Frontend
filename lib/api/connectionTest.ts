import { API_BASE_URL } from '@/constants/api';
import { log } from '@/lib/log';

/**
 * Pings the backend health check endpoint to verify server connectivity.
 * Logs successful handshake, network unreachable, or timeout.
 */
export async function runServerConnectionTest(): Promise<boolean> {
  const url = `${API_BASE_URL}/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  log.info('ConnTest', 'Verifying server connectivity...', { url });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      log.ok('ConnTest', 'Backend handshake successful!', { status: response.status });
      return true;
    } else {
      log.fail('ConnTest', 'Backend returned non-OK status', { status: response.status });
      return false;
    }
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      log.fail('ConnTest', 'Handshake timed out after 5s', { url });
    } else {
      log.fail('ConnTest', 'Handshake failed (network unreachable)', {
        message: error.message || String(error),
        url,
      });
    }
    return false;
  }
}
