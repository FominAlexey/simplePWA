/** Интерфейс записи в БД Indexed */
export interface IIndexedDBObject<T extends string> {
  /** Id Записи */
  id?: string;
  /** Тип Записи */
  type?: string | T;
  /** Время последнего изменения записи */
  lastModified: string;
  /** Время последней синхронизации записи */
  lastSynced?: string;
  /** Данные */
  data?: string | unknown;
  /** Id Пользователя */
  userId?: string;
}

/** Интерфейс ответа при синхронизации данных */
export interface ISyncObjectResponse<T extends string> extends Omit<IIndexedDBObject<T>, 'lastSynced'> {
  /** Состояние объекта */
  state: 'new' | 'deleted' | 'modified' | 'not-modified';
}

/** Интерфейс параметров синхронизации */
export interface IParametersSyncRequest {
  /** Количество попыток */
  maxAttempts: number;
  /** Задержка запросов */
  delayRequest: number;
}

/** Тип индексов в базе данных indexedDB */
export type TIndexes<T extends string> = { name: string; key: keyof IIndexedDBObject<T> };
