import * as Tone from 'tone';
import { DrumSound } from '../../types/audio';

export class DrumEngine {
  name = 'Studio Drum Engine';

  private outputNode: Tone.Volume;
  private kickSynth: Tone.MembraneSynth;
  private snareBody: Tone.MembraneSynth;
  private snareNoise: Tone.NoiseSynth;
  private hihatClosedFilter: Tone.Filter;
  private hihatClosed: Tone.NoiseSynth;
  private hihatOpenFilter: Tone.Filter;
  private hihatOpen: Tone.NoiseSynth;
  private clapFilter: Tone.Filter;
  private clapNoise: Tone.NoiseSynth;
  private tomSynth: Tone.MembraneSynth;

  constructor(masterBus?: Tone.ToneAudioNode) {
    this.outputNode = new Tone.Volume(0);

    // 1. Kick Drum: 55Hz punchy sub drop
    this.kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.38,
        sustain: 0,
        release: 0.2
      }
    });
    this.kickSynth.volume.value = 2;

    // 2. Snare: Dual Layer (Resonant Body + Pink Noise snap)
    this.snareBody = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2.5,
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.16,
        sustain: 0,
        release: 0.1
      }
    });
    this.snareBody.volume.value = 0;

    this.snareNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0
      }
    });
    this.snareNoise.volume.value = 1;

    // 3. Closed Hi-Hat: High-pass filtered noise snap (7.5kHz)
    this.hihatClosedFilter = new Tone.Filter({
      frequency: 7500,
      type: 'highpass'
    });
    this.hihatClosed = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.045,
        sustain: 0
      }
    });
    this.hihatClosed.volume.value = 0;
    this.hihatClosed.connect(this.hihatClosedFilter);
    this.hihatClosedFilter.connect(this.outputNode);

    // 4. Open Hi-Hat: Sizzling metallic noise ring (5.5kHz)
    this.hihatOpenFilter = new Tone.Filter({
      frequency: 5500,
      type: 'highpass'
    });
    this.hihatOpen = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.32,
        sustain: 0
      }
    });
    this.hihatOpen.volume.value = -1;
    this.hihatOpen.connect(this.hihatOpenFilter);
    this.hihatOpenFilter.connect(this.outputNode);

    // 5. Hand Clap: Bandpass filtered impulse burst (1.1kHz)
    this.clapFilter = new Tone.Filter({
      frequency: 1100,
      type: 'bandpass',
      Q: 1.4
    });
    this.clapNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.003,
        decay: 0.16,
        sustain: 0
      }
    });
    this.clapNoise.volume.value = 2;
    this.clapNoise.connect(this.clapFilter);
    this.clapFilter.connect(this.outputNode);

    // 6. Tom: Resonant pitch-bent tom
    this.tomSynth = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 3.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.32,
        sustain: 0,
        release: 0.2
      }
    });
    this.tomSynth.volume.value = 2;

    // Route direct synths to output volume node
    this.kickSynth.connect(this.outputNode);
    this.snareBody.connect(this.outputNode);
    this.snareNoise.connect(this.outputNode);
    this.tomSynth.connect(this.outputNode);

    if (masterBus) {
      this.outputNode.connect(masterBus);
    } else {
      this.outputNode.toDestination();
    }
  }

  public triggerDrum(sound: DrumSound, time?: number, velocity: number = 0.9): void {
    try {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }

      const vel = Math.min(Math.max(velocity, 0.1), 1.0);
      const triggerTime = time !== undefined ? time : Tone.now();

      switch (sound) {
        case 'kick':
          this.kickSynth.triggerAttackRelease('C1', '8n', triggerTime, vel);
          break;
        case 'snare':
          this.snareBody.triggerAttackRelease('G2', '16n', triggerTime, vel * 0.8);
          this.snareNoise.triggerAttackRelease('16n', triggerTime, vel);
          break;
        case 'hihatClosed':
          this.hihatClosed.triggerAttackRelease('32n', triggerTime, vel * 0.9);
          break;
        case 'hihatOpen':
          this.hihatOpen.triggerAttackRelease('8n', triggerTime, vel * 0.9);
          break;
        case 'clap':
          this.clapNoise.triggerAttackRelease('16n', triggerTime, vel);
          break;
        case 'tom':
          this.tomSynth.triggerAttackRelease('A1', '8n', triggerTime, vel);
          break;
      }
    } catch (err) {
      console.warn(`[DrumEngine] Failed to trigger drum ${sound}`, err);
    }
  }

  public setVolume(vol: number): void {
    if (vol <= 0) {
      this.outputNode.mute = true;
    } else {
      this.outputNode.mute = false;
      this.outputNode.volume.value = Tone.gainToDb(vol);
    }
  }

  public stopAll(): void {
    // Drum synths naturally decay; no long sustain to release
  }

  public connect(targetNode: Tone.ToneAudioNode): void {
    try {
      this.outputNode.disconnect();
      this.outputNode.connect(targetNode);
    } catch (err) {
      console.warn('[DrumEngine] Failed to connect targetNode', err);
    }
  }

  public disconnect(): void {
    try {
      this.outputNode.disconnect();
    } catch (err) {
      console.warn('[DrumEngine] Failed to disconnect', err);
    }
  }

  public dispose(): void {
    this.kickSynth.dispose();
    this.snareBody.dispose();
    this.snareNoise.dispose();
    this.hihatClosed.dispose();
    this.hihatClosedFilter.dispose();
    this.hihatOpen.dispose();
    this.hihatOpenFilter.dispose();
    this.clapNoise.dispose();
    this.clapFilter.dispose();
    this.tomSynth.dispose();
    this.outputNode.dispose();
  }
}
