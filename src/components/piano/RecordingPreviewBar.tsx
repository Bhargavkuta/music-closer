import React from 'react';
import { Circle, Play, Trash2, Music, CheckCircle2, Clock, Layers, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useTransportStore } from '../../store/transportStore';
import { Button } from '../common/Button';

export const RecordingPreviewBar: React.FC = () => {
  const { currentProject, activeTrackId, recordMode, setRecordMode, clearActiveTrackNotes } = useProjectStore();
  const { isRecording, isPlaying, play, toggleRecord, currentTimeSeconds } = useTransportStore();

  const activeTrack = currentProject.tracks.find(t => t.id === activeTrackId) || currentProject.tracks[0];
  const notesCount = activeTrack?.notes.length || 0;

  return (
    <div className="w-full max-w-5xl bg-studio-900/90 border border-studio-800 rounded-xl p-3.5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
      {/* Left: Track & Recording Status */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
          isRecording 
            ? 'bg-rose-950/60 border-rose-700/80 text-rose-400 animate-pulse shadow-lg shadow-rose-900/30' 
            : notesCount > 0
            ? 'bg-indigo-950/50 border-indigo-800/60 text-indigo-400'
            : 'bg-studio-950 border-studio-800 text-studio-400'
        }`}>
          {isRecording ? <Circle size={18} className="fill-current text-rose-500" /> : <Music size={18} />}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {isRecording ? 'RECORDING PERFORMANCE' : activeTrack?.name || 'Grand Piano'}
            </span>
            {isRecording ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-900/70 text-rose-200 border border-rose-600/50 flex items-center gap-1">
                <Clock size={10} />
                <span>{currentTimeSeconds.toFixed(1)}s</span>
              </span>
            ) : notesCount > 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/40 flex items-center gap-1">
                <CheckCircle2 size={10} className="text-indigo-400" />
                <span>{notesCount} {notesCount === 1 ? 'Note' : 'Notes'} Recorded</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-950 text-studio-400 border border-studio-800">
                Ready to Record
              </span>
            )}
          </div>

          <p className="text-[11px] text-studio-400">
            {isRecording
              ? 'Play keys using mouse or computer keyboard (A-J)...'
              : notesCount > 0
              ? 'Your take is saved. Press Play to listen back.'
              : 'Press Record (●) to capture your live performance.'}
          </p>
        </div>
      </div>

      {/* Center: Live Note Preview Pills */}
      {notesCount > 0 && !isRecording && (
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-md py-1 px-2 bg-studio-950/70 rounded-lg border border-studio-800/70">
          {activeTrack.notes.slice(-6).map((note) => (
            <span
              key={note.id}
              className="text-[10px] font-mono px-2 py-1 bg-studio-850 text-indigo-300 border border-indigo-900/50 rounded flex items-center gap-1 shrink-0"
              title={`Pitch: ${note.pitch}, Start: ${note.start}s, Duration: ${note.duration}s`}
            >
              <span className="font-bold text-white">{note.pitch}</span>
              <span className="text-studio-400 text-[9px]">({note.duration}s)</span>
            </span>
          ))}
          {notesCount > 6 && (
            <span className="text-[10px] font-mono text-studio-400 px-1">
              +{notesCount - 6} more
            </span>
          )}
        </div>
      )}

      {/* Right: Actions & Mode Selector */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Record Mode Toggle (Replace vs Overdub) */}
        {!isRecording && (
          <button
            onClick={() => setRecordMode(recordMode === 'replace' ? 'overdub' : 'replace')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
              recordMode === 'replace'
                ? 'bg-studio-950 border-studio-700 text-studio-300 hover:text-white'
                : 'bg-indigo-950 border-indigo-700 text-indigo-300 font-semibold'
            }`}
            title={recordMode === 'replace' ? 'Mode: Replace previous take on record' : 'Mode: Overdub onto existing take'}
          >
            {recordMode === 'replace' ? <RefreshCw size={11} /> : <Layers size={11} />}
            <span className="capitalize">{recordMode}</span>
          </button>
        )}

        {notesCount > 0 && !isRecording && (
          <>
            <Button
              size="sm"
              variant={isPlaying ? 'accent' : 'primary'}
              onClick={play}
              className="text-xs gap-1.5 px-3"
              title="Play Recorded Take"
            >
              <Play size={13} className="fill-current" />
              <span>Play Take</span>
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={clearActiveTrackNotes}
              className="text-xs gap-1.5 p-2"
              title="Clear Track Notes"
            >
              <Trash2 size={13} />
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant={isRecording ? 'danger' : 'secondary'}
          onClick={toggleRecord}
          className={`text-xs gap-1.5 px-3.5 ${
            isRecording ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40' : ''
          }`}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <Circle size={12} className="fill-current text-rose-500" />
          <span>{isRecording ? 'Stop Recording' : 'Record'}</span>
        </Button>
      </div>
    </div>
  );
};
