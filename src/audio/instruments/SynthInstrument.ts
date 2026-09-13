import * as Tone from 'tone';
import { BaseInstrument } from './Instrument';
import { InstrumentType } from '../../types/audio';

export class SynthInstrument extends BaseInstrument {
  name = 'Analog Synth';
  type: InstrumentType = 'synth';

  private synth: Tone.PolySynth;
  private filter: Tone.Filter;
  private chorus: Tone.Chorus;
  private volumeNode: Tone.Volume;
  private activeNotes: Set<string> = new Set();

  constructor(outputNode?: Tone.ToneAudioNode) {
    super();

    this.volumeNode = new Tone.Volume(0);

    // Warm analog lowpass filter with gentle resonance
    this.filter = new Tone.Filter({
      frequency: 3800,
      type: 'lowpass',
      rolloff: -12,
      Q: 2.5
    });

    // Subtle stereo chorus for lush analog width
    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.4,
      wet: 0.25
    }).start();

    // Polyphonic synthesizer with saw/square warmth and rich release
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.02,
        decay: 0.8,
        sustain: 0.5,
        release: 1.2
      }
    });

    this.synth.set({
      volume: -4
    });

    if (outputNode) {
      this.synth.chain(this.filter, this.chorus, this.volumeNode, outputNode);
    } else {
      this.synth.chain(this.filter, this.chorus, this.volumeNode, Tone.getDestination());
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
      console.warn(`[Synth] Failed to play note ${pitch}`, err);
    }
  }

  releaseNote(pitch: string): void {
    try {
      this.activeNotes.delete(pitch);
      this.synth.triggerRelease([pitch]);
    } catch (err) {
      console.warn(`[Synth] Failed to release note ${pitch}`, err);
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
      console.warn(`[Synth] Failed to triggerAttackRelease note ${pitch}`, err);
    }
  }

  stopAll(): void {
    try {
      if (this.activeNotes.size > 0) {
        this.synth.releaseAll();
        this.activeNotes.clear();
      }
    } catch (err) {
      console.warn('[Synth] Failed to stop all notes', err);
    }
  }

  setVolume(vol: number): void {
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
    this.chorus.dispose();
    this.volumeNode.dispose();
  }
}
