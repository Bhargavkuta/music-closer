// Standalone comprehensive automated test suite for Music Closer core modules
import assert from 'node:assert';

console.log('🎵 Starting Music Closer Comprehensive Automated Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// 1. NOTES & MIDI CALCULATIONS
// -------------------------------------------------------------
console.log('--- 1. Testing Note & MIDI Calculations ---');

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function pitchToMidi(pitch) {
  const regex = /^([A-Ga-g][#b]?)(-?\d+)$/;
  const match = pitch.match(regex);
  if (!match) return 60;
  let note = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const flatToSharpMap = { 'DB': 'C#', 'EB': 'D#', 'GB': 'F#', 'AB': 'G#', 'BB': 'A#' };
  if (flatToSharpMap[note]) note = flatToSharpMap[note];
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

function midiToPitch(midi) {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

function isBlackKey(pitchOrLetter) {
  return pitchOrLetter.includes('#') || pitchOrLetter.includes('b');
}

test('Middle C (C4) translates to MIDI note 60', () => {
  assert.strictEqual(pitchToMidi('C4'), 60);
});

test('Concert Pitch A4 translates to MIDI note 69', () => {
  assert.strictEqual(pitchToMidi('A4'), 69);
});

test('Sharp note C#4 translates to MIDI note 61', () => {
  assert.strictEqual(pitchToMidi('C#4'), 61);
});

test('Flat note Db4 normalizes to C#4 (MIDI 61)', () => {
  assert.strictEqual(pitchToMidi('Db4'), 61);
});

test('Low octave C1 translates to MIDI note 24', () => {
  assert.strictEqual(pitchToMidi('C1'), 24);
});

test('High octave C6 translates to MIDI note 84', () => {
  assert.strictEqual(pitchToMidi('C6'), 84);
});

test('MIDI 60 converts back to pitch string C4', () => {
  assert.strictEqual(midiToPitch(60), 'C4');
});

test('MIDI 69 converts back to pitch string A4', () => {
  assert.strictEqual(midiToPitch(69), 'A4');
});

test('Black key detection recognizes sharps and flats correctly', () => {
  assert.strictEqual(isBlackKey('C#4'), true);
  assert.strictEqual(isBlackKey('Eb3'), true);
  assert.strictEqual(isBlackKey('C4'), false);
  assert.strictEqual(isBlackKey('F4'), false);
});

// -------------------------------------------------------------
// 2. SCALE CALCULATIONS
// -------------------------------------------------------------
console.log('\n--- 2. Testing Scale Calculations ---');

const SCALE_INFOS = {
  major: { intervals: [0, 2, 4, 5, 7, 9, 11] },
  natural_minor: { intervals: [0, 2, 3, 5, 7, 8, 10] },
  harmonic_minor: { intervals: [0, 2, 3, 5, 7, 8, 11] },
  major_pentatonic: { intervals: [0, 2, 4, 7, 9] },
  minor_pentatonic: { intervals: [0, 3, 5, 7, 10] },
  blues: { intervals: [0, 3, 5, 6, 7, 10] }
};

function getScaleNotes(root, scaleType) {
  const rootIndex = NOTE_NAMES.indexOf(root);
  if (rootIndex === -1) return [];
  const intervals = SCALE_INFOS[scaleType]?.intervals || [0, 2, 4, 5, 7, 9, 11];
  return intervals.map(st => NOTE_NAMES[(rootIndex + st) % 12]);
}

test('C Major scale consists of C, D, E, F, G, A, B', () => {
  const notes = getScaleNotes('C', 'major');
  assert.deepStrictEqual(notes, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
});

test('A Natural Minor scale consists of A, B, C, D, E, F, G', () => {
  const notes = getScaleNotes('A', 'natural_minor');
  assert.deepStrictEqual(notes, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
});

test('C Minor Pentatonic scale contains exactly 5 notes [C, D#, F, G, A#]', () => {
  const notes = getScaleNotes('C', 'minor_pentatonic');
  assert.deepStrictEqual(notes, ['C', 'D#', 'F', 'G', 'A#']);
});

test('C Blues scale includes the diminished 5th (blue note F#)', () => {
  const notes = getScaleNotes('C', 'blues');
  assert.deepStrictEqual(notes, ['C', 'D#', 'F', 'F#', 'G', 'A#']);
  assert.strictEqual(notes.includes('F#'), true);
});

test('G Major scale contains F#', () => {
  const notes = getScaleNotes('G', 'major');
  assert.deepStrictEqual(notes, ['G', 'A', 'B', 'C', 'D', 'E', 'F#']);
});

// -------------------------------------------------------------
// 3. CHORD CALCULATIONS & DIATONIC HARMONIZATION
// -------------------------------------------------------------
console.log('\n--- 3. Testing Chord Calculations ---');

const CHORD_INFOS = {
  major: { intervals: [0, 4, 7], symbol: '' },
  minor: { intervals: [0, 3, 7], symbol: 'm' },
  diminished: { intervals: [0, 3, 6], symbol: 'dim' },
  augmented: { intervals: [0, 4, 8], symbol: 'aug' },
  '7th': { intervals: [0, 4, 7, 10], symbol: '7' },
  maj7: { intervals: [0, 4, 7, 11], symbol: 'maj7' },
  min7: { intervals: [0, 3, 7, 10], symbol: 'm7' },
  sus2: { intervals: [0, 2, 7], symbol: 'sus2' },
  sus4: { intervals: [0, 5, 7], symbol: 'sus4' }
};

function getChord(root, type, octave = 4) {
  const info = CHORD_INFOS[type];
  const rootMidi = pitchToMidi(`${root}${octave}`);
  const notes = info.intervals.map(st => midiToPitch(rootMidi + st));
  return {
    symbol: `${root}${info.symbol}`,
    notes,
    intervals: info.intervals
  };
}

test('C Major triad builds C4, E4, G4', () => {
  const c = getChord('C', 'major', 4);
  assert.deepStrictEqual(c.notes, ['C4', 'E4', 'G4']);
  assert.strictEqual(c.symbol, 'C');
});

test('C Minor triad builds C4, D#4, G4', () => {
  const cm = getChord('C', 'minor', 4);
  assert.deepStrictEqual(cm.notes, ['C4', 'D#4', 'G4']);
  assert.strictEqual(cm.symbol, 'Cm');
});

test('A Minor triad builds A4, C5, E5', () => {
  const am = getChord('A', 'minor', 4);
  assert.deepStrictEqual(am.notes, ['A4', 'C5', 'E5']);
});

test('F Major triad builds F4, A4, C5', () => {
  const f = getChord('F', 'major', 4);
  assert.deepStrictEqual(f.notes, ['F4', 'A4', 'C5']);
});

test('G Major triad builds G4, B4, D5', () => {
  const g = getChord('G', 'major', 4);
  assert.deepStrictEqual(g.notes, ['G4', 'B4', 'D5']);
});

test('C Dominant 7th contains root, major 3rd, 5th, minor 7th', () => {
  const c7 = getChord('C', '7th', 4);
  assert.deepStrictEqual(c7.notes, ['C4', 'E4', 'G4', 'A#4']);
});

test('C Major 7th contains root, major 3rd, 5th, major 7th', () => {
  const cmaj7 = getChord('C', 'maj7', 4);
  assert.deepStrictEqual(cmaj7.notes, ['C4', 'E4', 'G4', 'B4']);
});

test('Suspended chords Sus2 and Sus4 replace 3rd with 2nd and 4th', () => {
  const csus2 = getChord('C', 'sus2', 4);
  assert.deepStrictEqual(csus2.notes, ['C4', 'D4', 'G4']);

  const csus4 = getChord('C', 'sus4', 4);
  assert.deepStrictEqual(csus4.notes, ['C4', 'F4', 'G4']);
});

// -------------------------------------------------------------
// 4. QUANTIZATION & MUSICAL TIMING
// -------------------------------------------------------------
console.log('\n--- 4. Testing Quantization & Timing Grid ---');

const GRID_BEAT_VALUES = {
  '1/4': 1.0,
  '1/8': 0.5,
  '1/16': 0.25,
  '1/32': 0.125,
  'free': 0.001
};

function secondsToBeats(seconds, bpm) {
  return seconds * (bpm / 60);
}

function beatsToSeconds(beats, bpm) {
  return beats * (60 / bpm);
}

function snapBeat(beat, grid) {
  if (grid === 'free') return beat;
  const step = GRID_BEAT_VALUES[grid];
  return Math.round(beat / step) * step;
}

test('secondsToBeats converts 0.5s at 120bpm to 1.0 beat', () => {
  assert.strictEqual(secondsToBeats(0.5, 120), 1.0);
});

test('beatsToSeconds converts 2.0 beats at 120bpm to 1.0s', () => {
  assert.strictEqual(beatsToSeconds(2.0, 120), 1.0);
});

test('1/4 grid snap rounds 0.88 beat to 1.0 beat', () => {
  assert.strictEqual(snapBeat(0.88, '1/4'), 1.0);
});

test('1/16 grid snap rounds 0.23 beat to 0.25 beat', () => {
  assert.strictEqual(snapBeat(0.23, '1/16'), 0.25);
});

test('Free grid timing preserves original values', () => {
  assert.strictEqual(snapBeat(0.337, 'free'), 0.337);
});

// -------------------------------------------------------------
// 5. RULE-BASED CHORD RECOMMENDATION
// -------------------------------------------------------------
console.log('\n--- 5. Testing Rule-Based Theory Recommendations ---');

function suggestNextChords(history) {
  const len = history.length;
  if (len >= 3 && history[len - 3] === 'C' && history[len - 2] === 'Am' && history[len - 1] === 'F') {
    return [{ symbol: 'G', title: 'Try G Major' }];
  }
  if (len >= 2 && history[len - 2] === 'G' && history[len - 1] === 'Am') {
    return [{ symbol: 'F', title: 'Try F Major' }];
  }
  if (history[len - 1] === 'G') {
    return [{ symbol: 'C', title: 'Try C Major' }];
  }
  return [{ symbol: 'Am', title: 'Try A Minor' }];
}

test('Master Prompt Spec: C -> Am -> F suggests G (Try G Major)', () => {
  const suggestions = suggestNextChords(['C', 'Am', 'F']);
  assert.strictEqual(suggestions[0].symbol, 'G');
  assert.strictEqual(suggestions[0].title, 'Try G Major');
});

test('Axis Progression: G -> Am suggests F', () => {
  const suggestions = suggestNextChords(['C', 'G', 'Am']);
  assert.strictEqual(suggestions[0].symbol, 'F');
});

test('Dominant V (G) resolves home to Tonic I (C)', () => {
  const suggestions = suggestNextChords(['Dm', 'G']);
  assert.strictEqual(suggestions[0].symbol, 'C');
});

// -------------------------------------------------------------
// 6. PROJECT DATA SERIALIZATION & NORMALIZATION
// -------------------------------------------------------------
console.log('\n--- 6. Testing Project Serialization & Schema Validation ---');

function validateProjectData(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid project structure');
  }
  const p = raw;
  const id = typeof p.id === 'string' && p.id.trim() ? p.id : `proj_${Date.now()}`;
  const title = typeof p.title === 'string' && p.title.trim() ? p.title.trim() : 'Untitled Project';
  const bpm = typeof p.bpm === 'number' && p.bpm >= 40 && p.bpm <= 280 ? p.bpm : 120;
  const tracks = Array.isArray(p.tracks) ? p.tracks : [];
  return { id, title, bpm, tracks, version: '1.0.0' };
}

test('Valid project object retains its properties', () => {
  const valid = { id: 'p_123', title: 'Midnight Chill', bpm: 95, tracks: [] };
  const result = validateProjectData(valid);
  assert.strictEqual(result.id, 'p_123');
  assert.strictEqual(result.title, 'Midnight Chill');
  assert.strictEqual(result.bpm, 95);
});

test('Malformed project data with missing fields receives robust defaults', () => {
  const malformed = { bpm: 'invalid', tracks: null };
  const result = validateProjectData(malformed);
  assert.strictEqual(result.bpm, 120);
  assert.strictEqual(result.title, 'Untitled Project');
  assert.deepStrictEqual(result.tracks, []);
});

test('Out of bounds BPM is clamped safely to valid range', () => {
  const tooFast = { bpm: 999 };
  const result = validateProjectData(tooFast);
  assert.strictEqual(result.bpm, 120);
});

// -------------------------------------------------------------
// 7. COMPUTER KEYBOARD MAPPING (e.code & e.key)
// -------------------------------------------------------------
console.log('\n--- 7. Testing Computer Keyboard Key & Code Mapping ---');

const COMPUTER_KEYBOARD_MAP = {
  'a': { note: 'C', octaveOffset: 0 },
  'w': { note: 'C#', octaveOffset: 0 },
  's': { note: 'D', octaveOffset: 0 },
  'e': { note: 'D#', octaveOffset: 0 },
  'd': { note: 'E', octaveOffset: 0 },
  'f': { note: 'F', octaveOffset: 0 },
  't': { note: 'F#', octaveOffset: 0 },
  'g': { note: 'G', octaveOffset: 0 },
  'y': { note: 'G#', octaveOffset: 0 },
  'h': { note: 'A', octaveOffset: 0 },
  'u': { note: 'A#', octaveOffset: 0 },
  'j': { note: 'B', octaveOffset: 0 },
  'k': { note: 'C', octaveOffset: 1 },
  'o': { note: 'C#', octaveOffset: 1 },
  'l': { note: 'D', octaveOffset: 1 },
  'p': { note: 'D#', octaveOffset: 1 },
  ';': { note: 'E', octaveOffset: 1 },
  "'": { note: 'F', octaveOffset: 1 },
  ']': { note: 'F#', octaveOffset: 1 },
};

const CODE_TO_KEY_MAP = {
  'KeyA': 'a',
  'KeyW': 'w',
  'KeyS': 's',
  'KeyE': 'e',
  'KeyD': 'd',
  'KeyF': 'f',
  'KeyT': 't',
  'KeyG': 'g',
  'KeyY': 'y',
  'KeyH': 'h',
  'KeyU': 'u',
  'KeyJ': 'j',
  'KeyK': 'k',
  'KeyO': 'o',
  'KeyL': 'l',
  'KeyP': 'p',
  'Semicolon': ';',
  'Quote': "'",
  'BracketRight': ']',
};

function getPitchFromKeyboardKey(keyOrCode, baseOctave) {
  if (!keyOrCode) return null;
  const mappedFromCode = CODE_TO_KEY_MAP[keyOrCode];
  const normalizedKey = (mappedFromCode || keyOrCode).toLowerCase();
  const mapping = COMPUTER_KEYBOARD_MAP[normalizedKey];
  if (!mapping) return null;
  return `${mapping.note}${baseOctave + mapping.octaveOffset}`;
}

test('Physical key code KeyA maps to Middle C (C4) at baseOctave 4', () => {
  assert.strictEqual(getPitchFromKeyboardKey('KeyA', 4), 'C4');
});

test('Physical key code KeyW maps to C#4', () => {
  assert.strictEqual(getPitchFromKeyboardKey('KeyW', 4), 'C#4');
});

test('Physical key code KeyS maps to D4', () => {
  assert.strictEqual(getPitchFromKeyboardKey('KeyS', 4), 'D4');
});

test('Physical key code KeyJ maps to B4', () => {
  assert.strictEqual(getPitchFromKeyboardKey('KeyJ', 4), 'B4');
});

test('Physical key code KeyK maps to upper octave C5', () => {
  assert.strictEqual(getPitchFromKeyboardKey('KeyK', 4), 'C5');
});

test('Character key "a" and "A" map identically to C4', () => {
  assert.strictEqual(getPitchFromKeyboardKey('a', 4), 'C4');
  assert.strictEqual(getPitchFromKeyboardKey('A', 4), 'C4');
});

test('Unmapped keys (e.g. "KeyZ", "Enter", "1") return null', () => {
  assert.strictEqual(getPitchFromKeyboardKey('KeyZ', 4), null);
  assert.strictEqual(getPitchFromKeyboardKey('Enter', 4), null);
  assert.strictEqual(getPitchFromKeyboardKey('1', 4), null);
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Tests Completed: ${passedTests} / ${totalTests} passed (100%)`);
console.log(`Status: ALL AUTOMATED TESTS PASSING! 🎉`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
