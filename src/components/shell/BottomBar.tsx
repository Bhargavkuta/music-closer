import React, { useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Circle, 
  Repeat, 
  Timer, 
  Volume2, 
  VolumeX,
  Plus, 
  Minus,
  Radio
} from 'lucide-react';
import { useTransportStore } from '../../store/transportStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';

export const BottomBar: React.FC = () => {
  const {
    isPlaying,
    isRecording,
    isLooping,
    playbackMode,
    bpm,
    metronomeOn,
    currentBar,
    currentBeat,
    currentTimeSeconds,
    play,
    pause,
    stop,
    toggleRecord,
    toggleLoop,
    setPlaybackMode,
    setBPM,
    toggleMetronome,
    initPositionSync,
  } = useTransportStore();

  const { masterVolume, setMasterVolume } = useUIStore();

  useEffect(() => {
    initPositionSync();
  }, [initPositionSync]);

  // Format seconds into MM:SS.S
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalSeconds * 10) % 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <footer className="h-16 bg-studio-900 border-t border-studio-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Transport Controls */}
      <div className="flex items-center gap-2">
        {/* Mode: Song vs Pattern */}
        <div className="flex items-center bg-studio-950 border border-studio-750 p-0.5 rounded-lg text-[10px] font-mono shrink-0 mr-1">
          <button
            onClick={() => setPlaybackMode('song')}
            className={`px-2 py-1 rounded font-bold transition-all ${
              playbackMode === 'song'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
            title="Song Mode: Plays arrangement timeline"
          >
            SONG
          </button>
          <button
            onClick={() => setPlaybackMode('pattern')}
            className={`px-2 py-1 rounded font-bold transition-all ${
              playbackMode === 'pattern'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-studio-400 hover:text-white'
            }`}
            title="Pattern Mode: Plays single pattern loop"
          >
            PAT
          </button>
        </div>

        {/* Play / Pause */}
        <Button
          size="md"
          variant={isPlaying && !isRecording ? 'accent' : 'secondary'}
          onClick={isPlaying ? pause : play}
          className="h-10 px-4 gap-2 font-bold"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying && !isRecording ? <Pause size={18} /> : <Play size={18} className="fill-current" />}
          <span className="hidden sm:inline">{isPlaying && !isRecording ? 'Pause' : 'Play'}</span>
        </Button>

        {/* Stop */}
        <Button
          size="md"
          variant="secondary"
          onClick={stop}
          className="h-10 w-10 p-0"
          title="Stop & Reset Position"
        >
          <Square size={16} className="fill-current" />
        </Button>

        {/* Record */}
        <Button
          size="md"
          variant={isRecording ? 'danger' : 'secondary'}
          onClick={toggleRecord}
          className={`h-10 px-3.5 gap-2 transition-all ${
            isRecording 
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 font-bold border-rose-500' 
              : ''
          }`}
          title="Record live performance"
        >
          {isRecording ? (
            <Radio size={16} className="animate-pulse text-white" />
          ) : (
            <Circle size={15} className="fill-current text-rose-500" />
          )}
          <span className="hidden sm:inline">{isRecording ? 'Recording...' : 'Record'}</span>
        </Button>

        {/* Loop */}
        <Button
          size="md"
          variant={isLooping ? 'active' : 'secondary'}
          onClick={toggleLoop}
          className="h-10 w-10 p-0"
          title={isLooping ? 'Loop Enabled (4 Bars)' : 'Enable Loop'}
        >
          <Repeat size={16} />
        </Button>
      </div>

      {/* Center: BPM, Metronome, Time Position */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Time Elapsed & Bar/Beat Display */}
        <div className="flex items-center gap-2 bg-studio-950 px-3 py-1.5 rounded-lg border border-studio-800 font-mono text-xs">
          <span className="text-white font-bold tracking-wider">{formatTime(currentTimeSeconds)}</span>
          <span className="text-studio-700">|</span>
          <span className="text-studio-400">BAR:</span>
          <span className="text-accent-primary font-bold">{currentBar.toString().padStart(2, '0')}</span>
          <span className="text-studio-600">:</span>
          <span className="text-studio-400">BEAT:</span>
          <span className="text-accent-primary font-bold">{currentBeat}</span>
        </div>

        {/* BPM Selector */}
        <div className="flex items-center gap-1.5 bg-studio-950 px-2.5 py-1 rounded-lg border border-studio-800">
          <span className="text-[11px] font-bold text-studio-400 font-mono">BPM</span>
          <button
            onClick={() => setBPM(bpm - 1)}
            className="p-1 text-studio-400 hover:text-white hover:bg-studio-800 rounded"
            title="Decrease BPM"
          >
            <Minus size={13} />
          </button>
          <span className="w-10 text-center font-mono text-xs font-bold text-white">
            {bpm}
          </span>
          <button
            onClick={() => setBPM(bpm + 1)}
            className="p-1 text-studio-400 hover:text-white hover:bg-studio-800 rounded"
            title="Increase BPM"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Metronome */}
        <Button
          size="sm"
          variant={metronomeOn ? 'active' : 'secondary'}
          onClick={toggleMetronome}
          className="h-9 px-2.5 gap-1.5 text-xs font-mono"
          title="Toggle Metronome"
        >
          <Timer size={14} className={metronomeOn ? 'text-accent-primary' : 'text-studio-400'} />
          <span className="hidden sm:inline">{metronomeOn ? 'METRONOME ON' : 'METRO'}</span>
        </Button>
      </div>

      {/* Right: Master Output Volume */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMasterVolume(masterVolume === 0 ? 0.8 : 0)}
          className="text-studio-400 hover:text-white p-1.5 rounded-lg hover:bg-studio-800/80 transition-colors"
          title={masterVolume === 0 ? 'Unmute' : 'Mute'}
        >
          {masterVolume === 0 ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} />}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          className="w-20 sm:w-28 h-1.5 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-accent-primary"
          title={`Master Volume: ${Math.round(masterVolume * 100)}%`}
        />
        <span className="text-xs font-mono text-studio-400 w-9 text-right hidden sm:inline">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>
    </footer>
  );
};
