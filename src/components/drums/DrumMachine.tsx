import React from 'react';
import { 
  Disc, 
  Volume2, 
  Trash2, 
  Play, 
  Pause 
} from 'lucide-react';
import { DrumSound } from '../../types/audio';
import { useProjectStore } from '../../store/projectStore';
import { useTransportStore } from '../../store/transportStore';
import { useUIStore } from '../../store/uiStore';
import { AudioEngine } from '../../audio/AudioEngine';
import { Button } from '../common/Button';

interface DrumRowConfig {
  sound: DrumSound;
  label: string;
  subLabel: string;
  color: string;
}

const DRUM_ROWS: DrumRowConfig[] = [
  { sound: 'kick',        label: 'Kick Drum',   subLabel: '55Hz Punch',    color: '#ef4444' }, // Red
  { sound: 'snare',       label: 'Snare Drum',  subLabel: 'Crisp Snap',    color: '#3b82f6' }, // Blue
  { sound: 'hihatClosed', label: 'Closed Hat',  subLabel: 'Tight Click',   color: '#10b981' }, // Emerald
  { sound: 'hihatOpen',   label: 'Open Hat',    subLabel: 'Sizzle Ring',   color: '#06b6d4' }, // Cyan
  { sound: 'clap',        label: 'Hand Clap',   subLabel: 'Impulse Burst', color: '#f59e0b' }, // Amber
  { sound: 'tom',         label: 'Low Tom',     subLabel: 'Resonant Bend', color: '#a855f7' }, // Purple
];

export const DrumMachine: React.FC = () => {
  const { drumPattern, toggleDrumStep, clearDrumPattern, loadDrumPreset } = useProjectStore();
  const { currentDrumStep } = useUIStore();
  const { isPlaying, play, pause, setPlaybackMode, playbackMode } = useTransportStore();

  React.useEffect(() => {
    if (playbackMode !== 'pattern') {
      setPlaybackMode('pattern');
    }
  }, [playbackMode, setPlaybackMode]);

  const handleAudition = (sound: DrumSound) => {
    AudioEngine.triggerDrum(sound, undefined, 0.95);
  };

  const handleTogglePlayBeat = () => {
    if (isPlaying) {
      pause();
    } else {
      if (playbackMode !== 'pattern') {
        setPlaybackMode('pattern');
      }
      play();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto bg-studio-950 border border-studio-800 rounded-2xl shadow-2xl p-4 sm:p-5 select-none gap-4">
      {/* 1. Drum Machine Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-studio-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Disc size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              16-Step Drum Machine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                Pattern Loop
              </span>
            </h3>
            <p className="text-[11px] text-studio-400">
              Click steps to create beats. Click drum names to audition sounds.
            </p>
          </div>
        </div>

        {/* Action & Preset Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Play/Pause Pattern */}
          <Button
            size="sm"
            variant={isPlaying ? 'accent' : 'secondary'}
            onClick={handleTogglePlayBeat}
            className="h-8 gap-1.5 text-xs font-bold"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Beat'}</span>
          </Button>

          <div className="h-4 w-[1px] bg-studio-800" />

          {/* Presets */}
          <div className="flex items-center bg-studio-900 p-0.5 rounded-lg border border-studio-800 text-xs">
            <button
              onClick={() => loadDrumPreset('four_on_floor')}
              className="px-2.5 py-1 rounded text-studio-300 hover:text-white hover:bg-studio-800 font-mono text-[11px] transition-colors"
            >
              4-on-Floor
            </button>
            <button
              onClick={() => loadDrumPreset('hiphop')}
              className="px-2.5 py-1 rounded text-studio-300 hover:text-white hover:bg-studio-800 font-mono text-[11px] transition-colors"
            >
              Hip-Hop
            </button>
            <button
              onClick={() => loadDrumPreset('trap')}
              className="px-2.5 py-1 rounded text-studio-300 hover:text-white hover:bg-studio-800 font-mono text-[11px] transition-colors"
            >
              Trap
            </button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={clearDrumPattern}
            className="text-xs text-studio-400 hover:text-rose-400 h-8 px-2"
            title="Clear all drum steps"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* 2. Step Indicator LED Bar (Top 16th ticks) */}
      <div className="flex items-center">
        {/* Left spacer matching drum name column */}
        <div className="w-32 sm:w-44 shrink-0 text-[10px] font-mono font-bold text-studio-500 uppercase tracking-wider pl-2">
          Step
        </div>

        {/* 16 Step Header Numbers */}
        <div className="grid grid-cols-16 flex-1 gap-1 sm:gap-1.5">
          {Array.from({ length: 16 }, (_, i) => {
            const isDownbeat = i % 4 === 0;
            const isStepActive = isPlaying && currentDrumStep === i;

            return (
              <div
                key={i}
                className={`h-5 rounded flex items-center justify-center text-[10px] font-mono transition-all ${
                  isStepActive
                    ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/50 scale-105'
                    : isDownbeat
                    ? 'bg-studio-850 text-studio-200 font-bold'
                    : 'bg-studio-950 text-studio-500'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. The 6 Drum Rows Grid */}
      <div className="flex flex-col gap-2">
        {DRUM_ROWS.map((row) => {
          const steps = drumPattern[row.sound] || new Array(16).fill(false);

          return (
            <div key={row.sound} className="flex items-center gap-1.5 sm:gap-2">
              {/* Drum Voice Label & Audition Button */}
              <button
                onClick={() => handleAudition(row.sound)}
                className="w-32 sm:w-44 h-10 px-2.5 rounded-xl bg-studio-900 hover:bg-studio-850 border border-studio-800 flex items-center justify-between transition-all group shrink-0"
                title={`Click to audition ${row.label}`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {row.label}
                  </span>
                  <span className="text-[9px] font-mono text-studio-400">
                    {row.subLabel}
                  </span>
                </div>
                <Volume2 size={13} className="text-studio-500 group-hover:text-white" />
              </button>

              {/* 16 Step Buttons */}
              <div className="grid grid-cols-16 flex-1 gap-1 sm:gap-1.5">
                {steps.map((isActive, stepIdx) => {
                  const isCurrentPlayhead = isPlaying && currentDrumStep === stepIdx;
                  const isBeatStart = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleDrumStep(row.sound, stepIdx)}
                      style={{
                        backgroundColor: isActive ? row.color : undefined,
                        borderColor: isCurrentPlayhead ? '#ffffff' : undefined,
                      }}
                      className={`h-10 rounded-lg transition-all duration-75 border relative flex items-center justify-center ${
                        isActive
                          ? 'shadow-md shadow-black/40 scale-100 border-white/30 brightness-110'
                          : isBeatStart
                          ? 'bg-studio-850 border-studio-750 hover:bg-studio-800'
                          : 'bg-studio-900/90 border-studio-800/80 hover:bg-studio-850'
                      } ${isCurrentPlayhead ? 'ring-2 ring-white shadow-lg' : ''}`}
                    >
                      {/* Inner glowing pill when step is active */}
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-white/80 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
