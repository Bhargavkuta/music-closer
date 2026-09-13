import * as Tone from 'tone';
import { BaseInstrument } from './Instrument';
import { InstrumentType } from '../../types/audio';

export class BassInstrument extends BaseInstrument {
  name = 'Electric Bass';
  type: InstrumentType = 'bass';

  private synth: Tone.MonoSynth;
  private filter: Tone.Filter;
  private volumeNode: Tone.Volume;
  private activeNotes: Set<string> = new Set();
  private currentNote: string | null = null;

  constructor(outputNode?: Tone.ToneAudioNode) {
    super();

    this.volumeNode = new Tone.Volume(0);

    // Warm low-pass bass body filter
    this.filter = new Tone.Filter({
      frequency: 1400,
      type: 'lowpass',
      rolloff: -24,
      Q: 2.0
    });

    // Deep plucked bass synth — MonoSynth is the correct choice for bass
    // (bass is monophonic by nature, and PolySynth(MonoSynth) is broken in Tone.js v15)
    this.synth = new Tone.MonoSynth({
      oscillator: {
        type: 'triangle8' // Rich sub-bass fundamentals
      },
      filter: {
        Q: 1.5,
        type: 'lowpass',
        rolloff: -12
      },
      envelope: {
        attack: 0.01,
        decay: 1.2,
        sustain: 0.3,
        release: 0.8
      },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.5,
        sustain: 0.2,
        release: 0.6,
        baseFrequency: 120,
        octaves: 3.5
      }
    });

    this.synth.set({
      volume: -2
    });

    if (outputNode) {
      this.synth.chain(this.filter, this.volumeNode, outputNode);
    } else {
      this.synth.chain(this.filter, this.volumeNode, Tone.getDestination());
    }
  }

  playNote(pitch: string, velocity: number = 0.85): void {
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }
      // MonoSynth is monophonic — release previous note before attacking new one
      if (this.currentNote && this.currentNote !== pitch) {
        this.synth.triggerRelease();
      }
      this.activeNotes.add(pitch);
      this.currentNote = pitch;
      this.synth.triggerAttack(pitch, undefined, Math.min(Math.max(velocity, 0.1), 1.0));
    } catch (err) {
      console.warn(`[Bass] Failed to play note ${pitch}`, err);
    }
  }

  releaseNote(pitch: string): void {
    try {
      this.activeNotes.delete(pitch);
      if (this.currentNote === pitch) {
        this.synth.triggerRelease();
        this.currentNote = null;
      }
    } catch (err) {
      console.warn(`[Bass] Failed to release note ${pitch}`, err);
    }
  }

  triggerAttackRelease(pitch: string, duration: number, time?: number, velocity: number = 0.85): void {
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
      console.warn(`[Bass] Failed to triggerAttackRelease note ${pitch}`, err);
    }
  }

  stopAll(): void {
    try {
      if (this.activeNotes.size > 0) {
        this.synth.triggerRelease();
        this.activeNotes.clear();
        this.currentNote = null;
      }
    } catch (err) {
      console.warn('[Bass] Failed to stop all notes', err);
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
    this.volumeNode.dispose();
  }
}
