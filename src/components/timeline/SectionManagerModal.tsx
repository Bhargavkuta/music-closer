import React, { useState } from 'react';
import { X, Plus, ArrowUp, ArrowDown, Trash2, Bookmark } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { SectionType } from '../../types/project';

interface SectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SECTION_NAMES: SectionType[] = [
  'Intro',
  'Verse',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Drop',
  'Solo',
  'Outro'
];

export const SectionManagerModal: React.FC<SectionManagerModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, addSection, updateSection, reorderSections, deleteSection } = useProjectStore();
  const [selectedName, setSelectedName] = useState<string>('Chorus');
  const [customName, setCustomName] = useState<string>('');
  const [lengthBars, setLengthBars] = useState<number>(8);

  if (!isOpen) return null;

  const sections = currentProject.sections || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customName.trim() || selectedName;
    addSection(finalName, lengthBars);
    setCustomName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-studio-900 border border-studio-750 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-studio-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bookmark size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Song Structure & Sections</h2>
              <p className="text-xs text-studio-400">
                Organize Intro, Verse, Chorus, Bridge, and Outro markers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Sections List */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {sections.map((sec, index) => {
            const endBar = sec.startBar + sec.lengthBars - 1;

            return (
              <div
                key={sec.id}
                className="flex items-center justify-between p-2.5 bg-studio-950/70 border border-studio-800 rounded-xl gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: sec.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{sec.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-studio-850 text-studio-300 border border-studio-750">
                        Bars {sec.startBar} – {endBar}
                      </span>
                    </div>
                    <span className="text-[11px] text-studio-400 font-mono">
                      Length: {sec.lengthBars} bars
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Reorder Buttons */}
                  <button
                    disabled={index === 0}
                    onClick={() => reorderSections(index, index - 1)}
                    className="p-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move earlier"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    disabled={index === sections.length - 1}
                    onClick={() => reorderSections(index, index + 1)}
                    className="p-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Move later"
                  >
                    <ArrowDown size={13} />
                  </button>

                  {/* Length adjustments */}
                  <select
                    value={sec.lengthBars}
                    onChange={(e) => updateSection(sec.id, { lengthBars: Number(e.target.value) })}
                    className="bg-studio-850 border border-studio-750 rounded px-1.5 py-1 text-xs text-white font-mono"
                  >
                    <option value={2}>2b</option>
                    <option value={4}>4b</option>
                    <option value={8}>8b</option>
                    <option value={12}>12b</option>
                    <option value={16}>16b</option>
                  </select>

                  {/* Delete */}
                  {sections.length > 1 && (
                    <button
                      onClick={() => deleteSection(sec.id)}
                      className="p-1.5 rounded-lg text-studio-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete section"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Section Form */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-studio-800 flex flex-col gap-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Add Section
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_SECTION_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSelectedName(name);
                  setCustomName('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedName === name && !customName
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-studio-800 text-studio-300 hover:bg-studio-750'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Or custom section name..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 bg-studio-950 border border-studio-750 rounded-lg px-3 py-1.5 text-xs text-white placeholder-studio-500 focus:outline-none focus:border-amber-500"
            />

            <select
              value={lengthBars}
              onChange={(e) => setLengthBars(Number(e.target.value))}
              className="bg-studio-950 border border-studio-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            >
              <option value={4}>4 Bars</option>
              <option value={8}>8 Bars</option>
              <option value={12}>12 Bars</option>
              <option value={16}>16 Bars</option>
            </select>

            <button
              type="submit"
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-studio-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
