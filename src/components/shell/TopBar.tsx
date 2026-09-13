import React, { useState } from 'react';
import { Music, FolderPlus, FolderOpen, Save, Download, Sparkles, Volume2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { AudioEngine } from '../../audio/AudioEngine';

export const TopBar: React.FC = () => {
  const { 
    currentProject, 
    setProjectTitle, 
    saveCurrentProject, 
    isSaving 
  } = useProjectStore();
  const { isAudioReady, setShowOnboarding, setShowProjectManagerModal, setShowExportModal } = useUIStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(currentProject.title);
  const [justSaved, setJustSaved] = useState(false);

  const handleManualSave = async () => {
    await saveCurrentProject();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      setProjectTitle(titleInput.trim());
    } else {
      setTitleInput(currentProject.title);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitleInput(currentProject.title);
      setIsEditingTitle(false);
    }
  };

  const handleAudioInit = async () => {
    await AudioEngine.init();
  };

  return (
    <header className="h-14 bg-studio-900 border-b border-studio-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand & Onboarding trigger */}
      <div className="flex items-center gap-3">
        <div 
          onClick={() => setShowOnboarding(true)}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="About Music Closer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-accent-secondary flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Music size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-white via-studio-100 to-studio-400 bg-clip-text text-transparent font-sans">
              MUSIC CLOSER
            </span>
            <span className="text-[10px] text-studio-400 tracking-wider font-mono uppercase">
              Studio v1.0
            </span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-studio-800 mx-1 hidden sm:block" />

        {/* Project Actions */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowProjectManagerModal(true)}
            title="Create New Project"
            className="text-xs gap-1.5"
          >
            <FolderPlus size={14} />
            <span>New</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowProjectManagerModal(true)}
            title="Open Project Manager"
            className="text-xs gap-1.5"
          >
            <FolderOpen size={14} />
            <span>Open</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleManualSave}
            title="Save Project to Browser (IndexedDB)"
            className="text-xs gap-1.5 text-studio-300 hover:text-white"
          >
            <Save size={14} className={isSaving ? 'animate-pulse text-amber-400' : ''} />
            <span>{isSaving ? 'Saving...' : justSaved ? 'Saved!' : 'Save'}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowExportModal(true)}
            title="Export Audio/MIDI/Project"
            className="text-xs gap-1.5"
          >
            <Download size={14} />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Center: Project Name */}
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            autoFocus
            className="bg-studio-950 border border-indigo-500 rounded-md px-3 py-1 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-48 text-center"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(currentProject.title);
              setIsEditingTitle(true);
            }}
            className="text-xs font-semibold text-studio-200 hover:text-white hover:bg-studio-800/80 px-3 py-1 rounded-md transition-colors border border-transparent hover:border-studio-700 font-mono flex items-center gap-1.5"
            title="Click to rename project"
          >
            <span>{currentProject.title}</span>
          </button>
        )}

        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-studio-950 border border-studio-800 text-[10px] font-mono text-studio-400">
          <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span>{isSaving ? 'Saving' : 'Auto-saved'}</span>
        </div>
      </div>

      {/* Right: Audio Engine Status & Quick Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleAudioInit}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
            isAudioReady
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50 shadow-sm'
              : 'bg-amber-950/30 text-amber-300 border-amber-800/50 hover:bg-amber-900/40 animate-pulse'
          }`}
          title={isAudioReady ? 'Audio Engine Active' : 'Click to activate Audio Context'}
        >
          <span className={`w-2 h-2 rounded-full ${isAudioReady ? 'bg-emerald-400 shadow-glow-emerald' : 'bg-amber-400'}`} />
          <span className="hidden md:inline font-mono text-[11px]">
            {isAudioReady ? 'AUDIO ENGINE ACTIVE' : 'CLICK TO ENABLE AUDIO'}
          </span>
          <Volume2 size={13} />
        </button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowOnboarding(true)}
          className="text-xs gap-1.5 hidden md:flex"
        >
          <Sparkles size={13} className="text-accent-primary" />
          <span>Guide</span>
        </Button>
      </div>
    </header>
  );
};
