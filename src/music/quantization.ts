import { NoteEvent } from '../types/music';

export type GridDivision = '1/4' | '1/8' | '1/16' | '1/32' | 'free';

export const GRID_BEAT_VALUES: Record<GridDivision, number> = {
  '1/4': 1,        // Quarter note = 1 beat
  '1/8': 0.5,      // Eighth note = 0.5 beats
  '1/16': 0.25,    // Sixteenth note = 0.25 beats
  '1/32': 0.125,   // Thirty-second note = 0.125 beats
  'free': 0.001,   // Nearly continuous
};

/**
 * Convert seconds to musical beats based on BPM.
 */
export function secondsToBeats(seconds: number, bpm: number): number {
  return seconds * (bpm / 60);
}

/**
 * Convert musical beats to seconds based on BPM.
 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return beats * (60 / bpm);
}

/**
 * Snap a beat value to the specified grid division.
 */
export function snapBeat(beat: number, grid: GridDivision): number {
  if (grid === 'free') return beat;
  const step = GRID_BEAT_VALUES[grid];
  return Math.round(beat / step) * step;
}

/**
 * Snap seconds to the grid based on BPM.
 */
export function snapSeconds(seconds: number, grid: GridDivision, bpm: number): number {
  if (grid === 'free') return seconds;
  const beat = secondsToBeats(seconds, bpm);
  const snappedBeat = snapBeat(beat, grid);
  return beatsToSeconds(snappedBeat, bpm);
}

/**
 * Quantize a list of notes to the chosen grid division.
 */
export function quantizeNotes(notes: NoteEvent[], grid: GridDivision, bpm: number): NoteEvent[] {
  if (grid === 'free') return notes;

  const minDurationBeats = GRID_BEAT_VALUES[grid];
  const minDurationSeconds = beatsToSeconds(minDurationBeats, bpm);

  return notes.map(note => {
    const startBeat = secondsToBeats(note.start, bpm);
    const durationBeat = secondsToBeats(note.duration, bpm);

    const snappedStartBeat = snapBeat(startBeat, grid);
    const snappedDurationBeat = Math.max(minDurationBeats, snapBeat(durationBeat, grid));

    const newStart = Math.max(0, beatsToSeconds(snappedStartBeat, bpm));
    const newDuration = Math.max(minDurationSeconds, beatsToSeconds(snappedDurationBeat, bpm));

    return {
      ...note,
      start: Number(newStart.toFixed(3)),
      duration: Number(newDuration.toFixed(3)),
    };
  }).sort((a, b) => a.start - b.start);
}
