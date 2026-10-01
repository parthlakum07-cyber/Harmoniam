import React from 'react';
import type { InstrumentType, SoundPreset } from '../audio/AudioEngine';

interface PianoKeyProps {
  note: string;
  octave: number;
  keyboardKey?: string;
  isBlack: boolean;
  isActive: boolean;
  isComfortMode?: boolean;
  instrument?: InstrumentType;
  soundPreset?: SoundPreset;
  onPlay: (note: string, octave: number) => void;
  onStop: (note: string, octave: number) => void;
}

export const PianoKey: React.FC<PianoKeyProps> = ({
  note,
  octave,
  keyboardKey,
  isBlack,
  isActive,
  isComfortMode = true,
  instrument = 'harmonium',
  soundPreset = 'bright_piano',
  onPlay,
  onStop,
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onPlay(note, octave);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    onStop(note, octave);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isActive) {
      onStop(note, octave);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onPlay(note, octave);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onStop(note, octave);
  };

  const isPiano = instrument === 'piano';

  // Active Key Glow Classes per preset
  const getActiveBlackClass = () => {
    if (!isPiano) return 'key-black-active';
    if (soundPreset === 'bright_piano') return 'key-piano-black-active';
    if (soundPreset === 'strings') return 'key-strings-black-active';
    return 'key-flute-black-active';
  };

  const getActiveWhiteClass = () => {
    if (!isPiano) return 'key-white-active';
    if (soundPreset === 'bright_piano') return 'key-piano-white-active';
    if (soundPreset === 'strings') return 'key-strings-white-active';
    return 'key-flute-white-active';
  };

  if (isBlack) {
    const widthClass = isComfortMode
      ? 'w-7 sm:w-8.5 md:w-10 h-26 sm:h-30 md:h-34 -mx-3.5 sm:-mx-4 md:-mx-5'
      : 'w-5 sm:w-7 md:w-8 h-22 sm:h-26 md:h-28 -mx-2.5 sm:-mx-3.5 md:-mx-4';

    return (
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative z-10 rounded-b-md cursor-pointer transition-all duration-75 flex flex-col justify-between items-center py-2 select-none border border-zinc-900 shadow-xl ${widthClass} ${
          isActive
            ? getActiveBlackClass()
            : 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 hover:from-zinc-700 hover:to-zinc-900'
        }`}
      >
        <span className={`text-[9px] sm:text-[10px] font-bold ${
          !isPiano ? 'text-amber-200/80' : soundPreset === 'bright_piano' ? 'text-sky-200/80' : soundPreset === 'strings' ? 'text-emerald-200/80' : 'text-teal-200/80'
        }`}>
          {note}
        </span>
        {keyboardKey && (
          <span className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded bg-zinc-950 text-[10px] sm:text-xs font-mono font-black flex items-center justify-center shadow-md uppercase ${
            !isPiano
              ? 'border border-amber-500/60 text-amber-300'
              : soundPreset === 'bright_piano'
              ? 'border border-sky-500/60 text-sky-300'
              : soundPreset === 'strings'
              ? 'border border-emerald-500/60 text-emerald-300'
              : 'border border-teal-500/60 text-teal-300'
          }`}>
            {keyboardKey}
          </span>
        )}
      </div>
    );
  }

  const whiteWidthClass = isComfortMode
    ? 'w-10 sm:w-12 md:w-14 h-40 sm:h-48 md:h-56'
    : 'w-8 sm:w-10 md:w-12 h-34 sm:h-40 md:h-46';

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`${whiteWidthClass} rounded-b-lg cursor-pointer transition-all duration-75 flex flex-col justify-between items-center py-2 sm:py-3.5 select-none border-x border-b border-amber-900/30 shadow-sm ${
        isActive
          ? getActiveWhiteClass()
          : 'bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100/90 text-zinc-900 hover:from-white hover:to-stone-200'
      }`}
    >
      <span className={`text-[10px] sm:text-xs font-bold ${
        isActive
          ? !isPiano ? 'text-amber-950 font-bold' : soundPreset === 'bright_piano' ? 'text-sky-950 font-bold' : soundPreset === 'strings' ? 'text-emerald-950 font-bold' : 'text-teal-950 font-bold'
          : 'text-zinc-700'
      }`}>
        {note}{octave}
      </span>
      {keyboardKey && (
        <span className={`w-5 h-5 sm:w-6.5 sm:h-6.5 rounded border text-xs font-mono font-black flex items-center justify-center shadow-md uppercase ${
          isActive
            ? !isPiano
              ? 'bg-amber-900 text-amber-100 border-amber-500'
              : soundPreset === 'bright_piano'
              ? 'bg-sky-900 text-sky-100 border-sky-400'
              : soundPreset === 'strings'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-400'
              : 'bg-teal-900 text-teal-100 border-teal-400'
            : !isPiano
              ? 'bg-zinc-900 text-amber-300 border-zinc-700'
              : soundPreset === 'bright_piano'
              ? 'bg-zinc-900 text-sky-300 border-zinc-700'
              : soundPreset === 'strings'
              ? 'bg-zinc-900 text-emerald-300 border-zinc-700'
              : 'bg-zinc-900 text-teal-300 border-zinc-700'
        }`}>
          {keyboardKey}
        </span>
      )}
    </div>
  );
};
