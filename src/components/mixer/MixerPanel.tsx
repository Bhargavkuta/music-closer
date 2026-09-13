import React, { useEffect, useState, useRef } from 'react';
import { 
  Sliders, 
  Volume2, 
  VolumeX, 
  Plus, 
  Sparkles, 
  Piano, 
  Radio, 
  Guitar, 
  Layers, 
  Disc,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useUIStore } from '../../store/uiStore';
import { TrackData } from '../../types/project';
import { InstrumentType } from '../../types/audio';
import { AudioEngine, volumeToDb } from '../../audio/AudioEngine';

export const MixerPanel: React.FC = () => {
  const { 
    currentProject, 
    activeTrackId, 
    setActiveTrackId, 
    setTrackVolume, 
    setTrackPan, 
    toggleTrackMute, 
    toggleTrackSolo, 
    setTrackEq,
    setMasterFx,
    createTrack 
  } = useProjectStore();

  const { setWorkspaceTab } = useUIStore();

  // Peak Meter Levels (0.0 to 1.0) updated via RAF
  const [peakLevels, setPeakLevels] = useState<Record<string, number>>({});
  const [masterPeak, setMasterPeak] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const pollMeters = () => {
      if (!active) return;

      const levels: Record<string, number> = {};
      currentProject.tracks.forEach(track => {
        levels[track.id] = AudioEngine.getTrackPeakLevel(track.id);
      });
      setPeakLevels(levels);
      setMasterPeak(AudioEngine.getMasterPeakLevel());

      rafRef.current = requestAnimationFrame(pollMeters);
    };

    rafRef.current = requestAnimationFrame(pollMeters);

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentProject.tracks]);

  const masterFx = currentProject.masterFx || {
    volume: 1.0,
    pan: 0,
    isMuted: false,
    reverbWet: 0.15,
    delayWet: 0.0,
    limiterActive: true
  };

  const getInstrumentIcon = (inst: InstrumentType) => {
    switch (inst) {
      case 'piano': return <Piano size={13} />;
      case 'bass': return <Radio size={13} />;
      case 'guitar': return <Guitar size={13} />;
      case 'synth': return <Layers size={13} />;
      case 'drums': return <Disc size={13} />;
    }
  };

  const formatDb = (vol: number) => {
    const db = volumeToDb(vol);
    if (db <= -60) return '-∞ dB';
    const sign = db > 0 ? '+' : '';
    return `${sign}${db.toFixed(1)} dB`;
  };

  // Helper to render LED meter bars
  const renderMeter = (level: number) => {
    const segments = 14;
    const activeSegments = Math.round(level * segments);

    return (
      <div className="w-2.5 h-36 bg-studio-950/90 rounded border border-studio-800 flex flex-col-reverse p-0.5 gap-0.5 select-none overflow-hidden">
        {Array.from({ length: segments }).map((_, i) => {
          const isActive = i < activeSegments;
          let color = 'bg-emerald-500';
          if (i >= 12) color = 'bg-red-500';
          else if (i >= 9) color = 'bg-amber-400';

          return (
            <div
              key={i}
              className={`w-full flex-1 rounded-[1px] transition-opacity duration-75 ${
                isActive ? `${color} opacity-100 shadow-sm` : 'bg-studio-800/30 opacity-20'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 bg-studio-950/90 border border-studio-800/90 rounded-2xl p-4 md:p-5 shadow-2xl animate-in fade-in duration-200">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-studio-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Studio Multi-Track Mixer & FX Console
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                Phase 7 Mixer
              </span>
            </h2>
            <p className="text-xs text-studio-400">
              High-precision channel strips with 3-band EQ, gain faders, pan, solo/mute arbitration, and real-time peak metering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => createTrack('New Synth', 'synth')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-850 hover:bg-studio-800 text-studio-200 hover:text-white border border-studio-700 text-xs font-semibold transition-all shadow-sm"
            title="Add a new channel track to the mixer"
          >
            <Plus size={13} />
            <span>Add Track</span>
          </button>

          <button
            onClick={() => setWorkspaceTab('arrangement')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow"
          >
            <span>Back to Arranger</span>
          </button>
        </div>
      </div>

      {/* 2. Console Rack Container */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 select-none">
        
        {/* Track Channel Strips */}
        <div className="flex items-stretch gap-2.5">
          {currentProject.tracks.map((track: TrackData, idx: number) => {
            const isSelected = track.id === activeTrackId;
            const trackPeak = peakLevels[track.id] || 0;
            const eq = track.eq || { low: 0, mid: 0, high: 0 };

            return (
              <div
                key={track.id}
                onClick={() => setActiveTrackId(track.id)}
                className={`w-36 shrink-0 rounded-xl border flex flex-col justify-between p-2.5 transition-all relative ${
                  isSelected
                    ? 'bg-studio-900 border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/30'
                    : 'bg-studio-900/60 border-studio-800/80 hover:border-studio-700 hover:bg-studio-850/60'
                }`}
              >
                {/* Track Color Top Accent Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
                  style={{ backgroundColor: track.color }}
                />

                {/* Channel Header */}
                <div className="mt-1 flex flex-col gap-1 text-center">
                  <div className="flex items-center justify-between text-[10px] font-mono text-studio-400">
                    <span>CH {idx + 1}</span>
                    <div 
                      className="p-1 rounded flex items-center gap-1"
                      style={{ color: track.color }}
                    >
                      {getInstrumentIcon(track.instrument)}
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate text-left" title={track.name}>
                    {track.name}
                  </h4>
                </div>

                {/* 3-Band EQ & FX Strip */}
                <div className="my-2 p-2 rounded-lg bg-studio-950/60 border border-studio-800/60 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-studio-400">
                    <span>EQ / TONE</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrackEq(track.id, { low: 0, mid: 0, high: 0 });
                      }}
                      className="text-studio-500 hover:text-white"
                      title="Reset EQ"
                    >
                      <RotateCcw size={9} />
                    </button>
                  </div>

                  {/* High EQ */}
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-studio-400">HI</span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={eq.high}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setTrackEq(track.id, { high: parseFloat(e.target.value) })}
                      className="w-16 h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                    <span className="text-[8px] text-studio-400 w-5 text-right">
                      {eq.high > 0 ? `+${eq.high}` : eq.high}
                    </span>
                  </div>

                  {/* Mid EQ */}
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-studio-400">MID</span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={eq.mid}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setTrackEq(track.id, { mid: parseFloat(e.target.value) })}
                      className="w-16 h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                    <span className="text-[8px] text-studio-400 w-5 text-right">
                      {eq.mid > 0 ? `+${eq.mid}` : eq.mid}
                    </span>
                  </div>

                  {/* Low EQ */}
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-studio-400">LOW</span>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={eq.low}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setTrackEq(track.id, { low: parseFloat(e.target.value) })}
                      className="w-16 h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                    <span className="text-[8px] text-studio-400 w-5 text-right">
                      {eq.low > 0 ? `+${eq.low}` : eq.low}
                    </span>
                  </div>
                </div>

                {/* Pan Slider */}
                <div className="my-1.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[9px] font-mono text-studio-400">
                    <span>PAN</span>
                    <span className="text-white font-bold">
                      {track.pan === 0 
                        ? 'C' 
                        : track.pan < 0 
                        ? `L${Math.round(Math.abs(track.pan) * 100)}` 
                        : `R${Math.round(track.pan * 100)}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={track.pan}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-studio-950 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Mute & Solo Buttons */}
                <div className="flex items-center gap-1.5 my-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackMute(track.id);
                    }}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all border ${
                      track.isMuted
                        ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30'
                        : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white hover:border-studio-700'
                    }`}
                    title="Mute track"
                  >
                    M
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrackSolo(track.id);
                    }}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all border ${
                      track.isSoloed
                        ? 'bg-amber-500 border-amber-400 text-black shadow-md shadow-amber-500/30'
                        : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white hover:border-studio-700'
                    }`}
                    title="Solo track"
                  >
                    S
                  </button>
                </div>

                {/* Fader & Meter Section */}
                <div className="flex items-center justify-center gap-2.5 my-2">
                  {/* Vertical Fader */}
                  <div className="flex flex-col items-center gap-1">
                    <input
                      type="range"
                      min="0"
                      max="1.25"
                      step="0.01"
                      value={track.volume}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                      className="w-28 h-2 bg-studio-950 rounded cursor-pointer accent-indigo-500 -rotate-90 origin-center my-12"
                      style={{ width: '120px' }}
                    />
                  </div>

                  {/* Peak LED Meter */}
                  {renderMeter(trackPeak)}
                </div>

                {/* dB Readout Footer */}
                <div className="pt-2 border-t border-studio-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-studio-400">{Math.round(track.volume * 100)}%</span>
                  <span className="font-bold text-white">{formatDb(track.volume)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Bus Channel Strip (Fixed / Highlighted on the right) */}
        <div className="w-44 shrink-0 rounded-xl border border-amber-500/50 bg-gradient-to-b from-studio-900 via-studio-925 to-studio-950 flex flex-col justify-between p-3 shadow-2xl relative">
          {/* Master Gold Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl bg-amber-500" />

          {/* Master Header */}
          <div className="mt-1 flex flex-col gap-1 text-center">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold">
              <span>MAIN OUTPUT</span>
              <ShieldCheck size={14} className="text-amber-400" />
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider text-left">
              Master Bus
            </h4>
          </div>

          {/* Master FX Controls: Reverb & Delay Sends */}
          <div className="my-2 p-2.5 rounded-lg bg-studio-950/80 border border-amber-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[9px] font-mono text-amber-300 font-bold">
              <span>MASTER FX RACK</span>
              <Sparkles size={11} className="text-amber-400" />
            </div>

            {/* Reverb Send */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[9px] font-mono text-studio-400">
                <span>REVERB</span>
                <span className="text-white font-bold">{Math.round(masterFx.reverbWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                value={masterFx.reverbWet}
                onChange={(e) => setMasterFx({ reverbWet: parseFloat(e.target.value) })}
                className="w-full h-1 bg-studio-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Delay Send */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[9px] font-mono text-studio-400">
                <span>DELAY (8n)</span>
                <span className="text-white font-bold">{Math.round(masterFx.delayWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                value={masterFx.delayWet}
                onChange={(e) => setMasterFx({ delayWet: parseFloat(e.target.value) })}
                className="w-full h-1 bg-studio-800 rounded appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Limiter / Compressor Badge */}
            <div className="flex items-center justify-between pt-1 border-t border-studio-850 text-[9px] font-mono text-studio-400">
              <span>LIMITER:</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>

          {/* Master Mute & Balance */}
          <div className="flex items-center gap-2 my-1">
            <button
              onClick={() => setMasterFx({ isMuted: !masterFx.isMuted })}
              className={`flex-1 py-1 rounded text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all border ${
                masterFx.isMuted
                  ? 'bg-red-600 border-red-500 text-white shadow-md'
                  : 'bg-studio-950 border-studio-800 text-studio-300 hover:text-white hover:border-studio-700'
              }`}
              title="Mute Master Output"
            >
              {masterFx.isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span>{masterFx.isMuted ? 'MUTED' : 'MUTE'}</span>
            </button>
          </div>

          {/* Master Fader & Stereo Peak Meters */}
          <div className="flex items-center justify-center gap-3 my-2">
            {/* Master Fader */}
            <div className="flex flex-col items-center gap-1">
              <input
                type="range"
                min="0"
                max="1.25"
                step="0.01"
                value={masterFx.volume}
                onChange={(e) => setMasterFx({ volume: parseFloat(e.target.value) })}
                className="w-28 h-2 bg-studio-950 rounded cursor-pointer accent-amber-400 -rotate-90 origin-center my-12"
                style={{ width: '120px' }}
              />
            </div>

            {/* Master Stereo Meters (L and R) */}
            <div className="flex items-center gap-1">
              {renderMeter(masterPeak)}
              {renderMeter(masterPeak * 0.95)}
            </div>
          </div>

          {/* Master Output Footer */}
          <div className="pt-2 border-t border-studio-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-amber-400 font-bold">{Math.round(masterFx.volume * 100)}%</span>
            <span className="font-bold text-white">{formatDb(masterFx.volume)}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
