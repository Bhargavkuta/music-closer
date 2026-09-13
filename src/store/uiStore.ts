import { create } from 'zustand';
import { InstrumentType } from '../types/audio';
import { AudioEngine } from '../audio/AudioEngine';
import { GridDivision } from '../music/quantization';
import { NoteLetter } from '../music/notes';
import { ScaleType } from '../types/music';

export type AppView = 'studio' | 'instruments' | 'projects' | 'settings';

interface UIStoreState {
  baseOctave: number; // e.g. 4 for Middle C
  activeKeys: string[]; // List of pitches currently held down e.g. ["C4", "E4", "G4"]
  activeInstrument: InstrumentType;
  activeView: AppView;
  showOnboarding: boolean;
  showKeyLabels: boolean;
  masterVolume: number; // 0.0 to 1.0
  isAudioReady: boolean;
  
  // Workspace, Arranger, Piano Roll & Mixer
  workspaceTab: 'keyboard' | 'pianoroll' | 'drums' | 'arrangement' | 'mixer';
  activePatternId: string | null;
  timelineZoomX: number; // pixels per bar
  pianoRollGridSnap: GridDivision;
  pianoRollZoomX: number;
  pianoRollTool: 'draw' | 'erase';
  currentDrumStep: number;
  showProjectManagerModal: boolean;
  showExportModal: boolean;

  // Phase 6: Chords, Scales & Theory State
  selectedRootNote: NoteLetter;
  selectedScaleType: ScaleType;
  highlightScaleNotes: boolean;
  showTheoryPanel: boolean;
  activeChordProgression: string[];

  // Actions
  setWorkspaceTab: (tab: 'keyboard' | 'pianoroll' | 'drums' | 'arrangement' | 'mixer') => void;
  setShowProjectManagerModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setActivePatternId: (id: string | null) => void;
  setTimelineZoomX: (zoom: number) => void;
  setCurrentDrumStep: (step: number) => void;
  setPianoRollGridSnap: (snap: GridDivision) => void;
  setPianoRollZoomX: (zoom: number) => void;
  setPianoRollTool: (tool: 'draw' | 'erase') => void;
  setBaseOctave: (octave: number) => void;
  shiftOctave: (delta: number) => void;
  pressKey: (pitch: string, velocity?: number) => void;
  releaseKey: (pitch: string) => void;
  releaseAllKeys: () => void;
  setVisualNoteActive: (pitch: string, active: boolean) => void;
  setActiveInstrument: (inst: InstrumentType) => void;
  setActiveView: (view: AppView) => void;
  setShowOnboarding: (show: boolean) => void;
  toggleKeyLabels: () => void;
  setMasterVolume: (volume: number) => void;
  setAudioReady: (ready: boolean) => void;

  // Theory Actions
  setSelectedRootNote: (root: NoteLetter) => void;
  setSelectedScaleType: (scale: ScaleType) => void;
  toggleHighlightScaleNotes: () => void;
  setShowTheoryPanel: (show: boolean) => void;
  addToChordProgression: (chordSymbol: string) => void;
  clearChordProgression: () => void;
}

export const useUIStore = create<UIStoreState>((set, get) => ({
  baseOctave: 4,
  activeKeys: [],
  activeInstrument: 'piano',
  activeView: 'studio',
  showOnboarding: !localStorage.getItem('mc_onboarding_completed'),
  showKeyLabels: true,
  masterVolume: 0.85,
  isAudioReady: false,
  workspaceTab: 'keyboard',
  activePatternId: 'pat_piano_chords',
  timelineZoomX: 80,
  pianoRollGridSnap: '1/16',
  pianoRollZoomX: 64,
  pianoRollTool: 'draw',
  currentDrumStep: 0,
  showProjectManagerModal: false,
  showExportModal: false,

  // Phase 6 Theory Defaults
  selectedRootNote: 'C',
  selectedScaleType: 'major',
  highlightScaleNotes: true,
  showTheoryPanel: false,
  activeChordProgression: ['C', 'Am', 'F'],

  setWorkspaceTab: (tab) => set({ workspaceTab: tab }),
  setShowProjectManagerModal: (show) => set({ showProjectManagerModal: show }),
  setShowExportModal: (show) => set({ showExportModal: show }),
  setActivePatternId: (id) => set({ activePatternId: id }),
  setTimelineZoomX: (zoom) => set({ timelineZoomX: Math.max(40, Math.min(180, zoom)) }),
  setCurrentDrumStep: (step) => set({ currentDrumStep: step }),
  setPianoRollGridSnap: (snap) => set({ pianoRollGridSnap: snap }),
  setPianoRollZoomX: (zoom) => set({ pianoRollZoomX: Math.max(32, Math.min(160, zoom)) }),
  setPianoRollTool: (tool) => set({ pianoRollTool: tool }),

  setSelectedRootNote: (root) => set({ selectedRootNote: root }),
  setSelectedScaleType: (scale) => set({ selectedScaleType: scale }),
  toggleHighlightScaleNotes: () => set(state => ({ highlightScaleNotes: !state.highlightScaleNotes })),
  setShowTheoryPanel: (show) => set({ showTheoryPanel: show }),
  addToChordProgression: (sym) => set(state => ({
    activeChordProgression: [...state.activeChordProgression.slice(-7), sym]
  })),
  clearChordProgression: () => set({ activeChordProgression: [] }),

  setBaseOctave: (octave: number) => {
    const clamped = Math.max(1, Math.min(6, octave));
    set({ baseOctave: clamped });
  },

  shiftOctave: (delta: number) => {
    const current = get().baseOctave;
    const next = Math.max(1, Math.min(6, current + delta));
    set({ baseOctave: next });
  },

  pressKey: (pitch: string, velocity: number = 0.8) => {
    const { activeKeys } = get();
    if (!activeKeys.includes(pitch)) {
      set({ activeKeys: [...activeKeys, pitch] });
    }
    // Play through audio engine
    AudioEngine.playNote(pitch, velocity);
    if (!get().isAudioReady) {
      set({ isAudioReady: true });
    }
  },

  releaseKey: (pitch: string) => {
    const { activeKeys } = get();
    set({ activeKeys: activeKeys.filter(k => k !== pitch) });
    // Release in audio engine
    AudioEngine.releaseNote(pitch);
  },

  releaseAllKeys: () => {
    set({ activeKeys: [] });
    AudioEngine.stopAllNotes();
  },

  setVisualNoteActive: (pitch: string, active: boolean) => {
    const { activeKeys } = get();
    if (active) {
      if (!activeKeys.includes(pitch)) {
        set({ activeKeys: [...activeKeys, pitch] });
      }
    } else {
      set({ activeKeys: activeKeys.filter(k => k !== pitch) });
    }
  },

  setActiveInstrument: (inst: InstrumentType) => {
    set({ activeInstrument: inst });
    AudioEngine.setInstrument(inst);
  },

  setActiveView: (view: AppView) => {
    set({ activeView: view });
  },

  setShowOnboarding: (show: boolean) => {
    if (!show) {
      localStorage.setItem('mc_onboarding_completed', 'true');
    }
    set({ showOnboarding: show });
  },

  toggleKeyLabels: () => {
    set(state => ({ showKeyLabels: !state.showKeyLabels }));
  },

  setMasterVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    set({ masterVolume: clamped });
    AudioEngine.setMasterVolume(clamped);
  },

  setAudioReady: (ready: boolean) => {
    set({ isAudioReady: ready });
  }
}));
