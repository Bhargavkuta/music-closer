import { ProjectData } from '../types/project';
import { NoteEvent } from '../types/music';

/**
 * Encodes a variable-length quantity (VLQ) as used in MIDI format.
 */
function writeVLQ(value: number): number[] {
  let v = Math.round(value);
  const buffer: number[] = [];
  buffer.push(v & 0x7f);
  while ((v >>= 7) > 0) {
    buffer.push((v & 0x7f) | 0x80);
  }
  return buffer.reverse();
}

/**
 * Converts text string to ASCII byte array.
 */
function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xff);
  }
  return bytes;
}

/**
 * Writes 16-bit big-endian integer.
 */
function write16(val: number): number[] {
  return [(val >> 8) & 0xff, val & 0xff];
}

/**
 * Writes 32-bit big-endian integer.
 */
function write32(val: number): number[] {
  return [
    (val >> 24) & 0xff,
    (val >> 16) & 0xff,
    (val >> 8) & 0xff,
    val & 0xff
  ];
}

interface MidiNoteAction {
  tick: number;
  type: 'on' | 'off';
  note: number;
  velocity: number;
  channel: number;
}

/**
 * Generates a Standard MIDI File (Format 1) from project tracks and notes.
 */
export function generateMidiFile(project: ProjectData): Blob {
  const TICKS_PER_BEAT = 480; // Standard PPQ
  const bpm = project.bpm || 120;
  const secondsPerBeat = 60 / bpm;

  // Track 0: Conductor Track (Tempo & Time Signature)
  const conductorEvents: number[] = [];

  // Time Signature: FF 58 04 nn dd cc bb (4/4 time signature)
  const num = project.timeSignature?.[0] || 4;
  const denom = project.timeSignature?.[1] || 4;
  const denomPow = Math.round(Math.log2(denom));
  conductorEvents.push(
    ...writeVLQ(0),
    0xff, 0x58, 0x04,
    num, denomPow, 24, 8
  );

  // Tempo Meta Event: FF 51 03 tttttt (microseconds per quarter note)
  const microsecondsPerBeat = Math.round(60000000 / bpm);
  conductorEvents.push(
    ...writeVLQ(0),
    0xff, 0x51, 0x03,
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff
  );

  // Track Name: Project Title
  const titleBytes = stringToBytes(project.title || 'Music Closer Project');
  conductorEvents.push(
    ...writeVLQ(0),
    0xff, 0x03, titleBytes.length,
    ...titleBytes
  );

  // End of Track Meta Event: FF 2F 00
  conductorEvents.push(...writeVLQ(0), 0xff, 0x2f, 0x00);

  // Conductor Track Chunk
  const conductorChunk = [
    ...stringToBytes('MTrk'),
    ...write32(conductorEvents.length),
    ...conductorEvents
  ];

  // Note Tracks
  const trackChunks: number[][] = [];

  // Build notes for each track (incorporating direct notes & pattern clips)
  const patternMap = new Map();
  (project.patterns || []).forEach(p => patternMap.set(p.id, p));

  project.tracks.forEach((track, trackIdx) => {
    const channel = track.instrument === 'drums' ? 9 : (trackIdx >= 9 ? trackIdx + 1 : trackIdx) % 16;
    const trackEvents: number[] = [];

    // Track Name
    const nameBytes = stringToBytes(track.name);
    trackEvents.push(
      ...writeVLQ(0),
      0xff, 0x03, nameBytes.length,
      ...nameBytes
    );

    // Collect all note events
    const allNotes: NoteEvent[] = [];

    // 1. Direct notes
    if (track.notes && track.notes.length > 0) {
      allNotes.push(...track.notes);
    }

    // 2. Pattern clips
    if (track.clips && track.clips.length > 0) {
      const barSeconds = 4 * secondsPerBeat;
      track.clips.forEach(clip => {
        const pattern = patternMap.get(clip.patternId);
        if (pattern?.notes) {
          const clipStartSec = (clip.startBar - 1) * barSeconds;
          pattern.notes.forEach((n: NoteEvent) => {
            allNotes.push({
              ...n,
              start: clipStartSec + n.start
            });
          });
        }
      });
    }

    // Convert notes into sorted actions (note on and note off)
    const actions: MidiNoteAction[] = [];
    allNotes.forEach(note => {
      const startTick = Math.round((note.start / secondsPerBeat) * TICKS_PER_BEAT);
      const durationTicks = Math.max(12, Math.round((note.duration / secondsPerBeat) * TICKS_PER_BEAT));
      const endTick = startTick + durationTicks;
      const velocityByte = Math.min(127, Math.max(1, Math.round((note.velocity || 0.8) * 127)));

      actions.push({
        tick: startTick,
        type: 'on',
        note: Math.min(127, Math.max(0, note.midi)),
        velocity: velocityByte,
        channel
      });

      actions.push({
        tick: endTick,
        type: 'off',
        note: Math.min(127, Math.max(0, note.midi)),
        velocity: 0,
        channel
      });
    });

    // Sort chronologically (with note offs before note ons if same tick)
    actions.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      if (a.type === 'off' && b.type === 'on') return -1;
      if (a.type === 'on' && b.type === 'off') return 1;
      return 0;
    });

    // Write MIDI events with delta times
    let lastTick = 0;
    actions.forEach(act => {
      const deltaTicks = Math.max(0, act.tick - lastTick);
      lastTick = act.tick;

      trackEvents.push(...writeVLQ(deltaTicks));
      const statusByte = act.type === 'on' ? (0x90 | act.channel) : (0x80 | act.channel);
      trackEvents.push(statusByte, act.note, act.velocity);
    });

    // End of Track
    trackEvents.push(...writeVLQ(TICKS_PER_BEAT), 0xff, 0x2f, 0x00);

    const chunk = [
      ...stringToBytes('MTrk'),
      ...write32(trackEvents.length),
      ...trackEvents
    ];

    trackChunks.push(chunk);
  });

  // Header Chunk: MThd, length=6, format=1, numTracks, ticksPerBeat
  const totalTracks = 1 + trackChunks.length;
  const headerChunk = [
    ...stringToBytes('MThd'),
    ...write32(6),
    ...write16(1), // Format 1 (multi-track synchronous)
    ...write16(totalTracks),
    ...write16(TICKS_PER_BEAT)
  ];

  const fullMidiBytes: number[] = [
    ...headerChunk,
    ...conductorChunk,
    ...trackChunks.flat()
  ];

  const uint8 = new Uint8Array(fullMidiBytes);
  return new Blob([uint8], { type: 'audio/midi' });
}

/**
 * Triggers a browser download of the generated MIDI Blob.
 */
export function downloadMidiFile(project: ProjectData): void {
  const blob = generateMidiFile(project);
  const cleanTitle = (project.title || 'project').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const filename = `${cleanTitle}.mid`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
