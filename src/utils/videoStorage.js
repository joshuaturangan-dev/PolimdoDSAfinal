/**
 * IndexedDB Persistent Video Storage for POLIMDO Lab Signage
 * Allows local video files (MP4/WebM/MOV) to be stored permanently in browser storage (up to several GBs)
 * so they NEVER disappear when the browser is closed, refreshed, or restarted.
 */

const DB_NAME = 'PolimdoSignageVideoDB';
const DB_VERSION = 1;
const STORE_NAME = 'video_blobs';

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });

  return dbPromise;
}

/**
 * Saves a local Video File or Blob into IndexedDB permanently
 * @param {string} id - Unique video ID
 * @param {Blob|File} blob - Video file binary
 * @param {object} meta - Optional metadata (title, duration, thumbnail, etc.)
 * @returns {Promise<boolean>}
 */
export async function saveLocalVideoBlob(id, blob, meta = {}) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // If blob is not provided (e.g. metadata-only update), preserve existing blob
      if (!blob) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result || {};
          const record = {
            ...existing,
            id,
            updatedAt: Date.now(),
            ...(meta.title ? { title: meta.title } : {}),
            ...(meta.titleEn ? { titleEn: meta.titleEn } : {}),
            ...(meta.category ? { category: meta.category } : {}),
            ...(meta.duration ? { duration: meta.duration } : {}),
            ...(meta.durationSec ? { durationSec: meta.durationSec } : {}),
            ...(meta.thumbnail ? { thumbnail: meta.thumbnail } : {}),
            ...(meta.description ? { description: meta.description } : {}),
            ...(meta.scheduleSlot ? { scheduleSlot: meta.scheduleSlot } : {})
          };
          const putReq = store.put(record);
          putReq.onsuccess = () => resolve(true);
          putReq.onerror = (e) => reject(e.target.error);
        };
        getReq.onerror = (e) => reject(e.target.error);
        return;
      }

      const record = {
        id,
        blob,
        updatedAt: Date.now(),
        type: blob.type || 'video/mp4',
        title: meta.title || '',
        titleEn: meta.titleEn || '',
        category: meta.category || 'instructional',
        duration: meta.duration || '03:00',
        durationSec: meta.durationSec || 180,
        thumbnail: meta.thumbnail || '',
        description: meta.description || '',
        scheduleSlot: meta.scheduleSlot || 'Rotasi Teratur'
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to save video to IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieves a local Video Blob from IndexedDB and creates a working ObjectURL
 * @param {string} id - Unique video ID
 * @returns {Promise<string|null>} - Active ObjectURL or null
 */
export async function getLocalVideoBlobUrl(id) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const record = req.result;
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve video from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes a local Video Blob from IndexedDB
 * @param {string} id
 */
export async function deleteLocalVideoBlob(id) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Failed to delete video from IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieves all stored video records from IndexedDB
 * @returns {Promise<Array>}
 */
export async function getAllLocalVideoRecords() {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result || []);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to retrieve all records from IndexedDB:', err);
    return [];
  }
}

/**
 * Automatically captures a thumbnail image (first frame) from a local Video File
 * @param {File|Blob} file
 * @returns {Promise<string>} - Base64 Data URL of the thumbnail
 */
export function generateVideoThumbnail(file) {
  return new Promise((resolve) => {
    let resolved = false;
    let tempUrl = '';
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      if (tempUrl) {
        try { URL.revokeObjectURL(tempUrl); } catch {}
      }
      resolve(result || '');
    };

    // Timeout safety 4s
    const timer = setTimeout(() => finish(''), 4000);

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      tempUrl = URL.createObjectURL(file);
      video.src = tempUrl;

      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 640;
          let w = video.videoWidth || 640;
          let h = video.videoHeight || 360;

          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, w, h);
          const thumbBase64 = canvas.toDataURL('image/jpeg', 0.85);
          clearTimeout(timer);
          finish(thumbBase64);
        } catch {
          clearTimeout(timer);
          finish('');
        }
      };

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, Math.max(0.1, (video.duration || 1) * 0.1));
      };

      video.onseeked = () => {
        captureFrame();
      };

      video.onerror = () => {
        clearTimeout(timer);
        finish('');
      };

      video.load();
    } catch {
      clearTimeout(timer);
      finish('');
    }
  });
}

/**
 * Extracts exact duration string (MM:SS) and seconds from a Video File
 * @param {File|Blob} file
 * @returns {Promise<{duration: string, durationSec: number}>}
 */
export function extractVideoDuration(file) {
  return new Promise((resolve) => {
    let resolved = false;
    let tempUrl = '';
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      if (tempUrl) {
        try { URL.revokeObjectURL(tempUrl); } catch {}
      }
      resolve(result);
    };

    const timer = setTimeout(() => finish({ duration: '03:00', durationSec: 180 }), 3000);

    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      tempUrl = URL.createObjectURL(file);
      video.src = tempUrl;

      video.onloadedmetadata = () => {
        const sec = Math.round(video.duration || 0);
        const mins = Math.floor(sec / 60);
        const remainingSec = sec % 60;
        const formatted = String(mins).padStart(2, '0') + ':' + String(remainingSec).padStart(2, '0');
        clearTimeout(timer);
        finish({
          duration: sec > 0 ? formatted : '03:00',
          durationSec: sec > 0 ? sec : 180
        });
      };

      video.onerror = () => {
        clearTimeout(timer);
        finish({ duration: '03:00', durationSec: 180 });
      };

      video.load();
    } catch {
      clearTimeout(timer);
      finish({ duration: '03:00', durationSec: 180 });
    }
  });
}

/**
 * Robustly parses duration string (e.g. "00:30", "30s", "1m", "02:15", "180") into total seconds
 * @param {string|number} durationStr
 * @param {number} fallbackSec
 * @returns {number}
 */
export function parseDurationSeconds(durationStr, fallbackSec = 180) {
  if (typeof durationStr === 'number') {
    return durationStr > 0 ? durationStr : fallbackSec;
  }
  if (!durationStr || typeof durationStr !== 'string') {
    return fallbackSec;
  }

  const clean = durationStr.trim().toLowerCase();
  if (!clean) return fallbackSec;

  // Handle "30s", "1m", "5m"
  if (clean.endsWith('s')) {
    const num = parseInt(clean.slice(0, -1), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  if (clean.endsWith('m')) {
    const num = parseInt(clean.slice(0, -1), 10);
    if (!isNaN(num) && num > 0) return num * 60;
  }

  // Handle "MM:SS" or "HH:MM:SS"
  if (clean.includes(':')) {
    const parts = clean.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return Math.max(1, parts[0] * 60 + parts[1]);
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return Math.max(1, parts[0] * 3600 + parts[1] * 60 + parts[2]);
    }
  }

  // Pure integer string "30", "180"
  const parsed = parseInt(clean, 10);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  return fallbackSec;
}
