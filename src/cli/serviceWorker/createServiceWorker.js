import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';

// Предопределённые стратегии кеширования
const CACHING_STRATEGIES = [
  { name: 'Cache first (offline support)', value: 'cache-first' },
  { name: 'Network first (если offline — fallback)', value: 'network-first' }
];

async function main() {
  // Запрашиваем параметры service worker
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategy',
      message: 'Выберите кеш стратегию:',
      choices: CACHING_STRATEGIES
    },
    {
      type: 'confirm',
      name: 'enablePush',
      message: 'Включить поддержку push-уведомлений?',
      default: false
    },
    {
      type: 'confirm',
      name: 'offlineUI',
      message: 'Добавить Offline страницу?',
      default: true
    }
  ]);

  // Генерируем код service worker в зависимости от выбранного
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
  } else {
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

  // Добавляем push-уведомления, если выбраны
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

  const targetDir = process.cwd();
  const swPath = path.join(targetDir, 'serviceWorker.js');
  fs.writeFileSync(swPath, swCode.trim() + '\n');

  if (answers.offlineUI && !fs.existsSync(path.join(targetDir, 'offline.html'))) {
  const templateDir = path.join(__dirname, '..', 'templates');
  const templateOffline = path.join(templateDir, 'offline.html');
  if (fs.existsSync(templateOffline)) {
    fs.copyFileSync(templateOffline, path.join(targetDir, 'offline.html'));
    console.log('✅ offline.html скопирован из шаблона!');
  } else {
    fs.writeFileSync(
      path.join(targetDir, 'offline.html'),
      `<h1>Offline</h1><p>You are offline. Try again later.</p>\n`
    );
    console.log('✅ offline.html создан по умолчанию!');
  }
}


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

main();
