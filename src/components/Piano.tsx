import React from 'react';
import { PianoKey } from './PianoKey';
import { Music, Wind, Sliders } from 'lucide-react';
import type { InstrumentType, SoundPreset } from '../audio/AudioEngine';

export type KeyMapPreset = 'daw_2handed' | 'home_row';

interface PianoProps {
  currentOctave: number; // Base center octave (e.g. 4)
  activeNotes: Set<string>;
  isSustainActive: boolean;
  isComfortMode: boolean;
  keyMapPreset: KeyMapPreset;
  instrument: InstrumentType;
  soundPreset: SoundPreset;
  onSoundPresetChange: (preset: SoundPreset) => void;
  onToggleSustain: () => void;
  onPlayNote: (note: string, octave: number) => void;
  onStopNote: (note: string, octave: number) => void;
}

export interface KeyDefinition {
  note: string;
  isBlack: boolean;
}

export const BASE_KEYS_CONFIG: KeyDefinition[] = [
  { note: 'C', isBlack: false },
  { note: 'C#', isBlack: true },
  { note: 'D', isBlack: false },
  { note: 'D#', isBlack: true },
  { note: 'E', isBlack: false },
  { note: 'F', isBlack: false },
  { note: 'F#', isBlack: true },
  { note: 'G', isBlack: false },
  { note: 'G#', isBlack: true },
  { note: 'A', isBlack: false },
  { note: 'A#', isBlack: true },
  { note: 'B', isBlack: false },
];

export const DAW_2HANDED_MAPS: Record<number, Record<string, string>> = {
  [-1]: {
    'C': 'Z', 'C#': 'S', 'D': 'X', 'D#': 'D', 'E': 'C', 'F': 'V',
    'F#': 'G', 'G': 'B', 'G#': 'H', 'A': 'N', 'A#': 'J', 'B': 'M'
  },
  [0]: {
    'C': 'Q', 'C#': '2', 'D': 'W', 'D#': '3', 'E': 'E', 'F': 'R',
    'F#': '5', 'G': 'T', 'G#': '6', 'A': 'Y', 'A#': '7', 'B': 'U'
  },
  [1]: {
    'C': 'I', 'C#': '9', 'D': 'O', 'D#': '0', 'E': 'P', 'F': '[',
    'F#': '=', 'G': ']', 'G#': '', 'A': '', 'A#': '', 'B': ''
  }
};

export const HOME_ROW_MAPS: Record<number, Record<string, string>> = {
  [-1]: {
    'C': 'Z', 'C#': '1', 'D': 'X', 'D#': '2', 'E': 'C', 'F': 'V',
    'F#': '4', 'G': 'B', 'G#': '5', 'A': 'N', 'A#': '6', 'B': 'M'
  },
  [0]: {
    'C': 'A', 'C#': 'W', 'D': 'S', 'D#': 'E', 'E': 'D', 'F': 'F',
    'F#': 'T', 'G': 'G', 'G#': 'Y', 'A': 'H', 'A#': 'U', 'B': 'J'
  },
  [1]: {
    'C': 'K', 'C#': '8', 'D': 'L', 'D#': '9', 'E': ';', 'F': "'",
    'F#': '-', 'G': 'I', 'G#': '=', 'A': 'O', 'A#': '[', 'B': 'P'
  }
};

export const Piano: React.FC<PianoProps> = ({
  currentOctave,
  activeNotes,
  isSustainActive,
  isComfortMode,
  keyMapPreset,
  instrument,
  soundPreset,
  onSoundPresetChange,
  onToggleSustain,
  onPlayNote,
  onStopNote,
}) => {
  const formattedActiveNotes = Array.from(activeNotes).sort();
  const octavesToShow = [currentOctave - 1, currentOctave, currentOctave + 1];
  const activeKeyMaps = keyMapPreset === 'daw_2handed' ? DAW_2HANDED_MAPS : HOME_ROW_MAPS;
  const isPiano = instrument === 'piano';

  const getFrameStyle = () => {
    if (!isPiano) return 'bg-harmonium-wood border-amber-900/60';
    if (soundPreset === 'bright_piano') return 'bg-piano-frame border-sky-900/40';
    if (soundPreset === 'strings') return 'bg-strings-frame border-emerald-900/40';
    return 'bg-flute-frame border-teal-900/40';
  };

  const getTrimStyle = () => {
    if (!isPiano) return 'bg-gradient-to-r from-amber-900 via-amber-600 to-amber-900 border-amber-500/50 text-amber-950';
    if (soundPreset === 'bright_piano') return 'bg-gradient-to-r from-sky-950 via-sky-800 to-sky-950 border-sky-500/40 text-sky-100';
    if (soundPreset === 'strings') return 'bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950 border-emerald-500/40 text-emerald-100';
    return 'bg-gradient-to-r from-teal-950 via-teal-800 to-teal-950 border-teal-500/40 text-teal-100';
  };

  const getTitleText = () => {
    if (!isPiano) return '🎵 HARMONIUM REED BOARD';
    if (soundPreset === 'bright_piano') return '🎹 BRIGHT PIANO';
    if (soundPreset === 'strings') return '🎻 STRINGS';
    return '🪈 FLUTE';
  };

  return (
    <div className="w-full my-3 flex flex-col items-center">
      {/* HEADER SECTION FOR PIANO MODE */}
      {isPiano && (
        <div className="mb-3 text-center">
          <h2 className={`text-xl sm:text-2xl font-serif font-bold tracking-wider flex items-center justify-center gap-2 ${
            soundPreset === 'bright_piano' ? 'text-sky-200' : soundPreset === 'strings' ? 'text-emerald-200' : 'text-teal-200'
          }`}>
            {getTitleText()}
          </h2>
        </div>
      )}

      {/* NOW PLAYING & SUSTAIN CONTROL BAR */}
      <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
        <div className="py-2 px-6 rounded-lg bg-zinc-900/90 border border-amber-900/40 shadow-md flex items-center gap-3 backdrop-blur-sm">
          <Music className={`w-4 h-4 ${!isPiano ? 'text-amber-400' : soundPreset === 'bright_piano' ? 'text-sky-400' : soundPreset === 'strings' ? 'text-emerald-400' : 'text-teal-400'}`} />
          <span className={`text-xs font-serif font-bold uppercase tracking-wider ${!isPiano ? 'text-amber-200/80' : soundPreset === 'bright_piano' ? 'text-sky-200/80' : soundPreset === 'strings' ? 'text-emerald-200/80' : 'text-teal-200/80'}`}>
            NOW PLAYING
          </span>
          <div className={`min-w-[140px] text-center font-mono text-sm sm:text-base font-bold ${!isPiano ? 'text-amber-300' : soundPreset === 'bright_piano' ? 'text-sky-300' : soundPreset === 'strings' ? 'text-emerald-300' : 'text-teal-300'}`}>
            {formattedActiveNotes.length > 0 ? (
              <span>{formattedActiveNotes.join('   ')}</span>
            ) : (
              <span className="text-zinc-600 text-xs tracking-widest uppercase font-sans">READY</span>
            )}
          </div>
        </div>

        {/* SUSTAIN PEDAL TOGGLE BUTTON */}
        <button
          onClick={onToggleSustain}
          className={`py-2 px-4 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            isSustainActive
              ? !isPiano
                ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-md'
                : soundPreset === 'bright_piano'
                ? 'bg-sky-950/90 border-sky-400 text-sky-300 shadow-lg shadow-sky-500/20'
                : soundPreset === 'strings'
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20'
                : 'bg-teal-950/90 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/20'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <Wind className={`w-3.5 h-3.5 ${isSustainActive ? (!isPiano ? 'text-amber-400' : soundPreset === 'bright_piano' ? 'text-sky-400' : soundPreset === 'strings' ? 'text-emerald-400' : 'text-teal-400') : 'text-zinc-600'}`} />
          <span>SUSTAIN: {isSustainActive ? 'ON' : 'OFF'}</span>
          <span className="text-[10px] font-mono text-zinc-400">(SPACE)</span>
        </button>
      </div>

      {/* CONTINUOUS 3-OCTAVE KEYBOARD FRAME */}
      <div className={`w-full p-3 sm:p-5 rounded-xl border shadow-2xl overflow-x-auto ${getFrameStyle()}`}>
        {/* Top Trim Bar */}
        <div className={`h-4 w-full mb-3 rounded-sm border shadow-inner flex items-center justify-between px-4 text-[10px] font-bold font-serif ${getTrimStyle()}`}>
          <span>HARMONIAN · {getTitleText()}</span>
          <span>LAYOUT: {keyMapPreset === 'daw_2handed' ? '2-HANDED DAW' : 'HOME ROW'}</span>
        </div>

        {/* Octave Label Bar */}
        <div className={`flex justify-between items-center px-2 mb-2 text-[10px] font-mono uppercase tracking-wider border-b pb-1 ${
          !isPiano ? 'text-amber-400/80 border-amber-900/40' : soundPreset === 'bright_piano' ? 'text-sky-300/80 border-sky-900/30' : soundPreset === 'strings' ? 'text-emerald-300/80 border-emerald-900/30' : 'text-teal-300/80 border-teal-900/30'
        }`}>
          <span>Octave {currentOctave - 1} (Left Hand)</span>
          <span>Octave {currentOctave} (Right Hand)</span>
          <span>Octave {currentOctave + 1} (Upper)</span>
        </div>

        {/* SEAMLESS 3-OCTAVE KEYS LAYOUT */}
        <div className="flex items-start justify-center relative select-none min-w-max px-1">
          {octavesToShow.map((oct, idx) => {
            const octaveOffset = idx - 1;
            const keyMap = activeKeyMaps[octaveOffset] || {};

            return (
              <React.Fragment key={oct}>
                {BASE_KEYS_CONFIG.map((keyDef) => {
                  const fullNoteKey = `${keyDef.note}${oct}`;
                  const isActive = activeNotes.has(fullNoteKey);
                  const kbdShortcut = keyMap[keyDef.note];

                  return (
                    <PianoKey
                      key={`${keyDef.note}-${oct}`}
                      note={keyDef.note}
                      octave={oct}
                      keyboardKey={kbdShortcut}
                      isBlack={keyDef.isBlack}
                      isActive={isActive}
                      isComfortMode={isComfortMode}
                      instrument={instrument}
                      soundPreset={soundPreset}
                      onPlay={(note, octave) => onPlayNote(note, octave)}
                      onStop={(note, octave) => onStopNote(note, octave)}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* THREE INDEPENDENT SOUND PRESET SELECTOR FOR PIANO SECTION */}
      {isPiano && (
        <div className="w-full max-w-xl mt-4 p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 shadow-md flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-amber-200">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>SOUND PRESET</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={() => onSoundPresetChange('bright_piano')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
                soundPreset === 'bright_piano'
                  ? 'bg-sky-600 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{soundPreset === 'bright_piano' ? '●' : '○'}</span>
              <span>🎹 Bright Piano</span>
            </button>
            <button
              onClick={() => onSoundPresetChange('strings')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
                soundPreset === 'strings'
                  ? 'bg-emerald-600 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{soundPreset === 'strings' ? '●' : '○'}</span>
              <span>🎻 Strings</span>
            </button>
            <button
              onClick={() => onSoundPresetChange('flute')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
                soundPreset === 'flute'
                  ? 'bg-teal-600 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span>{soundPreset === 'flute' ? '●' : '○'}</span>
              <span>🪈 Flute</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
