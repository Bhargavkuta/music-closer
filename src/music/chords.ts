import { NOTE_NAMES, NoteLetter, pitchToMidi, midiToPitch } from './notes';
import { ChordType, ChordDefinition, NotePitch, NoteEvent, ScaleType } from '../types/music';
import { AudioEngine } from '../audio/AudioEngine';

export interface ChordInfo {
  type: ChordType;
  name: string;
  symbol: string; // e.g., "", "m", "dim", "aug", "7", "maj7", "m7", "sus2", "sus4"
  intervals: number[]; // semitone offsets from root
  description: string;
}

export const CHORD_INFOS: Record<ChordType, ChordInfo> = {
  major: {
    type: 'major',
    name: 'Major',
    symbol: '',
    intervals: [0, 4, 7],
    description: 'Bright, stable, and uplifting triad (Root, Maj 3rd, Perf 5th).'
  },
  minor: {
    type: 'minor',
    name: 'Minor',
    symbol: 'm',
    intervals: [0, 3, 7],
    description: 'Somber, emotional, and introspective triad (Root, Min 3rd, Perf 5th).'
  },
  diminished: {
    type: 'diminished',
    name: 'Diminished',
    symbol: 'dim',
    intervals: [0, 3, 6],
    description: 'Tense, dramatic, and unstable triad (Root, Min 3rd, Dim 5th).'
  },
  augmented: {
    type: 'augmented',
    name: 'Augmented',
    symbol: 'aug',
    intervals: [0, 4, 8],
    description: 'Dreamy, suspenseful, and unresolved triad (Root, Maj 3rd, Aug 5th).'
  },
  '7th': {
    type: '7th',
    name: 'Dominant 7th',
    symbol: '7',
    intervals: [0, 4, 7, 10],
    description: 'Bluesy, driving, leading tone chord resolving to tonic (Root, Maj 3rd, Perf 5th, Min 7th).'
  },
  maj7: {
    type: 'maj7',
    name: 'Major 7th',
    symbol: 'maj7',
    intervals: [0, 4, 7, 11],
    description: 'Lush, jazzy, relaxed, and sophisticated (Root, Maj 3rd, Perf 5th, Maj 7th).'
  },
  min7: {
    type: 'min7',
    name: 'Minor 7th',
    symbol: 'm7',
    intervals: [0, 3, 7, 10],
    description: 'Soulful, warm, and mellow (Root, Min 3rd, Perf 5th, Min 7th).'
  },
  sus2: {
    type: 'sus2',
    name: 'Suspended 2nd',
    symbol: 'sus2',
    intervals: [0, 2, 7],
    description: 'Open, floating, and airy with no 3rd (Root, Maj 2nd, Perf 5th).'
  },
  sus4: {
    type: 'sus4',
    name: 'Suspended 4th',
    symbol: 'sus4',
    intervals: [0, 5, 7],
    description: 'Heroic tension anticipating release to major (Root, Perf 4th, Perf 5th).'
  }
};

/**
 * Builds a ChordDefinition for a given root note, chord type, and base octave.
 * e.g. getChord('C', 'major', 4) -> notes: ['C4', 'E4', 'G4']
 */
export function getChord(root: NoteLetter, type: ChordType, octave: number = 4): ChordDefinition {
  const info = CHORD_INFOS[type];
  const rootMidi = pitchToMidi(`${root}${octave}`);

  const notes: NotePitch[] = info.intervals.map(semitones => {
    return midiToPitch(rootMidi + semitones);
  });

  const chordName = `${root}${info.symbol}`;

  return {
    name: `${root} ${info.name}`,
    symbol: chordName,
    root,
    type,
    intervals: info.intervals,
    notes
  };
}

/**
 * Play a chord with an expressive, human-like slight strumming offset.
 */
export function playChord(chord: ChordDefinition, durationSeconds: number = 1.6, velocity: number = 0.85): void {
  const strumDelayMs = 28; // 28ms between notes for natural strum

  chord.notes.forEach((pitch, i) => {
    setTimeout(() => {
      AudioEngine.playNote(pitch, velocity);
    }, i * strumDelayMs);

    setTimeout(() => {
      AudioEngine.releaseNote(pitch);
    }, durationSeconds * 1000 + i * strumDelayMs);
  });
}

/**
 * Converts chord notes into NoteEvent objects for insertion into track/piano roll.
 */
export function createChordNoteEvents(
  chord: ChordDefinition, 
  startSeconds: number, 
  durationSeconds: number = 1.8,
  velocity: number = 0.85
): NoteEvent[] {
  return chord.notes.map((pitch, idx) => ({
    id: `chord_note_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    pitch,
    midi: pitchToMidi(pitch),
    start: Number(startSeconds.toFixed(3)),
    duration: Number(durationSeconds.toFixed(3)),
    velocity
  }));
}

export interface DiatonicChord {
  degree: string; // e.g. "I", "ii", "iii", "IV", "V", "vi", "vii°"
  root: NoteLetter;
  type: ChordType;
  name: string; // e.g. "C Major", "D Minor"
  symbol: string; // e.g. "C", "Dm"
  function: string; // e.g. "Tonic", "Subdominant", "Dominant"
}

/**
 * Generates diatonic chords for a given key and scale.
 */
export function getDiatonicChords(root: NoteLetter, scaleType: ScaleType): DiatonicChord[] {
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [];

  if (scaleType === 'natural_minor') {
    // Minor key degrees: i, ii°, III, iv, v, VI, VII
    const degreeTemplates: Array<{ semitones: number; type: ChordType; roman: string; func: string }> = [
      { semitones: 0,  type: 'minor', roman: 'i', func: 'Tonic' },
      { semitones: 2,  type: 'diminished', roman: 'ii°', func: 'Subdominant' },
      { semitones: 3,  type: 'major', roman: 'III', func: 'Mediant' },
      { semitones: 5,  type: 'minor', roman: 'iv', func: 'Subdominant' },
      { semitones: 7,  type: 'minor', roman: 'v', func: 'Dominant' },
      { semitones: 8,  type: 'major', roman: 'VI', func: 'Subdominant' },
      { semitones: 10, type: 'major', roman: 'VII', func: 'Subtonic' },
    ];

    return degreeTemplates.map(t => {
      const chordRoot = NOTE_NAMES[(rootIndex + t.semitones) % 12];
      const chordInfo = CHORD_INFOS[t.type];
      return {
        degree: t.roman,
        root: chordRoot,
        type: t.type,
        name: `${chordRoot} ${chordInfo.name}`,
        symbol: `${chordRoot}${chordInfo.symbol}`,
        function: t.func
      };
    });
  }

  // Default: Major key degrees: I, ii, iii, IV, V, vi, vii°
  const majorDegrees: Array<{ semitones: number; type: ChordType; roman: string; func: string }> = [
    { semitones: 0,  type: 'major', roman: 'I', func: 'Tonic (Home)' },
    { semitones: 2,  type: 'minor', roman: 'ii', func: 'Supertonic' },
    { semitones: 4,  type: 'minor', roman: 'iii', func: 'Mediant' },
    { semitones: 5,  type: 'major', roman: 'IV', func: 'Subdominant (Lift)' },
    { semitones: 7,  type: 'major', roman: 'V', func: 'Dominant (Tension)' },
    { semitones: 9,  type: 'minor', roman: 'vi', func: 'Relative Minor (Emotion)' },
    { semitones: 11, type: 'diminished', roman: 'vii°', func: 'Leading Tone' },
  ];

  return majorDegrees.map(t => {
    const chordRoot = NOTE_NAMES[(rootIndex + t.semitones) % 12];
    const chordInfo = CHORD_INFOS[t.type];
    return {
      degree: t.roman,
      root: chordRoot,
      type: t.type,
      name: `${chordRoot} ${chordInfo.name}`,
      symbol: `${chordRoot}${chordInfo.symbol}`,
      function: t.func
    };
  });
}
