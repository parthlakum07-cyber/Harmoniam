import React from 'react';
import { Volume2, Sliders, Radio, Plus, Minus, Keyboard } from 'lucide-react';
import type { OrientationState } from '../sensors/Orientation';
import type { KeyMapPreset } from './Piano';
import type { InstrumentType } from '../audio/AudioEngine';

interface ControlsProps {
  volume: number; // 0.0 to 1.0
  onVolumeChange: (vol: number) => void;
  octave: number; // 1 to 7
  onOctaveChange: (oct: number) => void;
  keyMapPreset: KeyMapPreset;
  onKeyMapPresetChange: (preset: KeyMapPreset) => void;
  instrument: InstrumentType;
  orientationState: OrientationState;
  onAngleChange: (angle: number) => void;
  onModeChange: (mode: 'sensor' | 'manual') => void;
}

export const Controls: React.FC<ControlsProps> = ({
  volume,
  onVolumeChange,
  octave,
  onOctaveChange,
  keyMapPreset,
  onKeyMapPresetChange,
  instrument,
  orientationState,
  onAngleChange,
  onModeChange,
}) => {
  const volumePercent = Math.round(volume * 100);
  const isHarmonium = instrument === 'harmonium';

  const handleOctaveDecrease = () => {
    if (octave > 2) onOctaveChange(octave - 1);
  };

  const handleOctaveIncrease = () => {
    if (octave < 6) onOctaveChange(octave + 1);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto my-2 p-5 rounded-xl border shadow-xl backdrop-blur-md grid grid-cols-1 ${isHarmonium ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-5 ${
      isHarmonium ? 'bg-zinc-900/90 border-amber-900/40' : 'bg-zinc-900/90 border-sky-900/40'
    }`}>
      {/* 1. Master Volume Control */}
      <div className="flex flex-col gap-2">
        <div className={`flex items-center justify-between text-xs font-serif font-bold ${isHarmonium ? 'text-amber-200' : 'text-sky-200'}`}>
          <span className="flex items-center gap-1.5">
            <Volume2 className={`w-4 h-4 ${isHarmonium ? 'text-amber-400' : 'text-sky-400'}`} />
            Master Volume
          </span>
          <span className={`font-mono font-bold ${isHarmonium ? 'text-amber-300' : 'text-sky-300'}`}>{volumePercent}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className={`w-full cursor-pointer h-2 bg-zinc-950 rounded-lg ${isHarmonium ? 'accent-amber-500' : 'accent-sky-500'}`}
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 2. Key Map Layout Preset Toggle */}
      <div className="flex flex-col gap-2">
        <div className={`flex items-center justify-between text-xs font-serif font-bold ${isHarmonium ? 'text-amber-200' : 'text-sky-200'}`}>
          <span className="flex items-center gap-1.5">
            <Keyboard className={`w-4 h-4 ${isHarmonium ? 'text-amber-400' : 'text-sky-400'}`} />
            Laptop Mapping
          </span>
        </div>
        <div className="flex flex-col gap-1 my-auto">
          <button
            onClick={() => onKeyMapPresetChange('daw_2handed')}
            className={`py-1 px-2 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
              keyMapPreset === 'daw_2handed'
                ? isHarmonium
                  ? 'bg-amber-600 text-zinc-950 font-bold shadow'
                  : 'bg-sky-600 text-zinc-950 font-bold shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2-Handed DAW (Z & Q)
          </button>
          <button
            onClick={() => onKeyMapPresetChange('home_row')}
            className={`py-1 px-2 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
              keyMapPreset === 'home_row'
                ? isHarmonium
                  ? 'bg-amber-600 text-zinc-950 font-bold shadow'
                  : 'bg-sky-600 text-zinc-950 font-bold shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Home Row (A S D)
          </button>
        </div>
      </div>

      {/* 3. Base Octave Selector */}
      <div className="flex flex-col gap-2 items-center justify-between">
        <div className={`text-xs font-serif font-bold flex items-center gap-1.5 ${isHarmonium ? 'text-amber-200' : 'text-sky-200'}`}>
          <span>Base Octave</span>
          <span className={`text-[10px] font-sans font-normal ${isHarmonium ? 'text-amber-400/70' : 'text-sky-400/70'}`}>(← / →)</span>
        </div>
        <div className="flex items-center gap-3 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
          <button
            onClick={handleOctaveDecrease}
            disabled={octave <= 2}
            className={`w-7 h-7 rounded bg-zinc-900 border border-zinc-700 text-amber-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg active:scale-95 transition-all cursor-pointer ${isHarmonium ? 'text-amber-300' : 'text-sky-300'}`}
            title="Octave Down (←)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className={`w-7 text-center font-mono font-bold text-lg ${isHarmonium ? 'text-amber-300' : 'text-sky-300'}`}>
            {octave}
          </span>
          <button
            onClick={handleOctaveIncrease}
            disabled={octave >= 6}
            className={`w-7 h-7 rounded bg-zinc-900 border border-zinc-700 text-amber-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg active:scale-95 transition-all cursor-pointer ${isHarmonium ? 'text-amber-300' : 'text-sky-300'}`}
            title="Octave Up (→)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Motion / Angle Controls (RENDERED ONLY IN HARMONIUM MODE) */}
      {isHarmonium && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-serif font-bold text-amber-200">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              Tilt Slider
            </span>
            <span className="font-mono text-amber-300 font-bold">{orientationState.angle}°</span>
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            <button
              onClick={() => onModeChange('sensor')}
              className={`flex-1 py-1 px-1.5 text-[10px] font-semibold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                orientationState.mode === 'sensor'
                  ? 'bg-amber-600 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio className="w-3 h-3" />
              Sensor
            </button>
            <button
              onClick={() => onModeChange('manual')}
              className={`flex-1 py-1 px-1.5 text-[10px] font-semibold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                orientationState.mode === 'manual'
                  ? 'bg-amber-600 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              Manual
            </button>
          </div>

          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={orientationState.angle}
            onChange={(e) => {
              onModeChange('manual');
              onAngleChange(parseInt(e.target.value, 10));
            }}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-950 rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
