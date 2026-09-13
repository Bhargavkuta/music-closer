import React, { useMemo, useRef, useEffect } from 'react';
import { PianoRollToolbar } from './PianoRollToolbar';
import { PianoRollKeys, getPianoRollPitches, ROW_HEIGHT, PIANO_ROLL_MAX_MIDI } from './PianoRollKeys';
import { PianoRollRuler } from './PianoRollRuler';
import { PianoRollGrid } from './PianoRollGrid';
import { useUIStore } from '../../store/uiStore';
import { useTransportStore } from '../../store/transportStore';

export const PianoRoll: React.FC = () => {
  const { pianoRollZoomX } = useUIStore();
  const { bpm } = useTransportStore();

  const pitches = useMemo(() => getPianoRollPitches(), []);
  const totalBars = 16; // 16 full musical bars (64 beats)

  // Synchronized scroll refs
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const keysScrollRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center on C4 (Middle C, MIDI 60) on initial load
  useEffect(() => {
    if (gridScrollRef.current) {
      const c4RowIndex = PIANO_ROLL_MAX_MIDI - 60; // Row for C4
      const targetScrollTop = c4RowIndex * ROW_HEIGHT - 160;
      gridScrollRef.current.scrollTop = Math.max(0, targetScrollTop);
    }
  }, []);

  const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (keysScrollRef.current) {
      keysScrollRef.current.scrollTop = target.scrollTop;
    }
    if (rulerScrollRef.current) {
      rulerScrollRef.current.scrollLeft = target.scrollLeft;
    }
  };

  return (
    <div className="flex flex-col w-full h-full max-h-[620px] bg-studio-950 border border-studio-800 rounded-2xl shadow-2xl overflow-hidden select-none">
      {/* 1. Piano Roll Top Toolbar */}
      <PianoRollToolbar />

      {/* 2. Main Piano Roll Viewport (Ruler + Keys + Grid) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Column: Corner Box + Vertical Keys */}
        <div className="flex flex-col shrink-0 z-20 shadow-lg">
          {/* Corner Box aligned with ruler */}
          <div className="h-7 w-16 sm:w-20 bg-studio-950 border-r border-b border-studio-800 flex items-center justify-center text-[10px] font-mono text-studio-500 font-bold">
            PITCH
          </div>

          {/* Scrollable Keys (Synced vertically with grid) */}
          <div
            ref={keysScrollRef}
            className="flex-1 overflow-hidden pointer-events-auto"
          >
            <PianoRollKeys pitches={pitches} />
          </div>
        </div>

        {/* Right Section: Time Ruler + Main Grid */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Timeline Ruler (Synced horizontally with grid) */}
          <div
            ref={rulerScrollRef}
            className="h-7 overflow-hidden shrink-0"
          >
            <PianoRollRuler totalBars={totalBars} zoomX={pianoRollZoomX} bpm={bpm} />
          </div>

          {/* Interactive Note Grid Canvas */}
          <div
            ref={gridScrollRef}
            onScroll={handleGridScroll}
            className="flex-1 overflow-auto bg-studio-950"
          >
            <PianoRollGrid
              pitches={pitches}
              totalBars={totalBars}
              zoomX={pianoRollZoomX}
              bpm={bpm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
