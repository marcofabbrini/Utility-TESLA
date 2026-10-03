export type DocumentCategory = 'Assicurazione' | 'Libretto' | 'Manutenzione' | 'Acquisto' | 'Garanzia' | 'Altro';

export interface GarageDocument {
  id: string;
  name: string;
  mime: string;
  size: number;
  category: DocumentCategory;
  expiry: string;
  note: string;
  createdAt: string;
  blob: Blob;
}

export interface GaragePhoto {
  id: string;
  name: string;
  mime: string;
  createdAt: string;
  blob: Blob;
}

export interface ServiceEntry {
  id: string;
  date: string;
  odometer: number;
  title: string;
  workshop: string;
  cost: number | null;
  note: string;
  createdAt: string;
  attachmentName?: string;
  attachmentMime?: string;
  attachmentBlob?: Blob;
}

const DB_NAME = 'model3-owner-hub';
const DB_VERSION = 1;
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('services')) db.createObjectStore('services', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(storeName: 'documents' | 'photos' | 'services', mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  const result = await requestToPromise(work(tx.objectStore(storeName)));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return result;
}

export const db = {
  async listDocuments(): Promise<GarageDocument[]> {
    const rows = await withStore<GarageDocument[]>('documents', 'readonly', s => s.getAll());
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addDocument(doc: GarageDocument): Promise<void> {
    await withStore<IDBValidKey>('documents', 'readwrite', s => s.put(doc));
  },
  async deleteDocument(id: string): Promise<void> {
    await withStore<undefined>('documents', 'readwrite', s => s.delete(id) as IDBRequest<undefined>);
  },
  async listPhotos(): Promise<GaragePhoto[]> {
    const rows = await withStore<GaragePhoto[]>('photos', 'readonly', s => s.getAll());
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addPhoto(photo: GaragePhoto): Promise<void> {
    await withStore<IDBValidKey>('photos', 'readwrite', s => s.put(photo));
  },
  async deletePhoto(id: string): Promise<void> {
    await withStore<undefined>('photos', 'readwrite', s => s.delete(id) as IDBRequest<undefined>);
  },
  async listServices(): Promise<ServiceEntry[]> {
    const rows = await withStore<ServiceEntry[]>('services', 'readonly', s => s.getAll());
    return rows.sort((a, b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt));
  },
  async addService(entry: ServiceEntry): Promise<void> {
    await withStore<IDBValidKey>('services', 'readwrite', s => s.put(entry));
  },
  async deleteService(id: string): Promise<void> {
    await withStore<undefined>('services', 'readwrite', s => s.delete(id) as IDBRequest<undefined>);
  },
  async clearAll(): Promise<void> {
    const database = await openDb();
    const tx = database.transaction(['documents', 'photos', 'services'], 'readwrite');
    tx.objectStore('documents').clear();
    tx.objectStore('photos').clear();
    tx.objectStore('services').clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
};
