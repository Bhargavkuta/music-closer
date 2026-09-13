import * as Tone from 'tone';
import { BaseInstrument } from './Instrument';
import { InstrumentType } from '../../types/audio';

// Acoustic Guitar Sample Map matching our local downloaded high-quality multi-samples
const GUITAR_SAMPLES: Record<string, string> = {
  'D2': 'D2.mp3',
  'D#2': 'Ds2.mp3',
  'E2': 'E2.mp3',
  'F2': 'F2.mp3',
  'F#2': 'Fs2.mp3',
  'G2': 'G2.mp3',
  'G#2': 'Gs2.mp3',
  'A2': 'A2.mp3',
  'A#2': 'As2.mp3',
  'B2': 'B2.mp3',
  'C3': 'C3.mp3',
  'C#3': 'Cs3.mp3',
  'D3': 'D3.mp3',
  'D#3': 'Ds3.mp3',
  'E3': 'E3.mp3',
  'F3': 'F3.mp3',
  'F#3': 'Fs3.mp3',
  'G3': 'G3.mp3',
  'G#3': 'Gs3.mp3',
  'A3': 'A3.mp3',
  'A#3': 'As3.mp3',
  'B3': 'B3.mp3',
  'C4': 'C4.mp3',
  'C#4': 'Cs4.mp3',
  'D4': 'D4.mp3',
  'D#4': 'Ds4.mp3',
  'E4': 'E4.mp3',
  'F4': 'F4.mp3',
  'F#4': 'Fs4.mp3',
  'G4': 'G4.mp3',
  'G#4': 'Gs4.mp3',
  'A4': 'A4.mp3',
  'A#4': 'As4.mp3',
  'B4': 'B4.mp3',
  'C5': 'C5.mp3',
  'C#5': 'Cs5.mp3',
  'D5': 'D5.mp3'
};

export class GuitarInstrument extends BaseInstrument {
  name = 'Acoustic Guitar';
  type: InstrumentType = 'guitar';

  private sampler: Tone.Sampler;
  private fallbackSynth: Tone.PolySynth;
  private eq: Tone.EQ3;
  private volumeNode: Tone.Volume;
  private activeNotes: Set<string> = new Set();
  public isLoaded: boolean = false;

  constructor(outputNode?: Tone.ToneAudioNode) {
    super();

    this.volumeNode = new Tone.Volume(-2);

    // Warm acoustic guitar body shaping: rich low-mid body + crisp string brightness
    this.eq = new Tone.EQ3({
      low: 1.5,
      mid: -0.5,
      high: 2.0,
      lowFrequency: 250,
      highFrequency: 3500
    });

    // Fallback synth while samples are loading into audio context
    this.fallbackSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle16' },
      envelope: {
        attack: 0.005,
        decay: 1.2,
        sustain: 0.08,
        release: 0.8
      }
    });

    // Initialize Tone.Sampler with genuine acoustic steel-string multi-samples
    this.sampler = new Tone.Sampler({
      urls: GUITAR_SAMPLES,
      baseUrl: '/samples/guitar/',
      curve: 'exponential',
      attack: 0,
      release: 1.5,
      volume: 0,
      onload: () => {
        this.isLoaded = true;
        console.log('[GuitarInstrument] High-quality acoustic guitar samples loaded successfully');
      }
    });

    const destination = outputNode || Tone.getDestination();

    // Connect Sampler -> EQ -> Volume -> Output
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
      console.warn(`[Guitar] Failed to play note ${pitch}`, err);
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
      console.warn(`[Guitar] Failed to release note ${pitch}`, err);
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
      console.warn(`[Guitar] Failed to triggerAttackRelease note ${pitch}`, err);
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
      console.warn('[Guitar] Failed to stop all notes', err);
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
