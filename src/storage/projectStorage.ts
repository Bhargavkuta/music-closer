import { ProjectData, TrackData, PatternData, SectionData } from '../types/project';

const DB_NAME = 'MusicCloserDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const ACTIVE_PROJECT_KEY = 'music_closer_active_project_id';

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and caches the IndexedDB connection.
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Validates and safely normalizes any project data loaded from storage.
 * Handles missing fields, bad types, or legacy versions gracefully.
 */
export function validateProjectData(raw: unknown): ProjectData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid project structure');
  }

  const p = raw as Partial<ProjectData>;

  const id = typeof p.id === 'string' && p.id.trim() ? p.id : `proj_${Date.now()}`;
  const title = typeof p.title === 'string' && p.title.trim() ? p.title.trim() : 'Untitled Project';
  const bpm = typeof p.bpm === 'number' && p.bpm >= 40 && p.bpm <= 280 ? p.bpm : 120;
  const timeSignature: [number, number] = 
    Array.isArray(p.timeSignature) && p.timeSignature.length === 2 && typeof p.timeSignature[0] === 'number'
      ? [p.timeSignature[0], p.timeSignature[1]]
      : [4, 4];

  // Validate tracks
  const tracks: TrackData[] = Array.isArray(p.tracks) 
    ? p.tracks.map((t, idx) => ({
        id: typeof t.id === 'string' ? t.id : `track_${idx}`,
        name: typeof t.name === 'string' ? t.name : `Track ${idx + 1}`,
        instrument: t.instrument || 'piano',
        volume: typeof t.volume === 'number' ? Math.max(0, Math.min(1.25, t.volume)) : 0.8,
        pan: typeof t.pan === 'number' ? Math.max(-1, Math.min(1, t.pan)) : 0,
        isMuted: Boolean(t.isMuted),
        isSoloed: Boolean(t.isSoloed),
        color: typeof t.color === 'string' ? t.color : '#6366f1',
        notes: Array.isArray(t.notes) ? t.notes : [],
        clips: Array.isArray(t.clips) ? t.clips : [],
        eq: t.eq ? {
          low: typeof t.eq.low === 'number' ? t.eq.low : 0,
          mid: typeof t.eq.mid === 'number' ? t.eq.mid : 0,
          high: typeof t.eq.high === 'number' ? t.eq.high : 0,
        } : { low: 0, mid: 0, high: 0 },
        reverbSend: typeof t.reverbSend === 'number' ? t.reverbSend : 0.15,
        delaySend: typeof t.delaySend === 'number' ? t.delaySend : 0
      }))
    : [];

  // Validate patterns
  const patterns: PatternData[] = Array.isArray(p.patterns)
    ? p.patterns.map((pat, idx) => ({
        id: typeof pat.id === 'string' ? pat.id : `pat_${idx}`,
        name: typeof pat.name === 'string' ? pat.name : `Pattern ${idx + 1}`,
        durationBars: typeof pat.durationBars === 'number' ? pat.durationBars : 4,
        instrument: pat.instrument || 'piano',
        color: pat.color || '#6366f1',
        notes: Array.isArray(pat.notes) ? pat.notes : [],
        drumPattern: pat.drumPattern
      }))
    : [];

  // Validate sections
  const sections: SectionData[] = Array.isArray(p.sections)
    ? p.sections.map((sec, idx) => ({
        id: typeof sec.id === 'string' ? sec.id : `sec_${idx}`,
        name: typeof sec.name === 'string' ? sec.name : 'Verse',
        startBar: typeof sec.startBar === 'number' ? sec.startBar : 1,
        lengthBars: typeof sec.lengthBars === 'number' ? sec.lengthBars : 4,
        color: typeof sec.color === 'string' ? sec.color : '#6366f1',
      }))
    : [];

  return {
    id,
    title,
    bpm,
    timeSignature,
    tracks,
    patterns,
    sections,
    masterFx: p.masterFx || {
      volume: 1.0,
      pan: 0,
      isMuted: false,
      reverbWet: 0.15,
      delayWet: 0,
      limiterActive: true
    },
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
    updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : Date.now(),
    version: '1.0.0'
  };
}

/**
 * Saves a project to IndexedDB (with LocalStorage fallback).
 */
export async function saveProjectToDB(project: ProjectData): Promise<void> {
  const validated = validateProjectData({ ...project, updatedAt: Date.now() });

  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(validated);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    setActiveProjectId(validated.id);
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to LocalStorage:', err);
    try {
      localStorage.setItem(`music_closer_proj_${validated.id}`, JSON.stringify(validated));
      setActiveProjectId(validated.id);
    } catch (localErr) {
      console.error('LocalStorage save also failed:', localErr);
    }
  }
}

/**
 * Loads a project from IndexedDB by ID.
 */
export async function loadProjectFromDB(id: string): Promise<ProjectData | null> {
  try {
    const db = await initDB();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (result) {
      return validateProjectData(result);
    }
  } catch (err) {
    console.warn('IndexedDB read failed, trying LocalStorage fallback:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`music_closer_proj_${id}`);
    if (raw) {
      return validateProjectData(JSON.parse(raw));
    }
  } catch {
    // Ignore fallback parse error
  }

  return null;
}

/**
 * Loads all saved projects from IndexedDB.
 */
export async function loadAllProjectsFromDB(): Promise<ProjectData[]> {
  try {
    const db = await initDB();
    const results = await new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (results && results.length > 0) {
      return results.map(validateProjectData).sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch (err) {
    console.warn('IndexedDB getAll failed, falling back to LocalStorage scan:', err);
  }

  // LocalStorage fallback scan
  const list: ProjectData[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('music_closer_proj_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          list.push(validateProjectData(JSON.parse(raw)));
        }
      }
    }
  } catch {
    // Ignore
  }

  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Deletes a project from IndexedDB and LocalStorage.
 */
export async function deleteProjectFromDB(id: string): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }

  try {
    localStorage.removeItem(`music_closer_proj_${id}`);
    if (getActiveProjectId() === id) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Active project ID helpers using LocalStorage.
 */
export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch {
    // Ignore
  }
}
