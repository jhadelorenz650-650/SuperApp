import { useEffect, useState } from 'react';

// Photos pasted into notebook pages are stored as Blobs in IndexedDB.
// localStorage only keeps lightweight placement metadata ({ blobId, x, y, w, aspect }),
// so a handful of photos can never exhaust the ~5MB localStorage quota.

const DB_NAME = 'superapp_notebook_media_v1';
const STORE_NAME = 'images';
const MAX_EDGE_PX = 1600;
const ENCODE_QUALITY = 0.86;

let dbPromise = null;
const urlCache = new Map();
const pendingLoads = new Map();

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function runRequest(mode, buildRequest) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = buildRequest(tx.objectStore(STORE_NAME));
        tx.oncomplete = () => resolve(request ? request.result : undefined);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export function createImageId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveImageBlob(id, blob) {
  await runRequest('readwrite', (store) =>
    store.put({ blob, createdAt: Date.now() }, id)
  );
  if (!urlCache.has(id)) {
    urlCache.set(id, URL.createObjectURL(blob));
  }
}

export function getCachedImageUrl(id) {
  return id ? urlCache.get(id) || null : null;
}

export function loadImageUrl(id) {
  if (!id) return Promise.resolve(null);
  const cached = urlCache.get(id);
  if (cached) return Promise.resolve(cached);
  if (pendingLoads.has(id)) return pendingLoads.get(id);

  const load = runRequest('readonly', (store) => store.get(id))
    .then((record) => {
      const blob = record?.blob;
      if (!blob) return null;
      const url = URL.createObjectURL(blob);
      urlCache.set(id, url);
      return url;
    })
    .finally(() => {
      pendingLoads.delete(id);
    });
  pendingLoads.set(id, load);
  return load;
}

export function useNotebookImageUrl(id) {
  const [state, setState] = useState(() => ({
    id,
    url: getCachedImageUrl(id),
    missing: false,
  }));

  useEffect(() => {
    let alive = true;
    const cached = getCachedImageUrl(id);
    if (cached) {
      setState({ id, url: cached, missing: false });
      return undefined;
    }
    setState({ id, url: null, missing: false });
    loadImageUrl(id)
      .then((url) => {
        if (alive) setState({ id, url, missing: !url });
      })
      .catch(() => {
        if (alive) setState({ id, url: null, missing: true });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return state.id === id ? state : { id, url: null, missing: false };
}

// Remove stored photos that no saved notebook page references anymore.
// Only blobs older than `minAgeMs` are removed so photos added in another
// open tab (or still reachable through this session's undo history) survive.
export async function pruneUnusedImages(referencedIds, minAgeMs = 60 * 60 * 1000) {
  const db = await openDb();
  const cutoff = Date.now() - minAgeMs;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      const key = cursor.key;
      const createdAt = cursor.value?.createdAt || 0;
      if (!referencedIds.has(key) && createdAt < cutoff) {
        cursor.delete();
        const url = urlCache.get(key);
        if (url) {
          URL.revokeObjectURL(url);
          urlCache.delete(key);
        }
      }
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function decodeImage(file) {
  if (typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(file, {
        imageOrientation: 'from-image',
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close?.(),
      };
    } catch {
      // Fall back to <img> decoding (older Safari rejects the options bag)
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = objectUrl;
    if (typeof img.decode === 'function') {
      await img.decode();
    } else {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    }
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

// Downscale large photos (phone cameras, 4K screenshots) to keep storage lean.
export async function prepareImageFile(file) {
  const decoded = await decodeImage(file);
  try {
    const { width, height } = decoded;
    if (!width || !height) throw new Error('This image could not be read.');

    const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded.source, 0, 0, targetW, targetH);

    // WebP keeps transparency and compresses well; fall back where unsupported
    let blob = await canvasToBlob(canvas, 'image/webp', ENCODE_QUALITY);
    if (!blob || blob.type !== 'image/webp') {
      if (file.type === 'image/png') {
        blob = await canvasToBlob(canvas, 'image/png');
      } else {
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        blob = await canvasToBlob(canvas, 'image/jpeg', ENCODE_QUALITY);
      }
    }
    if (!blob) throw new Error('This image could not be processed.');

    return { blob, width: targetW, height: targetH };
  } finally {
    decoded.cleanup();
  }
}

export function requestPersistentStorage() {
  try {
    navigator.storage?.persist?.().catch(() => {});
  } catch {
    // Ignore unsupported browsers
  }
}
