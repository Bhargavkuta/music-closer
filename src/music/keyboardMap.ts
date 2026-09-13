export interface KeyBinding {
  key: string;
  noteLetter: string;
  octaveOffset: number; // 0 = base octave, 1 = base octave + 1
  label: string;
}

export const COMPUTER_KEYBOARD_MAP: Record<string, { note: string; octaveOffset: number }> = {
  // Octave 0 relative to base octave
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
  
  // Upper Octave (+1)
  'k': { note: 'C', octaveOffset: 1 },
  'o': { note: 'C#', octaveOffset: 1 },
  'l': { note: 'D', octaveOffset: 1 },
  'p': { note: 'D#', octaveOffset: 1 },
  ';': { note: 'E', octaveOffset: 1 },
  "'": { note: 'F', octaveOffset: 1 },
  ']': { note: 'F#', octaveOffset: 1 },
};

export const CODE_TO_KEY_MAP: Record<string, string> = {
  // Octave 0
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

  // Octave +1
  'KeyK': 'k',
  'KeyO': 'o',
  'KeyL': 'l',
  'KeyP': 'p',
  'Semicolon': ';',
  'Quote': "'",
  'BracketRight': ']',
};

/**
 * Given a keydown key (or event.code) and the base octave, returns the corresponding pitch string (e.g. "C4") or null.
 */
export function getPitchFromKeyboardKey(keyOrCode: string, baseOctave: number): string | null {
  if (!keyOrCode) return null;
  const mappedFromCode = CODE_TO_KEY_MAP[keyOrCode];
  const normalizedKey = (mappedFromCode || keyOrCode).toLowerCase();
  const mapping = COMPUTER_KEYBOARD_MAP[normalizedKey];
  if (!mapping) return null;
  return `${mapping.note}${baseOctave + mapping.octaveOffset}`;
}

/**
 * Given a pitch string (e.g. "C4") and base octave, returns the keyboard key label (e.g. "A") if mapped.
 */
export function getKeyLabelForPitch(pitch: string, baseOctave: number): string | null {
  for (const [key, mapping] of Object.entries(COMPUTER_KEYBOARD_MAP)) {
    const mappedPitch = `${mapping.note}${baseOctave + mapping.octaveOffset}`;
    if (mappedPitch === pitch) {
      return key.toUpperCase();
    }
  }
  return null;
}
