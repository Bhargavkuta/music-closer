import * as Tone from 'tone';
import { BaseInstrument } from './Instrument';
import { InstrumentType } from '../../types/audio';

// 30-note multi-sample anchor map covering the 88-key acoustic grand piano range
const PIANO_SAMPLES: Record<string, string> = {
  'A0': 'A0.mp3',
  'C1': 'C1.mp3',
  'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3',
  'A1': 'A1.mp3',
  'C2': 'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  'A2': 'A2.mp3',
  'C3': 'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  'A3': 'A3.mp3',
  'C4': 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  'A4': 'A4.mp3',
  'C5': 'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  'A5': 'A5.mp3',
  'C6': 'C6.mp3',
  'D#6': 'Ds6.mp3',
  'F#6': 'Fs6.mp3',
  'A6': 'A6.mp3',
  'C7': 'C7.mp3',
  'D#7': 'Ds7.mp3',
  'F#7': 'Fs7.mp3',
  'A7': 'A7.mp3',
  'C8': 'C8.mp3'
};

export class PianoInstrument extends BaseInstrument {
  name = 'Acoustic Grand Piano';
  type: InstrumentType = 'piano';

  private sampler: Tone.Sampler;
  private fallbackSynth: Tone.PolySynth;
  private eq: Tone.EQ3;
  private volumeNode: Tone.Volume;
  private activeNotes: Set<string> = new Set();
  public isLoaded: boolean = false;

  constructor(outputNode?: Tone.ToneAudioNode) {
    super();

    this.volumeNode = new Tone.Volume(-2);

    // Warm grand piano soundboard acoustic shaping: rich low-mids + crisp hammer clarity
    this.eq = new Tone.EQ3({
      low: 1.0,
      mid: 0.0,
      high: 1.5,
      lowFrequency: 280,
      highFrequency: 3800
    });

    // Zero-latency fallback synthesizer while multi-samples buffer
    this.fallbackSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle8' },
      envelope: {
        attack: 0.005,
        decay: 1.8,
        sustain: 0.15,
        release: 1.2
      }
    });

    // High-fidelity Yamaha C5 Grand Piano multi-sample library
    this.sampler = new Tone.Sampler({
      urls: PIANO_SAMPLES,
      baseUrl: '/samples/piano/',
      curve: 'exponential',
      attack: 0,
      release: 1.4,
      volume: 0,
      onload: () => {
        this.isLoaded = true;
        console.log('[PianoInstrument] High-quality Yamaha C5 Grand Piano samples loaded successfully');
      }
    });

    const destination = outputNode || Tone.getDestination();

    // Signal chain: [Sampler / Fallback] -> EQ -> VolumeNode -> Output
    this.sampler.chain(this.eq, this.volumeNode, destination);
    this.fallbackSynth.chain(this.eq, this.volumeNode, destination);
  }

  playNote(pitch: string, velocity: number = 0.8): void {
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }
      this.activeNotes.add(pitch);
      const vel = Math.min(Math.max(velocity, 0.1), 1.0);

      if (this.sampler.loaded) {
        this.sampler.triggerAttack(pitch, undefined, vel);
      } else {
        this.fallbackSynth.triggerAttack(pitch, undefined, vel);
      }
    } catch (err) {
      console.warn(`[Piano] Failed to play note ${pitch}`, err);
    }
  }

  releaseNote(pitch: string): void {
    try {
      this.activeNotes.delete(pitch);
      if (this.sampler.loaded) {
        this.sampler.triggerRelease([pitch]);
      } else {
        this.fallbackSynth.triggerRelease([pitch]);
      }
    } catch (err) {
      console.warn(`[Piano] Failed to release note ${pitch}`, err);
    }
  }

  triggerAttackRelease(pitch: string, duration: number, time?: number, velocity: number = 0.8): void {
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }
      const triggerTime = time !== undefined ? time : Tone.now();
      const vel = Math.min(Math.max(velocity, 0.1), 1.0);

      if (this.sampler.loaded) {
        this.sampler.triggerAttackRelease(pitch, duration, triggerTime, vel);
      } else {
        this.fallbackSynth.triggerAttackRelease(pitch, duration, triggerTime, vel);
      }
    } catch (err) {
      console.warn(`[Piano] Failed to triggerAttackRelease note ${pitch}`, err);
    }
  }

  stopAll(): void {
    try {
      if (this.activeNotes.size > 0) {
        if (this.sampler.loaded) {
          this.sampler.releaseAll();
        }
        this.fallbackSynth.releaseAll();
        this.activeNotes.clear();
      }
    } catch (err) {
      console.warn('[Piano] Failed to stop all notes', err);
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
    this.sampler.dispose();
    this.fallbackSynth.dispose();
    this.eq.dispose();
    this.volumeNode.dispose();
  }
}
