import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHING_STRATEGIES = [
  { name: 'Cache first (offline support)', value: 'cache-first' },
  { name: 'Network first (если offline — fallback)', value: 'network-first' }
];

/**
 * Генерация serviceWorker.js и offline.html (если нужно)
 * @param {object} options - параметры генерации
 * @param {string} [options.strategy] - 'cache-first' или 'network-first'
 * @param {boolean} [options.enablePush] - генерировать push-обработчик
 * @param {boolean} [options.offlineUI] - создать offline.html
 * @param {string} [options.targetDir] - путь к проекту (по умолчанию process.cwd())
 * @param {boolean} [options.silent] - не печатать логи
 * @returns {Promise<void>}
 */
export async function createServiceWorkerFile(options = {}) {
  let answers = options;
  // Если явно не указаны все параметры — спросить пользователя
  if (
    answers.strategy === undefined ||
    answers.enablePush === undefined ||
    answers.offlineUI === undefined
  ) {
    answers = {
      ...answers,
      ...(await inquirer.prompt([
        {
          type: 'list',
          name: 'strategy',
          message: 'Выберите кеш стратегию:',
          choices: CACHING_STRATEGIES,
          when: () => options.strategy === undefined,
        },
        {
          type: 'confirm',
          name: 'enablePush',
          message: 'Включить поддержку push-уведомлений?',
          default: false,
          when: () => options.enablePush === undefined,
        },
        {
          type: 'confirm',
          name: 'offlineUI',
          message: 'Добавить Offline страницу?',
          default: true,
          when: () => options.offlineUI === undefined,
        }
      ]))
    };
  }

  // Генерируем sw код
  let swCode = '';

  if (answers.strategy === 'cache-first') {
    swCode += `
const CACHE = 'pwa-cache-v1';
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['/', '/offline.html']))
  );
  self.skipWaiting();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );
});
`;
  } else { // network-first
    swCode += `
const CACHE = 'pwa-cache-v1';
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['/', '/offline.html']))
  );
  self.skipWaiting();
});
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(resp => {
        if (resp && resp.status === 200) {
          const respClone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, respClone));
          return resp;
        }
        throw new Error('Network response was not ok.');
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match('/offline.html')))
  );
});
`;
  }

  if (answers.enablePush) {
    swCode += `
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || 'New Notification', {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
  });
});
`;
  }

  const targetDir = options.targetDir || process.cwd();
  const swPath = path.join(targetDir, 'serviceWorker.js');
  fs.writeFileSync(swPath, swCode.trim() + '\n');

  // Offline.html
  if (answers.offlineUI && !fs.existsSync(path.join(targetDir, 'offline.html'))) {
    const templateDir = path.join(__dirname, '..', '..', 'templates');
    const templateOffline = path.join(templateDir, 'offline.html');
    if (fs.existsSync(templateOffline)) {
      fs.copyFileSync(templateOffline, path.join(targetDir, 'offline.html'));
      if (!options.silent) console.log('✅ offline.html скопирован из шаблона!');
    } else {
      fs.writeFileSync(
        path.join(targetDir, 'offline.html'),
        `<h1>Offline</h1><p>You are offline. Try again later.</p>\n`
      );
      if (!options.silent) console.log('✅ offline.html создан по умолчанию!');
    }
  }

  if (!options.silent) {
    console.log('✅ serviceWorker.js создан!');
    if (answers.offlineUI) console.log('✅ offline.html создан!');
    if (answers.enablePush) console.log('ℹ️ Добавьте регистрацию push и обработчик подписки в клиентском коде.');
    console.log('\nНе забудьте зарегистрировать сервис воркер в вашем основном JS файле:');
    console.log(`
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./serviceWorker.js');
}
`);
  }
}
