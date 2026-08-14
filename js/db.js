const DB_NAME = 'BalanceCheckerDB';
const DB_VERSION = 1;
const TRANSACTIONS_STORE = 'transactions';
const SETTINGS_STORE = 'settings';

let db = null;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains(TRANSACTIONS_STORE)) {
                const transactionsStore = database.createObjectStore(TRANSACTIONS_STORE, { keyPath: 'id' });
                transactionsStore.createIndex('date', 'date', { unique: false });
                transactionsStore.createIndex('name', 'name', { unique: false });
                transactionsStore.createIndex('category', 'category', { unique: false });
            }

            if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
                database.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
            }
        };
    });
}

function getAllTransactions() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([TRANSACTIONS_STORE], 'readonly');
        const store = transaction.objectStore(TRANSACTIONS_STORE);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function getTransaction(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([TRANSACTIONS_STORE], 'readonly');
        const store = transaction.objectStore(TRANSACTIONS_STORE);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function addTransaction(transaction) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transactionObj = db.transaction([TRANSACTIONS_STORE], 'readwrite');
        const store = transactionObj.objectStore(TRANSACTIONS_STORE);
        const request = store.add(transaction);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(transaction);
    });
}

function updateTransaction(transaction) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transactionObj = db.transaction([TRANSACTIONS_STORE], 'readwrite');
        const store = transactionObj.objectStore(TRANSACTIONS_STORE);
        const request = store.put(transaction);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(transaction);
    });
}

function deleteTransaction(id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([TRANSACTIONS_STORE], 'readwrite');
        const store = transaction.objectStore(TRANSACTIONS_STORE);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

function clearAllTransactions() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([TRANSACTIONS_STORE], 'readwrite');
        const store = transaction.objectStore(TRANSACTIONS_STORE);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

function getSetting(key) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([SETTINGS_STORE], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ? request.result.value : null);
    });
}

function setSetting(key, value) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.put({ key, value });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(value);
    });
}

function clearAllSettings() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

function clearAllData() {
    return Promise.all([clearAllTransactions(), clearAllSettings()]);
}
