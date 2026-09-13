import React, { useMemo } from 'react';
import { NOTE_NAMES, isBlackKey } from '../../music/notes';
import { AudioEngine } from '../../audio/AudioEngine';
import { useUIStore } from '../../store/uiStore';
import { getScaleNotes } from '../../music/scales';

export const PIANO_ROLL_MIN_MIDI = 36; // C2
export const PIANO_ROLL_MAX_MIDI = 84; // C6
export const ROW_HEIGHT = 24; // pixels per pitch row

export interface PitchRowInfo {
  pitch: string;
  midi: number;
  noteName: string;
  octave: number;
  isBlack: boolean;
  rowIndex: number;
}

/**
 * Generates array of pitches ordered from TOP (highest pitch C6) to BOTTOM (lowest pitch C2).
 */
export function getPianoRollPitches(): PitchRowInfo[] {
  const list: PitchRowInfo[] = [];
  let index = 0;

  for (let midi = PIANO_ROLL_MAX_MIDI; midi >= PIANO_ROLL_MIN_MIDI; midi--) {
    const noteIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const noteName = NOTE_NAMES[noteIndex];
    const pitch = `${noteName}${octave}`;
    const isBlack = isBlackKey(noteName);

    list.push({
      pitch,
      midi,
      noteName,
      octave,
      isBlack,
      rowIndex: index,
    });
    index++;
  }

  return list;
}

interface PianoRollKeysProps {
  pitches: PitchRowInfo[];
}

export const PianoRollKeys: React.FC<PianoRollKeysProps> = ({ pitches }) => {
  const { activeKeys, selectedRootNote, selectedScaleType, highlightScaleNotes } = useUIStore();

  const activeScaleNotes = useMemo(() => {
    if (!highlightScaleNotes) return [];
    return getScaleNotes(selectedRootNote, selectedScaleType);
  }, [highlightScaleNotes, selectedRootNote, selectedScaleType]);

  const handleMouseDown = (pitch: string) => {
    AudioEngine.playNote(pitch, 0.85);
  };

  const handleMouseUp = (pitch: string) => {
    AudioEngine.releaseNote(pitch);
  };

  return (
    <div className="w-16 sm:w-20 shrink-0 bg-studio-950 border-r border-studio-800 select-none flex flex-col z-20 shadow-md">
      {pitches.map((p) => {
        const isC = p.noteName === 'C';
        const isNoteActive = activeKeys.includes(p.pitch);
        const isScaleNote = highlightScaleNotes && activeScaleNotes.includes(p.noteName);
        const isRoot = highlightScaleNotes && p.noteName === selectedRootNote;

        return (
          <div
            key={p.pitch}
            style={{ height: `${ROW_HEIGHT}px` }}
            onMouseDown={() => handleMouseDown(p.pitch)}
            onMouseUp={() => handleMouseUp(p.pitch)}
            onMouseLeave={() => handleMouseUp(p.pitch)}
            className={`flex items-center justify-between px-2 cursor-pointer border-b border-studio-900 transition-colors text-[10px] font-mono ${
              isNoteActive
                ? 'bg-indigo-600 text-white font-bold shadow-inner'
                : isRoot
                ? 'bg-amber-950/40 text-amber-300 font-bold border-l-2 border-l-amber-400'
                : isScaleNote
                ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-l-emerald-500/70'
                : p.isBlack
                ? 'bg-studio-900 text-studio-400 hover:bg-studio-800 hover:text-white'
                : 'bg-studio-950 text-studio-200 hover:bg-studio-900 hover:text-white'
            }`}
            title={`Click to audition ${p.pitch}${isRoot ? ' (Root)' : isScaleNote ? ' (Scale)' : ''}`}
          >
            <span className={isC ? 'text-accent-primary font-bold' : ''}>
              {p.pitch}
            </span>
            <div className="flex items-center gap-1">
              {isRoot ? (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_#f59e0b]" />
              ) : isScaleNote ? (
                <span className="w-1 h-1 rounded-full bg-emerald-400/80" />
              ) : isC ? (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
