import React from 'react';
import { 
  Wand2, 
  ZoomIn, 
  ZoomOut, 
  Pencil, 
  Eraser, 
  Trash2, 
  Music, 
  Maximize2 
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';
import { GridDivision } from '../../music/quantization';
import { Button } from '../common/Button';

export const PianoRollToolbar: React.FC = () => {
  const {
    pianoRollGridSnap,
    setPianoRollGridSnap,
    pianoRollZoomX,
    setPianoRollZoomX,
    pianoRollTool,
    setPianoRollTool,
  } = useUIStore();

  const { currentProject, activeTrackId, quantizeActiveTrackNotes, clearActiveTrackNotes } = useProjectStore();
  const activeTrack = currentProject.tracks.find(t => t.id === activeTrackId) || currentProject.tracks[0];
  const noteCount = activeTrack?.notes.length || 0;

  const snapOptions: GridDivision[] = ['1/4', '1/8', '1/16', '1/32', 'free'];

  const handleQuantize = () => {
    quantizeActiveTrackNotes(pianoRollGridSnap);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-studio-900 border-b border-studio-800 select-none">
      {/* Left: Tools & Snap */}
      <div className="flex items-center gap-3">
        {/* Draw / Erase Tool Switch */}
        <div className="flex items-center bg-studio-950 p-1 rounded-lg border border-studio-800">
          <button
            onClick={() => setPianoRollTool('draw')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              pianoRollTool === 'draw'
                ? 'bg-accent-primary text-white shadow-sm font-semibold'
                : 'text-studio-400 hover:text-white hover:bg-studio-850'
            }`}
            title="Draw / Select Tool (Click to create, drag to move/resize)"
          >
            <Pencil size={13} />
            <span>Draw</span>
          </button>

          <button
            onClick={() => setPianoRollTool('erase')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              pianoRollTool === 'erase'
                ? 'bg-rose-600 text-white shadow-sm font-semibold'
                : 'text-studio-400 hover:text-white hover:bg-studio-850'
            }`}
            title="Erase Tool (Click notes to delete)"
          >
            <Eraser size={13} />
            <span>Erase</span>
          </button>
        </div>

        <div className="h-5 w-[1px] bg-studio-800 hidden sm:block" />

        {/* Grid Snap Selector */}
        <div className="flex items-center gap-1.5 bg-studio-950 px-2.5 py-1 rounded-lg border border-studio-800">
          <span className="text-[11px] font-mono font-bold text-studio-400 uppercase">Snap:</span>
          <select
            value={pianoRollGridSnap}
            onChange={(e) => setPianoRollGridSnap(e.target.value as GridDivision)}
            className="bg-transparent text-xs font-mono font-medium text-white focus:outline-none cursor-pointer"
            title="Grid snapping division"
          >
            {snapOptions.map(opt => (
              <option key={opt} value={opt} className="bg-studio-900 text-white">
                {opt === 'free' ? 'Free (Off)' : opt}
              </option>
            ))}
          </select>
        </div>

        {/* Quantize Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleQuantize}
          disabled={noteCount === 0 || pianoRollGridSnap === 'free'}
          className="text-xs gap-1.5 h-8"
          title="Snap all notes to the selected grid division"
        >
          <Wand2 size={13} className="text-amber-400" />
          <span>Quantize All</span>
        </Button>
      </div>

      {/* Right: Zoom Controls & Note Stats */}
      <div className="flex items-center gap-3">
        {/* Zoom Controls */}
        <div className="flex items-center bg-studio-950 p-1 rounded-lg border border-studio-800 gap-1">
          <button
            onClick={() => setPianoRollZoomX(pianoRollZoomX - 12)}
            disabled={pianoRollZoomX <= 32}
            className="p-1 text-studio-400 hover:text-white hover:bg-studio-850 rounded disabled:opacity-30"
            title="Zoom Out (Horizontal)"
          >
            <ZoomOut size={14} />
          </button>

          <span className="text-[10px] font-mono text-studio-400 px-1 w-10 text-center">
            {Math.round((pianoRollZoomX / 64) * 100)}%
          </span>

          <button
            onClick={() => setPianoRollZoomX(pianoRollZoomX + 12)}
            disabled={pianoRollZoomX >= 160}
            className="p-1 text-studio-400 hover:text-white hover:bg-studio-850 rounded disabled:opacity-30"
            title="Zoom In (Horizontal)"
          >
            <ZoomIn size={14} />
          </button>

          <button
            onClick={() => setPianoRollZoomX(64)}
            className="p-1 text-studio-400 hover:text-white hover:bg-studio-850 rounded ml-0.5"
            title="Reset Zoom to 100%"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {/* Note Count & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-studio-950 border border-studio-800 text-[11px] font-mono text-studio-300">
            <Music size={12} className="text-indigo-400" />
            <span>{noteCount} {noteCount === 1 ? 'Note' : 'Notes'}</span>
          </div>

          {noteCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearActiveTrackNotes}
              className="text-xs text-studio-400 hover:text-rose-400 h-8 px-2"
              title="Clear all notes on this track"
            >
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
