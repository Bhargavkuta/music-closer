import React, { useEffect } from 'react';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { BottomBar } from './BottomBar';
import { OnboardingModal } from './OnboardingModal';
import { PianoKeyboard } from '../piano/PianoKeyboard';
import { OctaveControls } from '../piano/OctaveControls';
import { RecordingPreviewBar } from '../piano/RecordingPreviewBar';
import { PianoRoll } from '../pianoRoll/PianoRoll';
import { DrumMachine } from '../drums/DrumMachine';
import { TrackManagerBar } from '../tracks/TrackManagerBar';
import { ArrangementTimeline } from '../timeline/ArrangementTimeline';
import { ChordScaleAssistant } from '../chords/ChordScaleAssistant';
import { MixerPanel } from '../mixer/MixerPanel';
import { ProjectManagerModal } from '../project/ProjectManagerModal';
import { ExportModal } from '../project/ExportModal';
import { Sparkles, Music4, Piano, Grid, Disc, ListMusic, Sliders } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useProjectStore } from '../../store/projectStore';

export const AppShell: React.FC = () => {
  const { activeInstrument, workspaceTab, setWorkspaceTab, showTheoryPanel } = useUIStore();
  const { initPersistence } = useProjectStore();

  useEffect(() => {
    initPersistence();
  }, [initPersistence]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-studio-950 text-studio-100 font-sans">
      {/* Top Bar */}
      <TopBar />

      {/* Main Workspace Area (Left Sidebar + Center Content) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Navigation Sidebar */}
        <LeftSidebar />

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col justify-between p-3 md:p-5 overflow-y-auto bg-gradient-to-b from-studio-950 via-studio-900/60 to-studio-950">
          {/* Studio Header Banner & View Switcher */}
          <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Music4 size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white capitalize flex items-center gap-2">
                  {workspaceTab === 'drums' 
                    ? 'Drum Sequencer' 
                    : workspaceTab === 'arrangement'
                    ? 'Song Arranger Timeline'
                    : workspaceTab === 'mixer'
                    ? 'Studio Mixer & FX'
                    : `${activeInstrument} Workspace`}
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950/70 text-indigo-400 border border-indigo-800/50">
                    Phase 9 Complete
                  </span>
                </h2>
                <p className="text-xs text-studio-400">
                  {workspaceTab === 'keyboard'
                    ? 'Play with computer keyboard (A-J) or mouse & record live takes.'
                    : workspaceTab === 'pianoroll'
                    ? 'Click to draw notes, drag to move/resize, and quantize grid timing.'
                    : workspaceTab === 'drums'
                    ? '16-step pattern drum machine for Kick, Snare, Hi-Hats, Clap, and Tom.'
                    : workspaceTab === 'arrangement'
                    ? 'Place pattern clips across tracks and structure Intro, Verse, Chorus, and Outro sections.'
                    : 'Channel strips with 3-band EQ, gain faders, pan, and real-time peak metering.'}
                </p>
              </div>
            </div>

            {/* View Switcher Tabs: [Instrument] vs [Piano Roll] vs [Drums] vs [Arranger] vs [Mixer] vs [Play Along] */}
            <div className="flex items-center bg-studio-950 p-1 rounded-xl border border-studio-800 shadow-lg gap-1">
              <button
                onClick={() => setWorkspaceTab('keyboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workspaceTab === 'keyboard'
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'text-studio-400 hover:text-white hover:bg-studio-850'
                }`}
                title="Switch to Interactive Virtual Instrument Keyboard"
              >
                <Piano size={14} />
                <span>Instrument</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('pianoroll')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workspaceTab === 'pianoroll'
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'text-studio-400 hover:text-white hover:bg-studio-850'
                }`}
                title="Switch to Piano Roll Note Editor"
              >
                <Grid size={14} />
                <span>Piano Roll</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('drums')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workspaceTab === 'drums'
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'text-studio-400 hover:text-white hover:bg-studio-850'
                }`}
                title="Switch to 16-step Drum Machine"
              >
                <Disc size={14} />
                <span>Drums</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('arrangement')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workspaceTab === 'arrangement'
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'text-studio-400 hover:text-white hover:bg-studio-850'
                }`}
                title="Switch to Multi-Track Song Arranger"
              >
                <ListMusic size={14} />
                <span>Arranger</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('mixer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  workspaceTab === 'mixer'
                    ? 'bg-accent-primary text-white shadow-md'
                    : 'text-studio-400 hover:text-white hover:bg-studio-850'
                }`}
                title="Switch to Studio Multi-Track Mixer & FX Console"
              >
                <Sliders size={14} />
                <span>Mixer</span>
              </button>
            </div>
          </div>

          {/* Dynamic Track Manager Bar */}
          <TrackManagerBar />

          {/* Central Section (Recording Bar + Workspace View) */}
          <div className="w-full flex flex-col items-center justify-center my-auto py-1 gap-3">
            {/* Live Take Status & Recording Strip */}
            <RecordingPreviewBar />

            {/* Phase 6: Chords, Scales & Progression Assistant */}
            {showTheoryPanel && (
              <div className="w-full max-w-5xl">
                <ChordScaleAssistant />
              </div>
            )}

            {/* View 1: Virtual Keyboard with Octave Controls */}
            {workspaceTab === 'keyboard' && (
              <div className="w-full flex flex-col items-center gap-3 animate-in fade-in duration-200">
                <div className="w-full max-w-5xl">
                  <OctaveControls />
                </div>
                <PianoKeyboard />
              </div>
            )}

            {/* View 2: Interactive DAW Piano Roll */}
            {workspaceTab === 'pianoroll' && (
              <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in duration-200">
                <PianoRoll />
              </div>
            )}

            {/* View 3: 16-step Drum Machine Sequencer */}
            {workspaceTab === 'drums' && (
              <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in duration-200">
                <DrumMachine />
              </div>
            )}

            {/* View 4: Song Arrangement Timeline */}
            {workspaceTab === 'arrangement' && (
              <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in duration-200">
                <ArrangementTimeline />
              </div>
            )}

            {/* View 5: Multi-Track Studio Mixer & FX Console */}
            {workspaceTab === 'mixer' && (
              <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-200">
                <MixerPanel />
              </div>
            )}
          </div>

          {/* Quick chords / inspirational hints bar */}
          <div className="w-full max-w-5xl mx-auto mt-2 p-2.5 bg-studio-900/60 border border-studio-800/80 rounded-xl flex items-center justify-between text-xs text-studio-400 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-studio-300 uppercase tracking-wider text-[11px] font-mono">
                {workspaceTab === 'drums' ? 'Drums:' : workspaceTab === 'keyboard' ? 'Key Shortcuts:' : 'Piano Roll:'}
              </span>
              <div className="flex items-center gap-2">
                {workspaceTab === 'drums' ? (
                  <>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      16 Steps Loop
                    </span>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      Kick &bull; Snare &bull; Hats &bull; Clap &bull; Tom
                    </span>
                  </>
                ) : workspaceTab === 'keyboard' ? (
                  <>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      Space: Play/Pause
                    </span>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      A-J: Keys
                    </span>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      Z / X: Octaves
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      Click: Add Note
                    </span>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      Drag Edge: Resize
                    </span>
                    <span className="px-2 py-0.5 bg-studio-850 rounded text-studio-200 font-mono border border-studio-700/50">
                      Right-Click: Delete
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-studio-500 font-mono text-[11px]">
              <Sparkles size={12} className="text-amber-400" />
              <span>Multi-Track Polyphony Active</span>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Transport Bar */}
      <BottomBar />

      {/* Onboarding Welcome Modal */}
      <OnboardingModal />

      {/* Local Project Manager Modal */}
      <ProjectManagerModal />

      {/* Phase 9: Project Export & Share Modal */}
      <ExportModal />
    </div>
  );
};
