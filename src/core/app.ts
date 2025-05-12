import { Router, Route } from './router';
import {
  DesktopHome, MobileHome,
  DesktopAbout, MobileAbout,
  Component
} from './component';
import { Store } from './store';

// Регистрация кастомных элементов
customElements.define('desktop-home', DesktopHome);
customElements.define('mobile-home', MobileHome);
customElements.define('desktop-about', DesktopAbout);
customElements.define('mobile-about', MobileAbout);
const appStore = new Store({ user: null, theme: 'light' });

interface AppConfig {
  rootElement?: string | HTMLElement;
  routes?: Route[];
  pwa?: {
    enabled?: boolean;
    serviceWorkerPath?: string;
    registerOnLoad?: boolean;
  };
}

export class App {
  private router: Router;
  private config: AppConfig;
  private rootElement: HTMLElement;

  public store = appStore;

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
}

// // Экспортируем CLI функции для удобства импорта
// export function createPWA(projectName: string) {
//   if (typeof window === 'undefined') {
//     try {
//       // Динамический импорт CLI-скрипта для создания PWA
//       import('../cli/pwa/createPWA').then(cli => {
//         console.log(`Запуск создания PWA проекта: ${projectName}`);
//       }).catch(err => {
//         console.error('Ошибка при запуске CLI для PWA:', err);
//       });
//     } catch (error) {
//       console.error('Не удалось загрузить CLI для PWA:', error);
//     }
//   } else {
//     console.warn('createPWA() можно вызывать только в Node.js окружении');
//   }
// }

// export function createServiceWorker() {
//   if (typeof window === 'undefined') {
//     try {
//       // Динамический импорт CLI-скрипта для создания Service Worker
//       import('../cli/serviceWorker/createServiceWorker').then(cli => {
//         console.log('Запуск создания Service Worker');
//       }).catch(err => {
//         console.error('Ошибка при запуске CLI для Service Worker:', err);
//       });
//     } catch (error) {
//       console.error('Не удалось загрузить CLI для Service Worker:', error);
//     }
//   } else {
//     console.warn('createServiceWorker() можно вызывать только в Node.js окружении');
//   }
// }

export default App;
