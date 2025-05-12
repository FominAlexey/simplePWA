# 🚀 SimplePWA Framework

**SimplePWA** — это современный фреймворк для создания адаптивных, реактивных веб-приложений с поддержкой оффлайн-режима и PWA (Progressive Web Applications).
Фреймворк построен на [Web Components](https://developer.mozilla.org/ru/docs/Web/Web_Components) и обеспечивает простую интеграцию [IndexedDB](https://developer.mozilla.org/ru/docs/Web/API/IndexedDB_API) для `offline-first` приложений.

---

## ✨ Основные возможности

| Функция | Описание |
|--------|----------|
| 📱 Адаптивная маршрутизация | Автоматическое определение типа устройства и загрузка соответствующих компонентов |
| 💾 Поддержка оффлайн-режима | Синхронизация данных и работа без подключения к интернету |
| 🔄 Реактивный стор | Глобальное состояние с подписками на изменения |
| 📦 Web Components | Инкапсуляция стилей и логики в пользовательские элементы |
| 🚀 PWA из коробки | Service Worker, манифест и инструменты для создания PWA |
| 🛠️ CLI-инструменты | Быстрое создание новых PWA проектов |

---

## 📦 Установка

```bash
npm install simple-pwa
# или
yarn add simple-pwa
```

---

## 🧪 Быстрый старт

```js
import { App } from 'simple-pwa';

// Создайте экземпляр приложения
const app = App.create({
  rootElement: '#app',
  pwa: {
    enabled: true,
    serviceWorkerPath: '/service-worker.js'
  }
});

// Запустите приложение
app.start();
```

---

## 🧭 Маршрутизация

Фреймворк автоматически определяет тип устройства (мобильное / десктопное) и загружает соответствующие компоненты:

```js
const routes = [
  {
    path: '/',
    desktopComponent: DesktopHome,
    mobileComponent: MobileHome
  },
  {
    path: '/about',
    desktopComponent: DesktopAbout,
    mobileComponent: MobileAbout
  }
];

const app = new App({ routes });
```

---

## 🧩 Компоненты

Создавайте адаптивные компоненты, наследуясь от базового класса:

```js
import { Component } from 'simple-pwa';

class CustomComponent extends Component {
  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 20px; }
          h2 { color: #2c3e50; }
        </style>
        <h2>Мой компонент</h2>
        <p>Счётчик: ${this.state.count || 0}</p>
        <button id="increment">+</button>
      `;

      this.shadowRoot.getElementById('increment')?.addEventListener('click', () => {
        this.setState({ count: (this.state.count || 0) + 1 });
      });
    }
  }
}

customElements.define('custom-component', CustomComponent);
```

---

## 🗄️ Работа с хранилищем (Store)

Глобальное состояние с реактивными обновлениями:

```js
import { Store } from 'simple-pwa';

// Создание глобального хранилища
const appStore = new Store({
  user: null,
  theme: 'light',
  counter: 0
});

// Обновление состояния
appStore.setState({ theme: 'dark' });

// Подписка на изменения
const unsubscribe = appStore.subscribe(state => {
  console.log('Состояние обновлено:', state);
});

// Отписаться от обновлений
unsubscribe();
```

---

## 🔌 Offline-First с IndexedDB

SimplePWA включает мощный менеджер синхронизации для работы с данными в оффлайн-режиме:

```js
import { App } from 'simple-pwa';

const app = App.create({
  syncDataManagerOptions: {
    dbName: 'my-app-db'
  }
});

// Получение данных из IndexedDB
const items = await app.getDBList();

// Добавление элемента
await app.addDBItem({
  id: '123',
  type: 'task',
  data: JSON.stringify({ title: 'Задача', completed: false }),
  lastModified: new Date().toISOString(),
  lastSynced: new Date().toISOString()
});

// Синхронизация с сервером при восстановлении соединения
app.setupAutoSync({
  tasks: () => fetch('/api/tasks').then(res => res.json()),
  users: () => fetch('/api/users').then(res => res.json())
}, {
  onNetworkRestore: true,
  interval: 5 * 60 * 1000  // Каждые 5 минут
});
```

---

## 🛠️ Создание PWA через CLI

```bash
npx simple-pwa-cli create-pwa my-project
```

CLI задаст вопросы о названии, описании, иконках и других параметрах. После завершения вы получите готовый PWA проект, который можно сразу запустить.

### 🧑‍🔧 Генерация Service Worker

```bash
npx simple-pwa-cli create-service-worker
```

CLI поможет настроить стратегии кеширования и обработку оффлайн-состояния.

---

## 📘 API Reference

### `App`

Класс `App` инкапсулирует маршрутизацию, глобальное состояние, синхронизацию и работу с PWA.

#### 🏁 Создание приложения

```js
import { App } from 'simple-pwa';

const app = App.create({
  rootElement: '#app', // или HTMLElement
  routes: [ /* ... */ ],
  pwa: { enabled: true },
  syncDataManagerOptions: { dbName: 'my-db' }
});
```

#### 🔧 Основные методы

| Метод | Описание |
|------|----------|
| `start()` | Запустить приложение |
| `navigate(path)` | Перейти по маршруту |
| `getDeviceType()` | Получить текущий тип устройства (`mobile` / `desktop`) |
| `getState()` | Получить объект состояния store |
| `setState(patch)` | Обновить состояние store |
| `addEventListener()` | Добавить глобальный обработчик событий |

---

### 🧲 Работа с IndexedDB (SyncDataManager)

| Метод | Описание |
|------|----------|
| `getDBList(...)` | Получить список объектов из IndexedDB |
| `getDBListByIndex(...)` | Получить список по индексу |
| `getDBItem(id)` | Получить объект по ID |
| `getDBItemByIndex(...)` | Получить объект по определённому индексу |
| `addDBItem(obj)` | Добавить объект |
| `updateDBItem(obj)` | Обновить объект |
| `deleteDBItem(id)` | Удалить объект по ID |
| `syncDBList(fetchMethod)` | Синхронизировать список с сервером |
| `syncDBItem(fetchMethod)` | Синхронизировать один объект с сервером |
| `isSyncNeeded(lastSynced, [timeDelay])` | Проверить, требуется ли повторная синхронизация |
| `deleteDB([nameDB])` | Удалить базу данных |
| `isOfflineMode()` | Проверить, в оффлайн-режиме ли работает приложение |
| `isSyncing()` | Проверить, идёт ли сейчас синхронизация |
| `syncAllData(methods)` | Запустить синхронизацию всех коллекций (например, задач и пользователей одновременно) |
| `setupAutoSync(methods, options)` | Настроить автосинхронизацию при восстановлении сети, по таймеру, при старте |
| `checkAndSync(id, method, [timeDelay])` | Проверить и синхронизировать данные по необходимости |

#### Пример использования методов синхронизации

```js
// Получить все задачи
const tasks = await app.getDBList();

// Добавить новую задачу
await app.addDBItem({ id: '1', type: 'task', ... });

// Синхронизировать задачи с сервером
await app.syncDBList(() => fetch('/api/tasks').then(r => r.json()));

// Автоматическая синхронизация при восстановлении сети
app.setupAutoSync({
  tasks: () => fetch('/api/tasks').then(r => r.json())
});
```

---

### 🧠 Store

Реактивный глобальный стор для хранения состояния приложения.

```js
import { Store } from 'simple-pwa';

// Создать стор
const store = new Store({ theme: 'light', counter: 0 });

// Подписка на изменения
const unsubscribe = store.subscribe(state => {
  console.log('Новое состояние:', state);
});

// Обновить состояние
store.setState({ theme: 'dark' });

// Отписка
unsubscribe();
```

---

### 🧱 Компоненты (Web Components)

Базовый класс `Component` и производные `DesktopComponent`, `MobileComponent`.

```js
import { Component } from 'simple-pwa';

class MyCounter extends Component {
  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <span>Count: ${this.state.count || 0}</span>
        <button id="inc">+</button>
      `;
      this.shadowRoot.getElementById('inc')?.addEventListener('click', () => {
        this.setState({ count: (this.state.count || 0) + 1 });
      });
    }
  }
}

customElements.define('my-counter', MyCounter);
```

---

### 🧭 Адаптивная маршрутизация

Используйте мобильные и десктопные компоненты для разных устройств:

```js
const routes = [
  {
    path: '/',
    desktopComponent: DesktopHome,
    mobileComponent: MobileHome
  }
];
const app = new App({ routes });
```

---

### 🛠️ CLI-инструменты

#### Создание PWA-проекта

```bash
npx simple-pwa-cli create-pwa my-project
```

#### Генерация сервис-воркера

```bash
npx simple-pwa-cli create-service-worker
```

Вам будет предложено выбрать стратегии кеширования и настройки offline UI.

---

## 📜 Лицензия

MIT

---

## 📬 Обратная связь и поддержка

Нашли баг или хотите предложить улучшение?
Открывайте [issue](https://github.com/example/simple-pwa/issues) или [PR](https://github.com/example/simple-pwa/pulls)!

---

🚀 **SimplePWA — ваш быстрый путь к production-ready PWA!**
