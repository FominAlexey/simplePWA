import { SyncDataManager } from '../../src/class';
import { openDB, deleteDB } from 'idb';

jest.mock('idb', () => ({
  openDB: jest.fn().mockResolvedValue({
    createObjectStore: jest.fn().mockReturnValue({
      createIndex: jest.fn(),
    }),
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        delete: jest.fn().mockResolvedValue(undefined),
      }),
      done: jest.fn().mockResolvedValue(undefined),
    }),
  }),
  deleteDB: jest.fn().mockResolvedValue(undefined),
}));

describe('SyncDataManager', () => {
  const dbName = 'test-db';
  const optionalParametersDB = { autoIncrement: true };
  const parametersSyncRequest = { maxAttempts: 3, delayRequest: 1000 };
  type TTypeEvent = 'claim' | 'policy-short' | 'policy-full';

  let syncDataManager: SyncDataManager<TTypeEvent>;

  beforeEach(() => {
    syncDataManager = new SyncDataManager(dbName, undefined, optionalParametersDB, parametersSyncRequest);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getList', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        },
      });
    });

    it('should return list of objects from db', async () => {
      const openDBMock = openDB as jest.Mock;
      openDBMock.mockResolvedValue({
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
        objectStore: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        },
      });

      const result = await syncDataManager.getList();

      expect(result).toEqual([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]);
    });
  });

  describe('getListByIndex', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
            index: jest.fn().mockReturnValue({
              getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
            }),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          index: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
      });
    });
    it('should return list of objects from db by index', async () => {
      const openDBMock = openDB as jest.Mock;
      openDBMock.mockResolvedValue({
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
        objectStore: {
          index: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }, { id: 2, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data2' }]),
          }),
        },
      });

      const result = await syncDataManager.getListByIndex('index1', 'key1');

      expect(result).toEqual([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        },
      });
    });
    it('should return object from db', async () => {
      const openDBMock = openDB as jest.Mock;
      openDBMock.mockResolvedValue({
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
        objectStore: {
          get: jest.fn().mockResolvedValue({ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }),
        },
      });

      const result = await syncDataManager.get('1');

      expect(result).toEqual({ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' });
    });
  });

  describe('getByIndex', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
            index: jest.fn().mockReturnValue({
              getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
            }),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          index: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
      });
    });
    it('should return object from db by index', async () => {
      const openDBMock = openDB as jest.Mock;
      openDBMock.mockResolvedValue({
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
        objectStore: {
          index: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }),
          }),
        },
      });

      const result = await syncDataManager.getByIndex('key1', 'index1');

      expect(result).toEqual({ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' });
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        },
      });
    });
    it('should delete object from db', async () => {
      const openDBMock = openDB as jest.Mock;
      openDBMock.mockResolvedValue({
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
        objectStore: {
          delete: jest.fn().mockResolvedValue(undefined),
        },
      });

      await syncDataManager.delete('1');

      expect(openDBMock).toHaveBeenCalledTimes(1);
      expect(openDBMock).toHaveBeenCalledWith(dbName, 1, expect.any(Object));
    });
  });

  describe('add', () => {
    it('should add object to db', async () => {
      const openDBMock = openDB as jest.Mock;
      openDBMock.mockResolvedValue({
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
        objectStore: {
          add: jest.fn().mockResolvedValue(undefined),
        },
      });

      await syncDataManager.add({
        id: '1',
        type: 'claim',
        lastModified: new Date().toISOString(),
        lastSynced: new Date().toISOString(),
        data: 'data1',
      });

      expect(openDBMock).toHaveBeenCalledTimes(2);
      expect(openDBMock).toHaveBeenCalledWith(dbName, 1, expect.any(Object));
    });
  });

  describe('update', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        },
      });
    });
    it('should update object in db', async () => {
      const openDBMock = openDB as jest.Mock;
      openDBMock.mockResolvedValue({
        createObjectStore: jest.fn(),
        transaction: jest.fn(),
        objectStore: {
          put: jest.fn().mockResolvedValue(undefined),
        },
      });

      await syncDataManager.update({
        id: '1',
        type: 'claim',
        lastModified: new Date().toISOString(),
        lastSynced: new Date().toISOString(),
        data: 'data1',
      });

      expect(openDBMock).toHaveBeenCalledTimes(1);
      expect(openDBMock).toHaveBeenCalledWith(dbName, 1, expect.any(Object));
    });
  });

  describe('syncList', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        },
      });
    });
    it('should sync list of objects with backend', async () => {
      const methodMock = jest.fn().mockResolvedValue([{ id: '1', type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }, { id: '2', type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data2' }]);

      await syncDataManager.syncList(methodMock);

      expect(methodMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncItem', () => {
    beforeEach(() => {
      jest.spyOn(syncDataManager as any, 'initDBAndGetTX').mockResolvedValue({
        tx: {
          done: jest.fn().mockResolvedValue(undefined),
          objectStore: jest.fn().mockReturnValue({
            getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
          }),
        },
        store: {
          getAll: jest.fn().mockResolvedValue([{ id: 1, type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' }]),
        },
      });
    });
    it('should sync object with backend', async () => {
      const methodMock = jest.fn().mockResolvedValue({ id: '1', type: 'claim', lastModified: '2022-01-01T00:00:00.000Z', lastSynced: '2022-01-01T00:00:00.000Z', data: 'data1' });

      await syncDataManager.syncItem(methodMock);

      expect(methodMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('isSyncNeeded', () => {
    it('should return true if syncing is needed', () => {
      const lastSynced = new Date().toISOString();
      const timeDelay = 1000;

      expect(syncDataManager.isSyncNeeded(lastSynced, timeDelay)).toBe(true);
    });

    it('should return false if syncing is not needed', () => {
      const lastSynced = new Date().toISOString();
      const timeDelay = 10000;

      expect(syncDataManager.isSyncNeeded(lastSynced, timeDelay)).toBe(true);
    });
  });

  describe('deleteDatabase', () => {
    it('should delete database', async () => {
      const deleteDBMock = deleteDB as jest.Mock;
      deleteDBMock.mockResolvedValue(undefined);

      await syncDataManager.deleteDatabase();

      expect(deleteDBMock).toHaveBeenCalledTimes(1);
      expect(deleteDBMock).toHaveBeenCalledWith(dbName);
    });

    it('should throw error if deleting fails', async () => {
      const deleteDBMock = deleteDB as jest.Mock;
      deleteDBMock.mockRejectedValue(new Error('Deleting error'));

      await expect(syncDataManager.deleteDatabase()).rejects.toThrowError('Deleting error');
    });
  });
})
