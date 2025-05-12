import { IIndexedDBObject } from "../models";

/** Дефолтное значение базы данных */
export const defaultDB = 'simplePWA';
/** Дефолтное значение индекса в базе данных */
export const defaultIndex = 'defaultIndex';
/** Дефолтные индексы в базе данных */
export const defaultIndexes = [{ name: defaultIndex, key: 'id' as keyof IIndexedDBObject<any> }];
/** Дефолтные параметры базы данных */
export const defaultOptionalParametersDB: IDBObjectStoreParameters = { keyPath: 'id' };
/** Дефолтное значение для проверки времени синхронизации */
export const defaultTimeDelay = 5 * 60 * 1000; // 5 минут
/** Дефолтное значение количества повторения запросов */
export const defaultMaxAttempts = 5;
/** Дефолтное значение задержки между запросами */
export const defaultDelayRequest = 200;
