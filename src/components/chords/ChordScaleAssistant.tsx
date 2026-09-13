import React, { useState } from 'react';
import { 
  Music2, 
  Sparkles, 
  Play, 
  Plus, 
  Check, 
  X, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';
import { NOTE_NAMES } from '../../music/notes';
import { ScaleType, ChordType, ChordDefinition } from '../../types/music';
import { SCALE_INFOS, getScaleNotes } from '../../music/scales';
import { getChord, playChord, createChordNoteEvents, getDiatonicChords } from '../../music/chords';
import { suggestNextChords } from '../../music/theory';

export const ChordScaleAssistant: React.FC = () => {
  const { 
    selectedRootNote, 
    selectedScaleType, 
    setSelectedRootNote, 
    setSelectedScaleType, 
    showTheoryPanel, 
    setShowTheoryPanel,
    activeChordProgression,
    addToChordProgression,
    clearChordProgression
  } = useUIStore();

  const { insertChordToActiveTrack, currentProject, activeTrackId } = useProjectStore();

  const [selectedChordType, setSelectedChordType] = useState<ChordType>('major');
  const [insertSuccess, setInsertSuccess] = useState<string | null>(null);

  if (!showTheoryPanel) return null;

  const activeTrack = currentProject.tracks.find(t => t.id === activeTrackId) || currentProject.tracks[0];
  const scaleInfo = SCALE_INFOS[selectedScaleType];
  const scaleNotes = getScaleNotes(selectedRootNote, selectedScaleType);
  const diatonicChords = getDiatonicChords(selectedRootNote, selectedScaleType);

  // Suggestions based on active chord progression history
  const suggestions = suggestNextChords(activeChordProgression, selectedRootNote, selectedScaleType);

  const handleAuditionChord = (chord: ChordDefinition) => {
    playChord(chord, 1.8, 0.85);
    addToChordProgression(chord.symbol);
  };

  const handleInsertChord = (chord: ChordDefinition) => {
    const noteEvents = createChordNoteEvents(chord, 0, 1.8, 0.85);
    insertChordToActiveTrack(noteEvents);
    addToChordProgression(chord.symbol);

    setInsertSuccess(chord.symbol);
    setTimeout(() => {
      setInsertSuccess(null);
    }, 1800);
  };

  const allChordTypes: ChordType[] = [
    'major', 
    'minor', 
    'diminished', 
    'augmented', 
    '7th', 
    'maj7', 
    'min7', 
    'sus2', 
    'sus4'
  ];

  return (
    <div className="w-full max-w-5xl mx-auto bg-studio-900/95 border border-amber-500/40 rounded-2xl shadow-2xl p-4 md:p-5 flex flex-col gap-4 animate-in fade-in duration-200 select-none">
      
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between border-b border-studio-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Chord Library & Scale Assistant
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-400 border border-amber-800/50">
                Phase 6 Music Theory
              </span>
            </h2>
            <p className="text-xs text-studio-400">
              Audition chords, highlight scale keys on the piano, and insert progressions directly into your track.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowTheoryPanel(false)}
          className="p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition-colors"
          title="Close Theory Assistant"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Key & Scale Selection Bar */}
      <div className="p-3.5 bg-studio-950/80 border border-studio-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Root Note Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-studio-400 uppercase">Key:</span>
            <div className="flex items-center gap-1 bg-studio-900 border border-studio-750 p-1 rounded-lg">
              {NOTE_NAMES.map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedRootNote(n)}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all ${
                    selectedRootNote === n
                      ? 'bg-amber-500 text-black shadow-md scale-105'
                      : 'text-studio-300 hover:text-white hover:bg-studio-800'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Type Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-studio-400 uppercase">Scale:</span>
            <select
              value={selectedScaleType}
              onChange={(e) => setSelectedScaleType(e.target.value as ScaleType)}
              className="bg-studio-850 border border-studio-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-500"
            >
              {Object.keys(SCALE_INFOS).map((k) => (
                <option key={k} value={k}>
                  {SCALE_INFOS[k as ScaleType].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scale summary badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-studio-900 border border-studio-800 text-amber-300">
            {scaleInfo.mood}
          </span>
          <span className="px-2.5 py-1 rounded bg-studio-900 border border-studio-800 text-studio-300">
            Notes: {scaleNotes.join(' - ')}
          </span>
        </div>
      </div>

      {/* 3. Diatonic Chords Strip in Selected Key */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Music2 size={13} className="text-indigo-400" />
            <span>Diatonic Chords in {selectedRootNote} {scaleInfo.name}</span>
          </span>
          <span className="text-[11px] text-studio-400 font-mono">
            Click to audition &bull; Click '+' to insert into {activeTrack?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {diatonicChords.map((d) => {
            const chordDef = getChord(d.root, d.type);
            const isInserted = insertSuccess === d.symbol;

            return (
              <div
                key={d.degree}
                onClick={() => handleAuditionChord(chordDef)}
                className="group relative p-2.5 rounded-xl bg-studio-950/70 border border-studio-800 hover:border-indigo-500/80 hover:bg-studio-850/80 cursor-pointer transition-all shadow-md flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-studio-900 text-indigo-300 border border-studio-800">
                    {d.degree}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsertChord(chordDef);
                    }}
                    className={`p-1 rounded-md transition-all ${
                      isInserted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-studio-800 hover:bg-indigo-600 text-studio-300 hover:text-white'
                    }`}
                    title="Insert chord notes into track"
                  >
                    {isInserted ? <Check size={12} /> : <Plus size={12} />}
                  </button>
                </div>

                <div className="my-1.5">
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                    {d.symbol}
                  </h4>
                  <p className="text-[10px] text-studio-400 truncate">
                    {chordDef.notes.map(n => n.replace(/\d/, '')).join(' - ')}
                  </p>
                </div>

                <span className="text-[9px] font-mono text-studio-500">
                  {d.function}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Full 9-Chord Type Explorer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-studio-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BookOpen size={13} className="text-amber-400" />
            <span>Chord Library Explorer ({allChordTypes.length} Types for {selectedRootNote})</span>
          </span>
          <span className="text-[11px] text-studio-400 font-mono">
            Explore 7ths, Suspended, Diminished & Augmented chords
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5">
          {allChordTypes.map((type) => {
            const chord = getChord(selectedRootNote, type);
            const isSelected = selectedChordType === type;
            const isInserted = insertSuccess === chord.symbol;

            return (
              <div
                key={type}
                onClick={() => {
                  setSelectedChordType(type);
                  handleAuditionChord(chord);
                }}
                className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-studio-800 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-studio-950/60 border-studio-800 hover:bg-studio-850 hover:border-studio-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {chord.symbol}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsertChord(chord);
                    }}
                    className={`p-1 rounded transition-all ${
                      isInserted
                        ? 'bg-emerald-600 text-white'
                        : 'text-studio-400 hover:text-white hover:bg-studio-700'
                    }`}
                    title="Insert into track"
                  >
                    {isInserted ? <Check size={11} /> : <Plus size={11} />}
                  </button>
                </div>

                <div className="text-[10px] font-mono text-studio-400 mt-1 truncate">
                  {chord.notes.map(n => n.replace(/\d/, '')).join(' ')}
                </div>

                <div className="text-[9px] text-studio-500 truncate capitalize mt-0.5">
                  {type}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Smart Rule-Based Chord Suggestions (Section 19) */}
      <div className="p-3.5 bg-gradient-to-r from-amber-950/30 via-studio-900 to-studio-950 border border-amber-500/30 rounded-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
              Smart Progression Suggestions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-studio-400">
              History: {activeChordProgression.length > 0 ? activeChordProgression.join(' → ') : 'None'}
            </span>
            {activeChordProgression.length > 0 && (
              <button
                onClick={clearChordProgression}
                className="p-1 text-studio-500 hover:text-white rounded hover:bg-studio-800 transition-colors"
                title="Clear Progression History"
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {suggestions.map((sug, i) => (
            <div
              key={i}
              className="p-3 bg-studio-950/90 border border-studio-800 rounded-xl flex flex-col justify-between gap-2 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {sug.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {sug.feel}
                  </span>
                </div>
                <p className="text-[11px] text-studio-300 mt-1 leading-relaxed">
                  {sug.reason}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-studio-850">
                <span className="text-[10px] font-mono text-studio-500">
                  Notes: {sug.chord.notes.map(n => n.replace(/\d/, '')).join(' ')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAuditionChord(sug.chord)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-200 text-xs font-semibold transition-colors"
                  >
                    <Play size={11} fill="currentColor" />
                    <span>Audition</span>
                  </button>
                  <button
                    onClick={() => handleInsertChord(sug.chord)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow"
                  >
                    <Plus size={12} />
                    <span>Insert</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
