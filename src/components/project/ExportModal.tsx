import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  FileCode, 
  Music, 
  Volume2, 
  X, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Layers
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';
import { downloadMidiFile } from '../../utils/midiExport';
import { downloadWavFile } from '../../utils/audioExport';
import { AudioEngine } from '../../audio/AudioEngine';
import { validateProjectData, saveProjectToDB } from '../../storage/projectStorage';
import { Button } from '../common/Button';

export const ExportModal: React.FC = () => {
  const { currentProject, loadProjectById, refreshSavedProjectsList } = useProjectStore();
  const { showExportModal, setShowExportModal } = useUIStore();

  const [isRenderingWav, setIsRenderingWav] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!showExportModal) return null;

  // 1. Export Project JSON
  const handleExportJson = () => {
    try {
      const jsonString = JSON.stringify(currentProject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const cleanTitle = (currentProject.title || 'project').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const filename = `${cleanTitle}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export JSON failed: ${err.message}`);
    }
  };

  // 2. Export MIDI File
  const handleExportMidi = () => {
    try {
      downloadMidiFile(currentProject);
    } catch (err: any) {
      alert(`Export MIDI failed: ${err.message}`);
    }
  };

  // 3. Export WAV Audio File
  const handleExportWav = async () => {
    setIsRenderingWav(true);
    try {
      const wavBlob = await AudioEngine.renderProjectToWav(currentProject);
      downloadWavFile(wavBlob, currentProject.title || 'music_closer_track');
    } catch (err: any) {
      console.error('Audio WAV export error:', err);
      alert(`Audio rendering failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRenderingWav(false);
    }
  };

  // 4. Import Project JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rawData = JSON.parse(text);
      const validated = validateProjectData(rawData);

      // Save to IndexedDB and reload
      await saveProjectToDB(validated);
      await loadProjectById(validated.id);
      await refreshSavedProjectsList();

      setImportStatus({
        type: 'success',
        message: `Successfully imported "${validated.title}" with ${validated.tracks.length} tracks!`
      });

      setTimeout(() => {
        setShowExportModal(false);
      }, 1400);
    } catch (err: any) {
      console.error('Import project error:', err);
      setImportStatus({
        type: 'error',
        message: `Failed to import project: ${err.message || 'Invalid JSON format'}`
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalNotes = currentProject.tracks.reduce((acc, t) => acc + (t.notes?.length || 0), 0);
  const totalClips = currentProject.tracks.reduce((acc, t) => acc + (t.clips?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-studio-900 border border-studio-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-studio-800 flex items-center justify-between bg-studio-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Export & Share Project
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold">
                  Phase 9 Active
                </span>
              </h3>
              <p className="text-xs text-studio-400">
                Export to standard MIDI, CD-quality WAV audio, or portable JSON project backup.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowExportModal(false)}
            className="p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          
          {/* Project Summary Card */}
          <div className="p-3.5 rounded-xl bg-studio-950/80 border border-studio-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-col gap-0.5">
              <span className="text-studio-400 text-[11px]">Current Project:</span>
              <span className="text-sm font-bold text-white truncate max-w-xs">
                {currentProject.title}
              </span>
            </div>

            <div className="flex items-center gap-4 text-studio-300">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-400" />
                {currentProject.tracks.length} Tracks
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Music size={13} className="text-amber-400" />
                {totalNotes + totalClips} Elements
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-400" />
                {currentProject.bpm} BPM
              </span>
            </div>
          </div>

          {/* Import Status Alert */}
          {importStatus && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-150 ${
              importStatus.type === 'success' 
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' 
                : 'bg-rose-950/50 text-rose-300 border-rose-800/60'
            }`}>
              {importStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* 3 Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Card 1: JSON Project Backup */}
            <div className="p-4 rounded-xl bg-studio-950/60 border border-studio-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 group">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                    <FileCode size={18} />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-studio-800 text-studio-400">
                    .JSON
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Project Backup</h4>
                <p className="text-[11px] text-studio-400 leading-relaxed">
                  Export complete musical data, clips, patterns, tracks, and mixer settings for offline backup or sharing.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportJson}
                className="w-full text-xs font-bold gap-1.5 shadow-sm"
              >
                <Download size={13} />
                <span>Export JSON</span>
              </Button>
            </div>

            {/* Card 2: Standard MIDI */}
            <div className="p-4 rounded-xl bg-studio-950/60 border border-studio-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 group">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                    <Music size={18} />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-studio-800 text-studio-400">
                    .MID
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Standard MIDI</h4>
                <p className="text-[11px] text-studio-400 leading-relaxed">
                  Export multi-track MIDI file compatible with FL Studio, Ableton Live, Logic Pro, and all DAWs.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportMidi}
                className="w-full text-xs font-bold gap-1.5 shadow-sm"
              >
                <Download size={13} />
                <span>Export MIDI</span>
              </Button>
            </div>

            {/* Card 3: Audio WAV */}
            <div className="p-4 rounded-xl bg-studio-950/60 border border-studio-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3 group">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Volume2 size={18} />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-studio-800 text-studio-400">
                    .WAV
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Audio Master</h4>
                <p className="text-[11px] text-studio-400 leading-relaxed">
                  Render arrangement offline to pristine 16-bit 44.1kHz stereo audio ready for playback and streaming.
                </p>
              </div>

              <Button
                variant="accent"
                size="sm"
                onClick={handleExportWav}
                disabled={isRenderingWav}
                className="w-full text-xs font-bold gap-1.5 shadow-md shadow-indigo-500/20"
              >
                {isRenderingWav ? (
                  <>
                    <span className="animate-spin text-xs">...</span>
                    <span>Rendering WAV</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Render & Download</span>
                  </>
                )}
              </Button>
            </div>

          </div>

          {/* Import Section */}
          <div className="p-4 rounded-xl bg-studio-950/40 border border-dashed border-studio-750 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-studio-850 text-studio-300">
                <Upload size={18} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Import Project File</h5>
                <p className="text-[11px] text-studio-400">
                  Select or drop a previously exported <code className="text-indigo-400">.json</code> project file.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold gap-1.5 whitespace-nowrap"
              >
                <Upload size={13} />
                <span>Browse File</span>
              </Button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-studio-800 bg-studio-950 flex items-center justify-between text-xs text-studio-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            <span>Local file exchange &bull; Zero login or cloud accounts</span>
          </div>
          <button
            onClick={() => setShowExportModal(false)}
            className="px-3.5 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-white font-sans font-semibold transition-colors text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
