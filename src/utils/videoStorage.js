/**
 * IndexedDB Persistent Video Storage & YouTube Utility for POLIMDO Lab Signage
 * Allows local video files (MP4/WebM/MOV) and YouTube/Cloud links to be stored permanently
 * in browser storage so they NEVER disappear when refreshed, closed, or restarted.
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
 * Robustly extracts YouTube Video ID from any standard URL format:
 * - https://youtu.be/ID?si=...
 * - https://www.youtube.com/watch?v=ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 * - https://www.youtube.com/live/ID
 * - http://m.youtube.com/...
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  if (!clean) return null;

  try {
    // 1. Check youtu.be shortlinks
    if (clean.includes('youtu.be/')) {
      const path = clean.split('youtu.be/')[1];
      const id = path.split(/[?&#/]/)[0];
      if (id && id.length === 11) return id;
    }

    // 2. Check standard youtube.com links
    if (clean.includes('youtube.com/')) {
      const fullUrl = clean.startsWith('http') ? clean : `https://${clean}`;
      const urlObj = new URL(fullUrl);

      // Query param ?v=
      const vParam = urlObj.searchParams.get('v');
      if (vParam && vParam.length === 11) return vParam;

      // Path based: /embed/ID, /shorts/ID, /live/ID, /v/ID
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      for (let i = 0; i < pathParts.length; i++) {
        if (['embed', 'shorts', 'live', 'v'].includes(pathParts[i]) && pathParts[i + 1]) {
          const possibleId = pathParts[i + 1].split(/[?&#/]/)[0];
          if (possibleId && possibleId.length === 11) return possibleId;
        }
      }
    }
  } catch {}

  // 3. Regex fallback
  const match = clean.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

/**
 * Extracts Google Drive preview URL from sharing links
 */
export function extractGoogleDrivePreview(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  const matchFile = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) return `https://drive.google.com/file/d/${matchFile[1]}/preview`;
  const matchId = clean.match(/drive\.google\.com\/(?:open|uc|file)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (matchId) return `https://drive.google.com/file/d/${matchId[1]}/preview`;
  return null;
}

/**
 * Saves a local Video File or YouTube/Cloud Link into IndexedDB permanently
 * @param {string} id - Unique video ID
 * @param {Blob|File|null} blob - Video file binary if local file, or null if cloud/YouTube
 * @param {object} meta - Metadata (title, duration, thumbnail, url, etc.)
 * @returns {Promise<boolean>}
 */
export async function saveLocalVideoBlob(id, blob, meta = {}) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result || {};
        
        const finalBlob = blob || existing.blob || null;
        const targetUrl = meta.url || meta.rawUrl || existing.url || (finalBlob ? `indexeddb://${id}` : '');
        const targetRawUrl = meta.rawUrl || meta.url || existing.rawUrl || (finalBlob ? `indexeddb://${id}` : '');
        const ytId = extractYouTubeId(targetUrl);
        const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

        const record = {
          ...existing,
          id,
          blob: finalBlob,
          url: targetUrl,
          rawUrl: targetRawUrl,
          updatedAt: Date.now(),
          type: finalBlob?.type || 'video/mp4',
          title: meta.title || existing.title || 'Video Signage',
          titleEn: meta.titleEn || existing.titleEn || meta.title || existing.title || 'Signage Video',
          category: meta.category || existing.category || 'instructional',
          categoryEn: meta.categoryEn || existing.categoryEn || 'Instructional & Practicum',
          duration: meta.duration || existing.duration || '03:00',
          durationSec: parseDurationSeconds(meta.duration || existing.duration, meta.durationSec || existing.durationSec || 180),
          thumbnail: meta.thumbnail || existing.thumbnail || autoThumb || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          description: meta.description || existing.description || '',
          descriptionEn: meta.descriptionEn || existing.descriptionEn || '',
          scheduleSlot: meta.scheduleSlot || existing.scheduleSlot || 'Rotasi Teratur',
          active: meta.active !== false && existing.active !== false,
          isActive: meta.isActive !== false && existing.isActive !== false,
          loop: meta.loop !== false && existing.loop !== false,
          order: meta.order || existing.order || 1
        };

        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = (e) => reject(e.target.error);
      };
      getReq.onerror = (e) => reject(e.target.error);
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
        if (record && record.blob && record.blob instanceof Blob) {
          try {
            const blobUrl = URL.createObjectURL(record.blob);
            resolve(blobUrl);
          } catch {
            resolve(null);
          }
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
 * Deletes a local Video from IndexedDB
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

      video.onloadeddata = () => {
        try {
          video.currentTime = Math.min(1.0, (video.duration || 2) / 2);
        } catch {
          capture();
        }
      };

      video.onseeked = () => {
        capture();
      };

      const capture = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          clearTimeout(timer);
          finish(dataUrl);
        } catch {
          clearTimeout(timer);
          finish('');
        }
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
 * Extracts exact duration from a video file
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

    const timer = setTimeout(() => finish({ duration: '03:00', durationSec: 180 }), 4000);

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
