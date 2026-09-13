import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Radio, 
  Piano, 
  Guitar, 
  Layers,
  Disc 
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';
import { InstrumentType } from '../../types/audio';
import { AudioEngine } from '../../audio/AudioEngine';
import { Button } from '../common/Button';

export const TrackManagerBar: React.FC = () => {
  const { 
    currentProject, 
    activeTrackId, 
    setActiveTrackId, 
    createTrack, 
    deleteTrack, 
    setTrackVolume, 
    toggleTrackMute, 
    toggleTrackSolo 
  } = useProjectStore();

  const { setActiveInstrument } = useUIStore();

  const [showAddMenu, setShowAddMenu] = useState(false);

  const instrumentOptions: Array<{ type: InstrumentType; label: string; icon: React.ReactNode }> = [
    { type: 'piano', label: 'Grand Piano', icon: <Piano size={15} /> },
    { type: 'bass', label: 'Electric Bass', icon: <Radio size={15} /> },
    { type: 'guitar', label: 'Acoustic Guitar', icon: <Guitar size={15} /> },
    { type: 'synth', label: 'Analog Synth', icon: <Layers size={15} /> },
    { type: 'drums', label: 'Drum Kit', icon: <Disc size={15} /> },
  ];

  const handleSelectTrack = (trackId: string, inst: InstrumentType) => {
    setActiveTrackId(trackId);
    setActiveInstrument(inst);
    AudioEngine.setInstrument(inst);
  };

  const handleAddTrack = (type: InstrumentType, label: string) => {
    createTrack(label, type);
    setActiveInstrument(type);
    AudioEngine.setInstrument(type);
    setShowAddMenu(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-studio-900/90 border border-studio-800 rounded-xl p-2.5 shadow-lg backdrop-blur-md flex flex-col gap-2 select-none">
      {/* Header & Add Track Trigger */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-mono font-bold text-studio-400 uppercase tracking-wider">
          Multi-Tracks ({currentProject.tracks.length}):
        </span>

        {/* Add Track Menu */}
        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="h-7 text-xs gap-1 px-2.5"
          >
            <Plus size={13} />
            <span>Add Track</span>
          </Button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-studio-900 border border-studio-700/80 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in duration-150">
              <span className="text-[10px] font-mono text-studio-400 px-2 py-1 uppercase">
                Choose Instrument:
              </span>
              {instrumentOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleAddTrack(opt.type, opt.label)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-studio-200 hover:text-white hover:bg-studio-800 rounded-lg transition-colors text-left"
                >
                  <span className="text-accent-primary">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tracks List Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {currentProject.tracks.map((track) => {
          const isActive = track.id === activeTrackId;

          return (
            <div
              key={track.id}
              onClick={() => handleSelectTrack(track.id, track.instrument)}
              style={{ borderLeftColor: track.color }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-y border-r border-l-4 transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-studio-850 border-studio-700 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-studio-950/80 border-studio-800 hover:bg-studio-850/60'
              }`}
            >
              {/* Instrument Icon & Name */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  {track.name}
                </span>
                <span className="text-[9px] font-mono text-studio-400 capitalize">
                  {track.instrument} &bull; {track.notes.length} notes
                </span>
              </div>

              {/* Mute Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTrackMute(track.id);
                }}
                className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-colors ${
                  track.isMuted
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-studio-800 text-studio-400 hover:text-white'
                }`}
                title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
              >
                M
              </button>

              {/* Solo Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTrackSolo(track.id);
                }}
                className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-colors ${
                  track.isSoloed
                    ? 'bg-amber-500 text-studio-950 shadow-sm'
                    : 'bg-studio-800 text-studio-400 hover:text-white'
                }`}
                title={track.isSoloed ? 'Unsolo Track' : 'Solo Track'}
              >
                S
              </button>

              {/* Volume Mini Slider */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="hidden sm:flex items-center gap-1 pl-1"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={track.volume}
                  onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                  className="w-12 h-1 bg-studio-800 rounded appearance-none cursor-pointer accent-accent-primary"
                  title={`Volume: ${Math.round(track.volume * 100)}%`}
                />
              </div>

              {/* Delete Track (only if > 1 track) */}
              {currentProject.tracks.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTrack(track.id);
                  }}
                  className="text-studio-500 hover:text-rose-400 p-0.5 rounded transition-colors ml-0.5"
                  title="Delete Track"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
