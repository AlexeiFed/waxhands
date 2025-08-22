// Утилиты для работы с IndexedDB
export class MediaStorage {
    private dbName = 'WaxHandsMediaDB';
    private version = 1;
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Создаем хранилище для медиа-файлов
                if (!db.objectStoreNames.contains('media')) {
                    const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
                    mediaStore.createIndex('type', 'type', { unique: false });
                    mediaStore.createIndex('entityId', 'entityId', { unique: false });
                }
            };
        });
    }

    async saveMedia(id: string, type: 'avatar' | 'image' | 'video', entityId: string, data: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['media'], 'readwrite');
            const store = transaction.objectStore('media');

            const mediaItem = {
                id,
                type,
                entityId,
                data,
                timestamp: Date.now()
            };

            const request = store.put(mediaItem);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getMedia(id: string): Promise<string | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['media'], 'readonly');
            const store = transaction.objectStore('media');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result?.data || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMedia(id: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['media'], 'readwrite');
            const store = transaction.objectStore('media');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteEntityMedia(entityId: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['media'], 'readwrite');
            const store = transaction.objectStore('media');
            const index = store.index('entityId');
            const request = index.openCursor(IDBKeyRange.only(entityId));

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAllMediaForEntity(entityId: string): Promise<Array<{ id: string; type: string; data: string }>> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['media'], 'readonly');
            const store = transaction.objectStore('media');
            const index = store.index('entityId');
            const request = index.getAll(IDBKeyRange.only(entityId));

            request.onsuccess = () => {
                resolve(request.result.map(item => ({
                    id: item.id,
                    type: item.type,
                    data: item.data
                })));
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Глобальный экземпляр для использования в приложении
export const mediaStorage = new MediaStorage();

// Утилиты для работы с файлами
export const generateMediaId = (entityId: string, type: string, index?: number): string => {
    return `${entityId}_${type}_${index || Date.now()}`;
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const filesToBase64 = async (files: File[]): Promise<string[]> => {
    const base64Promises = files.map(file => fileToBase64(file));
    return Promise.all(base64Promises);
}; 