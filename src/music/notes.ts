export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type NoteLetter = typeof NOTE_NAMES[number];

export const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const BLACK_NOTES = ['C#', 'D#', 'F#', 'G#', 'A#'];

/**
 * Converts note pitch string (e.g. "C4", "F#3") to MIDI number.
 * C4 = 60, A4 = 69
 */
export function pitchToMidi(pitch: string): number {
  const regex = /^([A-Ga-g][#b]?)(-?\d+)$/;
  const match = pitch.match(regex);
  if (!match) return 60; // Fallback to Middle C

  let note = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);

  // Normalize flats to sharps
  const flatToSharpMap: Record<string, string> = {
    'DB': 'C#',
    'EB': 'D#',
    'GB': 'F#',
    'AB': 'G#',
    'BB': 'A#'
  };
  if (flatToSharpMap[note]) {
    note = flatToSharpMap[note];
  }

  const noteIndex = NOTE_NAMES.indexOf(note as NoteLetter);
  if (noteIndex === -1) return 60;

  return (octave + 1) * 12 + noteIndex;
}

/**
 * Converts MIDI number to note pitch string (e.g. 60 -> "C4")
 */
export function midiToPitch(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Check if a note pitch is a sharp/flat (black key)
 */
export function isBlackKey(pitchOrLetter: string): boolean {
  return pitchOrLetter.includes('#') || pitchOrLetter.includes('b');
}

/**
 * Generates an array of all note pitches between startOctave and endOctave inclusive
 */
export function generateOctaveKeys(startOctave: number, endOctave: number): Array<{ pitch: string; isBlack: boolean; noteName: string; octave: number; midi: number }> {
  const keys: Array<{ pitch: string; isBlack: boolean; noteName: string; octave: number; midi: number }> = [];

  for (let oct = startOctave; oct <= endOctave; oct++) {
    for (const note of NOTE_NAMES) {
      const pitch = `${note}${oct}`;
      keys.push({
        pitch,
        isBlack: isBlackKey(note),
        noteName: note,
        octave: oct,
        midi: pitchToMidi(pitch),
      });
    }
  }

  return keys;
}
