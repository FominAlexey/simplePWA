import { Component } from './component';
import { getTagForComponent } from './component-registry';
import { Store } from './store';

type DeviceType = 'mobile' | 'desktop';

export interface Route {
  path: string;
  desktopComponent: typeof Component;
  mobileComponent: typeof Component;
}

export class Router {
  private routes: Route[];
  private currentRoute: Route | null = null;
  private deviceType: DeviceType;
  private rootElement: HTMLElement;
  private currentComponent: Component | null = null;
  private store?: Store<any> | null = null; // Добавляем store

  /**
   * Создает новый маршрутизатор
   * @param routes Массив маршрутов
   * @param rootElement Корневой элемент для рендеринга компонентов
   */
  constructor(routes: Route[], rootElement: HTMLElement = document.body, store?: Store<any>) {
    this.routes = routes;
    this.rootElement = rootElement;
    this.deviceType = this.detectDeviceType();
    this.store = store;

    // Слушаем изменения истории (кнопки назад/вперед)
    window.addEventListener('popstate', () => this.handleNavigation());

    // Слушаем изменение размера экрана
    window.addEventListener('resize', this.debounce(() => {
      const newDeviceType = this.detectDeviceType();
      if (this.deviceType !== newDeviceType) {
        this.deviceType = newDeviceType;
        this.handleNavigation(); // Перерендерим при смене типа устройства
      }
    }, 250));

    // Перехватываем клики по ссылкам
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        this.navigate(link.getAttribute('href') || '/');
      }
    });

    // Запускаем навигацию по текущему URL
    this.handleNavigation();
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
    const path = window.location.pathname;

    // Ищем подходящий маршрут
    this.currentRoute = this.findMatchingRoute(path);
    this.render();
  }

  /**
   * Находит маршрут, соответствующий пути
   */
  private findMatchingRoute(path: string): Route | null {
    // Сначала ищем точное совпадение
    let route = this.routes.find(r => r.path === path);
    if (route) return route;

    // Затем ищем маршруты с параметрами (например, /user/:id)
    for (const r of this.routes) {
      const routeParts = r.path.split('/');
      const pathParts = path.split('/');

      if (routeParts.length !== pathParts.length) continue;

      let match = true;
      const params: Record<string, string> = {};

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          // Параметр маршрута
          const paramName = routeParts[i].substring(1);
          params[paramName] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        // Сохраняем параметры для использования в компоненте
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

  // Вспомогательный метод для получения имени тега
  private getTagNameForComponent(ComponentClass: typeof Component): string {
    const mapping: Record<string, string> = {
      'DesktopHome': 'desktop-home',
      'MobileHome': 'mobile-home',
      'DesktopAbout': 'desktop-about',
      'MobileAbout': 'mobile-about'
      // Добавьте другие компоненты по необходимости
    };

    return mapping[ComponentClass.name] || ComponentClass.name.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2');
  }

   /**
   * Рендеринг текущего компонента в зависимости от типа устройства
   */
  private render() {
      // Удаляем старый компонент, если есть
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
      const ComponentClass = this.deviceType === 'mobile'
        ? this.currentRoute.mobileComponent
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
    // Можно расширить, добавив свойство title в Route
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
    return function(...args: any[]) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    };
  }
}



