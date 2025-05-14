// src/cli/pwa/createServiceWorker.d.ts

export type CachingStrategy = 'cache-first' | 'network-first';

export interface CreateServiceWorkerOptions {
  strategy?: CachingStrategy;
  enablePush?: boolean;
  offlineUI?: boolean;
  targetDir?: string;
  silent?: boolean;
}

/**
 * Генерирует serviceWorker.js и offline.html по параметрам.
 * Если какие-то опции не указаны — будет интерактивный режим.
 */
export function createServiceWorkerFile(
  options?: CreateServiceWorkerOptions
): Promise<void>;
