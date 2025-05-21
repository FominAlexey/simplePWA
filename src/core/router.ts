import { Component } from './component';
import { getTagForComponent } from './component-registry';
import { Store } from './store';

type DeviceType = 'mobile' | 'desktop';

export interface Route {
  path: string;
  desktopComponent: typeof Component;
  mobileComponent?: typeof Component;
}

export class Router {
  private routes: Route[];
  private currentRoute: Route | null = null;
  private deviceType: DeviceType;
  private rootElement: HTMLElement;
  private currentComponent: Component | null = null;
  private store?: Store<any> | null = null;
  private isOffline: boolean = !navigator.onLine;
  private offlineOverlay: HTMLElement | null = null;
  private showOfflineOverlay: boolean;

  /**
   * @param routes Массив маршрутов
   * @param rootElement Корневой элемент для рендеринга компонентов
   * @param store Хранилище (опционально)
   * @param showOfflineOverlay Показывать ли offline-overlay поверх страницы (по умолчанию true)
   */
  constructor(
    routes: Route[],
    rootElement: HTMLElement = document.body,
    store?: Store<any>,
    showOfflineOverlay: boolean = true
  ) {
    this.routes = routes;
    this.rootElement = rootElement;
    this.deviceType = this.detectDeviceType();
    this.store = store;
    this.showOfflineOverlay = showOfflineOverlay;

    // Подписка на popstate (назад/вперед)
    window.addEventListener('popstate', () => this.handleNavigation());

    // Подписка на resize
    window.addEventListener('resize', this.debounce(() => {
      const newDeviceType = this.detectDeviceType();
      if (this.deviceType !== newDeviceType) {
        this.deviceType = newDeviceType;
        this.handleNavigation();
      }
    }, 250));

    // Перехват ссылок
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        this.navigate(link.getAttribute('href') || '/');
      }
    });

    // Offline/Online overlay переключение
    window.addEventListener('offline', () => this.handleOffline());
    window.addEventListener('online', () => this.handleOnline());

    // Первичная отрисовка
    this.handleNavigation();
    if (!navigator.onLine) this.handleOffline();
  }

  /**
   * Определяет тип устройства
   */
  private detectDeviceType(): DeviceType {
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
      ? 'mobile'
      : 'desktop';
  }

  /**
   * Обработка текущего URL и отображение соответствующего компонента
   */
  private handleNavigation() {
    if (this.isOffline && this.showOfflineOverlay) return; // Не рендерим если в offline-overlay режиме
    const path = window.location.pathname;

    // Ищем подходящий маршрут
    this.currentRoute = this.findMatchingRoute(path);
    this.render();
  }

  /**
   * Находит маршрут, соответствующий пути
   */
  private findMatchingRoute(path: string): Route | null {
    let route = this.routes.find(r => r.path === path);
    if (route) return route;

    for (const r of this.routes) {
      const routeParts = r.path.split('/');
      const pathParts = path.split('/');

      if (routeParts.length !== pathParts.length) continue;

      let match = true;
      const params: Record<string, string> = {};

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          const paramName = routeParts[i].substring(1);
          params[paramName] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        (r as any).params = params;
        return r;
      }
    }

    return null;
  }

  /**
   * Программная навигация по указанному пути
   */
  public navigate(path: string) {
    window.history.pushState({}, '', path);
    this.handleNavigation();
  }

  /**
   * Рендеринг текущего компонента в зависимости от типа устройства
   */
  private render() {
    // Удаляем старый компонент
    if (this.currentComponent && this.currentComponent.parentNode) {
      this.currentComponent.parentNode.removeChild(this.currentComponent);
      this.currentComponent = null;
    }

    if (!this.currentRoute) {
      const notFoundElement = document.createElement('div');
      notFoundElement.innerHTML = `<h1>404 - Страница не найдена</h1>`;
      this.rootElement.innerHTML = '';
      this.rootElement.appendChild(notFoundElement);
      return;
    }

    // Выбираем нужный компонент
    // Если для мобильных не указан компонент - используем десктопный
    const ComponentClass = this.deviceType === 'mobile'
      ? (this.currentRoute.mobileComponent || this.currentRoute.desktopComponent)
      : this.currentRoute.desktopComponent;

    // Получаем тег и (если надо) регистрируем компонент:
    const tagName = getTagForComponent(ComponentClass);

    // Создаем компонент через document.createElement
    this.currentComponent = document.createElement(tagName) as Component;

    // Передаём параметры маршрута
    if ((this.currentRoute as any).params) {
      Object.entries((this.currentRoute as any).params).forEach(([key, value]) => {
        this.currentComponent?.setAttribute(key, value as string);
      });
    }

    // Передаём store, если компонент поддерживает
    if (this.store && 'setStore' in this.currentComponent &&
      typeof this.currentComponent.setStore === 'function') {
      this.currentComponent.setStore(this.store);
    }

    this.rootElement.innerHTML = '';
    this.rootElement.appendChild(this.currentComponent);

    document.title = this.getCurrentTitle();
    this.updateActiveLinks();
  }

  /**
   * Возвращает заголовок для текущей страницы
   */
  private getCurrentTitle(): string {
    return `Страница ${this.currentRoute?.path || ''}`;
  }
  /**
   * Обновляет классы активных ссылок
   */
  private updateActiveLinks() {
    if (!this.currentRoute) return;

    document.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === this.currentRoute?.path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Возвращает текущий тип устройства
   */
  public getDeviceType(): DeviceType {
    return this.deviceType;
  }

  /**
   * Утилита для дебаунса (предотвращает частое выполнение функции)
   */
  private debounce(fn: Function, delay: number) {
    let timeoutId: number | null = null;
    return function (...args: any[]) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Обработчик оффлайн-события. Показывает offline-оверлей
   */
  private handleOffline() {
    this.isOffline = true;
    if (this.showOfflineOverlay) this.showOffline();
  }

  /**
   * Обработчик online-события. Скрывает offline-оверлей
   */
  private handleOnline() {
    this.isOffline = false;
    if (this.showOfflineOverlay) this.hideOffline();
    // После возвращения online можно обновить страницу (по желанию)
    // this.handleNavigation();
  }

  /**
   * Показывает offline-оверлей (загружает offline.html либо дефолтную версию)
   */
  private showOffline() {
    if (!this.offlineOverlay) {
      fetch('/offline.html')
        .then(r => r.text())
        .then(html => {
          this.offlineOverlay = document.createElement('div');
          this.offlineOverlay.id = '__offline-overlay';
          Object.assign(this.offlineOverlay.style, {
            position: 'fixed',
            zIndex: '999999',
            left: '0',
            top: '0',
            width: '100vw',
            height: '100vh',
            background: 'none',
            padding: '0',
            margin: '0'
          });
          // Вставляем только содержимое <body>
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          this.offlineOverlay.innerHTML = bodyMatch ? bodyMatch[1] : html;
          document.body.appendChild(this.offlineOverlay);
        })
        .catch(() => {
          this.offlineOverlay = document.createElement('div');
          this.offlineOverlay.id = '__offline-overlay';
          Object.assign(this.offlineOverlay.style, {
            position: 'fixed',
            zIndex: '999999',
            left: '0',
            top: '0',
            width: '100vw',
            height: '100vh',
            background: '#1976d2',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3em'
          });
          this.offlineOverlay.innerHTML = `<div><h1>Вы оффлайн</h1><p>Нет интернет-соединения.</p></div>`;
          document.body.appendChild(this.offlineOverlay);
        });
    }
  }

  /**
   * Скрывает offline-оверлей
   */
  private hideOffline() {
    if (this.offlineOverlay) {
      this.offlineOverlay.remove();
      this.offlineOverlay = null;
    }
  }
}

export default Router;
