(function attachRepository(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.YyoinkWiki = root.YyoinkWiki || {};
  root.YyoinkWiki.repository = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRepositoryModule() {
  const DB_NAME = "yyoink-wiki";
  const DB_VERSION = 1;
  const STORES = ["topics", "sources", "wikiPages", "aiDrafts"];

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("topics")) {
          db.createObjectStore("topics", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("sources")) {
          const store = db.createObjectStore("sources", { keyPath: "id" });
          store.createIndex("topicId", "topicId", { unique: false });
          store.createIndex("aiStatus", "aiStatus", { unique: false });
        }
        if (!db.objectStoreNames.contains("wikiPages")) {
          const store = db.createObjectStore("wikiPages", { keyPath: "id" });
          store.createIndex("topicId", "topicId", { unique: false });
        }
        if (!db.objectStoreNames.contains("aiDrafts")) {
          const store = db.createObjectStore("aiDrafts", { keyPath: "id" });
          store.createIndex("topicId", "topicId", { unique: false });
          store.createIndex("status", "status", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(storeName, mode, callback) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = callback(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }).finally(() => db.close());
  }

  async function withStores(storeNames, mode, callback) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);
      const stores = Object.fromEntries(storeNames.map((name) => [name, tx.objectStore(name)]));
      const result = callback(stores);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }).finally(() => db.close());
  }

  async function getAll(storeName) {
    return withStore(storeName, "readonly", (store) => requestToPromise(store.getAll()));
  }

  async function getById(storeName, id) {
    return withStore(storeName, "readonly", (store) => requestToPromise(store.get(id)));
  }

  async function put(storeName, record) {
    await withStore(storeName, "readwrite", (store) => store.put(record));
    return record;
  }

  async function remove(storeName, id) {
    await withStore(storeName, "readwrite", (store) => store.delete(id));
    return id;
  }

  async function getAllByIndex(storeName, indexName, value) {
    return withStore(storeName, "readonly", (store) => requestToPromise(store.index(indexName).getAll(value)));
  }

  async function replaceAll({ topics, sources, wikiPages, aiDrafts }) {
    await withStores(STORES, "readwrite", (stores) => {
      STORES.forEach((storeName) => stores[storeName].clear());
      (topics || []).forEach((record) => stores.topics.put(record));
      (sources || []).forEach((record) => stores.sources.put(record));
      (wikiPages || []).forEach((record) => stores.wikiPages.put(record));
      (aiDrafts || []).forEach((record) => stores.aiDrafts.put(record));
    });
  }

  async function markTopicSourcesProcessed(topicId, sourceIds) {
    const sources = await getAllByIndex("sources", "topicId", topicId);
    const sourceSet = new Set(sourceIds);
    await withStore("sources", "readwrite", (store) => {
      sources.forEach((source) => {
        if (sourceSet.has(source.id)) {
          store.put({ ...source, aiStatus: "processed", updatedAt: new Date().toISOString() });
        }
      });
    });
  }

  return {
    openDatabase,
    getAll,
    getById,
    put,
    remove,
    getAllByIndex,
    replaceAll,
    markTopicSourcesProcessed,
  };
});
