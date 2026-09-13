import { create } from 'zustand';
import { ProjectData, TrackData, TrackClip, PatternData, SectionData, TrackEq, MasterFxData } from '../types/project';
import { NoteEvent } from '../types/music';
import { InstrumentType, DrumSound } from '../types/audio';
import { GridDivision, quantizeNotes } from '../music/quantization';
import { AudioEngine } from '../audio/AudioEngine';
import { 
  initDB, 
  saveProjectToDB, 
  loadProjectFromDB, 
  loadAllProjectsFromDB, 
  deleteProjectFromDB, 
  getActiveProjectId, 
  setActiveProjectId 
} from '../storage/projectStorage';

export const DEFAULT_DRUM_PATTERN: Record<DrumSound, boolean[]> = {
  kick:        [true,  false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false],
  snare:       [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
  hihatClosed: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
  hihatOpen:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
  clap:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  tom:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
};

const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  piano: '#6366f1',
  bass: '#3b82f6',
  guitar: '#f59e0b',
  synth: '#ec4899',
  drums: '#10b981',
};

const STARTER_PATTERNS: PatternData[] = [
  {
    id: 'pat_piano_chords',
    name: 'Intro Chords',
    durationBars: 4,
    instrument: 'piano',
    color: '#6366f1',
    notes: [
      // Bar 1: Cmaj
      { id: 'n_p1', pitch: 'C4', midi: 60, start: 0.0, duration: 1.8, velocity: 0.8 },
      { id: 'n_p2', pitch: 'E4', midi: 64, start: 0.0, duration: 1.8, velocity: 0.75 },
      { id: 'n_p3', pitch: 'G4', midi: 67, start: 0.0, duration: 1.8, velocity: 0.75 },
      // Bar 2: Gmaj
      { id: 'n_p4', pitch: 'G3', midi: 55, start: 2.0, duration: 1.8, velocity: 0.8 },
      { id: 'n_p5', pitch: 'B3', midi: 59, start: 2.0, duration: 1.8, velocity: 0.75 },
      { id: 'n_p6', pitch: 'D4', midi: 62, start: 2.0, duration: 1.8, velocity: 0.75 },
      // Bar 3: Amin
      { id: 'n_p7', pitch: 'A3', midi: 57, start: 4.0, duration: 1.8, velocity: 0.8 },
      { id: 'n_p8', pitch: 'C4', midi: 60, start: 4.0, duration: 1.8, velocity: 0.75 },
      { id: 'n_p9', pitch: 'E4', midi: 64, start: 4.0, duration: 1.8, velocity: 0.75 },
      // Bar 4: Fmaj
      { id: 'n_p10', pitch: 'F3', midi: 53, start: 6.0, duration: 1.8, velocity: 0.8 },
      { id: 'n_p11', pitch: 'A3', midi: 57, start: 6.0, duration: 1.8, velocity: 0.75 },
      { id: 'n_p12', pitch: 'C4', midi: 60, start: 6.0, duration: 1.8, velocity: 0.75 },
    ]
  },
  {
    id: 'pat_piano_melody',
    name: 'Verse Piano Melody',
    durationBars: 4,
    instrument: 'piano',
    color: '#818cf8',
    notes: [
      { id: 'n_vm1', pitch: 'C4', midi: 60, start: 0.0, duration: 0.45, velocity: 0.85 },
      { id: 'n_vm2', pitch: 'E4', midi: 64, start: 0.5, duration: 0.45, velocity: 0.8 },
      { id: 'n_vm3', pitch: 'G4', midi: 67, start: 1.0, duration: 0.8, velocity: 0.9 },
      { id: 'n_vm4', pitch: 'B3', midi: 59, start: 2.0, duration: 0.45, velocity: 0.8 },
      { id: 'n_vm5', pitch: 'D4', midi: 62, start: 2.5, duration: 0.45, velocity: 0.8 },
      { id: 'n_vm6', pitch: 'G4', midi: 67, start: 3.0, duration: 0.8, velocity: 0.9 },
      { id: 'n_vm7', pitch: 'A3', midi: 57, start: 4.0, duration: 0.45, velocity: 0.85 },
      { id: 'n_vm8', pitch: 'C4', midi: 60, start: 4.5, duration: 0.45, velocity: 0.8 },
      { id: 'n_vm9', pitch: 'E4', midi: 64, start: 5.0, duration: 0.8, velocity: 0.9 },
      { id: 'n_vm10', pitch: 'F3', midi: 53, start: 6.0, duration: 0.45, velocity: 0.8 },
      { id: 'n_vm11', pitch: 'A3', midi: 57, start: 6.5, duration: 0.45, velocity: 0.8 },
      { id: 'n_vm12', pitch: 'C4', midi: 60, start: 7.0, duration: 0.8, velocity: 0.85 },
    ]
  },
  {
    id: 'pat_bass_verse',
    name: 'Sub Bassline',
    durationBars: 4,
    instrument: 'bass',
    color: '#3b82f6',
    notes: [
      { id: 'n_b1', pitch: 'C2', midi: 36, start: 0.0, duration: 0.8, velocity: 0.85 },
      { id: 'n_b2', pitch: 'C2', midi: 36, start: 1.0, duration: 0.8, velocity: 0.85 },
      { id: 'n_b3', pitch: 'G1', midi: 31, start: 2.0, duration: 0.8, velocity: 0.85 },
      { id: 'n_b4', pitch: 'G1', midi: 31, start: 3.0, duration: 0.8, velocity: 0.85 },
      { id: 'n_b5', pitch: 'A1', midi: 33, start: 4.0, duration: 0.8, velocity: 0.85 },
      { id: 'n_b6', pitch: 'A1', midi: 33, start: 5.0, duration: 0.8, velocity: 0.85 },
      { id: 'n_b7', pitch: 'F1', midi: 29, start: 6.0, duration: 0.8, velocity: 0.85 },
      { id: 'n_b8', pitch: 'G1', midi: 31, start: 7.0, duration: 0.8, velocity: 0.85 },
    ]
  },
  {
    id: 'pat_drums_beat',
    name: 'Groove Drums',
    durationBars: 4,
    instrument: 'drums',
    color: '#10b981',
    notes: [],
    drumPattern: DEFAULT_DRUM_PATTERN
  },
  {
    id: 'pat_synth_lead',
    name: 'Analog Chorus Lead',
    durationBars: 4,
    instrument: 'synth',
    color: '#ec4899',
    notes: [
      { id: 'n_s1', pitch: 'E5', midi: 76, start: 0.0, duration: 0.4, velocity: 0.8 },
      { id: 'n_s2', pitch: 'G5', midi: 79, start: 0.5, duration: 0.4, velocity: 0.85 },
      { id: 'n_s3', pitch: 'A5', midi: 81, start: 1.0, duration: 0.9, velocity: 0.9 },
      { id: 'n_s4', pitch: 'D5', midi: 74, start: 2.0, duration: 0.4, velocity: 0.8 },
      { id: 'n_s5', pitch: 'F5', midi: 77, start: 2.5, duration: 0.4, velocity: 0.85 },
      { id: 'n_s6', pitch: 'G5', midi: 79, start: 3.0, duration: 0.9, velocity: 0.9 },
      { id: 'n_s7', pitch: 'C5', midi: 72, start: 4.0, duration: 0.4, velocity: 0.8 },
      { id: 'n_s8', pitch: 'E5', midi: 76, start: 4.5, duration: 0.4, velocity: 0.85 },
      { id: 'n_s9', pitch: 'A5', midi: 81, start: 5.0, duration: 0.9, velocity: 0.9 },
      { id: 'n_s10', pitch: 'G5', midi: 79, start: 6.0, duration: 0.4, velocity: 0.8 },
      { id: 'n_s11', pitch: 'E5', midi: 76, start: 6.5, duration: 0.4, velocity: 0.85 },
      { id: 'n_s12', pitch: 'C5', midi: 72, start: 7.0, duration: 0.9, velocity: 0.9 },
    ]
  }
];

const STARTER_TRACKS: TrackData[] = [
  {
    id: 'track_piano_1',
    name: 'Grand Piano',
    instrument: 'piano',
    volume: 0.85,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    color: '#6366f1',
    notes: [],
    clips: [
      { id: 'clip_p1', patternId: 'pat_piano_chords', startBar: 1, durationBars: 4 },
      { id: 'clip_p2', patternId: 'pat_piano_melody', startBar: 5, durationBars: 4 },
      { id: 'clip_p3', patternId: 'pat_piano_melody', startBar: 9, durationBars: 4 },
      { id: 'clip_p4', patternId: 'pat_piano_chords', startBar: 13, durationBars: 4 },
    ]
  },
  {
    id: 'track_drums_1',
    name: 'Drum Machine',
    instrument: 'drums',
    volume: 0.85,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    color: '#10b981',
    notes: [],
    clips: [
      { id: 'clip_d1', patternId: 'pat_drums_beat', startBar: 5, durationBars: 4 },
      { id: 'clip_d2', patternId: 'pat_drums_beat', startBar: 9, durationBars: 4 },
      { id: 'clip_d3', patternId: 'pat_drums_beat', startBar: 13, durationBars: 4 },
      { id: 'clip_d4', patternId: 'pat_drums_beat', startBar: 17, durationBars: 4 },
    ]
  },
  {
    id: 'track_bass_1',
    name: 'Electric Bass',
    instrument: 'bass',
    volume: 0.85,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    color: '#3b82f6',
    notes: [],
    clips: [
      { id: 'clip_b1', patternId: 'pat_bass_verse', startBar: 5, durationBars: 4 },
      { id: 'clip_b2', patternId: 'pat_bass_verse', startBar: 9, durationBars: 4 },
      { id: 'clip_b3', patternId: 'pat_bass_verse', startBar: 13, durationBars: 4 },
      { id: 'clip_b4', patternId: 'pat_bass_verse', startBar: 17, durationBars: 4 },
    ]
  },
  {
    id: 'track_synth_1',
    name: 'Analog Synth',
    instrument: 'synth',
    volume: 0.75,
    pan: 0,
    isMuted: false,
    isSoloed: false,
    color: '#ec4899',
    notes: [],
    clips: [
      { id: 'clip_s1', patternId: 'pat_synth_lead', startBar: 13, durationBars: 4 },
      { id: 'clip_s2', patternId: 'pat_synth_lead', startBar: 17, durationBars: 4 },
    ]
  }
];

const STARTER_SECTIONS: SectionData[] = [
  { id: 'sec_intro', name: 'Intro', startBar: 1, lengthBars: 4, color: '#3b82f6' },
  { id: 'sec_verse', name: 'Verse', startBar: 5, lengthBars: 8, color: '#10b981' },
  { id: 'sec_chorus', name: 'Chorus', startBar: 13, lengthBars: 8, color: '#f59e0b' },
  { id: 'sec_outro', name: 'Outro', startBar: 21, lengthBars: 4, color: '#8b5cf6' }
];

interface ProjectStoreState {
  currentProject: ProjectData;
  activeTrackId: string;
  recordMode: 'replace' | 'overdub';
  drumPattern: Record<DrumSound, boolean[]>;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;
  savedProjectsList: ProjectData[];

  // Persistence Actions
  initPersistence: () => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  loadProjectById: (id: string) => Promise<void>;
  createNewProject: (title?: string, template?: 'starter' | 'blank') => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshSavedProjectsList: () => Promise<void>;

  // Track & Mixer Actions
  setRecordMode: (mode: 'replace' | 'overdub') => void;
  setProjectTitle: (title: string) => void;
  setActiveTrackId: (id: string) => void;
  addTrack: (track: TrackData) => void;
  createTrack: (name: string, instrument: InstrumentType) => void;
  updateTrack: (id: string, updates: Partial<TrackData>) => void;
  deleteTrack: (id: string) => void;
  setTrackInstrument: (id: string, instrument: InstrumentType) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackPan: (id: string, pan: number) => void;
  setTrackEq: (id: string, eq: Partial<TrackEq>) => void;
  setMasterFx: (fx: Partial<MasterFxData>) => void;
  toggleTrackMute: (id: string) => void;
  toggleTrackSolo: (id: string) => void;

  // Note Actions
  setTrackNotes: (trackId: string, notes: NoteEvent[]) => void;
  addRecordedNotesToActiveTrack: (notes: NoteEvent[]) => void;
  addNoteToActiveTrack: (note: NoteEvent) => void;
  insertChordToActiveTrack: (chordNotes: NoteEvent[], startSeconds?: number) => void;
  updateNoteInActiveTrack: (noteId: string, updates: Partial<NoteEvent>) => void;
  deleteNoteFromActiveTrack: (noteId: string) => void;
  quantizeActiveTrackNotes: (grid: GridDivision) => void;
  clearActiveTrackNotes: () => void;

  // Pattern Actions (Phase 5)
  createPattern: (name: string, instrument: InstrumentType, durationBars?: number, notes?: NoteEvent[], drumPattern?: Record<DrumSound, boolean[]>) => string;
  duplicatePattern: (patternId: string) => string;
  deletePattern: (patternId: string) => void;
  updatePattern: (patternId: string, updates: Partial<PatternData>) => void;
  convertTrackNotesToPattern: (trackId: string, patternName?: string) => string;

  // Timeline Clip Actions (Phase 5)
  addClipToTrack: (trackId: string, patternId: string, startBar: number, durationBars?: number) => void;
  moveClip: (trackId: string, clipId: string, newStartBar: number, newTrackId?: string) => void;
  resizeClip: (trackId: string, clipId: string, newDurationBars: number) => void;
  removeClip: (trackId: string, clipId: string) => void;

  // Song Section Actions (Phase 5)
  addSection: (name: string, lengthBars?: number) => void;
  updateSection: (id: string, updates: Partial<SectionData>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  deleteSection: (id: string) => void;

  // Drum Pattern Actions
  toggleDrumStep: (sound: DrumSound, stepIndex: number) => void;
  clearDrumPattern: () => void;
  loadDrumPreset: (preset: 'four_on_floor' | 'hiphop' | 'trap' | 'empty') => void;
}

const defaultProject: ProjectData = {
  id: 'proj_' + Date.now(),
  title: 'My First Track',
  bpm: 120,
  timeSignature: [4, 4],
  tracks: STARTER_TRACKS,
  patterns: STARTER_PATTERNS,
  sections: STARTER_SECTIONS,
  masterFx: {
    volume: 1.0,
    pan: 0,
    isMuted: false,
    reverbWet: 0.15,
    delayWet: 0.0,
    limiterActive: true
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: '1.0.0'
};

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
function triggerAutoSave(project: ProjectData, set: any) {
  if (typeof window === 'undefined') return;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  set({ isSaving: true });
  autoSaveTimer = setTimeout(async () => {
    try {
      await saveProjectToDB(project);
      set({ isSaving: false, lastSavedAt: Date.now(), isDirty: false });
    } catch (err) {
      console.warn('[ProjectStore] Auto-save error', err);
      set({ isSaving: false });
    }
  }, 600);
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  currentProject: defaultProject,
  activeTrackId: 'track_piano_1',
  recordMode: 'replace',
  drumPattern: DEFAULT_DRUM_PATTERN,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  savedProjectsList: [],

  setRecordMode: (mode) => set({ recordMode: mode }),

  setProjectTitle: (title: string) => {
    set(state => {
      const nextProj = { ...state.currentProject, title, updatedAt: Date.now() };
      triggerAutoSave(nextProj, set);
      return { currentProject: nextProj, isDirty: true };
    });
  },

  initPersistence: async () => {
    try {
      await initDB();
      const activeId = getActiveProjectId();
      let loaded: ProjectData | null = null;
      if (activeId) {
        loaded = await loadProjectFromDB(activeId);
      }
      if (!loaded) {
        const all = await loadAllProjectsFromDB();
        if (all.length > 0) {
          loaded = all[0];
        }
      }
      if (loaded) {
        set({
          currentProject: loaded,
          activeTrackId: loaded.tracks[0]?.id || 'track_piano_1',
          isDirty: false,
          lastSavedAt: loaded.updatedAt
        });
        AudioEngine.syncProjectTracks(loaded.tracks);
        if (loaded.masterFx) {
          AudioEngine.updateMasterMixer(loaded.masterFx);
        }
      } else {
        await saveProjectToDB(defaultProject);
        set({ lastSavedAt: Date.now() });
      }
      await get().refreshSavedProjectsList();
    } catch (err) {
      console.warn('initPersistence error:', err);
    }
  },

  saveCurrentProject: async () => {
    set({ isSaving: true });
    try {
      await saveProjectToDB(get().currentProject);
      set({ isSaving: false, lastSavedAt: Date.now(), isDirty: false });
      await get().refreshSavedProjectsList();
    } catch (err) {
      console.error('saveCurrentProject error:', err);
      set({ isSaving: false });
    }
  },

  loadProjectById: async (id: string) => {
    try {
      const proj = await loadProjectFromDB(id);
      if (proj) {
        set({
          currentProject: proj,
          activeTrackId: proj.tracks[0]?.id || 'track_piano_1',
          isDirty: false,
          lastSavedAt: proj.updatedAt
        });
        setActiveProjectId(proj.id);
        AudioEngine.syncProjectTracks(proj.tracks);
        if (proj.masterFx) {
          AudioEngine.updateMasterMixer(proj.masterFx);
        }
        await get().refreshSavedProjectsList();
      }
    } catch (err) {
      console.error('loadProjectById error:', err);
    }
  },

  createNewProject: async (title = 'Untitled Project', template: 'starter' | 'blank' = 'starter') => {
    const newProj: ProjectData = template === 'starter' ? {
      ...defaultProject,
      id: 'proj_' + Date.now(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now()
    } : {
      id: 'proj_' + Date.now(),
      title,
      bpm: 120,
      timeSignature: [4, 4],
      tracks: [
        {
          id: 'track_piano_1',
          name: 'Grand Piano',
          instrument: 'piano',
          volume: 0.85,
          pan: 0,
          isMuted: false,
          isSoloed: false,
          color: '#6366f1',
          notes: [],
          clips: [],
          eq: { low: 0, mid: 0, high: 0 },
          reverbSend: 0.15,
          delaySend: 0
        }
      ],
      patterns: [],
      sections: [
        { id: 'sec_intro', name: 'Intro', startBar: 1, lengthBars: 4, color: '#3b82f6' }
      ],
      masterFx: {
        volume: 1.0,
        pan: 0,
        isMuted: false,
        reverbWet: 0.15,
        delayWet: 0,
        limiterActive: true
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0'
    };

    await saveProjectToDB(newProj);
    set({
      currentProject: newProj,
      activeTrackId: newProj.tracks[0].id,
      isDirty: false,
      lastSavedAt: Date.now()
    });
    AudioEngine.syncProjectTracks(newProj.tracks);
    if (newProj.masterFx) {
      AudioEngine.updateMasterMixer(newProj.masterFx);
    }
    await get().refreshSavedProjectsList();
  },

  duplicateProject: async (id: string) => {
    try {
      const source = await loadProjectFromDB(id);
      if (source) {
        const copy: ProjectData = {
          ...source,
          id: 'proj_' + Date.now(),
          title: `${source.title} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await saveProjectToDB(copy);
        await get().refreshSavedProjectsList();
      }
    } catch (err) {
      console.error('duplicateProject error:', err);
    }
  },

  deleteProject: async (id: string) => {
    try {
      await deleteProjectFromDB(id);
      const all = await loadAllProjectsFromDB();
      if (get().currentProject.id === id) {
        if (all.length > 0) {
          await get().loadProjectById(all[0].id);
        } else {
          await get().createNewProject('New Project', 'starter');
        }
      }
      await get().refreshSavedProjectsList();
    } catch (err) {
      console.error('deleteProject error:', err);
    }
  },

  refreshSavedProjectsList: async () => {
    try {
      const list = await loadAllProjectsFromDB();
      set({ savedProjectsList: list });
    } catch (err) {
      console.warn('refreshSavedProjectsList error:', err);
    }
  },

  setActiveTrackId: (id: string) => {
    const track = get().currentProject.tracks.find(t => t.id === id);
    if (track) {
      AudioEngine.setActiveTrack(id, track);
      AudioEngine.setInstrument(track.instrument);
    }
    set({ activeTrackId: id });
  },

  addTrack: (track: TrackData) => {
    set(state => {
      const nextTracks = [...state.currentProject.tracks, { ...track, clips: track.clips || [] }];
      const nextProj = {
        ...state.currentProject,
        tracks: nextTracks,
        updatedAt: Date.now()
      };
      AudioEngine.syncProjectTracks(nextTracks);
      triggerAutoSave(nextProj, set);
      return {
        currentProject: nextProj,
        activeTrackId: track.id,
        isDirty: true
      };
    });
  },

  createTrack: (name: string, instrument: InstrumentType) => {
    const id = `track_${instrument}_${Date.now()}`;
    const newTrack: TrackData = {
      id,
      name,
      instrument,
      volume: 0.85,
      pan: 0,
      isMuted: false,
      isSoloed: false,
      color: INSTRUMENT_COLORS[instrument] || '#6366f1',
      notes: [],
      clips: [],
      eq: { low: 0, mid: 0, high: 0 },
      reverbSend: 0.15,
      delaySend: 0
    };
    get().addTrack(newTrack);
  },

  updateTrack: (id: string, updates: Partial<TrackData>) => {
    set(state => {
      const updatedTracks = state.currentProject.tracks.map(t => t.id === id ? { ...t, ...updates } : t);
      const nextProj = {
        ...state.currentProject,
        tracks: updatedTracks,
        updatedAt: Date.now()
      };
      AudioEngine.syncProjectTracks(updatedTracks);
      triggerAutoSave(nextProj, set);
      return {
        currentProject: nextProj,
        isDirty: true
      };
    });
  },

  deleteTrack: (id: string) => {
    const { tracks } = get().currentProject;
    if (tracks.length <= 1) return; // Maintain at least 1 track

    const remaining = tracks.filter(t => t.id !== id);
    const newActiveId = get().activeTrackId === id ? remaining[0].id : get().activeTrackId;

    set(state => {
      const nextProj = {
        ...state.currentProject,
        tracks: remaining,
        updatedAt: Date.now()
      };
      AudioEngine.syncProjectTracks(remaining);
      triggerAutoSave(nextProj, set);
      return {
        currentProject: nextProj,
        activeTrackId: newActiveId,
        isDirty: true
      };
    });
  },

  setTrackInstrument: (id: string, instrument: InstrumentType) => {
    get().updateTrack(id, { instrument, color: INSTRUMENT_COLORS[instrument] });
  },

  setTrackVolume: (id: string, volume: number) => {
    get().updateTrack(id, { volume: Math.max(0, Math.min(1.25, volume)) });
  },

  setTrackPan: (id: string, pan: number) => {
    get().updateTrack(id, { pan: Math.max(-1, Math.min(1, pan)) });
  },

  setTrackEq: (id: string, eq: Partial<TrackEq>) => {
    const track = get().currentProject.tracks.find(t => t.id === id);
    if (track) {
      get().updateTrack(id, { eq: { ...(track.eq || { low: 0, mid: 0, high: 0 }), ...eq } });
    }
  },

  setMasterFx: (fx: Partial<MasterFxData>) => {
    set(state => {
      const current = state.currentProject.masterFx || {
        volume: 1.0,
        pan: 0,
        isMuted: false,
        reverbWet: 0.15,
        delayWet: 0,
        limiterActive: true
      };
      const updated = { ...current, ...fx };
      AudioEngine.updateMasterMixer(updated);
      const nextProj = { ...state.currentProject, masterFx: updated, updatedAt: Date.now() };
      triggerAutoSave(nextProj, set);
      return { currentProject: nextProj, isDirty: true };
    });
  },

  toggleTrackMute: (id: string) => {
    const track = get().currentProject.tracks.find(t => t.id === id);
    if (track) {
      get().updateTrack(id, { isMuted: !track.isMuted });
    }
  },

  toggleTrackSolo: (id: string) => {
    const track = get().currentProject.tracks.find(t => t.id === id);
    if (track) {
      get().updateTrack(id, { isSoloed: !track.isSoloed });
    }
  },

  setTrackNotes: (trackId: string, notes: NoteEvent[]) => {
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => t.id === trackId ? { ...t, notes } : t),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  addRecordedNotesToActiveTrack: (newNotes: NoteEvent[]) => {
    const { activeTrackId, recordMode } = get();
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === activeTrackId) {
            const combined = recordMode === 'replace'
              ? [...newNotes].sort((a, b) => a.start - b.start)
              : [...t.notes, ...newNotes].sort((a, b) => a.start - b.start);
            return { ...t, notes: combined };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  addNoteToActiveTrack: (note: NoteEvent) => {
    const { activeTrackId } = get();
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === activeTrackId) {
            const notes = [...t.notes, note].sort((a, b) => a.start - b.start);
            return { ...t, notes };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  insertChordToActiveTrack: (chordNotes: NoteEvent[], startSeconds?: number) => {
    const { activeTrackId, currentProject } = get();
    const track = currentProject.tracks.find(t => t.id === activeTrackId) || currentProject.tracks[0];
    if (!track) return;

    let insertTime = startSeconds;
    if (insertTime === undefined) {
      if (track.notes.length > 0) {
        const lastNoteEnd = Math.max(...track.notes.map(n => n.start + n.duration));
        const bpm = currentProject.bpm || 120;
        const beatDur = 60 / bpm;
        insertTime = Math.ceil(lastNoteEnd / beatDur) * beatDur;
      } else {
        insertTime = 0.0;
      }
    }

    const positionedNotes = chordNotes.map(n => ({
      ...n,
      start: insertTime
    }));

    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === track.id) {
            const combined = [...t.notes, ...positionedNotes].sort((a, b) => a.start - b.start);
            return { ...t, notes: combined };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  updateNoteInActiveTrack: (noteId: string, updates: Partial<NoteEvent>) => {
    const { activeTrackId } = get();
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === activeTrackId) {
            const notes = t.notes
              .map(n => n.id === noteId ? { ...n, ...updates } : n)
              .sort((a, b) => a.start - b.start);
            return { ...t, notes };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  deleteNoteFromActiveTrack: (noteId: string) => {
    const { activeTrackId } = get();
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === activeTrackId) {
            return { ...t, notes: t.notes.filter(n => n.id !== noteId) };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  quantizeActiveTrackNotes: (grid: GridDivision) => {
    const { activeTrackId, currentProject } = get();
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === activeTrackId) {
            const quantized = quantizeNotes(t.notes, grid, currentProject.bpm);
            return { ...t, notes: quantized };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  clearActiveTrackNotes: () => {
    const activeId = get().activeTrackId;
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => t.id === activeId ? { ...t, notes: [] } : t),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  // ==========================================
  // Pattern Actions (Phase 5)
  // ==========================================

  createPattern: (name, instrument, durationBars = 4, notes = [], drumPattern) => {
    const id = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPattern: PatternData = {
      id,
      name,
      instrument,
      durationBars,
      color: INSTRUMENT_COLORS[instrument] || '#6366f1',
      notes,
      drumPattern
    };

    set(state => ({
      currentProject: {
        ...state.currentProject,
        patterns: [...state.currentProject.patterns, newPattern],
        updatedAt: Date.now()
      },
      isDirty: true
    }));

    return id;
  },

  duplicatePattern: (patternId: string) => {
    const { patterns } = get().currentProject;
    const target = patterns.find(p => p.id === patternId);
    if (!target) return '';

    const newId = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clonedNotes: NoteEvent[] = target.notes.map(n => ({
      ...n,
      id: `n_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    }));

    const clonedDrum = target.drumPattern 
      ? JSON.parse(JSON.stringify(target.drumPattern)) 
      : undefined;

    const duplicated: PatternData = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      notes: clonedNotes,
      drumPattern: clonedDrum
    };

    set(state => ({
      currentProject: {
        ...state.currentProject,
        patterns: [...state.currentProject.patterns, duplicated],
        updatedAt: Date.now()
      },
      isDirty: true
    }));

    return newId;
  },

  deletePattern: (patternId: string) => {
    set(state => ({
      currentProject: {
        ...state.currentProject,
        patterns: state.currentProject.patterns.filter(p => p.id !== patternId),
        // Also remove any clips referencing this pattern
        tracks: state.currentProject.tracks.map(t => ({
          ...t,
          clips: (t.clips || []).filter(c => c.patternId !== patternId)
        })),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  updatePattern: (patternId: string, updates: Partial<PatternData>) => {
    set(state => ({
      currentProject: {
        ...state.currentProject,
        patterns: state.currentProject.patterns.map(p => p.id === patternId ? { ...p, ...updates } : p),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  convertTrackNotesToPattern: (trackId: string, patternName?: string) => {
    const track = get().currentProject.tracks.find(t => t.id === trackId);
    if (!track) return '';

    const name = patternName || `${track.name} Pattern`;
    const bpm = get().currentProject.bpm || 120;
    const barDuration = (4 * 60) / bpm;

    let durationBars = 4;
    if (track.notes.length > 0) {
      const maxEnd = Math.max(...track.notes.map(n => n.start + n.duration));
      durationBars = Math.max(2, Math.ceil(maxEnd / barDuration));
    }

    const patternId = get().createPattern(name, track.instrument, durationBars, [...track.notes]);

    // Also place this new pattern as a clip at Bar 1 on this track
    get().addClipToTrack(trackId, patternId, 1, durationBars);

    return patternId;
  },

  // ==========================================
  // Timeline Clip Actions (Phase 5)
  // ==========================================

  addClipToTrack: (trackId: string, patternId: string, startBar: number, durationBars?: number) => {
    const pattern = get().currentProject.patterns.find(p => p.id === patternId);
    const dur = durationBars || pattern?.durationBars || 4;

    const clipId = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newClip: TrackClip = {
      id: clipId,
      patternId,
      startBar: Math.max(1, startBar),
      durationBars: dur
    };

    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: [...(t.clips || []), newClip].sort((a, b) => a.startBar - b.startBar)
            };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  moveClip: (trackId: string, clipId: string, newStartBar: number, newTrackId?: string) => {
    const targetTrackId = newTrackId || trackId;
    const clampedStart = Math.max(1, newStartBar);

    set(state => {
      let movedClip: TrackClip | null = null;

      // Extract clip from source track
      const tracksAfterRemoval = state.currentProject.tracks.map(t => {
        if (t.id === trackId) {
          const found = (t.clips || []).find(c => c.id === clipId);
          if (found) {
            movedClip = { ...found, startBar: clampedStart };
          }
          return {
            ...t,
            clips: (t.clips || []).filter(c => c.id !== clipId)
          };
        }
        return t;
      });

      if (!movedClip) return state;

      // Place clip into target track
      const updatedTracks = tracksAfterRemoval.map(t => {
        if (t.id === targetTrackId && movedClip) {
          return {
            ...t,
            clips: [...(t.clips || []), movedClip].sort((a, b) => a.startBar - b.startBar)
          };
        }
        return t;
      });

      return {
        currentProject: {
          ...state.currentProject,
          tracks: updatedTracks,
          updatedAt: Date.now()
        },
        isDirty: true
      };
    });
  },

  resizeClip: (trackId: string, clipId: string, newDurationBars: number) => {
    const clampedDuration = Math.max(1, Math.min(32, newDurationBars));
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: (t.clips || []).map(c => c.id === clipId ? { ...c, durationBars: clampedDuration } : c)
            };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  removeClip: (trackId: string, clipId: string) => {
    set(state => ({
      currentProject: {
        ...state.currentProject,
        tracks: state.currentProject.tracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: (t.clips || []).filter(c => c.id !== clipId)
            };
          }
          return t;
        }),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  // ==========================================
  // Song Section Actions (Phase 5)
  // ==========================================

  addSection: (name: string, lengthBars: number = 8) => {
    const { sections } = get().currentProject;
    let nextStartBar = 1;
    if (sections.length > 0) {
      const last = sections[sections.length - 1];
      nextStartBar = last.startBar + last.lengthBars;
    }

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const color = colors[sections.length % colors.length];

    const newSec: SectionData = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      startBar: nextStartBar,
      lengthBars,
      color
    };

    set(state => ({
      currentProject: {
        ...state.currentProject,
        sections: [...state.currentProject.sections, newSec],
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  updateSection: (id: string, updates: Partial<SectionData>) => {
    set(state => ({
      currentProject: {
        ...state.currentProject,
        sections: state.currentProject.sections.map(s => s.id === id ? { ...s, ...updates } : s),
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  reorderSections: (fromIndex: number, toIndex: number) => {
    const { sections } = get().currentProject;
    if (fromIndex < 0 || fromIndex >= sections.length || toIndex < 0 || toIndex >= sections.length) return;

    const list = [...sections];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    // Recalculate startBar sequentially
    let curBar = 1;
    const recomputed = list.map(sec => {
      const updated = { ...sec, startBar: curBar };
      curBar += sec.lengthBars;
      return updated;
    });

    set(state => ({
      currentProject: {
        ...state.currentProject,
        sections: recomputed,
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  deleteSection: (id: string) => {
    const remaining = get().currentProject.sections.filter(s => s.id !== id);
    // Recalculate startBar sequentially
    let curBar = 1;
    const recomputed = remaining.map(sec => {
      const updated = { ...sec, startBar: curBar };
      curBar += sec.lengthBars;
      return updated;
    });

    set(state => ({
      currentProject: {
        ...state.currentProject,
        sections: recomputed,
        updatedAt: Date.now()
      },
      isDirty: true
    }));
  },

  // ==========================================
  // Drum Pattern Actions
  // ==========================================
  toggleDrumStep: (sound: DrumSound, stepIndex: number) => {
    set(state => {
      const current = state.drumPattern[sound] || new Array(16).fill(false);
      const updated = [...current];
      updated[stepIndex] = !updated[stepIndex];
      return {
        drumPattern: {
          ...state.drumPattern,
          [sound]: updated
        },
        isDirty: true
      };
    });
  },

  clearDrumPattern: () => {
    const empty: Record<DrumSound, boolean[]> = {
      kick: new Array(16).fill(false),
      snare: new Array(16).fill(false),
      hihatClosed: new Array(16).fill(false),
      hihatOpen: new Array(16).fill(false),
      clap: new Array(16).fill(false),
      tom: new Array(16).fill(false),
    };
    set({ drumPattern: empty, isDirty: true });
  },

  loadDrumPreset: (preset) => {
    if (preset === 'four_on_floor') {
      set({ drumPattern: DEFAULT_DRUM_PATTERN, isDirty: true });
    } else if (preset === 'hiphop') {
      set({
        drumPattern: {
          kick:        [true,  false, false, false, false, false, true,  false, false, false, true,  false, false, false, false, false],
          snare:       [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
          hihatClosed: [true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false, true,  false],
          hihatOpen:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true,  false],
          clap:        [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
          tom:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
        },
        isDirty: true
      });
    } else if (preset === 'trap') {
      set({
        drumPattern: {
          kick:        [true,  false, false, false, false, false, false, false, false, false, true,  false, false, false, false, false],
          snare:       [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
          hihatClosed: [true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true,  true],
          hihatOpen:   [false, false, false, true,  false, false, false, true,  false, false, false, true,  false, false, false, true],
          clap:        [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, false],
          tom:         [false, false, false, false, false, false, false, false, false, false, false, false, false, true,  true,  false],
        },
        isDirty: true
      });
    } else {
      get().clearDrumPattern();
    }
  }
}));

// Automatic persistence subscription whenever currentProject state changes
if (typeof window !== 'undefined') {
  useProjectStore.subscribe((state, prevState) => {
    if (state.currentProject !== prevState.currentProject) {
      triggerAutoSave(state.currentProject, useProjectStore.setState);
    }
  });
}
