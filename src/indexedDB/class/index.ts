import { deleteDB, IDBPObjectStore, IDBPTransaction, openDB } from 'idb';
import {
  defaultDB,
  defaultDelayRequest,
  defaultIndex,
  defaultIndexes,
  defaultMaxAttempts,
  defaultOptionalParametersDB,
  defaultTimeDelay,
} from '../constants';
import { IIndexedDBObject, IParametersSyncRequest, ISyncObjectResponse, TIndexes } from '../models';

export class SyncDataManager<T extends string> {
  /** База данных */
  private db: any;

  /** Свойство: режим работы онлайн/оффлайн */
  private _isOffline: boolean = false;

  /** Свойство: происходит ли сейчас синхронизация */
  private _isSyncing: boolean = false;

  /** Имя базы данных */
  private dbName: string;

  /** Дефолтное значение индекса */
  private index: string = defaultIndex;

  /** Дефолтное значение для проверки времени синхронизации */
  private timeDelay: number = defaultTimeDelay;

  /** Дефолтное значение количества повторения запросов */
  private maxAttempts: number;

  /** Дефолтное значение задержки между запросами */
  private delayRequest: number;

  /**
   * @param {string} dbName - Имя базы данных
   * @param {TIndexes<T>[]} indexes - Индексы базы данных
   * @param {IDBObjectStoreParameters} optionalParametersDB - Параметры базы данных
   * @param {IParametersSyncRequest} parametersSyncRequest - Параметры для синхронизации
   */
  constructor(
    dbName: string = defaultDB,
    indexes: TIndexes<T>[] = defaultIndexes,
    optionalParametersDB: IDBObjectStoreParameters = defaultOptionalParametersDB,
    parametersSyncRequest: IParametersSyncRequest = {
      maxAttempts: defaultMaxAttempts,
      delayRequest: defaultDelayRequest,
    }
  ) {
    this.dbName = dbName;
    this.maxAttempts = parametersSyncRequest.maxAttempts;
    this.delayRequest = parametersSyncRequest.delayRequest;
    this.initDB(indexes, optionalParametersDB);
  }

  /** Инициализация базы данных
   * @param {TIndexes<T>[]} indexes - Индексы базы данных
   * @param {IDBObjectStoreParameters} optionalParametersDB - Параметры базы данных
   */
  private async initDB(
    indexes: TIndexes<T>[] = defaultIndexes,
    optionalParametersDB: IDBObjectStoreParameters = defaultOptionalParametersDB
  ) {
    try {
      this.db = await openDB(this.dbName, 1, {
        upgrade(db) {
          const store = db.createObjectStore(db.name, optionalParametersDB);
          indexes.forEach((index) => {
            store.createIndex(index.name, index.key);
          });
        },
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  /** Инициализация базы данных и открытие транзакции
   * @param {IDBTransactionMode} mode - Тип как открывать базу данных
   * @param {boolean} isReturnStore - Индексы базы данных
   */
  private async initDBAndGetTX(
    mode: IDBTransactionMode = 'readonly',
    isReturnStore: boolean = false
  ): Promise<{
    tx: IDBPTransaction<unknown, ArrayLike<string>, IDBTransactionMode>;
    store?: IDBPObjectStore<unknown, ArrayLike<string>, string, IDBTransactionMode>;
  } | null> {
    try {
      await this.initDB();
      const tx = this.db.transaction(this.dbName, mode);
      if (isReturnStore) {
        const store = tx.objectStore(this.dbName);
        return { tx, store };
      }
      return { tx };
    } catch (error) {
      throw error;
    }
  }

  /** Синхронизация записи в базе данных с реальными данными
   * @param {() => Promise<ISyncObjectResponse<T> | ISyncObjectResponse<T>[]>} method - Метод получения данных с backend
   * @param {boolean} isAddTypeInId - Нужно ли добавлять type к id
   */
  private async _sync(method: () => Promise<ISyncObjectResponse<T> | ISyncObjectResponse<T>[]>, isAddTypeInId?: boolean): Promise<void> {
    this._isSyncing = true;
    let attempts = 0;

    async function retry(this: SyncDataManager<T>) {
      try {
        const response = await method();
        const responses = Array.isArray(response) ? response : [response];
        for (const response of responses) {
          if (response.state !== 'deleted') {
            const syncObject: IIndexedDBObject<T> = {
              id: isAddTypeInId ? `${response?.id || ''}:${response?.type || ''}` : response?.id || '',
              type: response?.type || '',
              lastModified: response?.lastModified || '',
              lastSynced: new Date().toISOString(),
              data: JSON.stringify(response?.data) || '',
              userId: response?.userId || ''
            };
            switch (response.state) {
              case 'new':
                await this.add(syncObject);
                break;
              case 'modified':
                await this.update(syncObject);
                break;
              case 'not-modified':
                // eslint-disable-next-line no-case-declarations
                const objectInDB = await this.get(response?.id || '');
                if (objectInDB) {
                  await this.update({
                    ...objectInDB, lastSynced: new Date().toISOString(),
                    type: objectInDB?.type,
                    userId: objectInDB?.userId,
                    data: response?.data ? JSON.stringify(response.data) : (objectInDB?.data || '')
                  });
                }
                break;
            }
          } else {
            await this.delete(response?.id || '');
          }
        }
      } catch (error) {
        // Проверка, отменен ли запрос
        const isCanceledRequest = error && JSON.parse((error as any)?.message || '')?.responseBody?.message === 'canceled';
        attempts++;
        if (attempts < this.maxAttempts && !isCanceledRequest) {
          await new Promise((resolve) => setTimeout(resolve, this.delayRequest));
          await retry.call(this);
        } else {
          throw error;
        }
      }
    }

    try {
      await retry.call(this);
    } catch (error) {
      throw error;
    } finally {
      this._isSyncing = false;
    }
  }

  /** Получение свойства: режим работы онлайн/оффлайн */
  public get isOffline(): boolean {
    this._isOffline = !navigator.onLine;
    return this._isOffline;
  }

  /** Получение свойства: происходит ли сейчас синхронизация */
  public get isSyncing(): boolean {
    return this._isSyncing;
  }

  /** Получение списка
   * @param {string} id - Id записи в базе данных
   * @param {keyof IIndexedDBObject<T>} filterBy - По какому параметру фильтровать ответ
   * @param {T | string} valueFilter - По какому значению фильтровать ответ
   */
  public async getList(
    id?: string,
    filterBy?: keyof IIndexedDBObject<T>,
    valueFilter?: T | string
  ): Promise<IIndexedDBObject<T>[] | null> {
    try {
      const resultInitDB = await this.initDBAndGetTX('readonly', true);
      if (!resultInitDB) {
        return null;
      }
      const { tx, store } = resultInitDB;
      if (!tx || !store) {
        return null;
      }
      let result = await store.getAll();
      if (valueFilter) {
        result = result.filter((obj: IIndexedDBObject<T>) => obj[filterBy || 'type'] === valueFilter);
      }
      await tx.done;
      return result;
    } catch (error) {
      throw error;
    }
  }

  /** Получение списка по индексу
   * @param {string} _index - Индекс в базе данных
   * @param {T | string} keyValue - Значение, по которому ищутся объекты
   */
  public async getListByIndex(_index?: string, keyValue?: T | string): Promise<IIndexedDBObject<T>[] | null> {
    try {
      const resultInitDB = await this.initDBAndGetTX('readonly', true);
      if (!resultInitDB) {
        return null;
      }
      const { tx, store } = resultInitDB;
      if (!tx || !store) {
        return null;
      }
      const index = store.index(_index || this.index);
      const result = await index.getAll(keyValue);
      await tx.done;
      return result;
    } catch (error) {
      throw error;
    }
  }

  /** Получение объекта
   * @param {string} id - Id в базе данных
   */
  public async get(id: string): Promise<IIndexedDBObject<T> | null> {
    try {
      const resultInitDB = await this.initDBAndGetTX('readonly', true);
      if (!resultInitDB) {
        return null;
      }
      const { tx, store } = resultInitDB;
      if (!tx || !store) {
        return null;
      }
      const result = await store.get(id);
      await tx.done;
      return result;
    } catch (error) {
      throw error;
    }
  }

  /** Получение объекта по индексу
   * @param {string} keyValue - Значение для индекса в базе данных
   * @param {string} _index - Индекс в базе данных
   * @param {boolean} isFind - Надо ли искать по значению
   * @param {string} valueFind - Значение поиска объекта
   */
  public async getByIndex(
    keyValue: string,
    _index?: string,
    isFind?: boolean,
    valueFind?: T | string
  ): Promise<IIndexedDBObject<T> | null> {
    try {
      const resultList = await this.getListByIndex(_index, keyValue);
      let result = resultList?.[0] || null;
      if (isFind) {
        result = resultList?.find((obj) => obj.id === String(valueFind)) || null;
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  /** Удаление записи из базы данных
   * @param {string} id - Id базы данных
   */
  public async delete(id: string) {
    try {
      const resultInitDB = await this.initDBAndGetTX('readwrite', true);
      if (!resultInitDB) {
        return null;
      }
      const { tx, store } = resultInitDB;
      if (!tx || !store) {
        return null;
      }
      if (store.delete) {
        await store.delete(id);
      }
      await tx.done;
      return true;
    } catch (error) {
      throw error;
    }
  }

  /** Добавление записи в базу данных
   * @param {IIndexedDBObject<T>} syncObject - Объект для сохранения в базе данных
   */
  public async add(syncObject: IIndexedDBObject<T>) {
    try {
      const resultInitDB = await this.initDBAndGetTX('readwrite', true);
      if (!resultInitDB) {
        return null;
      }
      const { tx, store } = resultInitDB;
      if (!tx || !store) {
        return null;
      }
      if (store.add) {
        try {
          await store.add(syncObject);
        } catch (error) {
          throw error;
        }
      }
      await tx.done;
      return true;
    } catch (error) {
      return null;
    }
  }

  /** Обновление записи в базе данных
   * @param {IIndexedDBObject<T>} syncObject - Объект для обновления в базе данных
   */
  public async update(syncObject: IIndexedDBObject<T>) {
    try {
      const resultInitDB = await this.initDBAndGetTX('readwrite', true);
      if (!resultInitDB) {
        return null;
      }
      const { tx, store } = resultInitDB;
      if (!tx || !store) {
        return null;
      }
      if (store.put) {
        await store.put(syncObject);
      }
      await tx.done;
      return true;
    } catch (error) {
      throw error;
    }
  }

  /** Синхронизация записей в базе данных с реальными данными
   * @param {() => Promise<ISyncObjectResponse<T>[]>} method - Метод получения данных с backend
   * @param {boolean} isAddTypeInId - Нужно ли добавлять type к id
   */
  public async syncList(method: () => Promise<ISyncObjectResponse<T>[]>, isAddTypeInId?: boolean): Promise<void> {
    try {
      await this._sync(method, isAddTypeInId);
    } catch (error) {
      throw error;
    }
  }

  /** Синхронизация записи в базе данных с реальными данными
   * @param {() => Promise<ISyncObjectResponse<T>>} method - Метод получения данных с backend
   * @param {boolean} isAddTypeInId - Нужно ли добавлять type к id
   */
  public async syncItem(method: () => Promise<ISyncObjectResponse<T>>, isAddTypeInId?: boolean): Promise<void> {
    try {
      await this._sync(method, isAddTypeInId);
    } catch (error) {
      throw error;
    }
  }

  /** Проверка, прошло ли время синхронизации
   * @param {string} lastSynced - Время последней синхронизации
   * @param {number} timeDelay - Время для сравнение с текущим временем
   */
  public isSyncNeeded(lastSynced: string, timeDelay: number = this.timeDelay): boolean {
    const _lastSynced = new Date(lastSynced);
    const now = new Date();
    const diff = now.getTime() - _lastSynced.getTime();
    return diff >= timeDelay;
  }

  /** Удаление базы данных
   * @param {string} nameDB - Название базы данных
   */
  public async deleteDatabase(nameDB: string = this.dbName): Promise<boolean> {
    try {
      await deleteDB(nameDB);
      return true;
    } catch (error) {
      throw error;
    }
  }
}
