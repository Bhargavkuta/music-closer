import React from 'react';
import * as Tone from 'tone';
import { beatsToSeconds } from '../../music/quantization';
import { useTransportStore } from '../../store/transportStore';

interface PianoRollRulerProps {
  totalBars: number;
  zoomX: number; // pixels per beat
  bpm: number;
}

export const PianoRollRuler: React.FC<PianoRollRulerProps> = ({
  totalBars,
  zoomX,
  bpm,
}) => {
  const { isLooping } = useTransportStore();
  const beatsPerBar = 4;
  const totalBeats = totalBars * beatsPerBar;
  const totalWidth = totalBeats * zoomX;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedBeat = Math.max(0, clickX / zoomX);
    const targetSeconds = beatsToSeconds(clickedBeat, bpm);

    Tone.getTransport().seconds = targetSeconds;
  };

  const bars = Array.from({ length: totalBars }, (_, i) => i + 1);

  return (
    <div
      onClick={handleRulerClick}
      style={{ width: `${totalWidth}px` }}
      className="h-7 bg-studio-950 border-b border-studio-800 flex relative cursor-pointer select-none text-[10px] font-mono text-studio-400 shrink-0"
      title="Click timeline ruler to seek playhead"
    >
      {/* Loop Region Highlight (Bars 1 to 4) */}
      {isLooping && (
        <div
          style={{ width: `${4 * beatsPerBar * zoomX}px` }}
          className="absolute inset-y-0 left-0 bg-accent-primary/15 border-r-2 border-accent-primary pointer-events-none"
        />
      )}

      {bars.map((bar) => {
        const barWidth = beatsPerBar * zoomX;
        return (
          <div
            key={bar}
            style={{ width: `${barWidth}px` }}
            className="h-full border-r border-studio-700/80 flex flex-col justify-between pl-1.5 py-0.5 relative shrink-0"
          >
            {/* Bar Label */}
            <span className="font-bold text-white tracking-wider">
              {bar}
            </span>

            {/* Sub-beat tick marks */}
            <div className="flex justify-between pr-2 pb-0.5">
              <span className="w-[1px] h-1.5 bg-studio-700" />
              <span className="w-[1px] h-1.5 bg-studio-700" />
              <span className="w-[1px] h-1.5 bg-studio-700" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
