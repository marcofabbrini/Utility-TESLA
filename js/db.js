const DB_NAME = 'model3-owner-hub';
const DB_VERSION = 1;
let dbPromise = null;
function openDb() {
    if (dbPromise)
        return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('documents'))
                db.createObjectStore('documents', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('photos'))
                db.createObjectStore('photos', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('services'))
                db.createObjectStore('services', { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}
function requestToPromise(req) {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
async function withStore(storeName, mode, work) {
    const db = await openDb();
    const tx = db.transaction(storeName, mode);
    const result = await requestToPromise(work(tx.objectStore(storeName)));
    await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
    return result;
}
export const db = {
    async listDocuments() {
        const rows = await withStore('documents', 'readonly', s => s.getAll());
        return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async addDocument(doc) {
        await withStore('documents', 'readwrite', s => s.put(doc));
    },
    async deleteDocument(id) {
        await withStore('documents', 'readwrite', s => s.delete(id));
    },
    async listPhotos() {
        const rows = await withStore('photos', 'readonly', s => s.getAll());
        return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async addPhoto(photo) {
        await withStore('photos', 'readwrite', s => s.put(photo));
    },
    async deletePhoto(id) {
        await withStore('photos', 'readwrite', s => s.delete(id));
    },
    async listServices() {
        const rows = await withStore('services', 'readonly', s => s.getAll());
        return rows.sort((a, b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt));
    },
    async addService(entry) {
        await withStore('services', 'readwrite', s => s.put(entry));
    },
    async deleteService(id) {
        await withStore('services', 'readwrite', s => s.delete(id));
    },
    async clearAll() {
        const database = await openDb();
        const tx = database.transaction(['documents', 'photos', 'services'], 'readwrite');
        tx.objectStore('documents').clear();
        tx.objectStore('photos').clear();
        tx.objectStore('services').clear();
        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }
};
//# sourceMappingURL=db.js.map