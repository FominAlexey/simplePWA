// component-registry.ts
import { Component } from './component';

// Словарь для хранения соответствия между классами и тегами
const componentTagMap: Map<typeof Component, string> = new Map();
// Словарь уже зарегистрированных компонентов
const registeredComponents: Set<string> = new Set();

/**
 * Функция для получения имени тега из имени класса
 */
function getTagNameFromClass(ComponentClass: typeof Component): string {
  // Преобразуем CamelCase в kebab-case
  return ComponentClass.name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Регистрирует компонент с указанным тегом или автоматически генерирует имя тега
 */
export function registerComponent(
  ComponentClass: typeof Component,
  tagName?: string
): string {
  // Генерируем имя тега
  const tag = tagName || getTagNameFromClass(ComponentClass);

  // Уже зарегистрировано с ЭТИМ классом?
  if (componentTagMap.has(ComponentClass)) {
    return tag;
  }

  // Уже есть такой тег, но с ДРУГИМ классом?
  const existing = customElements.get(tag);
  if (existing && existing !== ComponentClass) {
    // Не регистрируем снова, иначе будет ошибка!
    throw new Error(
      `Тег <${tag}> уже зарегистрирован с другим классом: ${existing.name}`
    );
  }

  // Регистрируем, если еще не зарегистрирован
  if (!customElements.get(tag)) {
    customElements.define(tag, ComponentClass);
    console.log(`✓ Зарегистрирован компонент: ${ComponentClass.name} как <${tag}>`);
  }

  // Вносим в карты
  registeredComponents.add(tag);
  componentTagMap.set(ComponentClass, tag);

  return tag;
}

/**
 * Получает имя тега для указанного класса компонента
 * Если компонент еще не зарегистрирован, регистрирует его автоматически
 */
export function getTagForComponent(ComponentClass: typeof Component): string {
  // Если компонент уже есть в карте - возвращаем его тег
  if (componentTagMap.has(ComponentClass)) {
    return componentTagMap.get(ComponentClass)!;
  }

  // Иначе регистрируем и возвращаем тег
  return registerComponent(ComponentClass);
}

/**
 * Создает экземпляр компонента, автоматически регистрируя его при необходимости
 */
export function createElement<T extends Component>(
  ComponentClass: new () => T
): T {
  const tagName = getTagForComponent(ComponentClass as unknown as typeof Component);
  return document.createElement(tagName) as T;
}

/**
 * Получает все зарегистрированные компоненты
 */
export function getRegisteredComponents(): string[] {
  return Array.from(registeredComponents);
}
