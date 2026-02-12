const DB_NAME = 'fitforge-db';
const DB_VERSION = 1;

export async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const store = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date');
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(storeName, mode, action) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = action(store);
    transaction.oncomplete = () => resolve(result?.result ?? result);
    transaction.onerror = () => reject(transaction.error);
  });
}

export const dbApi = {
  saveProfile(profile) {
    return tx('profile', 'readwrite', (store) => store.put({ ...profile, id: 'me' }));
  },
  getProfile() {
    return tx('profile', 'readonly', (store) => store.get('me'));
  },
  addSession(session) {
    return tx('sessions', 'readwrite', (store) => store.add(session));
  },
  getSessions() {
    return tx('sessions', 'readonly', (store) => store.getAll());
  }
};
