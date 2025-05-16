import { Router, Route } from './router';
import {
  DesktopHome, MobileHome,
  DesktopAbout, MobileAbout,
  Component
} from './component';
import { Store } from './store';
import { SyncDataManager } from '../indexedDB';

// Регистрация кастомных элементов
customElements.define('desktop-home', DesktopHome);
customElements.define('mobile-home', MobileHome);
customElements.define('desktop-about', DesktopAbout);
customElements.define('mobile-about', MobileAbout);
const appStore = new Store({ user: null, theme: 'light', isSyncing: false });

interface AppConfig {
  rootElement?: string | HTMLElement;
  routes?: Route[];
  pwa?: {
    enabled?: boolean;
    serviceWorkerPath?: string;
    registerOnLoad?: boolean;
  };
  syncDataManagerOptions?: {
    dbName?: string;
    indexes?: any[]; // замените на ваш конкретный тип
    optionalParametersDB?: IDBObjectStoreParameters;
    parametersSyncRequest?: any;
  };
}

export class App {
  private router: Router;
  private config: AppConfig;
  private rootElement: HTMLElement;

  public store = appStore;
  public syncDataManager: SyncDataManager<any>;

  constructor(config: AppConfig = {}) {
    this.config = {
      rootElement: '#app',
      pwa: {
        enabled: false,
        serviceWorkerPath: '/serviceWorker.js',
        registerOnLoad: true
      },
      ...config
    };

    // Определяем корневой элемент
    if (typeof this.config.rootElement === 'string') {
      const el = document.querySelector(this.config.rootElement);
      if (!el) {
        throw new Error(`Элемент ${this.config.rootElement} не найден`);
      }
      this.rootElement = el as HTMLElement;
    } else if (this.config.rootElement instanceof HTMLElement) {
      this.rootElement = this.config.rootElement;
    } else {
      // Создаем корневой элемент, если не указан
      this.rootElement = document.createElement('div');
      this.rootElement.id = 'app';
      document.body.appendChild(this.rootElement);
    }

    // Определяем маршруты или используем дефолтные
    const routes: Route[] = this.config.routes || [
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

    // Инициализируем роутер с передачей store
    this.router = new Router(routes, this.rootElement, this.store);

    // Инициализируем PWA, если включено
    if (this.config.pwa?.enabled) {
      this.initPWA();
    }

    // Можно позволить пробрасывать опции для SyncDataManager через конфиг
    const syncOptions = config.syncDataManagerOptions || {};
    this.syncDataManager = new SyncDataManager(
      syncOptions.dbName,
      syncOptions.indexes,
      syncOptions.optionalParametersDB,
      syncOptions.parametersSyncRequest
    );
  }

  /**
   * Инициализирует Progressive Web App (PWA)
   */
  private initPWA() {
    if ('serviceWorker' in navigator && this.config.pwa?.enabled) {
      if (this.config.pwa.registerOnLoad) {
        window.addEventListener('load', () => {
          this.registerServiceWorker();
        });
      } else {
        this.registerServiceWorker();
      }
    }
  }

  /**
   * Регистрирует Service Worker для PWA
   */
  private registerServiceWorker() {
    const swPath = this.config.pwa?.serviceWorkerPath || '/serviceWorker.js';

    navigator.serviceWorker.register(swPath)
      .then(registration => {
        console.log('Service Worker зарегистрирован с областью:', registration.scope);

        // Обработка обновлений Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.notifyUpdateReady();
              }
            });
          }
        });
      })
      .catch(error => {
        console.error('Ошибка регистрации Service Worker:', error);
      });
  }

  /**
   * Уведомляет пользователя о доступном обновлении
   */
  private notifyUpdateReady() {
    if (confirm('Доступно обновление приложения. Обновить сейчас?')) {
      window.location.reload();
    }
  }

  /**
   * Программная навигация
   */
  public navigate(path: string) {
    this.router.navigate(path);
  }

  /**
   * Возвращает текущий тип устройства
   */
  public getDeviceType() {
    return this.router.getDeviceType();
  }

  /**
   * Создает новый компонент и возвращает его
   */
  public createComponent<T extends Component>(ComponentClass: new () => T): T {
    const component = new ComponentClass();
    return component;
  }

  /**
   * Добавить глобальный слушатель событий
   */
  public addEventListener(event: string, callback: EventListenerOrEventListenerObject) {
    window.addEventListener(event, callback);
    return this; // для цепочки вызовов
  }

  /**
   * Запуск приложения (возвращает сам объект для цепочки вызовов)
   */
  public start() {
    console.log('Приложение запущено!');
    return this;
  }

  /**
   * Статический метод для быстрого создания приложения
   */
  static create(config: AppConfig = {}) {
    return new App(config).start();
  }

  /**
   * Получить текущее состояние store
   */
  public getState() {
    return this.store.getState();
  }

  /**
   * Обновить состояние приложения
   */
  public setState(patch: Partial<any>) {
    this.store.setState(patch);
    return this;
  }

  /**
   * Получение списка элементов из IndexedDB
   * @param id - Id записи в базе данных (опционально)
   * @param filterBy - По какому параметру фильтровать ответ
   * @param valueFilter - По какому значению фильтровать ответ
   * @returns Массив объектов или null
   */
  public async getDBList(...args: Parameters<SyncDataManager<any>['getList']>) {
  return await this.syncDataManager.getList(...args);
  }

  /**
   * Получение списка элементов по индексу
   * @param index - Индекс в базе данных
   * @param keyValue - Значение, по которому ищутся объекты
   * @returns Массив объектов или null
   */
  public async getDBListByIndex(...args: Parameters<SyncDataManager<any>['getListByIndex']>) {
  return await this.syncDataManager.getListByIndex(...args);
  }

  /**
   * Получение конкретного элемента по id
   * @param id - Id в базе данных
   * @returns Объект или null
   */
  public async getDBItem(id: string) {
  return await this.syncDataManager.get(id);
  }

  /**
   * Получение элемента по индексу
   * @param keyValue - Значение для индекса в базе данных
   * @param index - Индекс в базе данных
   * @param isFind - Надо ли искать по значению
   * @param valueFind - Значение поиска объекта
   * @returns Объект или null
   */
  public async getDBItemByIndex(...args: Parameters<SyncDataManager<any>['getByIndex']>) {
  return await this.syncDataManager.getByIndex(...args);
  }

  /**
   * Добавление элемента в IndexedDB
   * @param syncObject - Объект для сохранения в базе данных
   * @returns true при успехе, null при ошибке
   */
  public async addDBItem(...args: Parameters<SyncDataManager<any>['add']>) {
  return await this.syncDataManager.add(...args);
  }

  /**
   * Обновление элемента в IndexedDB
   * @param syncObject - Объект для обновления в базе данных
   * @returns true при успехе, null при ошибке
   */
  public async updateDBItem(...args: Parameters<SyncDataManager<any>['update']>) {
  return await this.syncDataManager.update(...args);
  }

  /**
   * Удаление элемента из IndexedDB
   * @param id - Id элемента в базе данных
   * @returns true при успехе, null при ошибке
   */
  public async deleteDBItem(...args: Parameters<SyncDataManager<any>['delete']>) {
  return await this.syncDataManager.delete(...args);
  }

  /**
   * Синхронизация списка элементов
   * @param method - Метод получения данных с сервера
   * @param isAddTypeInId - Нужно ли добавлять type к id
   * @returns Promise<void>
   */
  public async syncDBList(...args: Parameters<SyncDataManager<any>['syncList']>) {
  return await this.syncDataManager.syncList(...args);
  }

  /**
   * Синхронизация одного элемента
   * @param method - Метод получения данных с сервера
   * @param isAddTypeInId - Нужно ли добавлять type к id
   * @returns Promise<void>
   */
  public async syncDBItem(...args: Parameters<SyncDataManager<any>['syncItem']>) {
  return await this.syncDataManager.syncItem(...args);
  }

  /**
   * Проверка необходимости синхронизации
   * @param lastSynced - Время последней синхронизации
   * @param timeDelay - Задержка времени для сравнения
   * @returns true если синхронизация требуется
   */
  public isSyncNeeded(...args: Parameters<SyncDataManager<any>['isSyncNeeded']>) {
  return this.syncDataManager.isSyncNeeded(...args);
  }

  /**
   * Удаление IndexedDB базы данных
   * @param nameDB - Название базы данных (опционально)
   * @returns Promise<boolean>
   */
  public async deleteDB(...args: Parameters<SyncDataManager<any>['deleteDatabase']>) {
  return await this.syncDataManager.deleteDatabase(...args);
  }

  /**
   * Получение статуса: в оффлайн режиме?
   * @returns true если приложение оффлайн
   */
  public isOfflineMode() {
  return this.syncDataManager.isOffline;
  }

  /**
   * Получение статуса: происходит ли сейчас синхронизация
   * @returns true если идет синхронизация
   */
  public isSyncing() {
  return this.syncDataManager.isSyncing;
  }

  /**
   * Запустить синхронизацию всего приложения
   * @param syncMethods - Объект с методами для синхронизации каждого типа данных
   * @returns Promise с результатами синхронизации
   */
  public async syncAllData(syncMethods: Record<string, () => Promise<any>>) {
    if (this.isOfflineMode()) {
      console.warn('Синхронизация невозможна в режиме оффлайн');
      return { success: false, error: 'offline-mode' };
    }

    if (this.isSyncing()) {
      console.warn('Синхронизация уже выполняется');
      return { success: false, error: 'already-syncing' };
    }

    try {
      // Уведомляем о начале синхронизации (можно интегрировать со store)
      if (this.store) {
        this.store.setState({ isSyncing: true });
      }

      // Последовательно выполняем все методы синхронизации
      const results: Record<string, any> = {};
      const errors: Record<string, any> = {};

      for (const [key, syncMethod] of Object.entries(syncMethods)) {
        try {
          await this.syncDataManager.syncList(syncMethod);
          results[key] = true;
        } catch (error) {
          console.error(`Ошибка синхронизации ${key}:`, error);
          errors[key] = error;
        }
      }

      return {
        success: Object.keys(errors).length === 0,
        results,
        errors: Object.keys(errors).length ? errors : null
      };
    } catch (error) {
      console.error('Общая ошибка синхронизации:', error);
      return { success: false, error };
    } finally {
      // Уведомляем об окончании синхронизации
      if (this.store) {
        this.store.setState({ isSyncing: false });
      }
    }
  }

  /**
   * Настроить автоматическую синхронизацию при восстановлении сети
   * @param syncMethods - Объект с методами для синхронизации
   * @param options - Опции автосинхронизации
   */
  public setupAutoSync(
    syncMethods: Record<string, () => Promise<any>>,
    options: {
      onNetworkRestore?: boolean; // Синхронизировать при восстановлении сети
      interval?: number;          // Интервал периодической синхронизации (мс)
      onStartup?: boolean;        // Синхронизировать при запуске приложения
    } = {}
  ) {
    const defaultOptions = {
      onNetworkRestore: true,
      interval: 0, // 0 = отключено
      onStartup: false
    };

    const config = { ...defaultOptions, ...options };

    // Синхронизация при восстановлении сети
    if (config.onNetworkRestore) {
      window.addEventListener('online', () => {
        console.log('Сеть восстановлена, запускаем синхронизацию...');
        this.syncAllData(syncMethods);
      });
    }

    // Периодическая синхронизация
    if (config.interval > 0) {
      setInterval(() => {
        if (!this.isOfflineMode() && !this.isSyncing()) {
          this.syncAllData(syncMethods);
        }
      }, config.interval);
    }

    // Синхронизация при запуске
    if (config.onStartup) {
      // Запускаем синхронизацию при загрузке страницы
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (!this.isOfflineMode()) {
            this.syncAllData(syncMethods);
          }
        });
      } else {
        // Страница уже загружена
        if (!this.isOfflineMode()) {
          this.syncAllData(syncMethods);
        }
      }
    }

    return this; // Для цепочки вызовов
  }

  /**
   * Проверить и запустить синхронизацию, если необходимо
   * @param id - ID элемента для проверки времени последней синхронизации
   * @param syncMethod - Метод для синхронизации данных
   * @param timeDelay - Задержка в миллисекундах (через сколько нужна повторная синхронизация)
   * @returns Promise с результатом проверки
   */
  public async checkAndSync(
    id: string,
    syncMethod: () => Promise<any>,
    timeDelay?: number
  ) {
    try {
      // Если офлайн, не пытаемся синхронизировать
      if (this.isOfflineMode()) {
        return { synced: false, reason: 'offline' };
      }

      // Получаем данные из IndexedDB
      const item = await this.getDBItem(id);

      // Если элемент не найден или нет lastSynced, сразу синхронизируем
      if (!item || !item.lastSynced) {
        await this.syncDBItem(syncMethod);
        return { synced: true, reason: 'not-found' };
      }

      // Проверяем, нужна ли синхронизация
      if (this.isSyncNeeded(item.lastSynced, timeDelay)) {
        await this.syncDBItem(syncMethod);
        return { synced: true, reason: 'time-delay-exceeded' };
      }

      return { synced: false, reason: 'not-needed' };

    } catch (error) {
      console.error('Ошибка при проверке/синхронизации:', error);
      return { synced: false, reason: 'error', error };
    }
  }
}

export default App;
