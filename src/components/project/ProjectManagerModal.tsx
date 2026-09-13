import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FolderPlus, 
  Copy, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock, 
  Layers, 
  HardDrive,
  Sparkles
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';
import { ProjectData } from '../../types/project';
import { saveProjectToDB } from '../../storage/projectStorage';

export const ProjectManagerModal: React.FC = () => {
  const { 
    currentProject, 
    savedProjectsList, 
    loadProjectById, 
    createNewProject, 
    duplicateProject, 
    deleteProject, 
    setProjectTitle,
    refreshSavedProjectsList 
  } = useProjectStore();

  const { showProjectManagerModal, setShowProjectManagerModal } = useUIStore();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState<'starter' | 'blank'>('starter');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (showProjectManagerModal) {
      refreshSavedProjectsList();
    }
  }, [showProjectManagerModal, refreshSavedProjectsList]);

  if (!showProjectManagerModal) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'Untitled Project';
    await createNewProject(title, newTemplate);
    setIsCreatingNew(false);
    setNewTitle('');
    setShowProjectManagerModal(false);
  };

  const handleRenameSubmit = async (id: string) => {
    if (editingTitle.trim()) {
      if (currentProject.id === id) {
        setProjectTitle(editingTitle.trim());
      }
      // If editing another project in the list, update it in DB
      const target = savedProjectsList.find(p => p.id === id);
      if (target && currentProject.id !== id) {
        target.title = editingTitle.trim();
        await saveProjectToDB(target);
        await refreshSavedProjectsList();
      }
    }
    setEditingProjectId(null);
    setEditingTitle('');
  };

  const formatDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-studio-900 border border-studio-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-studio-800 flex items-center justify-between bg-studio-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Project Manager
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-studio-800 text-studio-300">
                  {savedProjectsList.length} Saved Projects
                </span>
              </h3>
              <p className="text-xs text-studio-400">
                Manage, duplicate, open, and create local projects stored directly in your browser.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowProjectManagerModal(false)}
            className="p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar / Create New Banner */}
        <div className="p-3 bg-studio-950/80 border-b border-studio-800/80 flex items-center justify-between">
          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <FolderPlus size={14} />
            <span>New Project</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-studio-400 font-mono">
            <HardDrive size={13} className="text-emerald-400" />
            <span>IndexedDB Local-First Storage Active</span>
          </div>
        </div>

        {/* Inline Create Dialog */}
        {isCreatingNew && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-studio-950 border-b border-studio-800 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-mono">Create New Project</span>
              <button 
                type="button" 
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-studio-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Project Title (e.g. Midnight Chill)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className="flex-1 bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full"
              />

              <select
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value as 'starter' | 'blank')}
                className="bg-studio-900 border border-studio-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="starter">Starter Template (4 Tracks & Groove)</option>
                <option value="blank">Blank Template (Empty Track)</option>
              </select>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shrink-0"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Projects List */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2.5">
          {savedProjectsList.map((proj: ProjectData) => {
            const isActive = proj.id === currentProject.id;
            const isEditing = editingProjectId === proj.id;

            return (
              <div
                key={proj.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-studio-850 border-indigo-500/70 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-studio-950/60 border-studio-800/80 hover:bg-studio-850/60 hover:border-studio-750'
                }`}
              >
                {/* Project Details */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(proj.id);
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                          autoFocus
                          className="bg-studio-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none"
                        />
                        <button
                          onClick={() => handleRenameSubmit(proj.id)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-bold text-white truncate">
                          {proj.title}
                        </h4>
                        <button
                          onClick={() => {
                            setEditingProjectId(proj.id);
                            setEditingTitle(proj.title);
                          }}
                          className="text-studio-400 hover:text-white p-0.5 rounded transition-colors"
                          title="Rename project"
                        >
                          <Edit3 size={12} />
                        </button>
                      </>
                    )}

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        Active Project
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-studio-400 font-mono mt-0.5">
                    <span className="flex items-center gap-1">
                      <Layers size={11} />
                      {proj.tracks?.length || 0} Tracks
                    </span>
                    <span>&bull;</span>
                    <span>{proj.bpm || 120} BPM</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDate(proj.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {!isActive && (
                    <button
                      onClick={async () => {
                        await loadProjectById(proj.id);
                        setShowProjectManagerModal(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow"
                    >
                      Open
                    </button>
                  )}

                  <button
                    onClick={() => duplicateProject(proj.id)}
                    className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white transition-colors"
                    title="Duplicate project copy"
                  >
                    <Copy size={13} />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${proj.title}"?`)) {
                        deleteProject(proj.id);
                      }
                    }}
                    disabled={savedProjectsList.length <= 1}
                    className={`p-1.5 rounded-lg transition-colors ${
                      savedProjectsList.length <= 1
                        ? 'text-studio-600 cursor-not-allowed'
                        : 'bg-studio-800 hover:bg-red-900/60 text-studio-400 hover:text-red-300'
                    }`}
                    title={savedProjectsList.length <= 1 ? 'Cannot delete the only project' : 'Delete project'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-studio-800/80 bg-studio-950 flex items-center justify-between text-xs text-studio-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            <span>Zero authentication &bull; Survives browser reload</span>
          </div>
          <button
            onClick={() => setShowProjectManagerModal(false)}
            className="px-3 py-1 rounded-lg bg-studio-800 hover:bg-studio-700 text-white font-sans font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
