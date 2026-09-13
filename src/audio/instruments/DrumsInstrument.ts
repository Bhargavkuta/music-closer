import { InstrumentType, InstrumentInterface, DrumSound } from '../../types/audio';
import { DrumEngine } from './DrumEngine';

export class DrumsInstrument implements InstrumentInterface {
  name = 'Studio Drum Kit';
  type: InstrumentType = 'drums';
  private drumEngine: DrumEngine;

  constructor(drumEngine: DrumEngine) {
    this.drumEngine = drumEngine;
  }

  private pitchToDrumSound(pitch: string): DrumSound {
    // Extract base note letter and accidental
    const note = pitch.replace(/\d+/, '').toUpperCase();
    switch (note) {
      case 'C':
      case 'C#':
        return 'kick';
      case 'D':
      case 'D#':
        return 'snare';
      case 'E':
      case 'F':
        return 'hihatClosed';
      case 'F#':
      case 'G':
        return 'hihatOpen';
      case 'G#':
      case 'A':
        return 'clap';
      case 'A#':
      case 'B':
      default:
        return 'tom';
    }
  }

  public playNote(pitch: string, velocity: number = 0.85): void {
    const sound = this.pitchToDrumSound(pitch);
    this.drumEngine.triggerDrum(sound, undefined, velocity);
  }

  public releaseNote(_pitch: string): void {
    // Drums are transient percussive hits with their own natural envelope
  }

  public triggerAttackRelease(pitch: string, _duration: number, time?: number, velocity: number = 0.85): void {
    const sound = this.pitchToDrumSound(pitch);
    this.drumEngine.triggerDrum(sound, time, velocity);
  }

  public stopAll(): void {
    this.drumEngine.stopAll();
  }

  public setVolume(volume: number): void {
    this.drumEngine.setVolume(volume);
  }

  public dispose(): void {
    // DrumEngine lifecycle is handled by AudioEngine
  }
}
