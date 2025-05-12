### simplePWA

Универсальный фреймворк для веб-приложения

#### Установка пакета

```
yarn add simplePWA
```

#### Импортируем в проект например работу с синхронизацией

```
import { SyncDataManager } from 'simplePWA';

type TTypeEvent = 'claim' | 'policy-short' | 'policy-full';

const syncDataManager = new SyncDataManager<TTypeEvent>();
```

При объявлении класса можно передать параметры:

##### Параметры класса

* **dbName**: Имя базы данных (string)
* **indexes**: Индексы базы данных (TIndexes<T>[])
* **optionalParametersDB**: Параметры базы данных (IDBObjectStoreParameters)
* **parametersSyncRequest**: Параметры для синхронизации (IParametersSyncRequest)

### Свойства и методы класса

#### isOffline

Получение свойства: режим работы онлайн/оффлайн

```
syncDataManager.isOffline
```

#### isSyncing

Получение свойства: происходит ли сейчас синхронизация

```
syncDataManager.isSyncing
```

#### getList

Получение списка

```
await syncDataManager.getList()
```

##### Параметры метода

* **id**: Id записи в базе данных (string)
* **filterBy**: По какому параметру фильтровать ответ (keyof IIndexedDBObject<T>)
* **valueFilter**: По какому значению фильтровать ответ (T | string)

#### getListByIndex

Получение списка по индексу

```
await syncDataManager.getListByIndex()
```

##### Параметры метода

* **_index**: Индекс в базе данных (string)
* **keyValue**: Значение, по которому ищутся объекты (T | string)

#### get

Получение объекта

```
await syncDataManager.get(Id)
```

##### Параметры метода

* **id**: Id в базе данных (string) - **Обязательный**
* **filterBy**: Значение, по которому ищутся объекты (keyof IIndexedDBObject<T>)
* **valueFilterList**: По какому значению фильтровать ответ (T | string)
* **isFind**: Надо ли искать по значению (boolean)
* **valueFind**: Значение поиска объекта (string)

#### getByIndex

Получение объекта по индексу

```
await syncDataManager.getByIndex(keyValue)
```

##### Параметры метода

* **keyValue**: Значение для индекса в базе данных (string) - **Обязательный**
* **_index**: Индекс в базе данных (string)
* **isFind**: Надо ли искать по значению (boolean)
* **valueFind**: Значение поиска объекта (string)

#### delete

Удаление записи из базы данных

```
await syncDataManager.delete(Id)
```

##### Параметры метода

* **id**: Id базы данных (string) - **Обязательный**

#### add

Добавление записи в базу данных

```
await syncDataManager.add(syncObject)
```

##### Параметры метода

* **syncObject**: Объект для сохранения в базе данных (IIndexedDBObject<T>) - **Обязательный**

#### update

Обновление записи в базе данных

```
await syncDataManager.update(syncObject)
```

##### Параметры метода

* **syncObject**: Объект для обновления в базе данных (IIndexedDBObject<T>) - **Обязательный**

#### syncList

Синхронизация записей в базе данных с реальными данными

```
await syncDataManager.syncList(method)
```

##### Параметры метода

* **method**: Метод получения данных с backend, возвращающий промис с массивом ответов ( () => Promise<ISyncObjectResponse<T>[]> ) - **Обязательный**

#### syncItem

Синхронизация записи в базе данных с реальными данными

```
await syncDataManager.syncItem(method)
```

##### Параметры метода

* **method**: Метод получения данных с backend, возвращающий промис с массивом ответов ( () => Promise<ISyncObjectResponse<T>> ) - **Обязательный**

#### isSyncNeeded

Проверка, прошло ли время синхронизации

```
await syncDataManager.isSyncNeeded(lastSynced)
```

##### Параметры метода


* **lastSynced**: Время последней синхронизации (string) - **Обязательный**
* **timeDelay**: Время для сравнения с текущим временем (number)

#### deleteDatabase

Удаление базы данных

```
await syncDataManager.deleteDatabase(nameDB)
```

##### Параметры метода

* **nameDB**: Название базы данных (string) - **Обязательный**
