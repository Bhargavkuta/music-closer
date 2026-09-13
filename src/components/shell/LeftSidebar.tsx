import React from 'react';
import { 
  Piano, 
  Guitar, 
  Disc, 
  Layers, 
  Radio, 
  Music2, 
  Sliders, 
  SlidersHorizontal,
  Sparkles,
  ListMusic
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';
import { InstrumentType } from '../../types/audio';
import { AudioEngine } from '../../audio/AudioEngine';

export const LeftSidebar: React.FC = () => {
  const { 
    activeInstrument, 
    setActiveInstrument, 
    workspaceTab, 
    setWorkspaceTab,
    showTheoryPanel,
    setShowTheoryPanel
  } = useUIStore();
  const { currentProject, createTrack, setActiveTrackId } = useProjectStore();

  const instruments: Array<{ id: InstrumentType; label: string; icon: React.ReactNode }> = [
    { id: 'piano', label: 'Grand Piano', icon: <Piano size={16} /> },
    { id: 'bass', label: 'Electric Bass', icon: <Radio size={16} /> },
    { id: 'guitar', label: 'Acoustic Guitar', icon: <Guitar size={16} /> },
    { id: 'synth', label: 'Analog Synth', icon: <Layers size={16} /> },
    { id: 'drums', label: 'Drum Machine', icon: <Disc size={16} /> },
  ];

  const tools: Array<{ id: string; label: string; icon: React.ReactNode; phase: string; active?: boolean }> = [
    { id: 'chords', label: 'Chord Library', icon: <Music2 size={16} />, phase: 'Phase 6', active: true },
    { id: 'scales', label: 'Scale Assistant', icon: <Sparkles size={16} />, phase: 'Phase 6', active: true },
    { id: 'mixer', label: 'Mixer & FX', icon: <Sliders size={16} />, phase: 'Phase 7', active: true },
  ];

  const handleInstrumentSelect = (id: InstrumentType, label: string) => {
    if (id === 'drums') {
      setWorkspaceTab('drums');
      return;
    }

    setActiveInstrument(id);
    AudioEngine.setInstrument(id);

    // Switch to keyboard or keep in pianoroll
    if (workspaceTab === 'drums' || workspaceTab === 'arrangement') {
      setWorkspaceTab('keyboard');
    }

    // Select or create corresponding track
    const existingTrack = currentProject.tracks.find(t => t.instrument === id);
    if (existingTrack) {
      setActiveTrackId(existingTrack.id);
    } else {
      createTrack(label, id);
    }
  };

  return (
    <aside className="w-56 bg-studio-900/95 border-r border-studio-800 flex flex-col justify-between p-3 select-none shrink-0 overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Workspace Views Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold text-studio-400 uppercase tracking-wider font-mono">
              Workspaces
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => setWorkspaceTab('arrangement')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                workspaceTab === 'arrangement'
                  ? 'bg-accent-primary text-white shadow-sm font-semibold'
                  : 'text-studio-200 hover:text-white hover:bg-studio-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ListMusic size={16} className={workspaceTab === 'arrangement' ? 'text-white' : 'text-studio-400'} />
                <span>Song Arranger</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                workspaceTab === 'arrangement' ? 'bg-white/20 text-white' : 'bg-studio-800 text-studio-400'
              }`}>
                Phase 5
              </span>
            </button>
          </div>
        </div>

        {/* Instruments Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold text-studio-400 uppercase tracking-wider font-mono">
              Instruments
            </span>
            <SlidersHorizontal size={13} className="text-studio-500" />
          </div>

          <div className="flex flex-col gap-1">
            {instruments.map((inst) => {
              const isSelected = inst.id === 'drums' 
                ? workspaceTab === 'drums' 
                : activeInstrument === inst.id && workspaceTab !== 'drums';

              return (
                <button
                  key={inst.id}
                  onClick={() => handleInstrumentSelect(inst.id, inst.label)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-accent-primary text-white shadow-sm font-semibold'
                      : 'text-studio-200 hover:text-white hover:bg-studio-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isSelected ? 'text-white' : 'text-studio-400'}>
                      {inst.icon}
                    </span>
                    <span>{inst.label}</span>
                  </div>

                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-studio-800 text-studio-400'
                  }`}>
                    {isSelected ? 'Active' : 'Play'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold text-studio-400 uppercase tracking-wider font-mono">
              Tools & Theory
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {tools.map((tool) => {
              const isTheoryTool = tool.id === 'chords' || tool.id === 'scales';
              const isMixer = tool.id === 'mixer';
              const isToolActive = isMixer 
                ? workspaceTab === 'mixer' 
                : isTheoryTool && showTheoryPanel;

              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    if (isTheoryTool) {
                      setShowTheoryPanel(!showTheoryPanel);
                    } else if (isMixer) {
                      setWorkspaceTab('mixer');
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isToolActive
                      ? isMixer 
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : tool.active
                      ? 'text-studio-200 hover:text-white hover:bg-studio-800/80'
                      : 'text-studio-400 hover:text-studio-200 hover:bg-studio-800/50 opacity-70'
                  }`}
                  title={`${tool.label} (${tool.phase})`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isToolActive ? 'text-white' : tool.active ? (isMixer ? 'text-indigo-400' : 'text-amber-400/80') : 'text-studio-400'}>
                      {tool.icon}
                    </span>
                    <span>{tool.label}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isToolActive
                      ? isMixer ? 'bg-white/20 text-white' : 'bg-amber-500 text-black font-bold'
                      : tool.active
                      ? isMixer ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60' : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      : 'bg-studio-800 text-studio-400'
                  }`}>
                    {tool.active ? 'Active' : tool.phase}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Status Info */}
      <div className="mt-auto pt-4 border-t border-studio-800/60 flex flex-col gap-1.5 text-[11px] text-studio-400 font-mono">
        <div className="flex items-center justify-between">
          <span>Instruments:</span>
          <span className="text-accent-emerald">5 Available</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Tracks:</span>
          <span className="text-studio-200">{currentProject.tracks.length} Dynamic</span>
        </div>
      </div>
    </aside>
  );
};
