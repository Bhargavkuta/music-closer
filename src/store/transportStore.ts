import { create } from 'zustand';
import { AudioEngine, TransportPosition } from '../audio/AudioEngine';
import { SectionData } from '../types/project';
import { useProjectStore } from './projectStore';
import { useUIStore } from './uiStore';

export type PlaybackMode = 'pattern' | 'song';

interface TransportStoreState {
  isPlaying: boolean;
  isRecording: boolean;
  isLooping: boolean;
  playbackMode: PlaybackMode;
  activeLoopSectionId: string | null;
  bpm: number;
  metronomeOn: boolean;
  currentBar: number;
  currentBeat: number;
  currentSixteenth: number;
  currentTimeSeconds: number;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleRecord: () => void;
  toggleLoop: () => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  loopSection: (section: SectionData) => void;
  clearSectionLoop: () => void;
  setBPM: (bpm: number) => void;
  toggleMetronome: () => void;
  initPositionSync: () => void;
}

export const useTransportStore = create<TransportStoreState>((set, get) => ({
  isPlaying: false,
  isRecording: false,
  isLooping: false,
  playbackMode: 'song',
  activeLoopSectionId: null,
  bpm: 120,
  metronomeOn: false,
  currentBar: 1,
  currentBeat: 1,
  currentSixteenth: 0,
  currentTimeSeconds: 0,

  setPlaybackMode: (mode: PlaybackMode) => {
    const wasPlaying = get().isPlaying;
    if (wasPlaying) {
      get().stop();
    }
    set({ playbackMode: mode });
  },

  loopSection: (section: SectionData) => {
    AudioEngine.setLoopSection(section.startBar, section.lengthBars);
    set({ 
      isLooping: true, 
      activeLoopSectionId: section.id,
      playbackMode: 'song'
    });
    if (!get().isPlaying) {
      get().play();
    }
  },

  clearSectionLoop: () => {
    AudioEngine.setLoop(false);
    set({ isLooping: false, activeLoopSectionId: null });
  },

  play: () => {
    const { playbackMode } = get();
    const projectState = useProjectStore.getState();
    const project = projectState.currentProject;

    // Wire visual playback illumination for active instrument
    AudioEngine.setVisualNoteCallback((pitch, isActive) => {
      useUIStore.getState().setVisualNoteActive(pitch, isActive);
    });

    // Wire drum sequencer step playhead
    AudioEngine.setDrumStepCallback((step) => {
      useUIStore.getState().setCurrentDrumStep(step);
    });

    const onEnd = () => {
      set({ 
        isPlaying: false, 
        currentBar: 1, 
        currentBeat: 1, 
        currentSixteenth: 0,
        currentTimeSeconds: 0 
      });
      useUIStore.getState().setCurrentDrumStep(0);
    };

    if (playbackMode === 'song') {
      // Schedule full multi-track arrangement timeline
      AudioEngine.scheduleArrangementPlayback(project, onEnd);
    } else {
      // Schedule pattern / current active take & drum loop
      AudioEngine.scheduleAllTracksPlayback(project.tracks, projectState.drumPattern, onEnd);
    }

    AudioEngine.startTransport();
    set({ isPlaying: true, isRecording: false });
  },

  pause: () => {
    AudioEngine.pauseTransport();
    set({ isPlaying: false });
  },

  stop: () => {
    const { isRecording } = get();
    if (isRecording) {
      const recordedNotes = AudioEngine.stopRecording();
      if (recordedNotes.length > 0) {
        useProjectStore.getState().addRecordedNotesToActiveTrack(recordedNotes);
      }
    } else {
      AudioEngine.stopTransport();
    }

    AudioEngine.clearPlaybackSchedule();
    useUIStore.getState().releaseAllKeys();
    useUIStore.getState().setCurrentDrumStep(0);

    set({ 
      isPlaying: false, 
      isRecording: false, 
      currentBar: 1, 
      currentBeat: 1, 
      currentSixteenth: 0,
      currentTimeSeconds: 0 
    });
  },

  toggleRecord: () => {
    const { isRecording } = get();
    if (isRecording) {
      const recordedNotes = AudioEngine.stopRecording();
      if (recordedNotes.length > 0) {
        useProjectStore.getState().addRecordedNotesToActiveTrack(recordedNotes);
      }
      useUIStore.getState().releaseAllKeys();
      set({ 
        isRecording: false, 
        isPlaying: false,
        currentBar: 1,
        currentBeat: 1,
        currentSixteenth: 0,
        currentTimeSeconds: 0
      });
    } else {
      AudioEngine.startRecording();
      set({ 
        isRecording: true, 
        isPlaying: true,
        currentBar: 1,
        currentBeat: 1,
        currentSixteenth: 0,
        currentTimeSeconds: 0
      });
    }
  },

  toggleLoop: () => {
    const nextLoop = !get().isLooping;
    if (!nextLoop) {
      AudioEngine.setLoop(false);
      set({ isLooping: false, activeLoopSectionId: null });
    } else {
      AudioEngine.setLoop(true, 0, 4);
      set({ isLooping: true });
    }
  },

  setBPM: (bpm: number) => {
    const clamped = Math.min(Math.max(bpm, 40), 280);
    AudioEngine.setBPM(clamped);
    set({ bpm: clamped });
  },

  toggleMetronome: () => {
    const nextState = AudioEngine.toggleMetronome();
    set({ metronomeOn: nextState });
  },

  initPositionSync: () => {
    AudioEngine.addPositionListener((pos: TransportPosition) => {
      set({
        currentBar: pos.bar,
        currentBeat: pos.beat,
        currentSixteenth: pos.sixteenth,
        currentTimeSeconds: pos.seconds,
      });
    });
  }
}));
