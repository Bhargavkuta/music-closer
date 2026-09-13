import React from 'react';

interface PianoKeyProps {
  pitch: string;
  isBlack: boolean;
  isActive: boolean;
  keyLabel: string | null;
  showLabels: boolean;
  isScaleNote?: boolean;
  isRootNote?: boolean;
  onPress: (pitch: string) => void;
  onRelease: (pitch: string) => void;
  leftOffsetPercent?: number;
}

export const PianoKey: React.FC<PianoKeyProps> = ({
  pitch,
  isBlack,
  isActive,
  keyLabel,
  showLabels,
  isScaleNote = false,
  isRootNote = false,
  onPress,
  onRelease,
  leftOffsetPercent,
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onPress(pitch);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    // If left mouse button is held down while dragging across keys (glissando)
    if (e.buttons === 1) {
      onPress(pitch);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    onRelease(pitch);
  };

  const handleMouseLeave = () => {
    if (isActive) {
      onRelease(pitch);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onPress(pitch);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onRelease(pitch);
  };

  if (isBlack) {
    const scaleBorderClass = isRootNote 
      ? 'border-b-2 border-amber-400' 
      : isScaleNote 
      ? 'border-b-2 border-emerald-400/80' 
      : 'border-b border-studio-700/60';

    return (
      <div
        data-pitch={pitch}
        className={`absolute z-20 top-0 w-8 md:w-10 h-36 md:h-44 rounded-b-md cursor-pointer transition-all duration-75 select-none shadow-piano-black flex flex-col justify-end items-center pb-2.5 ${
          isActive
            ? 'bg-gradient-to-b from-indigo-700 via-indigo-600 to-indigo-500 shadow-glow-primary translate-y-[2px] border-b-2 border-indigo-400'
            : `bg-gradient-to-b from-studio-750 via-studio-900 to-studio-950 hover:from-studio-700 hover:to-studio-900 ${scaleBorderClass}`
        }`}
        style={{ left: `${leftOffsetPercent}%` }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {showLabels && (
          <div className="flex flex-col items-center gap-0.5 pointer-events-none">
            {isScaleNote && (
              <div 
                className={`w-1.5 h-1.5 rounded-full mb-0.5 ${
                  isRootNote ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-emerald-400 shadow-[0_0_5px_#10b981]'
                }`}
                title={isRootNote ? 'Scale Root' : 'In Scale'}
              />
            )}
            {keyLabel && (
              <span className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded ${
                isActive ? 'bg-indigo-300 text-indigo-950' : 'bg-studio-800 text-studio-300'
              }`}>
                {keyLabel}
              </span>
            )}
            <span className={`text-[9px] font-mono ${isActive ? 'text-white' : 'text-studio-400'}`}>
              {pitch}
            </span>
          </div>
        )}
      </div>
    );
  }

  // White key
  const whiteScaleBorderClass = isRootNote 
    ? 'border-b-4 border-b-amber-400' 
    : isScaleNote 
    ? 'border-b-4 border-b-emerald-500/80' 
    : '';

  return (
    <div
      data-pitch={pitch}
      className={`relative z-10 flex-1 min-w-[40px] md:min-w-[52px] h-56 md:h-64 rounded-b-lg cursor-pointer transition-all duration-75 select-none border-x border-b border-studio-750/30 flex flex-col justify-end items-center pb-3 ${
        isActive
          ? 'bg-gradient-to-b from-indigo-100 via-indigo-200 to-indigo-400 shadow-piano-white-active translate-y-[3px] border-indigo-500'
          : `bg-gradient-to-b from-[#ffffff] via-[#f8fafc] to-[#e2e8f0] hover:bg-gradient-to-b hover:from-slate-50 hover:to-slate-200 shadow-piano-white ${whiteScaleBorderClass}`
      }`}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {showLabels && (
        <div className="flex flex-col items-center gap-1 pointer-events-none">
          {isScaleNote && (
            <div 
              className={`w-2 h-2 rounded-full mb-0.5 ${
                isRootNote ? 'bg-amber-400 ring-2 ring-amber-300 shadow-[0_0_6px_#f59e0b]' : 'bg-emerald-500 shadow-sm'
              }`}
              title={isRootNote ? 'Scale Root' : 'In Scale'}
            />
          )}
          {keyLabel && (
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded shadow-sm ${
              isActive ? 'bg-indigo-600 text-white' : 'bg-studio-850 text-studio-100'
            }`}>
              {keyLabel}
            </span>
          )}
          <span className={`text-[11px] font-mono font-medium ${
            isActive ? 'text-indigo-900 font-bold' : 'text-studio-600'
          }`}>
            {pitch}
          </span>
        </div>
      )}
    </div>
  );
};
