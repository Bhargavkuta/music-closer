import React, { useEffect, useMemo, useRef } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useTransportStore } from '../../store/transportStore';
import { PianoKey } from './PianoKey';
import { WHITE_NOTES, NOTE_NAMES, NoteLetter } from '../../music/notes';
import { getPitchFromKeyboardKey, getKeyLabelForPitch } from '../../music/keyboardMap';
import { getScaleNotes, SCALE_INFOS } from '../../music/scales';
import { ScaleType } from '../../types/music';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

export const PianoKeyboard: React.FC = () => {
  const {
    baseOctave,
    activeKeys,
    showKeyLabels,
    selectedRootNote,
    selectedScaleType,
    highlightScaleNotes,
    setSelectedRootNote,
    setSelectedScaleType,
    toggleHighlightScaleNotes,
    setShowTheoryPanel,
    showTheoryPanel,
    pressKey,
    releaseKey,
    releaseAllKeys,
    shiftOctave,
  } = useUIStore();

  const keyboardContainerRef = useRef<HTMLDivElement>(null);

  // We display 2 full octaves + 1 final C (25 total keys, 15 white keys)
  const numOctaves = 2;
  const startOctave = baseOctave;

  // Generate white keys and black keys with exact positioning
  const { whiteKeys, blackKeys } = useMemo(() => {
    const whites: Array<{ pitch: string; note: string; octave: number; index: number }> = [];
    const blacks: Array<{ pitch: string; note: string; octave: number; leftOffsetPercent: number }> = [];

    let whiteIndex = 0;

    for (let octOffset = 0; octOffset < numOctaves; octOffset++) {
      const currentOct = startOctave + octOffset;

      WHITE_NOTES.forEach((note) => {
        whites.push({
          pitch: `${note}${currentOct}`,
          note,
          octave: currentOct,
          index: whiteIndex,
        });
        whiteIndex++;
      });
    }

    // Add high C at the end
    whites.push({
      pitch: `C${startOctave + numOctaves}`,
      note: 'C',
      octave: startOctave + numOctaves,
      index: whiteIndex,
    });

    const totalWhites = whites.length; // 15 white keys

    // Now calculate black keys positions relative to white key slots
    for (let octOffset = 0; octOffset < numOctaves; octOffset++) {
      const currentOct = startOctave + octOffset;
      const baseIndex = octOffset * 7;

      // C# between white key 0 and 1
      blacks.push({
        pitch: `C#${currentOct}`,
        note: 'C#',
        octave: currentOct,
        leftOffsetPercent: ((baseIndex + 1) / totalWhites) * 100,
      });

      // D# between white key 1 and 2
      blacks.push({
        pitch: `D#${currentOct}`,
        note: 'D#',
        octave: currentOct,
        leftOffsetPercent: ((baseIndex + 2) / totalWhites) * 100,
      });

      // F# between white key 3 and 4
      blacks.push({
        pitch: `F#${currentOct}`,
        note: 'F#',
        octave: currentOct,
        leftOffsetPercent: ((baseIndex + 4) / totalWhites) * 100,
      });

      // G# between white key 4 and 5
      blacks.push({
        pitch: `G#${currentOct}`,
        note: 'G#',
        octave: currentOct,
        leftOffsetPercent: ((baseIndex + 5) / totalWhites) * 100,
      });

      // A# between white key 5 and 6
      blacks.push({
        pitch: `A#${currentOct}`,
        note: 'A#',
        octave: currentOct,
        leftOffsetPercent: ((baseIndex + 6) / totalWhites) * 100,
      });
    }

    return { whiteKeys: whites, blackKeys: blacks };
  }, [startOctave, numOctaves]);

  // Compute active scale notes for key highlighting
  const activeScaleNotes = useMemo(() => {
    if (!highlightScaleNotes) return [];
    return getScaleNotes(selectedRootNote, selectedScaleType);
  }, [highlightScaleNotes, selectedRootNote, selectedScaleType]);

  // Global Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Ignore held-down key repetitions
      if (e.repeat) {
        return;
      }

      // Spacebar toggles Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        const transport = useTransportStore.getState();
        if (transport.isPlaying) {
          transport.pause();
        } else {
          transport.play();
        }
        return;
      }

      // Octave switching hotkeys (Z / X)
      if (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ') {
        shiftOctave(-1);
        return;
      }
      if (e.key === 'x' || e.key === 'X' || e.code === 'KeyX') {
        shiftOctave(1);
        return;
      }

      const pitch = getPitchFromKeyboardKey(e.code, baseOctave) || getPitchFromKeyboardKey(e.key, baseOctave);
      if (pitch) {
        pressKey(pitch);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const pitch = getPitchFromKeyboardKey(e.code, baseOctave) || getPitchFromKeyboardKey(e.key, baseOctave);
      if (pitch) {
        releaseKey(pitch);
      }
    };

    const handleWindowBlur = () => {
      releaseAllKeys();
    };

    const handleWindowMouseUp = () => {
      // Safety release of held keys if mouse released outside piano key bounds
      releaseAllKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [baseOctave, pressKey, releaseKey, releaseAllKeys, shiftOctave]);

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto items-center">
      {/* Keyboard Case Frame */}
      <div
        ref={keyboardContainerRef}
        className="relative w-full bg-gradient-to-b from-studio-900 to-studio-950 p-3 md:p-4 rounded-2xl border border-studio-800 shadow-2xl overflow-x-auto select-none"
      >
        {/* Scale & Key Quick Guide Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 mb-3 bg-studio-950/80 border border-studio-800 rounded-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-studio-400">Key:</span>
              <select
                value={selectedRootNote}
                onChange={(e) => setSelectedRootNote(e.target.value as NoteLetter)}
                className="bg-studio-850 border border-studio-700 text-white rounded px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
              >
                {NOTE_NAMES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-studio-400">Scale:</span>
              <select
                value={selectedScaleType}
                onChange={(e) => setSelectedScaleType(e.target.value as ScaleType)}
                className="bg-studio-850 border border-studio-700 text-white rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                {Object.keys(SCALE_INFOS).map((k) => (
                  <option key={k} value={k}>{SCALE_INFOS[k as ScaleType].name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleHighlightScaleNotes}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                highlightScaleNotes 
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                  : 'bg-studio-850 border-studio-700 text-studio-400 hover:text-white'
              }`}
              title={highlightScaleNotes ? 'Hide Scale Highlights' : 'Highlight Scale Notes'}
            >
              {highlightScaleNotes ? <Eye size={13} /> : <EyeOff size={13} />}
              <span className="hidden sm:inline">{highlightScaleNotes ? 'Scale Active' : 'Off'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTheoryPanel(!showTheoryPanel)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                showTheoryPanel
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                  : 'bg-studio-850 hover:bg-studio-800 text-amber-400 border-amber-500/30'
              }`}
            >
              <Sparkles size={13} />
              <span>Chord & Scale Assistant</span>
            </button>
          </div>
        </div>

        {/* Felt Red Top Strip (Realistic Piano Detail) */}
        <div className="w-full h-2 bg-gradient-to-r from-red-900 via-rose-700 to-red-900 rounded-t-sm shadow-inner mb-0.5 opacity-90" />

        {/* Keybed Container */}
        <div className="relative flex w-full min-w-[650px] bg-studio-950 rounded-b-lg overflow-hidden border border-studio-800/80 shadow-2xl">
          {/* White Keys */}
          <div className="flex w-full">
            {whiteKeys.map((k) => {
              const isActive = activeKeys.includes(k.pitch);
              const label = getKeyLabelForPitch(k.pitch, baseOctave);
              const isScaleNote = highlightScaleNotes && activeScaleNotes.includes(k.note);
              const isRootNote = highlightScaleNotes && k.note === selectedRootNote;

              return (
                <PianoKey
                  key={k.pitch}
                  pitch={k.pitch}
                  isBlack={false}
                  isActive={isActive}
                  keyLabel={label}
                  showLabels={showKeyLabels}
                  isScaleNote={isScaleNote}
                  isRootNote={isRootNote}
                  onPress={pressKey}
                  onRelease={releaseKey}
                />
              );
            })}
          </div>

          {/* Black Keys */}
          {blackKeys.map((k) => {
            const isActive = activeKeys.includes(k.pitch);
            const label = getKeyLabelForPitch(k.pitch, baseOctave);
            const isScaleNote = highlightScaleNotes && activeScaleNotes.includes(k.note);
            const isRootNote = highlightScaleNotes && k.note === selectedRootNote;

            // Translate black keys slightly back to center between white keys
            return (
              <div
                key={k.pitch}
                style={{
                  position: 'absolute',
                  left: `${k.leftOffsetPercent}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <PianoKey
                  pitch={k.pitch}
                  isBlack={true}
                  isActive={isActive}
                  keyLabel={label}
                  showLabels={showKeyLabels}
                  isScaleNote={isScaleNote}
                  isRootNote={isRootNote}
                  onPress={pressKey}
                  onRelease={releaseKey}
                />
              </div>
            );
          })}
        </div>

        {/* Visual helper footer under keyboard */}
        <div className="flex items-center justify-between mt-3 text-[11px] text-studio-400 font-mono px-2">
          <span>Octave Range: C{baseOctave} — C{baseOctave + numOctaves}</span>
          <span className="hidden sm:inline">Use <kbd className="px-1 py-0.5 bg-studio-800 rounded border border-studio-700 text-studio-200">A</kbd>-<kbd className="px-1 py-0.5 bg-studio-800 rounded border border-studio-700 text-studio-200">J</kbd> to play &bull; <kbd className="px-1 py-0.5 bg-studio-800 rounded border border-studio-700 text-studio-200">Z</kbd>/<kbd className="px-1 py-0.5 bg-studio-800 rounded border border-studio-700 text-studio-200">X</kbd> to shift octaves</span>
        </div>
      </div>
    </div>
  );
};
