import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Repeat, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Trash2, 
  Music, 
  Disc, 
  Radio, 
  Guitar, 
  Layers, 
  Bookmark 
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useTransportStore } from '../../store/transportStore';
import { useUIStore } from '../../store/uiStore';
import { PatternPalette } from './PatternPalette';
import { SectionManagerModal } from './SectionManagerModal';
import { TrackClip } from '../../types/project';
import { InstrumentType } from '../../types/audio';
import * as Tone from 'tone';

export const ArrangementTimeline: React.FC = () => {
  const { 
    currentProject, 
    addClipToTrack, 
    moveClip, 
    resizeClip, 
    removeClip,
    toggleTrackMute,
    toggleTrackSolo,
    createTrack
  } = useProjectStore();

  const { 
    isPlaying, 
    playbackMode, 
    setPlaybackMode, 
    play, 
    stop, 
    loopSection, 
    clearSectionLoop, 
    activeLoopSectionId,
    currentBar,
    currentBeat
  } = useTransportStore();

  const { 
    timelineZoomX, 
    setTimelineZoomX, 
    activePatternId, 
    setActivePatternId, 
    setWorkspaceTab,
    setActiveInstrument
  } = useUIStore();

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

  // Dragging state for moving or resizing clips
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize';
    clipId: string;
    sourceTrackId: string;
    startBar: number;
    durationBars: number;
    initialClientX: number;
  } | null>(null);

  const tracks = currentProject.tracks || [];
  const patterns = currentProject.patterns || [];
  const sections = currentProject.sections || [];
  const activePattern = patterns.find(p => p.id === activePatternId) || patterns[0];

  // Calculate dynamic total bars on timeline (minimum 24 bars)
  const maxClipBar = tracks.reduce((max, track) => {
    const trackMax = (track.clips || []).reduce((tMax, c) => Math.max(tMax, c.startBar + c.durationBars), 0);
    return Math.max(max, trackMax);
  }, 0);

  const maxSectionBar = sections.reduce((max, s) => Math.max(max, s.startBar + s.lengthBars), 0);
  const totalBars = Math.max(24, Math.ceil((Math.max(maxClipBar, maxSectionBar) + 4) / 4) * 4);

  // Scrub playhead to bar
  const handleRulerClick = (barNumber: number) => {
    const targetBarIndex = Math.max(0, barNumber - 1);
    Tone.getTransport().position = `${targetBarIndex}:0:0`;
  };

  // Place active pattern on empty grid cell
  const handleGridCellClick = (trackId: string, bar: number) => {
    if (dragState || !activePattern) return;

    // Check if cell is already occupied
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const isOccupied = (track.clips || []).some(
      c => bar >= c.startBar && bar < c.startBar + c.durationBars
    );

    if (!isOccupied) {
      addClipToTrack(trackId, activePattern.id, bar, activePattern.durationBars);
    }
  };

  // Clip drag move
  const handleClipMouseDown = (e: React.MouseEvent, trackId: string, clip: TrackClip) => {
    e.stopPropagation();
    setDragState({
      type: 'move',
      clipId: clip.id,
      sourceTrackId: trackId,
      startBar: clip.startBar,
      durationBars: clip.durationBars,
      initialClientX: e.clientX,
    });
  };

  // Clip drag resize handle
  const handleResizeMouseDown = (e: React.MouseEvent, trackId: string, clip: TrackClip) => {
    e.stopPropagation();
    setDragState({
      type: 'resize',
      clipId: clip.id,
      sourceTrackId: trackId,
      startBar: clip.startBar,
      durationBars: clip.durationBars,
      initialClientX: e.clientX,
    });
  };

  // Window mouse move & up listeners for drag
  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.initialClientX;
    const deltaBars = Math.round(deltaX / timelineZoomX);

    if (dragState.type === 'move') {
      const newStart = Math.max(1, dragState.startBar + deltaBars);
      moveClip(dragState.sourceTrackId, dragState.clipId, newStart);
    } else if (dragState.type === 'resize') {
      const newDur = Math.max(1, dragState.durationBars + deltaBars);
      resizeClip(dragState.sourceTrackId, dragState.clipId, newDur);
    }
  };

  const handleTimelineMouseUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  const getInstIcon = (inst: InstrumentType) => {
    switch (inst) {
      case 'drums': return <Disc size={14} />;
      case 'bass': return <Radio size={14} />;
      case 'guitar': return <Guitar size={14} />;
      case 'synth': return <Layers size={14} />;
      case 'piano':
      default: return <Music size={14} />;
    }
  };

  // Playhead position in pixels
  const playheadX = ((currentBar - 1) + (currentBeat - 1) / 4) * timelineZoomX;

  return (
    <div 
      onMouseMove={handleTimelineMouseMove}
      onMouseUp={handleTimelineMouseUp}
      className="w-full flex flex-col gap-3.5 select-none"
    >
      {/* Pattern Palette Shelf */}
      <PatternPalette />

      {/* Main Arranger Timeline Container */}
      <div className="w-full bg-studio-900/95 border border-studio-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Arranger Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-studio-950/80 border-b border-studio-800">
          <div className="flex items-center gap-3">
            {/* Play/Stop Button */}
            <button
              onClick={() => {
                if (isPlaying) stop();
                else play();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isPlaying 
                  ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isPlaying ? 'Stop' : 'Play Song'}</span>
            </button>

            {/* Song Mode vs Pattern Mode Toggle */}
            <div className="flex items-center bg-studio-900 border border-studio-750 p-0.5 rounded-lg text-[11px] font-mono">
              <button
                onClick={() => setPlaybackMode('song')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  playbackMode === 'song'
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-studio-400 hover:text-white'
                }`}
              >
                SONG
              </button>
              <button
                onClick={() => setPlaybackMode('pattern')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  playbackMode === 'pattern'
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-studio-400 hover:text-white'
                }`}
              >
                PATTERN
              </button>
            </div>

            {/* Active Section Loop Status */}
            {activeLoopSectionId && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                <Repeat size={12} className="animate-spin text-indigo-400" />
                <span>Looping Section</span>
                <button
                  onClick={clearSectionLoop}
                  className="ml-1 text-[10px] text-studio-400 hover:text-white underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Manage Song Sections Button */}
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-200 border border-studio-700/60 text-xs font-semibold transition-all hover:scale-[1.02]"
            >
              <Bookmark size={13} className="text-amber-400" />
              <span>Manage Sections</span>
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-studio-900 border border-studio-750 rounded-lg p-0.5">
              <button
                onClick={() => setTimelineZoomX(timelineZoomX - 16)}
                className="p-1.5 text-studio-400 hover:text-white hover:bg-studio-800 rounded transition-colors"
                title="Zoom Out Timeline"
              >
                <ZoomOut size={13} />
              </button>
              <span className="px-2 text-[10px] font-mono text-studio-300">
                {timelineZoomX}px
              </span>
              <button
                onClick={() => setTimelineZoomX(timelineZoomX + 16)}
                className="p-1.5 text-studio-400 hover:text-white hover:bg-studio-800 rounded transition-colors"
                title="Zoom In Timeline"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Arranger Workspace (Left Track Headers + Right Scrollable Grid) */}
        <div className="flex w-full overflow-x-auto relative">
          
          {/* Left Column: Track Headers */}
          <div className="w-52 shrink-0 bg-studio-950/90 border-r border-studio-800 flex flex-col z-20 shadow-lg">
            
            {/* Top Corner: Sections Label & Track Header Title */}
            <div className="h-8 border-b border-studio-800 px-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-studio-400 font-mono">
              <span>Sections</span>
              <Bookmark size={12} />
            </div>

            <div className="h-7 border-b border-studio-800 px-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-studio-500 font-mono bg-studio-900/40">
              <span>Tracks</span>
              <span>M / S</span>
            </div>

            {/* Track Info Rows */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-16 px-3 border-b border-studio-800/80 flex items-center justify-between hover:bg-studio-900/50 transition-colors group relative"
              >
                {/* Left track accent indicator */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{ backgroundColor: track.color }}
                />

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-studio-400 shrink-0">{getInstIcon(track.instrument)}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {track.name}
                    </span>
                    <span className="text-[10px] font-mono text-studio-400 capitalize">
                      {track.instrument} • {(track.clips || []).length} clips
                    </span>
                  </div>
                </div>

                {/* Mute and Solo Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleTrackMute(track.id)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                      track.isMuted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-studio-850 text-studio-400 hover:text-white hover:bg-studio-800'
                    }`}
                    title="Mute Track"
                  >
                    M
                  </button>

                  <button
                    onClick={() => toggleTrackSolo(track.id)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                      track.isSoloed
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-studio-850 text-studio-400 hover:text-white hover:bg-studio-800'
                    }`}
                    title="Solo Track"
                  >
                    S
                  </button>
                </div>
              </div>
            ))}

            {/* Quick Add Track Button */}
            <div className="p-2 border-t border-studio-800/80 bg-studio-950/40">
              <button
                onClick={() => createTrack('Synth Pad', 'synth')}
                className="w-full py-1.5 px-2 rounded-lg bg-studio-900 hover:bg-studio-850 text-studio-300 hover:text-white border border-studio-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus size={12} />
                <span>Add Track</span>
              </button>
            </div>
          </div>

          {/* Right Scrollable Arranger Grid Area */}
          <div className="flex-1 flex flex-col relative overflow-x-auto min-w-[700px]">
            
            {/* 1. Top Section Ribbon */}
            <div 
              className="h-8 border-b border-studio-800 bg-studio-950/60 relative flex items-center"
              style={{ width: `${totalBars * timelineZoomX}px` }}
            >
              {sections.map((sec) => {
                const leftPx = (sec.startBar - 1) * timelineZoomX;
                const widthPx = sec.lengthBars * timelineZoomX;
                const isLooped = activeLoopSectionId === sec.id;

                return (
                  <div
                    key={sec.id}
                    onClick={() => loopSection(sec)}
                    style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                    className={`absolute top-1 bottom-1 px-2 rounded-md flex items-center justify-between cursor-pointer transition-all border ${
                      isLooped
                        ? 'ring-2 ring-white shadow-lg brightness-110'
                        : 'hover:brightness-125'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 rounded-md opacity-25"
                      style={{ backgroundColor: sec.color }}
                    />
                    <div className="flex items-center gap-1.5 relative z-10">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }} />
                      <span className="text-[11px] font-bold text-white tracking-wide">
                        {sec.name}
                      </span>
                    </div>

                    <span className="text-[9px] font-mono text-white/80 relative z-10 px-1 py-0.5 rounded bg-black/40">
                      {isLooped ? 'Looping' : `${sec.lengthBars}b`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 2. Bar Numbers Ruler */}
            <div 
              className="h-7 border-b border-studio-800 bg-studio-950/90 relative cursor-pointer"
              style={{ width: `${totalBars * timelineZoomX}px` }}
            >
              {Array.from({ length: totalBars }).map((_, i) => {
                const barNum = i + 1;
                const isMajor = barNum % 4 === 1;

                return (
                  <div
                    key={barNum}
                    onClick={() => handleRulerClick(barNum)}
                    style={{ left: `${i * timelineZoomX}px`, width: `${timelineZoomX}px` }}
                    className="absolute top-0 bottom-0 border-r border-studio-850 hover:bg-white/5 flex items-center px-1.5 text-[10px] font-mono text-studio-400 group"
                  >
                    <span className={`transition-colors ${isMajor ? 'text-studio-200 font-bold' : 'text-studio-500'}`}>
                      {barNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 3. Track Rows & Grid Cells */}
            <div 
              className="flex flex-col relative"
              style={{ width: `${totalBars * timelineZoomX}px` }}
            >
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="h-16 border-b border-studio-800/80 relative bg-studio-950/20"
                >
                  {/* Grid Bar Background Cells */}
                  {Array.from({ length: totalBars }).map((_, barIdx) => {
                    const barNum = barIdx + 1;
                    const isEvenBar = barNum % 2 === 0;

                    return (
                      <div
                        key={barNum}
                        onClick={() => handleGridCellClick(track.id, barNum)}
                        style={{ left: `${barIdx * timelineZoomX}px`, width: `${timelineZoomX}px` }}
                        className={`absolute top-0 bottom-0 border-r border-studio-850/60 transition-colors ${
                          isEvenBar ? 'bg-studio-900/10' : 'bg-transparent'
                        } hover:bg-indigo-500/10 cursor-pointer`}
                      />
                    );
                  })}

                  {/* Placed Pattern Clips */}
                  {(track.clips || []).map((clip) => {
                    const pattern = patterns.find(p => p.id === clip.patternId);
                    const clipLeft = (clip.startBar - 1) * timelineZoomX;
                    const clipWidth = clip.durationBars * timelineZoomX;
                    const clipColor = pattern?.color || track.color || '#6366f1';
                    const isDrums = pattern?.instrument === 'drums';

                    return (
                      <div
                        key={clip.id}
                        onMouseDown={(e) => handleClipMouseDown(e, track.id, clip)}
                        onDoubleClick={() => {
                          if (pattern) {
                            setActivePatternId(pattern.id);
                            setActiveInstrument(pattern.instrument);
                            if (isDrums) setWorkspaceTab('drums');
                            else setWorkspaceTab('pianoroll');
                          }
                        }}
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                          borderColor: clipColor
                        }}
                        className="absolute top-1 bottom-1 rounded-xl p-2 bg-studio-850/95 border-2 shadow-lg cursor-grab active:cursor-grabbing hover:brightness-110 flex flex-col justify-between overflow-hidden group transition-transform"
                      >
                        {/* Clip Accent Gradient Fill */}
                        <div 
                          className="absolute inset-0 opacity-15 pointer-events-none"
                          style={{ backgroundColor: clipColor }}
                        />

                        {/* Clip Header (Title & Controls) */}
                        <div className="flex items-center justify-between gap-1 relative z-10">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clipColor }} />
                            <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                              {pattern?.name || 'Pattern'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono text-studio-300 px-1 py-0.2 rounded bg-black/40">
                              {clip.durationBars}b
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeClip(track.id, clip.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-900/60 text-studio-400 hover:text-rose-400 transition-opacity"
                              title="Delete clip"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Miniature Music Notes/Drums Graphic Preview */}
                        <div className="w-full h-3 flex items-center gap-1 px-1 opacity-70 relative z-10 pointer-events-none">
                          {isDrums ? (
                            // Drum dots preview
                            Array.from({ length: 8 }).map((_, dotIdx) => (
                              <div
                                key={dotIdx}
                                className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shrink-0"
                              />
                            ))
                          ) : (
                            // Note dashes preview
                            (pattern?.notes || []).slice(0, 8).map((note, noteIdx) => (
                              <div
                                key={noteIdx}
                                className="h-1 rounded bg-indigo-300/80 shrink-0"
                                style={{ width: `${Math.max(6, Math.min(18, note.duration * 14))}px` }}
                              />
                            ))
                          )}
                        </div>

                        {/* Right Resize Drag Handle */}
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, track.id, clip)}
                          className="absolute right-0 top-0 bottom-0 w-2.5 hover:bg-white/40 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          title="Drag to resize length"
                        >
                          <div className="w-0.5 h-4 bg-white/70 rounded" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Dynamic Song Playhead */}
              <div
                style={{ 
                  transform: `translateX(${playheadX}px)`,
                  transition: isPlaying ? 'none' : 'transform 0.1s ease-out'
                }}
                className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-30 pointer-events-none shadow-[0_0_10px_#f59e0b]"
              >
                {/* Playhead Top Badge */}
                <div className="w-3 h-3 bg-amber-400 rotate-45 -ml-[5px] -mt-1 shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Arranger Footer Info */}
        <div className="p-2.5 bg-studio-950 border-t border-studio-800 flex flex-wrap items-center justify-between text-xs text-studio-400 px-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-studio-300 font-mono text-[11px] uppercase">
              Arranger Hints:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 border border-studio-800">
                Click empty cell to place selected pattern
              </span>
              <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 border border-studio-800">
                Drag clip to move bars
              </span>
              <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 border border-studio-800">
                Drag right edge to stretch
              </span>
              <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 border border-studio-800">
                Double-click to edit notes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-studio-400">
            <span>Bar: <strong className="text-white">{currentBar}</strong></span>
            <span>&bull;</span>
            <span>Beat: <strong className="text-white">{currentBeat}</strong></span>
            <span>&bull;</span>
            <span className="text-accent-emerald font-semibold">4 Tracks Active</span>
          </div>
        </div>
      </div>

      {/* Section Manager Modal */}
      <SectionManagerModal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
      />
    </div>
  );
};
