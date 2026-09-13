import React, { useState } from 'react';
import { 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Music, 
  Disc, 
  Layers, 
  Radio, 
  Guitar, 
  Check, 
  Sparkles,
  Download
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';
import { PatternData } from '../../types/project';
import { InstrumentType } from '../../types/audio';

export const PatternPalette: React.FC = () => {
  const { currentProject, activeTrackId, createPattern, duplicatePattern, deletePattern, convertTrackNotesToPattern } = useProjectStore();
  const { activePatternId, setActivePatternId, setWorkspaceTab, setActiveInstrument } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternInst, setNewPatternInst] = useState<InstrumentType>('piano');
  const [newPatternBars, setNewPatternBars] = useState<number>(4);

  const patterns = currentProject.patterns || [];
  const activePattern = patterns.find(p => p.id === activePatternId) || patterns[0];
  const activeTrack = currentProject.tracks.find(t => t.id === activeTrackId);

  const getInstIcon = (inst: InstrumentType) => {
    switch (inst) {
      case 'drums': return <Disc size={13} />;
      case 'bass': return <Radio size={13} />;
      case 'guitar': return <Guitar size={13} />;
      case 'synth': return <Layers size={13} />;
      case 'piano':
      default: return <Music size={13} />;
    }
  };

  const handleCreatePattern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatternName.trim()) return;

    const newId = createPattern(newPatternName.trim(), newPatternInst, newPatternBars);
    setActivePatternId(newId);
    setIsCreating(false);
    setNewPatternName('');
  };

  const handleEditPatternInWorkspace = (pattern: PatternData) => {
    setActivePatternId(pattern.id);
    setActiveInstrument(pattern.instrument);

    if (pattern.instrument === 'drums') {
      setWorkspaceTab('drums');
    } else {
      // Load pattern notes into active track for piano roll editing if user wants
      setWorkspaceTab('pianoroll');
    }
  };

  const handleConvertCurrentTake = () => {
    if (!activeTrack || activeTrack.notes.length === 0) return;
    const newId = convertTrackNotesToPattern(activeTrack.id);
    setActivePatternId(newId);
  };

  return (
    <div className="w-full bg-studio-900/90 border border-studio-800/90 rounded-xl p-3 flex flex-col gap-3 shadow-md">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-studio-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              Pattern Palette
              <span className="text-[10px] text-studio-400 font-normal">
                ({patterns.length} available)
              </span>
            </h3>
            <p className="text-[11px] text-studio-400">
              Select a pattern to paint onto track bars in the Arrangement Timeline below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTrack && activeTrack.notes.length > 0 && (
            <button
              onClick={handleConvertCurrentTake}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-750 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all hover:scale-[1.02]"
              title="Save current recorded/drawn notes as a reusable pattern"
            >
              <Download size={13} />
              <span>Save Take as Pattern</span>
            </button>
          )}

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={13} />
            <span>New Pattern</span>
          </button>
        </div>
      </div>

      {/* Creation inline form */}
      {isCreating && (
        <form onSubmit={handleCreatePattern} className="p-3 bg-studio-950/80 border border-indigo-500/30 rounded-lg flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] uppercase font-mono text-studio-400 block mb-1">Pattern Name</label>
            <input
              type="text"
              placeholder="e.g. Chorus Chords, Bass Drop"
              value={newPatternName}
              onChange={(e) => setNewPatternName(e.target.value)}
              className="w-full bg-studio-850 border border-studio-700 rounded px-2.5 py-1 text-xs text-white placeholder-studio-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-studio-400 block mb-1">Instrument</label>
            <select
              value={newPatternInst}
              onChange={(e) => setNewPatternInst(e.target.value as InstrumentType)}
              className="bg-studio-850 border border-studio-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="piano">Grand Piano</option>
              <option value="bass">Electric Bass</option>
              <option value="guitar">Acoustic Guitar</option>
              <option value="synth">Analog Synth</option>
              <option value="drums">Drum Machine</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-studio-400 block mb-1">Length</label>
            <select
              value={newPatternBars}
              onChange={(e) => setNewPatternBars(Number(e.target.value))}
              className="bg-studio-850 border border-studio-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value={2}>2 Bars</option>
              <option value={4}>4 Bars</option>
              <option value={8}>8 Bars</option>
              <option value={16}>16 Bars</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 self-end">
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1"
            >
              <Check size={13} />
              <span>Create</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 bg-studio-800 hover:bg-studio-700 text-studio-300 rounded text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pattern chips / selector grid */}
      <div className="flex flex-wrap items-center gap-2">
        {patterns.map((pat) => {
          const isSelected = pat.id === activePattern?.id;
          const noteCount = pat.notes ? pat.notes.length : 0;
          const isDrums = pat.instrument === 'drums';

          return (
            <div
              key={pat.id}
              onClick={() => setActivePatternId(pat.id)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-studio-800 text-white border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-studio-850/70 hover:bg-studio-800/80 text-studio-300 border-studio-750'
              }`}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: pat.color || '#6366f1' }}
              />

              <div className="flex items-center gap-1.5">
                <span className="text-studio-400">{getInstIcon(pat.instrument)}</span>
                <span className="text-xs font-semibold">{pat.name}</span>
              </div>

              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-900 text-studio-400">
                {pat.durationBars}b {isDrums ? '• Beat' : `• ${noteCount}n`}
              </span>

              {/* Action buttons on hover/select */}
              <div className="flex items-center gap-1 ml-1 opacity-80 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePattern(pat.id);
                  }}
                  className="p-1 hover:bg-studio-700 text-studio-400 hover:text-white rounded transition-colors"
                  title="Duplicate pattern"
                >
                  <Copy size={12} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPatternInWorkspace(pat);
                  }}
                  className="p-1 hover:bg-indigo-900/40 text-indigo-400 hover:text-indigo-200 rounded transition-colors"
                  title="Open in note editor"
                >
                  <Edit3 size={12} />
                </button>

                {patterns.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePattern(pat.id);
                    }}
                    className="p-1 hover:bg-rose-900/40 text-studio-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete pattern"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
