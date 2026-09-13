import * as Tone from 'tone';
import { InstrumentType, InstrumentInterface, DrumSound } from '../types/audio';
import { NoteEvent } from '../types/music';
import { TrackData, ProjectData, PatternData, MasterFxData } from '../types/project';
import { pitchToMidi } from '../music/notes';
import { PianoInstrument } from './instruments/PianoSampler';
import { BassInstrument } from './instruments/BassInstrument';
import { GuitarInstrument } from './instruments/GuitarInstrument';
import { SynthInstrument } from './instruments/SynthInstrument';
import { DrumEngine } from './instruments/DrumEngine';
import { DrumsInstrument } from './instruments/DrumsInstrument';
import { audioBufferToWav } from '../utils/audioExport';

export interface TransportPosition {
  bar: number;
  beat: number;
  sixteenth: number;
  seconds: number;
  progress: number;
}

export interface TrackChannelNodes {
  channel: Tone.Channel;
  eq: Tone.EQ3;
  meter: Tone.Meter;
}

export function volumeToDb(vol: number): number {
  if (vol <= 0.001) return -100;
  // 0.8 is 0 dB unity, 1.0 is +1.94 dB, 1.25 is +3.88 dB
  return 20 * Math.log10(vol / 0.8);
}

export function getMeterNormalizedLevel(meter: Tone.Meter): number {
  try {
    const val = meter.getValue();
    const db = Array.isArray(val) 
      ? Math.max(val[0] ?? -100, val[1] ?? -100) 
      : (typeof val === 'number' ? val : -100);
    if (!isFinite(db) || db <= -60) return 0;
    if (db >= 0) return 1;
    return (db + 60) / 60;
  } catch {
    return 0;
  }
}

type PositionCallback = (pos: TransportPosition) => void;
type VisualNoteCallback = (pitch: string, isActive: boolean) => void;
type DrumStepCallback = (step: number) => void;

class AudioEngineSingleton {
  private static instance: AudioEngineSingleton;
  private isInitialized = false;
  private masterVolumeNode: Tone.Volume;
  private masterCompressor: Tone.Compressor;
  private masterReverb: Tone.Reverb;
  private masterDelay: Tone.FeedbackDelay;
  private masterMeter: Tone.Meter;
  private masterBus: Tone.Channel;
  private trackChannels: Map<string, TrackChannelNodes> = new Map();

  // Multi-Instruments
  private currentInstrumentType: InstrumentType = 'piano';
  private instruments: Map<InstrumentType, InstrumentInterface> = new Map();
  private trackInstruments: Map<string, InstrumentInterface> = new Map();
  private drumEngine: DrumEngine;
  private activeLiveDrumPattern: Record<DrumSound, boolean[]> | null = null;


  // Metronome
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private metronomeEnabled: boolean = false;

  // Recording State
  private isRecording = false;
  private recordingNotesInProgress: Map<string, { start: number; velocity: number; midi: number }> = new Map();
  private recordedNotesBuffer: NoteEvent[] = [];

  // Multi-Track Playback Scheduling
  private playbackParts: Tone.Part[] = [];
  private playbackEndEventId: number | null = null;
  private drumScheduleId: number | null = null;
  private drumSequence: Tone.Sequence<number> | null = null;
  private arrangementEventIds: number[] = [];
  private visualNoteCallback: VisualNoteCallback | null = null;
  private drumStepCallback: DrumStepCallback | null = null;
  private positionListeners: Set<PositionCallback> = new Set();
  private tickerScheduled = false;

  private constructor() {
    this.masterVolumeNode = new Tone.Volume(0);
    this.masterCompressor = new Tone.Compressor({
      threshold: -12,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });

    this.masterReverb = new Tone.Reverb({
      decay: 1.8,
      preDelay: 0.01,
      wet: 0.15
    });

    this.masterDelay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.2,
      wet: 0.0
    });

    this.masterMeter = new Tone.Meter(0.8);
    this.masterBus = new Tone.Channel(0, 0);

    // Chain: MasterBus -> Delay -> Reverb -> Compressor -> MasterVolume -> MasterMeter -> Destination
    this.masterBus.chain(
      this.masterDelay,
      this.masterReverb,
      this.masterCompressor,
      this.masterVolumeNode,
      this.masterMeter,
      Tone.getDestination()
    );

    // 1. Piano
    try {
      const piano = new PianoInstrument(this.masterBus);
      this.instruments.set('piano', piano);
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize Piano instrument:', err);
    }

    // 2. Bass
    try {
      const bass = new BassInstrument(this.masterBus);
      this.instruments.set('bass', bass);
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize Bass instrument:', err);
    }

    // 3. Guitar
    try {
      const guitar = new GuitarInstrument(this.masterBus);
      this.instruments.set('guitar', guitar);
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize Guitar instrument:', err);
    }

    // 4. Synth
    try {
      const synth = new SynthInstrument(this.masterBus);
      this.instruments.set('synth', synth);
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize Synth instrument:', err);
    }

    // 5. Drums
    try {
      this.drumEngine = new DrumEngine(this.masterBus);
      const drumsInst = new DrumsInstrument(this.drumEngine);
      this.instruments.set('drums', drumsInst);
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize Drum engine:', err);
      this.drumEngine = new DrumEngine(); // fallback without routing
      this.instruments.set('drums', new DrumsInstrument(this.drumEngine));
    }
  }

  public static getInstance(): AudioEngineSingleton {
    if (!AudioEngineSingleton.instance) {
      AudioEngineSingleton.instance = new AudioEngineSingleton();
    }
    return AudioEngineSingleton.instance;
  }

  public async init(): Promise<boolean> {
    try {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        await Tone.getContext().resume();
      }
      this.isInitialized = true;
      this.initMetronome();
      this.setupTransportTicker();
      if (this.masterReverb) {
        this.masterReverb.generate().catch(err => console.warn('[AudioEngine] Reverb generate warning', err));
      }
      console.log('[AudioEngine] Context initialized and running at', Tone.getContext().sampleRate, 'Hz');
      return true;
    } catch (err) {
      console.error('[AudioEngine] Failed to initialize AudioContext:', err);
      return false;
    }
  }

  public async ensureAudioStarted(): Promise<void> {
    try {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
        await Tone.getContext().resume();
      }
      if (!this.isInitialized) {
        await this.init();
      }
    } catch (err) {
      console.warn('[AudioEngine] ensureAudioStarted warning:', err);
    }
  }

  public isContextRunning(): boolean {
    return this.isInitialized && Tone.getContext().state === 'running';
  }

  // --- Instrument Controls & Triggering ---

  /**
   * Get the instrument for live keyboard/mouse playing.
   * Always uses the global instruments map (connected directly to masterBus)
   * so that solo/mute on track channels doesn't block live playing.
   * Per-track instruments are only used for scheduled playback.
   */
  private getActivePlayInstrument(): InstrumentInterface {
    return this.instruments.get(this.currentInstrumentType) || this.instruments.get('piano')!;
  }

  public playNote(pitch: string, velocity: number = 0.8): void {
    if (!this.isInitialized || Tone.getContext().state !== 'running') {
      this.ensureAudioStarted().then(() => {
        this.performPlayNote(pitch, velocity);
      });
      return;
    }
    this.performPlayNote(pitch, velocity);
  }

  private activeTrackId: string | null = null;

  public setActiveTrack(trackId: string, track?: TrackData): void {
    this.activeTrackId = trackId;
    if (track) {
      // Pre-create the track instrument so it's ready for scheduled playback
      this.getTrackInstrument(track);
    }
  }

  public getActiveTrackId(): string | null {
    return this.activeTrackId;
  }

  private performPlayNote(pitch: string, velocity: number = 0.8): void {
    const inst = this.getActivePlayInstrument();
    inst?.playNote(pitch, velocity);

    // Capture note on if recording is active
    if (this.isRecording) {
      const currentSeconds = Tone.getTransport().seconds;
      if (this.recordingNotesInProgress.has(pitch)) {
        const prev = this.recordingNotesInProgress.get(pitch)!;
        const dur = Math.max(0.08, currentSeconds - prev.start);
        this.recordedNotesBuffer.push({
          id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          pitch,
          midi: prev.midi,
          start: Number(prev.start.toFixed(3)),
          duration: Number(dur.toFixed(3)),
          velocity: prev.velocity
        });
      }
      this.recordingNotesInProgress.set(pitch, {
        start: currentSeconds,
        velocity,
        midi: pitchToMidi(pitch)
      });
    }
  }

  public releaseNote(pitch: string): void {
    const inst = this.getActivePlayInstrument();
    inst?.releaseNote(pitch);

    if (this.isRecording && this.recordingNotesInProgress.has(pitch)) {
      const startData = this.recordingNotesInProgress.get(pitch)!;
      const currentSeconds = Tone.getTransport().seconds;
      const duration = Math.max(0.08, currentSeconds - startData.start);

      const noteEvent: NoteEvent = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pitch,
        midi: startData.midi,
        start: Number(startData.start.toFixed(3)),
        duration: Number(duration.toFixed(3)),
        velocity: startData.velocity
      };

      this.recordedNotesBuffer.push(noteEvent);
      this.recordingNotesInProgress.delete(pitch);
    }
  }

  public stopAllNotes(): void {
    for (const inst of this.instruments.values()) {
      inst.stopAll();
    }
    for (const inst of this.trackInstruments.values()) {
      inst.stopAll();
    }
  }

  public setInstrument(type: InstrumentType): void {
    this.stopAllNotes();
    this.currentInstrumentType = type;
  }

  public getInstrument(type: InstrumentType): InstrumentInterface | undefined {
    return this.instruments.get(type);
  }

  public getActiveInstrument(): InstrumentInterface | undefined {
    return this.instruments.get(this.currentInstrumentType);
  }

  // --- Drum Machine Triggering ---

  public triggerDrum(sound: DrumSound, time?: number, velocity: number = 0.9): void {
    this.init().then(() => {
      this.drumEngine.triggerDrum(sound, time, velocity);
    });
  }

  public updateLiveDrumPattern(pattern: Record<DrumSound, boolean[]>): void {
    this.activeLiveDrumPattern = pattern;
  }

  public setDrumVolume(vol: number): void {
    this.drumEngine.setVolume(vol);
  }

  public setDrumStepCallback(cb: DrumStepCallback | null): void {
    this.drumStepCallback = cb;
  }

  // --- Recording Management ---

  public startRecording(): void {
    this.init().then(() => {
      this.stopAllNotes();
      this.clearPlaybackSchedule();
      Tone.getTransport().stop();
      Tone.getTransport().seconds = 0;

      this.isRecording = true;
      this.recordedNotesBuffer = [];
      this.recordingNotesInProgress.clear();

      Tone.getTransport().start();
    });
  }

  public stopRecording(): NoteEvent[] {
    if (!this.isRecording) return [...this.recordedNotesBuffer];

    this.isRecording = false;
    const currentSeconds = Tone.getTransport().seconds;

    this.recordingNotesInProgress.forEach((startData, pitch) => {
      const duration = Math.max(0.08, currentSeconds - startData.start);
      this.recordedNotesBuffer.push({
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pitch,
        midi: startData.midi,
        start: Number(startData.start.toFixed(3)),
        duration: Number(duration.toFixed(3)),
        velocity: startData.velocity
      });
    });
    this.recordingNotesInProgress.clear();

    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;

    return [...this.recordedNotesBuffer];
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getRecordedNotesBuffer(): NoteEvent[] {
    return [...this.recordedNotesBuffer];
  }

  // --- Multi-Track & Drum Scheduled Playback ---

  public setVisualNoteCallback(cb: VisualNoteCallback | null): void {
    this.visualNoteCallback = cb;
  }

  /**
   * Schedule simultaneous playback across all unmuted/soloed project tracks and the drum sequencer.
   */
  public scheduleAllTracksPlayback(
    tracks: TrackData[],
    drumPattern?: Record<DrumSound, boolean[]>,
    _onPlaybackEnd?: () => void
  ): void {
    this.clearPlaybackSchedule();

    // Determine which tracks are audible considering Solo and Mute
    const hasSolo = tracks.some(t => t.isSoloed);
    const audibleTracks = tracks.filter(t => {
      if (t.isMuted) return false;
      if (hasSolo) return t.isSoloed;
      return true;
    });

    let overallMaxEnd = 1.0;

    // Connect drum engine to drum track channel if available
    const drumTrack = tracks.find(t => t.instrument === 'drums');
    if (drumTrack) {
      const drumNode = this.getOrCreateTrackChannel(drumTrack.id, drumTrack);
      this.drumEngine.connect(drumNode.eq);
    }

    // 1. Schedule each track's notes on its designated instrument
    audibleTracks.forEach((track) => {
      if (!track.notes || track.notes.length === 0) return;

      const inst = this.getTrackInstrument(track);
      if (!inst) return;

      inst.setVolume(track.volume);

      const events = track.notes.map(n => ({
        time: n.start,
        pitch: n.pitch,
        duration: n.duration,
        velocity: n.velocity * track.volume,
      }));

      const part = new Tone.Part((time, value) => {
        inst.triggerAttackRelease(value.pitch, value.duration, time, value.velocity);

        // Visual illumination for active instrument notes
        if (track.instrument === this.currentInstrumentType && this.visualNoteCallback) {
          Tone.getDraw().schedule(() => {
            this.visualNoteCallback?.(value.pitch, true);
          }, time);

          Tone.getDraw().schedule(() => {
            this.visualNoteCallback?.(value.pitch, false);
          }, time + value.duration);
        }
      }, events);

      part.start(0);
      this.playbackParts.push(part);

      const trackMax = Math.max(...track.notes.map(n => n.start + n.duration));
      if (trackMax > overallMaxEnd) {
        overallMaxEnd = trackMax;
      }
    });

    // 2. Schedule Drum Sequencer Loop if drum pattern has active steps
    this.activeLiveDrumPattern = drumPattern || null;
    const bpm = Tone.getTransport().bpm.value || 120;
    const oneBarSec = (4 * 60) / bpm;

    if (drumPattern) {
      this.drumSequence = new Tone.Sequence(
        (time, step) => {
          const currentPattern = this.activeLiveDrumPattern || drumPattern;

          // Trigger active drum sounds for this sixteenth step
          (Object.keys(currentPattern) as DrumSound[]).forEach((sound) => {
            if (currentPattern[sound]?.[step]) {
              this.drumEngine.triggerDrum(sound, time, 0.9);
            }
          });

          // Notify UI of active step for LED playhead
          if (this.drumStepCallback) {
            Tone.getDraw().schedule(() => {
              this.drumStepCallback?.(step);
            }, time);
          }
        },
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        '16n'
      );

      this.drumSequence.loop = true;
      this.drumSequence.start(0);

      if (overallMaxEnd < oneBarSec) {
        overallMaxEnd = oneBarSec;
      }
    }

    // In pattern mode (drum loop or pattern preview), loop continuously
    const finalEnd = Math.max(overallMaxEnd, oneBarSec);
    Tone.getTransport().loop = true;
    Tone.getTransport().loopStart = 0;
    Tone.getTransport().loopEnd = finalEnd;
  }

  /**
   * Schedule arrangement playback across all tracks, placed pattern clips, and sections.
   */
  public scheduleArrangementPlayback(
    project: ProjectData,
    onPlaybackEnd?: () => void
  ): void {
    this.clearPlaybackSchedule();
    this.syncProjectTracks(project.tracks);
    if (project.masterFx) {
      this.updateMasterMixer(project.masterFx);
    }

    const bpm = project.bpm || 120;
    const barDuration = (4 * 60) / bpm;
    const sixteenthDuration = barDuration / 16;

    const hasSolo = project.tracks.some(t => t.isSoloed);
    const audibleTracks = project.tracks.filter(t => {
      if (t.isMuted) return false;
      if (hasSolo) return t.isSoloed;
      return true;
    });

    let maxArrangementEndSec = 2.0;

    const patternMap = new Map<string, PatternData>();
    (project.patterns || []).forEach(p => patternMap.set(p.id, p));

    const drumTrack = project.tracks.find(t => t.instrument === 'drums');
    if (drumTrack) {
      const drumNode = this.getOrCreateTrackChannel(drumTrack.id, drumTrack);
      this.drumEngine.connect(drumNode.eq);
    }

    audibleTracks.forEach((track) => {
      const inst = this.getTrackInstrument(track);
      if (!inst) return;
      inst.setVolume(track.volume);

      const events: Array<{ time: number; pitch: string; duration: number; velocity: number }> = [];
      const clips = track.clips || [];

      clips.forEach((clip) => {
        const pattern = patternMap.get(clip.patternId);
        if (!pattern) return;

        const clipStartSec = (clip.startBar - 1) * barDuration;
        const clipEndSec = clipStartSec + (clip.durationBars * barDuration);
        if (clipEndSec > maxArrangementEndSec) {
          maxArrangementEndSec = clipEndSec;
        }

        // Schedule drum pattern if present
        if (pattern.drumPattern) {
          for (let b = 0; b < clip.durationBars; b++) {
            const barStart = clipStartSec + (b * barDuration);
            for (let s = 0; s < 16; s++) {
              const stepTime = barStart + (s * sixteenthDuration);
              (Object.keys(pattern.drumPattern) as DrumSound[]).forEach((sound) => {
                if (pattern.drumPattern?.[sound]?.[s]) {
                  const eventId = Tone.getTransport().schedule((time) => {
                    this.drumEngine.triggerDrum(sound, time, 0.85 * track.volume);
                  }, stepTime);
                  this.arrangementEventIds.push(eventId);
                }
              });
            }
          }
        }

        // Schedule instrument notes if present
        if (pattern.notes && pattern.notes.length > 0) {
          pattern.notes.forEach((n) => {
            const noteStart = clipStartSec + n.start;
            if (noteStart < clipEndSec) {
              const remainingDuration = Math.min(n.duration, clipEndSec - noteStart);
              events.push({
                time: noteStart,
                pitch: n.pitch,
                duration: remainingDuration,
                velocity: n.velocity * track.volume,
              });
            }
          });
        }
      });

      // Fallback: If track has direct notes and no clips placed, play direct notes
      if (clips.length === 0 && track.notes && track.notes.length > 0) {
        track.notes.forEach((n) => {
          events.push({
            time: n.start,
            pitch: n.pitch,
            duration: n.duration,
            velocity: n.velocity * track.volume,
          });
          const noteEnd = n.start + n.duration;
          if (noteEnd > maxArrangementEndSec) {
            maxArrangementEndSec = noteEnd;
          }
        });
      }

      if (events.length > 0) {
        const part = new Tone.Part((time, value) => {
          inst.triggerAttackRelease(value.pitch, value.duration, time, value.velocity);

          if (track.instrument === this.currentInstrumentType && this.visualNoteCallback) {
            Tone.getDraw().schedule(() => {
              this.visualNoteCallback?.(value.pitch, true);
            }, time);
            Tone.getDraw().schedule(() => {
              this.visualNoteCallback?.(value.pitch, false);
            }, time + value.duration);
          }
        }, events);

        part.start(0);
        this.playbackParts.push(part);
      }
    });

    // Schedule stop when song finishes (if loop is disabled)
    const finalEnd = maxArrangementEndSec + 0.3;
    this.playbackEndEventId = Tone.getTransport().scheduleOnce(() => {
      if (!Tone.getTransport().loop) {
        this.stopTransport();
        onPlaybackEnd?.();
      }
    }, finalEnd);
  }

  public clearPlaybackSchedule(): void {
    this.playbackParts.forEach(p => p.dispose());
    this.playbackParts = [];

    this.arrangementEventIds.forEach(id => Tone.getTransport().clear(id));
    this.arrangementEventIds = [];

    if (this.playbackEndEventId !== null) {
      Tone.getTransport().clear(this.playbackEndEventId);
      this.playbackEndEventId = null;
    }

    if (this.drumScheduleId !== null) {
      Tone.getTransport().clear(this.drumScheduleId);
      this.drumScheduleId = null;
    }

    if (this.drumSequence) {
      this.drumSequence.stop();
      this.drumSequence.dispose();
      this.drumSequence = null;
    }
    Tone.getTransport().loop = false;
  }

  // --- Transport Controls ---

  public setBPM(bpm: number): void {
    const clampedBpm = Math.min(Math.max(bpm, 40), 280);
    Tone.getTransport().bpm.value = clampedBpm;
  }

  public getBPM(): number {
    return Math.round(Tone.getTransport().bpm.value);
  }

  public startTransport(): void {
    this.init().then(() => {
      Tone.getTransport().start();
    });
  }

  public pauseTransport(): void {
    Tone.getTransport().pause();
  }

  public stopTransport(): void {
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    Tone.getTransport().loop = false;
    if (this.drumSequence) {
      this.drumSequence.stop();
    }
    this.stopAllNotes();
    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.drumStepCallback) {
      this.drumStepCallback(0);
    }
  }

  public isTransportPlaying(): boolean {
    return Tone.getTransport().state === 'started';
  }

  public setLoop(enabled: boolean, startBar: number = 0, endBar: number = 4): void {
    Tone.getTransport().loop = enabled;
    Tone.getTransport().loopStart = `${startBar}:0:0`;
    Tone.getTransport().loopEnd = `${endBar}:0:0`;
  }

  public setLoopSection(startBar: number, lengthBars: number): void {
    const start = Math.max(0, startBar - 1);
    const end = start + lengthBars;
    Tone.getTransport().loop = true;
    Tone.getTransport().loopStart = `${start}:0:0`;
    Tone.getTransport().loopEnd = `${end}:0:0`;
    Tone.getTransport().position = `${start}:0:0`;
  }

  // --- Transport Ticker & Position Listeners ---

  public addPositionListener(cb: PositionCallback): () => void {
    this.positionListeners.add(cb);
    return () => {
      this.positionListeners.delete(cb);
    };
  }

  private setupTransportTicker(): void {
    if (this.tickerScheduled) return;
    this.tickerScheduled = true;

    const tick = () => {
      if (Tone.getTransport().state === 'started' || this.isRecording) {
        const rawPos = Tone.getTransport().position.toString().split(':');
        const bar = parseInt(rawPos[0], 10) + 1;
        const beat = parseInt(rawPos[1], 10) + 1;
        const sixteenth = Math.floor(parseFloat(rawPos[2]));
        const seconds = Tone.getTransport().seconds;

        const posData: TransportPosition = {
          bar,
          beat,
          sixteenth,
          seconds,
          progress: seconds % 8
        };

        this.positionListeners.forEach(listener => listener(posData));
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // --- Metronome ---

  private initMetronome(): void {
    if (this.metronomeSynth) return;

    this.metronomeSynth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.04
      }
    }).connect(this.masterVolumeNode);

    Tone.getTransport().scheduleRepeat((time) => {
      if (!this.metronomeEnabled || !this.metronomeSynth) return;
      
      const position = Tone.getTransport().position.toString().split(':');
      const beat = parseInt(position[1], 10);

      if (beat === 0) {
        this.metronomeSynth.triggerAttackRelease('C5', '32n', time, 0.9);
      } else {
        this.metronomeSynth.triggerAttackRelease('G4', '32n', time, 0.4);
      }
    }, '4n');
  }

  public toggleMetronome(enable?: boolean): boolean {
    this.metronomeEnabled = enable !== undefined ? enable : !this.metronomeEnabled;
    return this.metronomeEnabled;
  }

  public isMetronomeOn(): boolean {
    return this.metronomeEnabled;
  }

  // --- Track Mixer & Master FX Settings ---

  public getOrCreateTrackChannel(trackId: string, track?: TrackData): TrackChannelNodes {
    let node = this.trackChannels.get(trackId);
    if (!node) {
      const channel = new Tone.Channel({
        volume: volumeToDb(track?.volume ?? 0.8),
        pan: track?.pan ?? 0
      });
      const eq = new Tone.EQ3({
        low: track?.eq?.low ?? 0,
        mid: track?.eq?.mid ?? 0,
        high: track?.eq?.high ?? 0
      });
      const meter = new Tone.Meter(0.8);

      // Signal flow: EQ -> Channel -> Meter -> MasterBus
      eq.chain(channel, meter, this.masterBus);
      node = { channel, eq, meter };
      this.trackChannels.set(trackId, node);
    }
    return node;
  }

  public updateTrackMixer(track: TrackData, anySolo: boolean): void {
    const node = this.getOrCreateTrackChannel(track.id, track);
    try {
      node.channel.volume.rampTo(volumeToDb(track.volume), 0.04);
      node.channel.pan.rampTo(track.pan, 0.04);
      node.channel.mute = anySolo ? !track.isSoloed : track.isMuted;

      if (track.eq) {
        node.eq.low.rampTo(track.eq.low, 0.04);
        node.eq.mid.rampTo(track.eq.mid, 0.04);
        node.eq.high.rampTo(track.eq.high, 0.04);
      }
    } catch (err) {
      console.warn(`[AudioEngine] updateTrackMixer error for ${track.id}`, err);
    }
  }

  public syncProjectTracks(tracks: TrackData[]): void {
    const anySolo = tracks.some(t => t.isSoloed);
    tracks.forEach(t => this.updateTrackMixer(t, anySolo));
  }

  public getTrackPeakLevel(trackId: string): number {
    const node = this.trackChannels.get(trackId);
    if (!node) return 0;
    return getMeterNormalizedLevel(node.meter);
  }

  public getMasterPeakLevel(): number {
    return getMeterNormalizedLevel(this.masterMeter);
  }

  public setMasterFx(reverbWet: number, delayWet: number): void {
    try {
      this.masterReverb.wet.rampTo(Math.max(0, Math.min(1, reverbWet)), 0.05);
      this.masterDelay.wet.rampTo(Math.max(0, Math.min(1, delayWet)), 0.05);
    } catch {
      // Ignore if not ready
    }
  }

  public setMasterPan(pan: number): void {
    try {
      this.masterBus.pan.rampTo(Math.max(-1, Math.min(1, pan)), 0.05);
    } catch {
      // Ignore
    }
  }

  public updateMasterMixer(masterFx: MasterFxData): void {
    try {
      this.setMasterVolume(masterFx.volume);
      this.setMasterPan(masterFx.pan);
      this.setMute(masterFx.isMuted);
      this.setMasterFx(masterFx.reverbWet, masterFx.delayWet);
    } catch (err) {
      console.warn('[AudioEngine] updateMasterMixer error', err);
    }
  }

  public setMasterVolume(volume: number): void {
    if (volume <= 0.001) {
      this.masterVolumeNode.mute = true;
    } else {
      this.masterVolumeNode.mute = false;
      this.masterVolumeNode.volume.rampTo(volumeToDb(volume), 0.04);
    }
  }

  public setMute(muted: boolean): void {
    this.masterVolumeNode.mute = muted;
  }

  // --- Dynamic Track Instrument Routing ---

  public getTrackInstrument(track: TrackData): InstrumentInterface {
    let inst = this.trackInstruments.get(track.id);
    if (!inst) {
      try {
        const node = this.getOrCreateTrackChannel(track.id, track);
        switch (track.instrument) {
          case 'bass':
            inst = new BassInstrument(node.eq);
            break;
          case 'guitar':
            inst = new GuitarInstrument(node.eq);
            break;
          case 'synth':
            inst = new SynthInstrument(node.eq);
            break;
          case 'drums':
            inst = new DrumsInstrument(this.drumEngine);
            break;
          case 'piano':
          default:
            inst = new PianoInstrument(node.eq);
            break;
        }
      } catch (err) {
        console.error(`[AudioEngine] Failed to create ${track.instrument} for track ${track.id}, falling back to piano:`, err);
        const node = this.getOrCreateTrackChannel(track.id, track);
        inst = new PianoInstrument(node.eq);
      }
      this.trackInstruments.set(track.id, inst);
    }
    return inst;
  }


  // --- Phase 9: Master Audio WAV Offline Render ---

  public async renderProjectToWav(project: ProjectData): Promise<Blob> {
    const bpm = project.bpm || 120;
    const barDuration = (4 * 60) / bpm;

    // Calculate arrangement duration
    let maxSec = 4.0;
    const patternMap = new Map<string, PatternData>();
    (project.patterns || []).forEach(p => patternMap.set(p.id, p));

    project.tracks.forEach(track => {
      (track.clips || []).forEach(clip => {
        const end = (clip.startBar - 1 + clip.durationBars) * barDuration;
        if (end > maxSec) maxSec = end;
      });
      (track.notes || []).forEach(n => {
        const end = n.start + n.duration;
        if (end > maxSec) maxSec = end;
      });
    });

    const totalRenderDuration = Math.min(180, Math.max(2.0, maxSec + 1.2));

    const renderedBuffer = await Tone.Offline(async (ctx) => {
      ctx.transport.bpm.value = bpm;
      const masterVol = new Tone.Volume(0).toDestination();

      for (const track of project.tracks) {
        if (track.isMuted) continue;

        const channel = new Tone.Channel({
          volume: volumeToDb(track.volume),
          pan: track.pan || 0
        }).connect(masterVol);

        const synth = new Tone.PolySynth(Tone.Synth).connect(channel);

        const clips = track.clips || [];
        clips.forEach(clip => {
          const pattern = patternMap.get(clip.patternId);
          if (pattern?.notes) {
            const clipStartSec = (clip.startBar - 1) * barDuration;
            pattern.notes.forEach((n: NoteEvent) => {
              ctx.transport.schedule((time) => {
                synth.triggerAttackRelease(n.pitch, n.duration, time, n.velocity * track.volume);
              }, clipStartSec + n.start);
            });
          }
        });

        if (clips.length === 0 && track.notes) {
          track.notes.forEach(n => {
            ctx.transport.schedule((time) => {
              synth.triggerAttackRelease(n.pitch, n.duration, time, n.velocity * track.volume);
            }, n.start);
          });
        }
      }

      ctx.transport.start(0);
    }, totalRenderDuration);

    const buffer = renderedBuffer.get();
    if (!buffer) {
      throw new Error('Offline audio rendering produced no audio buffer');
    }
    return audioBufferToWav(buffer);
  }
}

export const AudioEngine = AudioEngineSingleton.getInstance();
