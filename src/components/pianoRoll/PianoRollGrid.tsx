import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NoteEvent } from '../../types/music';
import { PitchRowInfo, ROW_HEIGHT, PIANO_ROLL_MAX_MIDI, PIANO_ROLL_MIN_MIDI } from './PianoRollKeys';
import { 
  secondsToBeats, 
  beatsToSeconds, 
  snapBeat, 
  GRID_BEAT_VALUES 
} from '../../music/quantization';
import { pitchToMidi, midiToPitch } from '../../music/notes';
import { getScaleNotes } from '../../music/scales';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';
import { useTransportStore } from '../../store/transportStore';
import { AudioEngine } from '../../audio/AudioEngine';

interface PianoRollGridProps {
  pitches: PitchRowInfo[];
  totalBars: number;
  zoomX: number; // pixels per beat
  bpm: number;
}

export const PianoRollGrid: React.FC<PianoRollGridProps> = ({
  pitches,
  totalBars,
  zoomX,
  bpm,
}) => {
  const { 
    pianoRollGridSnap, 
    pianoRollTool,
    selectedRootNote,
    selectedScaleType,
    highlightScaleNotes
  } = useUIStore();
  const { currentProject, activeTrackId, addNoteToActiveTrack, updateNoteInActiveTrack, deleteNoteFromActiveTrack } = useProjectStore();
  const { currentTimeSeconds } = useTransportStore();

  const activeScaleNotes = useMemo(() => {
    if (!highlightScaleNotes) return [];
    return getScaleNotes(selectedRootNote, selectedScaleType);
  }, [highlightScaleNotes, selectedRootNote, selectedScaleType]);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  const activeTrack = currentProject.tracks.find(t => t.id === activeTrackId) || currentProject.tracks[0];
  const notes = activeTrack?.notes || [];

  const beatsPerBar = 4;
  const totalBeats = totalBars * beatsPerBar;
  const totalWidth = totalBeats * zoomX;
  const totalHeight = pitches.length * ROW_HEIGHT;

  // Dragging State for Note Move or Note Resize
  const [activeDrag, setActiveDrag] = useState<{
    type: 'move' | 'resize';
    noteId: string;
    startClientX: number;
    startClientY: number;
    initialStartBeat: number;
    initialDurationBeat: number;
    initialMidi: number;
  } | null>(null);

  // Real-time moving playhead X position in pixels
  const playheadBeat = secondsToBeats(currentTimeSeconds, bpm);
  const playheadX = playheadBeat * zoomX;

  // Handle clicking empty space to create note
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeDrag || pianoRollTool === 'erase') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const rawBeat = clickX / zoomX;
    const snappedBeat = snapBeat(rawBeat, pianoRollGridSnap);

    const rowIndex = Math.floor(clickY / ROW_HEIGHT);
    const targetPitchInfo = pitches[rowIndex];
    if (!targetPitchInfo) return;

    // Default note duration is the current grid snap (or 1/4 beat if free)
    const defaultDurationBeat = pianoRollGridSnap === 'free' ? 0.5 : (GRID_BEAT_VALUES[pianoRollGridSnap] || 0.25);
    const startSeconds = beatsToSeconds(snappedBeat, bpm);
    const durationSeconds = beatsToSeconds(defaultDurationBeat, bpm);

    const newNote: NoteEvent = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pitch: targetPitchInfo.pitch,
      midi: targetPitchInfo.midi,
      start: Number(startSeconds.toFixed(3)),
      duration: Number(durationSeconds.toFixed(3)),
      velocity: 0.85,
    };

    addNoteToActiveTrack(newNote);
    AudioEngine.playNote(targetPitchInfo.pitch, 0.85);
    setTimeout(() => {
      AudioEngine.releaseNote(targetPitchInfo.pitch);
    }, 180);
  };

  // Start Move Drag
  const handleNoteMouseDown = (e: React.MouseEvent, note: NoteEvent) => {
    e.stopPropagation();

    if (pianoRollTool === 'erase' || e.button === 2) {
      deleteNoteFromActiveTrack(note.id);
      return;
    }

    const initialStartBeat = secondsToBeats(note.start, bpm);
    const initialDurationBeat = secondsToBeats(note.duration, bpm);

    setActiveDrag({
      type: 'move',
      noteId: note.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialStartBeat,
      initialDurationBeat,
      initialMidi: note.midi,
    });
  };

  // Start Resize Drag
  const handleResizeMouseDown = (e: React.MouseEvent, note: NoteEvent) => {
    e.stopPropagation();

    const initialStartBeat = secondsToBeats(note.start, bpm);
    const initialDurationBeat = secondsToBeats(note.duration, bpm);

    setActiveDrag({
      type: 'resize',
      noteId: note.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      initialStartBeat,
      initialDurationBeat,
      initialMidi: note.midi,
    });
  };

  // Global mousemove & mouseup for drag tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDrag) return;

      const deltaX = e.clientX - activeDrag.startClientX;
      const deltaY = e.clientY - activeDrag.startClientY;

      const deltaBeats = deltaX / zoomX;

      if (activeDrag.type === 'move') {
        const rawNewStartBeat = Math.max(0, activeDrag.initialStartBeat + deltaBeats);
        const snappedStartBeat = snapBeat(rawNewStartBeat, pianoRollGridSnap);
        const newStartSeconds = beatsToSeconds(snappedStartBeat, bpm);

        const rowDelta = Math.round(deltaY / ROW_HEIGHT);
        // Note: index 0 is C6 (highest), so moving down increases rowDelta and DECREASES midi
        const newMidi = Math.max(PIANO_ROLL_MIN_MIDI, Math.min(PIANO_ROLL_MAX_MIDI, activeDrag.initialMidi - rowDelta));
        const newPitch = midiToPitch(newMidi);

        updateNoteInActiveTrack(activeDrag.noteId, {
          start: Number(newStartSeconds.toFixed(3)),
          midi: newMidi,
          pitch: newPitch,
        });
      } else if (activeDrag.type === 'resize') {
        const rawNewDurationBeat = Math.max(
          GRID_BEAT_VALUES[pianoRollGridSnap] || 0.125,
          activeDrag.initialDurationBeat + deltaBeats
        );
        const snappedDurationBeat = snapBeat(rawNewDurationBeat, pianoRollGridSnap);
        const newDurationSeconds = beatsToSeconds(snappedDurationBeat, bpm);

        updateNoteInActiveTrack(activeDrag.noteId, {
          duration: Number(newDurationSeconds.toFixed(3)),
        });
      }
    };

    const handleMouseUp = () => {
      if (activeDrag) {
        // Audition note at final drop position if moved
        const note = notes.find(n => n.id === activeDrag.noteId);
        if (note) {
          AudioEngine.playNote(note.pitch, 0.8);
          setTimeout(() => AudioEngine.releaseNote(note.pitch), 150);
        }
        setActiveDrag(null);
      }
    };

    if (activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, zoomX, bpm, pianoRollGridSnap, notes, updateNoteInActiveTrack]);

  return (
    <div
      ref={gridContainerRef}
      onClick={handleGridClick}
      style={{
        width: `${totalWidth}px`,
        height: `${totalHeight}px`,
      }}
      className="relative bg-studio-950 overflow-hidden cursor-crosshair select-none"
    >
      {/* 1. Horizontal Pitch Rows (Zebra striped matching keyboard + scale highlights) */}
      {pitches.map((p) => {
        const isC = p.noteName === 'C';
        const isScaleNote = highlightScaleNotes && activeScaleNotes.includes(p.noteName);
        const isRoot = highlightScaleNotes && p.noteName === selectedRootNote;

        return (
          <div
            key={p.pitch}
            style={{
              top: `${p.rowIndex * ROW_HEIGHT}px`,
              height: `${ROW_HEIGHT}px`,
              width: `${totalWidth}px`,
            }}
            className={`absolute left-0 border-b transition-colors pointer-events-none ${
              isRoot
                ? 'border-amber-500/30 bg-amber-950/15'
                : isScaleNote
                ? 'border-emerald-500/20 bg-emerald-950/10'
                : isC
                ? 'border-studio-700/60 bg-indigo-950/10'
                : p.isBlack
                ? 'border-studio-900/60 bg-studio-950'
                : 'border-studio-900/40 bg-studio-900/25'
            }`}
          />
        );
      })}

      {/* 2. Vertical Beat & Bar Lines */}
      {Array.from({ length: totalBeats }, (_, beat) => {
        const isBar = beat % beatsPerBar === 0;
        return (
          <div
            key={beat}
            style={{
              left: `${beat * zoomX}px`,
              height: `${totalHeight}px`,
            }}
            className={`absolute top-0 pointer-events-none ${
              isBar ? 'border-r border-studio-700/80' : 'border-r border-studio-850/50'
            }`}
          />
        );
      })}

      {/* 3. Rendered Note Blocks */}
      {notes.map((note) => {
        const noteMidi = note.midi || pitchToMidi(note.pitch);
        const rowIndex = PIANO_ROLL_MAX_MIDI - noteMidi;

        if (rowIndex < 0 || rowIndex >= pitches.length) return null;

        const startBeat = secondsToBeats(note.start, bpm);
        const durationBeat = secondsToBeats(note.duration, bpm);

        const leftPx = startBeat * zoomX;
        const widthPx = Math.max(10, durationBeat * zoomX);
        const topPx = rowIndex * ROW_HEIGHT + 1;
        const heightPx = ROW_HEIGHT - 3;

        return (
          <div
            key={note.id}
            style={{
              left: `${leftPx}px`,
              top: `${topPx}px`,
              width: `${widthPx}px`,
              height: `${heightPx}px`,
            }}
            onMouseDown={(e) => handleNoteMouseDown(e, note)}
            onContextMenu={(e) => {
              e.preventDefault();
              deleteNoteFromActiveTrack(note.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              deleteNoteFromActiveTrack(note.id);
            }}
            className="absolute rounded-md bg-gradient-to-r from-indigo-500 via-indigo-600 to-accent-secondary border border-indigo-300/40 shadow-sm flex items-center justify-between px-1.5 cursor-grab active:cursor-grabbing hover:brightness-110 z-10 select-none group"
            title={`${note.pitch} | Start: ${note.start}s | Len: ${note.duration}s (Right-click or double-click to delete)`}
          >
            {/* Note Pitch Label */}
            <span className="text-[10px] font-mono font-bold text-white truncate pointer-events-none drop-shadow">
              {note.pitch}
            </span>

            {/* Right Resize Handle */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, note)}
              className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/30 rounded-r-md transition-colors"
              title="Drag to resize duration"
            />
          </div>
        );
      })}

      {/* 4. Synchronized Moving Playhead Needle */}
      {playheadX >= 0 && playheadX <= totalWidth && (
        <div
          style={{
            left: `${playheadX}px`,
            height: `${totalHeight}px`,
          }}
          className="absolute top-0 w-[2px] bg-rose-500 shadow-glow-primary pointer-events-none z-30 flex flex-col items-center"
        >
          {/* Playhead arrow head */}
          <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -translate-y-1 shadow-md" />
        </div>
      )}
    </div>
  );
};
