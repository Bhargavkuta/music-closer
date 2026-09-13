import * as Tone from 'tone';
import { BaseInstrument } from './Instrument';
import { InstrumentType } from '../../types/audio';

export class PianoInstrument extends BaseInstrument {
  name = 'Acoustic Grand Piano';
  type: InstrumentType = 'piano';

  private synth: Tone.PolySynth;
  private filter: Tone.Filter;
  private volumeNode: Tone.Volume;
  private activeNotes: Set<string> = new Set();

  constructor(outputNode?: Tone.ToneAudioNode) {
    super();

    this.volumeNode = new Tone.Volume(0);

    // Warm acoustic lowpass filter with slight resonance
    this.filter = new Tone.Filter({
      frequency: 4500,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.2
    });

    // Custom polyphonic piano synth mimicking hammer strike and piano string resonance
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle8' // Rich harmonic overtone stack resembling piano strings
      },
      envelope: {
        attack: 0.005,
        decay: 1.8,
        sustain: 0.15,
        release: 1.2,
      }
    });

    this.synth.set({
      volume: -4
    });

    // Chain: Synth -> Filter -> Volume -> Output
    if (outputNode) {
      this.synth.chain(this.filter, this.volumeNode, outputNode);
    } else {
      this.synth.chain(this.filter, this.volumeNode, Tone.getDestination());
    }
  }

  playNote(pitch: string, velocity: number = 0.8): void {
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }
      this.activeNotes.add(pitch);
      this.synth.triggerAttack(pitch, undefined, Math.min(Math.max(velocity, 0.1), 1.0));
    } catch (err) {
      console.warn(`[Piano] Failed to play note ${pitch}`, err);
    }
  }

  releaseNote(pitch: string): void {
    try {
      this.activeNotes.delete(pitch);
      this.synth.triggerRelease([pitch]);
    } catch (err) {
      console.warn(`[Piano] Failed to release note ${pitch}`, err);
    }
  }

  triggerAttackRelease(pitch: string, duration: number, time?: number, velocity: number = 0.8): void {
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }
      this.synth.triggerAttackRelease(
        pitch,
        duration,
        time,
        Math.min(Math.max(velocity, 0.1), 1.0)
      );
    } catch (err) {
      console.warn(`[Piano] Failed to triggerAttackRelease note ${pitch}`, err);
    }
  }

  stopAll(): void {
    try {
      if (this.activeNotes.size > 0) {
        this.synth.releaseAll();
        this.activeNotes.clear();
      }
    } catch (err) {
      console.warn('[Piano] Failed to stop all notes', err);
    }
  }

  setVolume(vol: number): void {
    // vol is 0 to 1 -> map to dB (-60 to +6 dB)
    if (vol <= 0) {
      this.volumeNode.mute = true;
    } else {
      this.volumeNode.mute = false;
      this.volumeNode.volume.value = Tone.gainToDb(vol);
    }
  }

  dispose(): void {
    this.stopAll();
    this.synth.dispose();
    this.filter.dispose();
    this.volumeNode.dispose();
  }
}
