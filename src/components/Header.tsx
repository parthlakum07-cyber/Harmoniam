import React from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import type { InstrumentType } from '../audio/AudioEngine';

interface HeaderProps {
  isAudioReady: boolean;
  instrument: InstrumentType;
  onInstrumentChange: (inst: InstrumentType) => void;
  onStartAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAudioReady,
  instrument,
  onInstrumentChange,
  onStartAudio,
}) => {
  return (
    <header className="w-full py-4 px-6 flex flex-col sm:flex-row items-center justify-between border-b border-amber-900/30 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Branding & Active Instrument Display */}
      <div className="flex items-center gap-3 text-center sm:text-left mb-2 sm:mb-0">
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center border shadow-md text-xl transition-all duration-300 ${
            instrument === 'piano'
              ? 'bg-gradient-to-br from-cyan-800 via-sky-900 to-zinc-950 border-cyan-500/50 text-cyan-200'
              : 'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border-amber-600/40 text-amber-200'
          }`}
        >
          {instrument === 'harmonium' ? '🎵' : '🎹'}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-wider text-amber-100 flex items-center gap-2">
            HARMONIAN
          </h1>
          <p className="text-xs font-sans tracking-wide transition-colors duration-300">
            {instrument === 'harmonium' ? (
              <span className="text-amber-200/70 font-semibold">🎵 HARMONIUM MODE</span>
            ) : (
              <span className="text-cyan-300/90 font-bold tracking-widest">🎹 BRIGHT PIANO MODE</span>
            )}
          </p>
        </div>
      </div>

      {/* Instrument Switcher & Audio Control */}
      <div className="flex items-center gap-4">
        {/* Instrument Switcher */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-lg border border-amber-900/40 shadow-inner">
          <button
            onClick={() => onInstrumentChange('harmonium')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              instrument === 'harmonium'
                ? 'bg-amber-600 text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-amber-200 hover:bg-zinc-800/60'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            HARMONIUM
          </button>
          <button
            onClick={() => onInstrumentChange('piano')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
              instrument === 'piano'
                ? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-950/50'
                : 'text-zinc-400 hover:text-cyan-200 hover:bg-zinc-800/60'
            }`}
          >
            <span>🎹</span>
            PIANO
          </button>
        </div>

        {!isAudioReady ? (
          <button
            onClick={onStartAudio}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow-md border border-amber-400/40 transition-all cursor-pointer"
          >
            <VolumeX className="w-4 h-4" />
            Click to Start
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 border border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            Audio Ready
          </div>
        )}
      </div>
    </header>
  );
};
