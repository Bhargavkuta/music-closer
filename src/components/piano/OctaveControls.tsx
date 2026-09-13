import React from 'react';
import { ChevronLeft, ChevronRight, Keyboard, Volume2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';

export const OctaveControls: React.FC = () => {
  const {
    baseOctave,
    setBaseOctave,
    shiftOctave,
    showKeyLabels,
    toggleKeyLabels,
    masterVolume,
    setMasterVolume,
  } = useUIStore();

  const octaves = [1, 2, 3, 4, 5, 6];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-studio-900/90 border border-studio-800 rounded-xl shadow-lg backdrop-blur-md">
      {/* Octave Shift Controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-studio-400 uppercase tracking-wider">Octave:</span>
        <div className="flex items-center bg-studio-950 p-1 rounded-lg border border-studio-800">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => shiftOctave(-1)}
            disabled={baseOctave <= 1}
            title="Shift octave down (Z)"
            className="p-1.5 h-7 w-7"
          >
            <ChevronLeft size={16} />
          </Button>

          <div className="flex items-center gap-1 px-2">
            {octaves.map((oct) => (
              <button
                key={oct}
                onClick={() => setBaseOctave(oct)}
                className={`w-7 h-7 rounded text-xs font-mono font-medium transition-all ${
                  baseOctave === oct
                    ? 'bg-accent-primary text-white shadow-sm font-bold scale-105'
                    : 'text-studio-400 hover:text-studio-200 hover:bg-studio-800/80'
                }`}
              >
                C{oct}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => shiftOctave(1)}
            disabled={baseOctave >= 6}
            title="Shift octave up (X)"
            className="p-1.5 h-7 w-7"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Keyboard info & toggles */}
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant={showKeyLabels ? 'active' : 'secondary'}
          onClick={toggleKeyLabels}
          className="gap-2 text-xs"
        >
          <Keyboard size={14} />
          <span>Key Bindings: {showKeyLabels ? 'ON' : 'OFF'}</span>
        </Button>

        {/* Quick Volume Slider in Piano view */}
        <div className="hidden sm:flex items-center gap-2 bg-studio-950 px-3 py-1.5 rounded-lg border border-studio-800">
          <Volume2 size={15} className="text-studio-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-accent-primary"
            title={`Volume: ${Math.round(masterVolume * 100)}%`}
          />
          <span className="text-[11px] font-mono text-studio-400 w-8 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
