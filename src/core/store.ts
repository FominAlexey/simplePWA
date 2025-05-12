type Listener<T> = (state: T) => void;

export class Store<T extends object> {
  private state: T;
  private listeners: Listener<T>[] = [];

  constructor(initialState: T) {
    this.state = { ...initialState };
  }

  /**
   * Получить текущее состояние store
   */
  public getState(): T {
    return { ...this.state }; // Возвращаем копию state
  }

  /**
   * Обновить store (с реактивным оповещением подписчиков)
   */
  public setState(patch: Partial<T>) {
    this.state = { ...this.state, ...patch };
    this.emit(); // Оповещаем подписчиков
    return this;
  }

  /**
   * Подписка на изменения store
   */
  public subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    // Возвращаем функцию отписки
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Внутренний метод для вызова всех подписчиков
   */
  private emit() {
    const current = this.getState();
    this.listeners.forEach(listener => listener(current));
  }
}
