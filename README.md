# 🚀 SimplePWA Framework

# Description in English

**SimplePWA** — It is a modern framework for creating adaptive, reactive web applications with offline mode support и PWA (Progressive Web Applications).
The framework is built on [Web Components](https://developer.mozilla.org/ru/docs/Web/Web_Components) and provides easy integration [IndexedDB](https://developer.mozilla.org/ru/docs/Web/API/IndexedDB_API) for `offline-first` applications.

---

## ✨ Main features

| Feature | Description |
|--------|----------|
| 📱 Responsive Routing | Automatic detection of device type and loading of appropriate components |
| 💾 Offline Support | Data synchronization and operation without internet connection |
| 🔄 Reactive Store | Global state with subscriptions for changes |
| 📦 Web Components | Encapsulation of styles and logic in custom elements |
| 🚀 PWA out of the box | Service Worker, manifest, and tools for creating PWA applications |
| 🛠️ CLI Tools | Rapid creation of new PWA projects |

---

## 📦 Installation

```bash
npm install simple-pwa
# or
yarn add simple-pwa
```

---

## 🧪 Quick Start

```js
import { App } from '@dakir/simple-pwa';

// Create an instance of the application
const app = App.create({
  rootElement: '#app',
  pwa: {
    enabled: true,
    serviceWorkerPath: '/service-worker.js'
  }
});

// Launch the application
app.start();
```

---

## 🧭 Routing

The framework automatically detects the device type (mobile / desktop) and loads the corresponding components:

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

## 🧩 Components

Create responsive components by inheriting from the base class:

```js
import { Component } from '@dakir/simple-pwa';

class CustomComponent extends Component {
  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 20px; }
          h2 { color: #2c3e50; }
        </style>
        <h2>My component</h2>
        <p>Counter: ${this.state.count || 0}</p>
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

## 🗄️ Working with Store

Global state with reactive updates:

```js
import { Store } from '@dakir/simple-pwa';

// Creating a global store
const appStore = new Store({
  user: null,
  theme: 'light',
  counter: 0
});

// Updating state
appStore.setState({ theme: 'dark' });

// Subscribing to changes
const unsubscribe = appStore.subscribe(state => {
  console.log('State updated:', state);
});

// Unsubscribe from updates
unsubscribe();
```

---

## 🔌 Offline-First with IndexedDB

SimplePWA includes a powerful sync manager for working with data in offline mode:

```js
import { App } from '@dakir/simple-pwa';

const app = App.create({
  syncDataManagerOptions: {
    dbName: 'my-app-db'
  }
});

// Retrieving data from IndexedDB
const items = await app.getDBList();

// Adding an item
await app.addDBItem({
  id: '123',
  type: 'task',
  data: JSON.stringify({ title: 'Task', completed: false }),
  lastModified: new Date().toISOString(),
  lastSynced: new Date().toISOString()
});

// Synchronizing with the server when the connection is restored
app.setupAutoSync({
  tasks: () => fetch('/api/tasks').then(res => res.json()),
  users: () => fetch('/api/users').then(res => res.json())
}, {
  onNetworkRestore: true,
  interval: 5 * 60 * 1000  // Every 5 minutes
});
```

---

## 🛠️ Creating PWA via CLI

```bash
npx create-pwa my-project
```

CLI will ask questions about the name, description, icons, and other parameters. Upon completion, you'll get a ready-to-use PWA project that you can launch immediately.

### 🧑‍🔧 Generating a Service Worker

```bash
npx create-sw
```

CLI will help set up caching strategies and handle offline states.

---

## 📘 API Reference

### `App`

The `App` class encapsulates routing, global state, synchronization, and PWA operations.

#### 🏁 Creating an Application

```js
import { App } from '@dakir/simple-pwa';

const app = App.create({
  rootElement: '#app', // or HTMLElement
  routes: [ /* ... */ ],
  pwa: { enabled: true },
  syncDataManagerOptions: { dbName: 'my-db' }
});
```

#### 🔧 Main Methods

| Method | Description |
|------|----------|
| `start()` | Start the application |
| `navigate(path)` | Navigate to a route |
| `getDeviceType()` | Get current device type (`mobile` / `desktop`) |
| `getState()` | Get store state object |
| `setState(patch)` | Update store state |
| `addEventListener()` | Add a global event handler |

---

### 🧲 Working with IndexedDB (SyncDataManager)

| Method | Description |
|------|----------|
| `getDBList(...)` | Retrieve a list of objects from IndexedDB |
| `getDBListByIndex(...)` | Retrieve a list by index |
| `getDBItem(id)` | Retrieve an object by ID |
| `getDBItemByIndex(...)` | Retrieve an object by a specific index |
| `addDBItem(obj)` | Add an object |
| `updateDBItem(obj)` | Update an object |
| `deleteDBItem(id)` | Delete an object by ID |
| `syncDBList(fetchMethod)` | Synchronize a list with the server |
| `syncDBItem(fetchMethod)` | Synchronize a single object with the server |
| `isSyncNeeded(lastSynced, [timeDelay])` | Check if re-synchronization is needed |
| `deleteDB([nameDB])` | Delete a database |
| `isOfflineMode()` | Check if the app is in offline mode |
| `isSyncing()` | Check if synchronization is currently in progress |
| `syncAllData(methods)` | Run synchronization of all collections (e.g., tasks and users simultaneously) |
| `setupAutoSync(methods, options)` | Configure auto-sync on network restoration, by timer, or at startup |
| `checkAndSync(id, method, [timeDelay])` | Check and synchronize data as needed |

#### Example usage of synchronization methods

```js
// Retrieve all tasks
const tasks = await app.getDBList();

// Add a new task
await app.addDBItem({ id: '1', type: 'task', ... });

// Synchronize tasks with the server
await app.syncDBList(() => fetch('/api/tasks').then(r => r.json()));

// Auto-sync when the network is restored
app.setupAutoSync({
  tasks: () => fetch('/api/tasks').then(r => r.json())
});
```

---

### 🧠 Store

Reactive global store for storing application state.

```js
import { Store } from '@dakir/simple-pwa';

// Create a store
const store = new Store({ theme: 'light', counter: 0 });

// Subscribe to changes
const unsubscribe = store.subscribe(state => {
  console.log('New state:', state);
});

// Update state
store.setState({ theme: 'dark' });

// Unsubscribe
unsubscribe();
```

---

### 🧱 Components (Web Components)

Base class `Component` and derived classes `DesktopComponent`, `MobileComponent`.

```js
import { Component } from '@dakir/simple-pwa';

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

### 🧭 Adaptive Routing

Use mobile and desktop components for different devices:

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

## 📜 License

MIT

---

## 📬 Feedback and Support

Found a bug or want to suggest an improvement?
Open an [issue](https://github.com/FominAlexey/simplePWA/issues) or [PR](https://github.com/FominAlexey/simplePWA/pulls)!


---

🚀 **SimplePWA — your fast path to production-ready PWA!**

# Описание на русском

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
import { App } from '@dakir/simple-pwa';

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
import { Component } from '@dakir/simple-pwa';

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
import { Store } from '@dakir/simple-pwa';

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
import { App } from '@dakir/simple-pwa';

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
npx create-pwa my-project
```

CLI задаст вопросы о названии, описании, иконках и других параметрах. После завершения вы получите готовый PWA проект, который можно сразу запустить.

### 🧑‍🔧 Генерация Service Worker

```bash
npx create-sw
```

CLI поможет настроить стратегии кеширования и обработку оффлайн-состояния.

---

## 📘 API Reference

### `App`

Класс `App` инкапсулирует маршрутизацию, глобальное состояние, синхронизацию и работу с PWA.

#### 🏁 Создание приложения

```js
import { App } from '@dakir/simple-pwa';

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
import { Store } from '@dakir/simple-pwa';

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
import { Component } from '@dakir/simple-pwa';

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

## 📜 Лицензия

MIT

---

## 📬 Обратная связь и поддержка

Нашли баг или хотите предложить улучшение?
Открывайте [issue](https://github.com/FominAlexey/simplePWA/issues) или [PR](https://github.com/FominAlexey/simplePWA/pulls)!

---

🚀 **SimplePWA — ваш быстрый путь к production-ready PWA!**
