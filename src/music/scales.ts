import { NOTE_NAMES, NoteLetter } from './notes';
import { ScaleType, ScaleDefinition } from '../types/music';

export interface ScaleInfo {
  type: ScaleType;
  name: string;
  formula: string; // e.g., "1 - 2 - 3 - 4 - 5 - 6 - 7"
  intervals: number[]; // semitones from root
  description: string;
  mood: string;
}

export const SCALE_INFOS: Record<ScaleType, ScaleInfo> = {
  major: {
    type: 'major',
    name: 'Major (Ionian)',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'Bright, joyful, and stable. Foundation of Western melody and harmony.',
    mood: 'Happy & Uplifting'
  },
  natural_minor: {
    type: 'natural_minor',
    name: 'Natural Minor (Aeolian)',
    formula: '1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'Moody, emotional, and introspective.',
    mood: 'Melancholic & Deep'
  },
  harmonic_minor: {
    type: 'harmonic_minor',
    name: 'Harmonic Minor',
    formula: '1 - 2 - ♭3 - 4 - 5 - ♭6 - 7',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Exotic, dramatic sound with an augmented second leading to the tonic.',
    mood: 'Dramatic & Exotic'
  },
  major_pentatonic: {
    type: 'major_pentatonic',
    name: 'Major Pentatonic',
    formula: '1 - 2 - 3 - 5 - 6',
    intervals: [0, 2, 4, 7, 9],
    description: '5-note scale with no dissonant semitones. Impossible to play a wrong note.',
    mood: 'Pleasant & Pure'
  },
  minor_pentatonic: {
    type: 'minor_pentatonic',
    name: 'Minor Pentatonic',
    formula: '1 - ♭3 - 4 - 5 - ♭7',
    intervals: [0, 3, 5, 7, 10],
    description: 'The staple of rock, funk, and R&B solos. Punchy and expressive.',
    mood: 'Edgy & Groovy'
  },
  blues: {
    type: 'blues',
    name: 'Blues Scale',
    formula: '1 - ♭3 - 4 - ♭5 - 5 - ♭7',
    intervals: [0, 3, 5, 6, 7, 10],
    description: 'Minor pentatonic plus the famous "blue note" (diminished 5th).',
    mood: 'Bluesy & Soulful'
  }
};

/**
 * Calculates the scale notes for any given root and scale type.
 * e.g., getScaleNotes('C', 'major') -> ['C', 'D', 'E', 'F', 'G', 'A', 'B']
 * e.g., getScaleNotes('A', 'natural_minor') -> ['A', 'B', 'C', 'D', 'E', 'F', 'G']
 */
export function getScaleNotes(root: NoteLetter, scaleType: ScaleType): string[] {
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [];

  const intervals = SCALE_INFOS[scaleType]?.intervals || [0, 2, 4, 5, 7, 9, 11];

  return intervals.map(semitones => {
    const noteIndex = (rootIndex + semitones) % 12;
    return NOTE_NAMES[noteIndex];
  });
}

/**
 * Returns a full ScaleDefinition object.
 */
export function getScaleDefinition(root: NoteLetter, scaleType: ScaleType): ScaleDefinition {
  const info = SCALE_INFOS[scaleType];
  const notes = getScaleNotes(root, scaleType);

  return {
    name: `${root} ${info.name}`,
    root,
    type: scaleType,
    intervals: info.intervals,
    notes
  };
}

/**
 * Checks if a note name (e.g. "C", "F#") is in the scale notes array.
 */
export function isNoteInScale(noteName: string, scaleNotes: string[]): boolean {
  return scaleNotes.includes(noteName);
}

/**
 * Checks if a full pitch (e.g. "C4", "F#3") is in the scale.
 */
export function isPitchInScale(pitch: string, scaleNotes: string[]): boolean {
  const regex = /^([A-Ga-g][#b]?)/;
  const match = pitch.match(regex);
  if (!match) return false;
  let letter = match[1].toUpperCase();
  if (letter === 'DB') letter = 'C#';
  if (letter === 'EB') letter = 'D#';
  if (letter === 'GB') letter = 'F#';
  if (letter === 'AB') letter = 'G#';
  if (letter === 'BB') letter = 'A#';
  return scaleNotes.includes(letter);
}

/**
 * Returns the scale degree (1, 2, 3...) of a note within a scale, or null if not in scale.
 */
export function getScaleDegree(noteName: string, scaleNotes: string[]): number | null {
  const idx = scaleNotes.indexOf(noteName);
  return idx === -1 ? null : idx + 1;
}
