import { Store } from "./store";

export class Component extends HTMLElement {
  static get observedAttributes(): string[] {
    return []; // По умолчанию пустой массив - переопределяется в подклассах
  }

  protected state: Record<string, any> = {};
  protected props: Record<string, any> = {};
  private observers: Record<string, Set<() => void>> = {};
  // Store, если компоненту нужен доступ
  protected _store: Store<any> | null = null;
  // Для хранения функций отписки от store
  protected _storeUnsubscribers: (() => void)[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // Метод для установки store извне (например, из роутера)
  setStore(store: Store<any>) {
    this._store = store;
    // Подписываемся на изменения store
    this.subscribeToStore(store, () => this.render());
    // Вызываем рендер для отображения данных из store
    this.render();
  }

  // Хелпер для подписки на store с автоматической отпиской при удалении компонента
  protected subscribeToStore<T extends object>(store: Store<T>, callback: (state: T) => void) {
    const unsubscribe = store.subscribe(callback);
    this._storeUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  // Обновление состояния с запуском рендера
  setState(newState: Record<string, any>) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };

    Object.keys(newState).forEach(key => {
      if (oldState[key] !== newState[key] && this.observers[key]) {
        this.observers[key].forEach(callback => callback());
      }
    });

    this.render();
  }

  // Наблюдение за изменением свойства
  observe(prop: string, callback: () => void) {
    if (!this.observers[prop]) {
      this.observers[prop] = new Set();
    }
    this.observers[prop].add(callback);
  }

  // Получение обновленных атрибутов из DOM
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.props[name] = newValue;
      this.render();
    }
  }

  connectedCallback() {
    // Инициализация после подключения компонента к DOM
    this.render();
  }

  disconnectedCallback() {
    // Очищаем подписки при удалении компонента из DOM
    this._storeUnsubscribers.forEach(unsub => unsub());
    this._storeUnsubscribers = [];
  }

  // Метод для переопределения в дочерних классах
  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `<div>Component Base</div>`;
    }
  }
}

// Базовые классы для десктопных и мобильных компонентов
export class DesktopComponent extends Component {
  render() {
    if (this.shadowRoot) {
      // Получаем тему из store, если он доступен
      const theme = this._store?.getState().theme || 'light';

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            background-color: ${theme === 'dark' ? '#2c3e50' : '#ffffff'};
            color: ${theme === 'dark' ? '#ecf0f1' : '#333333'};
            padding: 20px;
          }
        </style>
        <div>Desktop Component</div>
      `;
    }
  }
}

export class MobileComponent extends Component {
  render() {
    if (this.shadowRoot) {
      // Получаем тему из store, если он доступен
      const theme = this._store?.getState().theme || 'light';

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            background-color: ${theme === 'dark' ? '#34495e' : '#ffffff'};
            color: ${theme === 'dark' ? '#ecf0f1' : '#333333'};
            padding: 10px;
          }
        </style>
        <div>Mobile Component</div>
      `;
    }
  }
}

export class DesktopHome extends DesktopComponent {
  connectedCallback() {
    super.connectedCallback();
    // Если передан store - подписываемся на его изменения для автоматического рендера
    if (this._store) {
      this.subscribeToStore(this._store, () => this.render());
    }
  }

  render() {
    if (this.shadowRoot) {
      const count = this.state.count || 0;
      const theme = this._store?.getState().theme || 'light';
      const user = this._store?.getState().user;

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 20px; }
          h2 { color: ${theme === 'dark' ? '#ecf0f1' : '#2c3e50'}; }
          p { color: ${theme === 'dark' ? '#bdc3c7' : '#333'}; }
          .welcome { font-weight: bold; }
          button {
            background: ${theme === 'dark' ? '#3498db' : '#2980b9'};
            color: white;
            border: none;
            padding: 8px 16px;
            margin-top: 16px;
            border-radius: 4px;
            cursor: pointer;
          }
        </style>
        <h2>Десктоп Главная</h2>
        <p class="welcome">
          ${user ? `Добро пожаловать, ${user.name}!` : "Добро пожаловать, гость!"}
        </p>
        <button id="counter-btn">Нажатий: ${count}</button>
        <button id="switch-theme">Сменить тему</button>
      `;

      this.shadowRoot.getElementById('counter-btn')?.addEventListener('click', () => {
        this.setState({ count: count + 1 });
      });

      this.shadowRoot.getElementById('switch-theme')?.addEventListener('click', () => {
        if (this._store) {
          const curTheme = this._store.getState().theme;
          this._store.setState({ theme: curTheme === 'dark' ? 'light' : 'dark' });
        }
      });
    }
  }
}

export class MobileHome extends MobileComponent {
  connectedCallback() {
    super.connectedCallback();
    if (this._store) {
      this.subscribeToStore(this._store, () => this.render());
    }
  }

  render() {
    if (this.shadowRoot) {
      const count = this.state.count || 0;
      const theme = this._store?.getState().theme || 'light';
      const user = this._store?.getState().user;

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 10px; }
          h2 { color: ${theme === 'dark' ? '#ecf0f1' : '#3498db'}; font-size: 1.2rem; }
          button {
            background: ${theme === 'dark' ? '#6dd5ed' : '#2980b9'};
            color: white;
            border: none;
            padding: 7px 13px;
            margin: 15px 0 0 0;
            border-radius: 4px;
          }
        </style>
        <h2>Мобильная Главная</h2>
        <p>
          ${user ? `Привет, ${user.name}!` : "Для мобильных устройств"}
        </p>
        <button id="counter-btn">Тапов: ${count}</button>
        <button id="switch-theme">Тема</button>
      `;

      this.shadowRoot.getElementById('counter-btn')?.addEventListener('click', () => {
        this.setState({ count: count + 1 });
      });
      this.shadowRoot.getElementById('switch-theme')?.addEventListener('click', () => {
        if (this._store) {
          const curTheme = this._store.getState().theme;
          this._store.setState({ theme: curTheme === 'dark' ? 'light' : 'dark' });
        }
      });
    }
  }
}

export class DesktopAbout extends DesktopComponent {
  connectedCallback() {
    super.connectedCallback();
    if (this._store) {
      this.subscribeToStore(this._store, () => this.render());
    }
  }
  render() {
    if (this.shadowRoot) {
      const theme = this._store?.getState().theme || 'light';

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 20px; }
          h2 { color: ${theme === 'dark' ? '#ecf0f1' : '#2c3e50'}; }
          p { color: ${theme === 'dark' ? '#bdc3c7' : '#333'}; }
        </style>
        <h2>Десктоп О нас</h2>
        <p>Информация о компании и о фреймворке — на десктопе.</p>
      `;
    }
  }
}

export class MobileAbout extends MobileComponent {
  connectedCallback() {
    super.connectedCallback();
    if (this._store) {
      this.subscribeToStore(this._store, () => this.render());
    }
  }
  render() {
    if (this.shadowRoot) {
      const theme = this._store?.getState().theme || 'light';
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 10px; }
          h2 { color: ${theme === 'dark' ? '#ecf0f1' : '#3498db'}; font-size: 1.2rem; }
          p { color: ${theme === 'dark' ? '#bdc3c7' : '#333'}; }
        </style>
        <h2>Мобильная О нас</h2>
        <p>Краткая информация о нашем проекте на мобильном экране.</p>
      `;
    }
  }
}
