import * as Tone from 'tone';
import { BaseInstrument } from './Instrument';
import { InstrumentType } from '../../types/audio';

// 17-note multi-sample anchor map covering the electric bass guitar range
const BASS_SAMPLES: Record<string, string> = {
  'A#1': 'As1.mp3',
  'C#1': 'Cs1.mp3',
  'E1': 'E1.mp3',
  'G1': 'G1.mp3',
  'A#2': 'As2.mp3',
  'C#2': 'Cs2.mp3',
  'E2': 'E2.mp3',
  'G2': 'G2.mp3',
  'A#3': 'As3.mp3',
  'C#3': 'Cs3.mp3',
  'E3': 'E3.mp3',
  'G3': 'G3.mp3',
  'A#4': 'As4.mp3',
  'C#4': 'Cs4.mp3',
  'E4': 'E4.mp3',
  'G4': 'G4.mp3',
  'C#5': 'Cs5.mp3'
};

export class BassInstrument extends BaseInstrument {
  name = 'Electric Bass';
  type: InstrumentType = 'bass';

  private sampler: Tone.Sampler;
  private fallbackSynth: Tone.MonoSynth;
  private eq: Tone.EQ3;
  private volumeNode: Tone.Volume;
  private activeNotes: Set<string> = new Set();
  private currentNote: string | null = null;
  public isLoaded: boolean = false;

  constructor(outputNode?: Tone.ToneAudioNode) {
    super();

    this.volumeNode = new Tone.Volume(-1);

    // Deep plucked electric bass body EQ: rich low-end punch + warm string definition
    this.eq = new Tone.EQ3({
      low: 2.5,
      mid: 0.0,
      high: -1.0,
      lowFrequency: 180,
      highFrequency: 2800
    });

    // Zero-latency fallback synthesizer while samples buffer into context
    this.fallbackSynth = new Tone.MonoSynth({
      oscillator: {
        type: 'triangle8'
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

    this.fallbackSynth.set({
      volume: -2
    });

    // Authentic studio-recorded plucked Electric Bass multi-samples
    this.sampler = new Tone.Sampler({
      urls: BASS_SAMPLES,
      baseUrl: '/samples/bass/',
      curve: 'exponential',
      attack: 0,
      release: 0.9,
      volume: 0,
      onload: () => {
        this.isLoaded = true;
        console.log('[BassInstrument] High-quality Electric Bass samples loaded successfully');
      }
    });

    const destination = outputNode || Tone.getDestination();

    // Signal chain: [Sampler / Fallback] -> EQ -> VolumeNode -> Output
    this.sampler.chain(this.eq, this.volumeNode, destination);
    this.fallbackSynth.chain(this.eq, this.volumeNode, destination);
  }

  playNote(pitch: string, velocity: number = 0.85): void {
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }
      this.activeNotes.add(pitch);
      this.currentNote = pitch;
      const vel = Math.min(Math.max(velocity, 0.1), 1.0);

      if (this.sampler.loaded) {
        this.sampler.triggerAttack(pitch, undefined, vel);
      } else {
        this.fallbackSynth.triggerAttack(pitch, undefined, vel);
      }
    } catch (err) {
      console.warn(`[Bass] Failed to play note ${pitch}`, err);
    }
  }

  releaseNote(pitch: string): void {
    try {
      this.activeNotes.delete(pitch);
      if (this.sampler.loaded) {
        this.sampler.triggerRelease([pitch]);
      } else {
        if (this.currentNote === pitch) {
          this.fallbackSynth.triggerRelease();
          this.currentNote = null;
        }
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
      const triggerTime = time !== undefined ? time : Tone.now();
      const vel = Math.min(Math.max(velocity, 0.1), 1.0);

      if (this.sampler.loaded) {
        this.sampler.triggerAttackRelease(pitch, duration, triggerTime, vel);
      } else {
        this.fallbackSynth.triggerAttackRelease(pitch, duration, triggerTime, vel);
      }
    } catch (err) {
      console.warn(`[Bass] Failed to triggerAttackRelease note ${pitch}`, err);
    }
  }

  stopAll(): void {
    try {
      if (this.activeNotes.size > 0) {
        if (this.sampler.loaded) {
          this.sampler.releaseAll();
        }
        this.fallbackSynth.triggerRelease();
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
    this.sampler.dispose();
    this.fallbackSynth.dispose();
    this.eq.dispose();
    this.volumeNode.dispose();
  }
}
