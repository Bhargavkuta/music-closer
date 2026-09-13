import * as Tone from 'tone';
import { DrumSound } from '../../types/audio';

export class DrumEngine {
  name = 'Studio Drum Engine';

  private outputNode: Tone.Volume;
  private kickSynth: Tone.MembraneSynth;
  private snareBody: Tone.MembraneSynth;
  private snareNoise: Tone.NoiseSynth;
  private hihatClosed: Tone.MetalSynth;
  private hihatOpen: Tone.MetalSynth;
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
        decay: 0.35,
        sustain: 0,
        release: 0.2
      }
    });

    // 2. Snare: Dual Layer (Body + Noise snap)
    this.snareBody = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0,
        release: 0.1
      }
    });

    this.snareNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0
      }
    });

    // 3. Closed Hi-Hat: Short metallic click
    this.hihatClosed = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.05,
        release: 0.05
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    });
    this.hihatClosed.frequency.value = 240;
    this.hihatClosed.volume.value = -8;

    // 4. Open Hi-Hat: Sizzling metallic ring
    this.hihatOpen = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.35,
        release: 0.2
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    });
    this.hihatOpen.frequency.value = 240;
    this.hihatOpen.volume.value = -8;

    // 5. Clap: Filtered noise snap
    this.clapNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.005,
        decay: 0.14,
        sustain: 0
      }
    });
    this.clapNoise.volume.value = -4;

    // 6. Tom: Resonant pitch-bent tom
    this.tomSynth = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 3.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.2
      }
    });

    // Route all drum voices to output volume node
    this.kickSynth.connect(this.outputNode);
    this.snareBody.connect(this.outputNode);
    this.snareNoise.connect(this.outputNode);
    this.hihatClosed.connect(this.outputNode);
    this.hihatOpen.connect(this.outputNode);
    this.clapNoise.connect(this.outputNode);
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
          this.snareBody.triggerAttackRelease('G2', '16n', triggerTime, vel * 0.7);
          this.snareNoise.triggerAttackRelease('16n', triggerTime, vel);
          break;
        case 'hihatClosed':
          this.hihatClosed.triggerAttackRelease('32n', triggerTime, vel * 0.8);
          break;
        case 'hihatOpen':
          this.hihatOpen.triggerAttackRelease('8n', triggerTime, vel * 0.8);
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
    this.hihatOpen.dispose();
    this.clapNoise.dispose();
    this.tomSynth.dispose();
    this.outputNode.dispose();
  }
}
