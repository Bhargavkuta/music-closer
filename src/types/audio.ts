export type InstrumentType = 'piano' | 'guitar' | 'bass' | 'drums' | 'synth';

export type DrumSound = 'kick' | 'snare' | 'hihatClosed' | 'hihatOpen' | 'clap' | 'tom';

export interface AudioEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  timeSignature: [number, number];
  currentBar: number;
  currentBeat: number;
  currentTime: number;
  masterVolume: number; // 0 to 1
  isMuted: boolean;
  metronomeActive: boolean;
}

export interface InstrumentInterface {
  name: string;
  type: InstrumentType;
  playNote(pitch: string, velocity?: number): void;
  releaseNote(pitch: string): void;
  triggerAttackRelease(pitch: string, duration: number, time?: number, velocity?: number): void;
  stopAll(): void;
  setVolume(volume: number): void;
  dispose(): void;
}
