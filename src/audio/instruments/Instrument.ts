import { InstrumentType, InstrumentInterface } from '../../types/audio';

export abstract class BaseInstrument implements InstrumentInterface {
  abstract name: string;
  abstract type: InstrumentType;

  abstract playNote(pitch: string, velocity?: number): void;
  abstract releaseNote(pitch: string): void;
  abstract triggerAttackRelease(pitch: string, duration: number, time?: number, velocity?: number): void;
  abstract stopAll(): void;
  abstract setVolume(volume: number): void;
  abstract dispose(): void;
}
