import React from 'react';
import { Sparkles, Music, Play, Layers, X, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { AudioEngine } from '../../audio/AudioEngine';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, setShowOnboarding, setWorkspaceTab } = useUIStore();

  if (!showOnboarding) return null;

  const handlePlayInstrument = async () => {
    await AudioEngine.init();
    setWorkspaceTab('keyboard');
    setShowOnboarding(false);
  };

  const handleCreateSong = async () => {
    await AudioEngine.init();
    setWorkspaceTab('arrangement');
    setShowOnboarding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-studio-900 via-studio-900 to-studio-950 border border-studio-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-center">
        {/* Close button */}
        <button
          onClick={() => setShowOnboarding(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-accent-secondary flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Music size={32} className="text-white" />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to Music Closer 🎵
            </h1>
            <p className="text-sm sm:text-base text-studio-300 font-medium italic">
              "Play something. Create something. Stay close to music."
            </p>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-studio-950/80 rounded-xl border border-studio-800/80 text-left">
          <div className="flex flex-col gap-1 p-2">
            <Sparkles size={18} className="text-indigo-400" />
            <span className="text-xs font-semibold text-white">Instant Sound</span>
            <span className="text-[10px] text-studio-400">Zero-latency polyphonic acoustic engine.</span>
          </div>

          <div className="flex flex-col gap-1 p-2">
            <Layers size={18} className="text-accent-secondary" />
            <span className="text-xs font-semibold text-white">Keyboard Controls</span>
            <span className="text-[10px] text-studio-400">Play naturally with your PC keyboard.</span>
          </div>

          <div className="flex flex-col gap-1 p-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white">100% Local</span>
            <span className="text-[10px] text-studio-400">No account, login, or cloud required.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="accent"
            onClick={handlePlayInstrument}
            className="w-full sm:w-auto font-bold gap-2 text-sm shadow-indigo-500/30"
          >
            <Play size={16} className="fill-current" />
            <span>Play an Instrument</span>
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={handleCreateSong}
            className="w-full sm:w-auto text-sm font-semibold"
          >
            <span>Create a Song</span>
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={() => {
              setWorkspaceTab('keyboard');
              setShowOnboarding(false);
            }}
            className="w-full sm:w-auto text-sm text-studio-400 hover:text-white"
          >
            <span>Explore</span>
          </Button>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-studio-500 font-mono">
          No sign up required &bull; Works completely in your browser
        </div>
      </div>
    </div>
  );
};
