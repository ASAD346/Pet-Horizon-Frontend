import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/lib/log';

export interface SyncQueueItem {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = '@sync_manager_queue';
const SCOPE = 'SyncManager';

class SyncManagerClass {
  private queue: SyncQueueItem[] = [];
  private isProcessing = false;
  private isOnline = true;

  constructor() {
    this.loadQueue();
  }

  setOnlineStatus(online: boolean) {
    this.isOnline = online;
    log.info(SCOPE, `Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
    if (online) {
      void this.processQueue();
    }
  }

  async enqueue(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: any, headers?: Record<string, string>) {
    const item: SyncQueueItem = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timestamp: Date.now(),
      retries: 0,
    };

    // Deduplicate identical pending requests
    const duplicate = this.queue.find(q => q.url === url && q.method === method && q.body === item.body);
    if (duplicate) {
      log.info(SCOPE, 'Duplicate request ignored', { url });
      return;
    }

    this.queue.push(item);
    await this.saveQueue();
    log.info(SCOPE, 'Request queued offline', { url, method });

    if (this.isOnline) {
      void this.processQueue();
    }
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        log.ok(SCOPE, `Loaded ${this.queue.length} pending items from storage`);
      }
    } catch {
      this.queue = [];
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e: any) {
      log.fail(SCOPE, 'Failed to persist queue to storage', e?.message || String(e));
    }
  }

  private async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) return;

    this.isProcessing = true;
    log.info(SCOPE, `Flushing sync queue with ${this.queue.length} items`);

    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue[0];
      
      // Calculate exponential backoff delay with jitter
      if (item.retries > 0) {
        const backoff = Math.min(1000 * Math.pow(2, item.retries) + Math.random() * 1000, 30000);
        log.info(SCOPE, `Retrying item with backoff of ${Math.round(backoff)}ms`, { url: item.url });
        await new Promise(resolve => setTimeout(resolve, backoff));
      }

      const success = await this.executeRequest(item);

      if (success) {
        this.queue.shift();
        await this.saveQueue();
        log.ok(SCOPE, 'Sync item processed successfully', { url: item.url });
      } else {
        item.retries += 1;
        if (item.retries > 5) {
          // Discard after 5 failures to prevent lockups
          log.fail(SCOPE, 'Discarding failed item after max retries', { url: item.url });
          this.queue.shift();
          await this.saveQueue();
        } else {
          // Pause execution and retry later
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  private async executeRequest(item: SyncQueueItem): Promise<boolean> {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(item.headers || {}),
        },
        body: item.body,
      });

      // Succeed on typical success ranges, retry on server issues or transient failures
      return res.status >= 200 && res.status < 300;
    } catch (err: any) {
      log.fail(SCOPE, 'Sync request network error', err?.message || String(err));
      return false;
    }
  }
}

export const SyncManager = new SyncManagerClass();
