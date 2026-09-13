import { NoteEvent } from './music';
import { InstrumentType, DrumSound } from './audio';

export interface TrackClip {
  id: string;
  patternId: string;
  startBar: number; // 1-indexed bar number on timeline
  durationBars: number; // duration in bars
}

export interface TrackEq {
  low: number; // -12 to +12 dB
  mid: number; // -12 to +12 dB
  high: number; // -12 to +12 dB
}

export interface TrackData {
  id: string;
  name: string;
  instrument: InstrumentType;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  isMuted: boolean;
  isSoloed: boolean;
  color: string;
  notes: NoteEvent[];
  clips: TrackClip[];
  eq?: TrackEq;
  reverbSend?: number;
  delaySend?: number;
}

export interface PatternData {
  id: string;
  name: string;
  durationBars: number; // in bars (e.g., 2, 4, 8)
  instrument: InstrumentType;
  color?: string;
  notes: NoteEvent[];
  drumPattern?: Record<DrumSound, boolean[]>;
}

export type SectionType = 'Intro' | 'Verse' | 'Chorus' | 'Bridge' | 'Outro' | string;

export interface SectionData {
  id: string;
  name: SectionType;
  startBar: number;
  lengthBars: number;
  color: string;
}

export interface MasterFxData {
  volume: number; // 0 to 1.25 (default 1.0)
  pan: number; // -1 to 1 (default 0)
  isMuted: boolean;
  reverbWet: number; // 0 to 1
  delayWet: number; // 0 to 1
  limiterActive: boolean;
}

export interface ProjectData {
  id: string;
  title: string;
  bpm: number;
  timeSignature: [number, number];
  tracks: TrackData[];
  patterns: PatternData[];
  sections: SectionData[];
  masterFx?: MasterFxData;
  createdAt: number;
  updatedAt: number;
  version: string;
}


