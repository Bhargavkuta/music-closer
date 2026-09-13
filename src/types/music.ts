export type NotePitch = string; // e.g. "C4", "F#3", "Bb5"

export interface NoteEvent {
  id: string;
  pitch: NotePitch;
  midi: number;
  start: number; // in beats or seconds
  duration: number; // in beats or seconds
  velocity: number; // 0.0 to 1.0
  trackId?: string;
}

export type ScaleType = 
  | 'major' 
  | 'natural_minor' 
  | 'harmonic_minor' 
  | 'major_pentatonic' 
  | 'minor_pentatonic' 
  | 'blues';

export type ChordType = 
  | 'major' 
  | 'minor' 
  | 'diminished' 
  | 'augmented' 
  | '7th' 
  | 'maj7' 
  | 'min7' 
  | 'sus2' 
  | 'sus4';

export interface ChordDefinition {
  name: string;
  symbol: string;
  root: string;
  type: ChordType;
  intervals: number[]; // semitone offsets from root
  notes: NotePitch[];
}

export interface ScaleDefinition {
  name: string;
  root: string;
  type: ScaleType;
  intervals: number[];
  notes: string[];
}
