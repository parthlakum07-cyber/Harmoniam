import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { AngleMeter } from './components/AngleMeter';
import { Piano } from './components/Piano';
import type { KeyMapPreset } from './components/Piano';
import { Controls } from './components/Controls';
import { audioEngine } from './audio/AudioEngine';
import type { InstrumentType, SoundPreset } from './audio/AudioEngine';
import { orientationSensor } from './sensors/Orientation';
import type { OrientationState } from './sensors/Orientation';

interface MappedKey {
  note: string;
  offset: number; // -1: lower, 0: center, 1: upper
}

const DAW_2HANDED_PHYSICAL_MAP: Record<string, MappedKey> = {
  z: { note: 'C', offset: -1 },
  s: { note: 'C#', offset: -1 },
  x: { note: 'D', offset: -1 },
  d: { note: 'D#', offset: -1 },
  c: { note: 'E', offset: -1 },
  v: { note: 'F', offset: -1 },
  g: { note: 'F#', offset: -1 },
  b: { note: 'G', offset: -1 },
  h: { note: 'G#', offset: -1 },
  n: { note: 'A', offset: -1 },
  j: { note: 'A#', offset: -1 },
  m: { note: 'B', offset: -1 },

  q: { note: 'C', offset: 0 },
  '2': { note: 'C#', offset: 0 },
  w: { note: 'D', offset: 0 },
  '3': { note: 'D#', offset: 0 },
  e: { note: 'E', offset: 0 },
  r: { note: 'F', offset: 0 },
  '5': { note: 'F#', offset: 0 },
  t: { note: 'G', offset: 0 },
  '6': { note: 'G#', offset: 0 },
  y: { note: 'A', offset: 0 },
  '7': { note: 'A#', offset: 0 },
  u: { note: 'B', offset: 0 },

  i: { note: 'C', offset: 1 },
  '9': { note: 'C#', offset: 1 },
  o: { note: 'D', offset: 1 },
  '0': { note: 'D#', offset: 1 },
  p: { note: 'E', offset: 1 },
  '[': { note: 'F', offset: 1 },
  '=': { note: 'F#', offset: 1 },
  ']': { note: 'G', offset: 1 },
};

const HOME_ROW_PHYSICAL_MAP: Record<string, MappedKey> = {
  z: { note: 'C', offset: -1 },
  '1': { note: 'C#', offset: -1 },
  x: { note: 'D', offset: -1 },
  '2': { note: 'D#', offset: -1 },
  c: { note: 'E', offset: -1 },
  v: { note: 'F', offset: -1 },
  '4': { note: 'F#', offset: -1 },
  b: { note: 'G', offset: -1 },
  '5': { note: 'G#', offset: -1 },
  n: { note: 'A', offset: -1 },
  '6': { note: 'A#', offset: -1 },
  m: { note: 'B', offset: -1 },

  a: { note: 'C', offset: 0 },
  w: { note: 'C#', offset: 0 },
  s: { note: 'D', offset: 0 },
  e: { note: 'D#', offset: 0 },
  d: { note: 'E', offset: 0 },
  f: { note: 'F', offset: 0 },
  t: { note: 'F#', offset: 0 },
  g: { note: 'G', offset: 0 },
  y: { note: 'G#', offset: 0 },
  h: { note: 'A', offset: 0 },
  u: { note: 'A#', offset: 0 },
  j: { note: 'B', offset: 0 },

  k: { note: 'C', offset: 1 },
  '8': { note: 'C#', offset: 1 },
  l: { note: 'D', offset: 1 },
  '9': { note: 'D#', offset: 1 },
  ';': { note: 'E', offset: 1 },
  "'": { note: 'F', offset: 1 },
  '-': { note: 'F#', offset: 1 },
  i: { note: 'G', offset: 1 },
  '=': { note: 'G#', offset: 1 },
  o: { note: 'A', offset: 1 },
  '[': { note: 'A#', offset: 1 },
  p: { note: 'B', offset: 1 },
};

export function App() {
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [octave, setOctave] = useState<number>(4);
  const [volume, setVolume] = useState<number>(0.7);
  const [instrument, setInstrument] = useState<InstrumentType>('harmonium');
  const [soundPreset, setSoundPreset] = useState<SoundPreset>('bright_piano');
  const [isComfortMode] = useState<boolean>(true);
  const [keyMapPreset, setKeyMapPreset] = useState<KeyMapPreset>('daw_2handed');
  const [isSustainActive, setIsSustainActive] = useState<boolean>(false);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [orientationState, setOrientationState] = useState<OrientationState>(
    orientationSensor.getState()
  );

  const pressedPhysicalKeys = useRef<Set<string>>(new Set());
  const heldNotesRef = useRef<Set<string>>(new Set());

  // Subscribe to orientation sensor ONLY for Harmonium mode
  useEffect(() => {
    const unsubscribe = orientationSensor.subscribe((state) => {
      setOrientationState(state);
      const angleMultiplier = Math.max(0, Math.min(1, state.angle / 180));
      audioEngine.setAngleVolumeMultiplier(angleMultiplier);
    });
    return unsubscribe;
  }, []);

  const handleStartAudio = useCallback(async () => {
    const ready = await audioEngine.initAudio();
    setIsAudioReady(ready);
  }, []);

  const handleInstrumentChange = (newInst: InstrumentType) => {
    setInstrument(newInst);
    audioEngine.setInstrument(newInst);
    pressedPhysicalKeys.current.clear();
    heldNotesRef.current.clear();
    setActiveNotes(new Set());
  };

  const handleSoundPresetChange = (newPreset: SoundPreset) => {
    setSoundPreset(newPreset);
    audioEngine.setSoundPreset(newPreset);
    pressedPhysicalKeys.current.clear();
    heldNotesRef.current.clear();
    setActiveNotes(new Set());
  };

  const handleToggleSustain = useCallback(() => {
    setIsSustainActive((prev) => {
      const nextState = !prev;
      audioEngine.setSustain(nextState);
      if (!nextState) {
        setActiveNotes(new Set(heldNotesRef.current));
      }
      return nextState;
    });
  }, []);

  const playNote = useCallback(
    (noteName: string, targetOctave: number) => {
      if (!isAudioReady) {
        handleStartAudio();
      }
      const noteKey = `${noteName}${targetOctave}`;
      heldNotesRef.current.add(noteKey);
      audioEngine.playNote(noteName, targetOctave);
      setActiveNotes((prev) => new Set(prev).add(noteKey));
    },
    [isAudioReady, handleStartAudio]
  );

  const stopNote = useCallback((noteName: string, targetOctave: number) => {
    const noteKey = `${noteName}${targetOctave}`;
    heldNotesRef.current.delete(noteKey);
    audioEngine.stopNote(noteName, targetOctave);
    if (!audioEngine.getSustain()) {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteKey);
        return next;
      });
    }
  }, []);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioEngine.setUserVolume(newVolume);
  };

  const handleOctaveChange = useCallback((newOctave: number) => {
    audioEngine.stopAllNotes();
    heldNotesRef.current.clear();
    pressedPhysicalKeys.current.clear();
    setActiveNotes(new Set());
    setOctave(Math.max(2, Math.min(6, newOctave)));
  }, []);

  useEffect(() => {
    const activeMap =
      keyMapPreset === 'daw_2handed' ? DAW_2HANDED_PHYSICAL_MAP : HOME_ROW_PHYSICAL_MAP;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          setIsSustainActive(true);
          audioEngine.setSustain(true);
        }
        return;
      }

      const key = e.key.toLowerCase();

      if (e.key === 'ArrowLeft') {
        if (!e.repeat) handleOctaveChange(octave - 1);
        return;
      }
      if (e.key === 'ArrowRight') {
        if (!e.repeat) handleOctaveChange(octave + 1);
        return;
      }

      const mapped = activeMap[key];
      if (mapped) {
        if (pressedPhysicalKeys.current.has(key)) {
          return;
        }
        pressedPhysicalKeys.current.add(key);
        const targetOctave = octave + mapped.offset;
        playNote(mapped.note, targetOctave);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSustainActive(false);
        audioEngine.setSustain(false);
        setActiveNotes(new Set(heldNotesRef.current));
        return;
      }

      const key = e.key.toLowerCase();
      if (pressedPhysicalKeys.current.has(key)) {
        pressedPhysicalKeys.current.delete(key);
        const mapped = activeMap[key];
        if (mapped) {
          const targetOctave = octave + mapped.offset;
          stopNote(mapped.note, targetOctave);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octave, keyMapPreset, playNote, stopNote, handleOctaveChange]);

  return (
    <div
      onClick={() => {
        if (!isAudioReady) handleStartAudio();
      }}
      className="min-h-screen flex flex-col justify-between bg-zinc-950 text-amber-50"
    >
      <Header
        isAudioReady={isAudioReady}
        instrument={instrument}
        onInstrumentChange={handleInstrumentChange}
        onStartAudio={handleStartAudio}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col justify-center items-center">
        {/* TILT ANGLE DISPLAY & LAPTOP SVG VISUALIZATION (RENDERED ONLY IN HARMONIUM MODE) */}
        {instrument === 'harmonium' && (
          <AngleMeter
            orientationState={orientationState}
            onRequestPermission={() => orientationSensor.requestPermission()}
          />
        )}

        {/* 3-OCTAVE KEYBOARD & NOTE DISPLAY */}
        <Piano
          currentOctave={octave}
          activeNotes={activeNotes}
          isSustainActive={isSustainActive}
          isComfortMode={isComfortMode}
          keyMapPreset={keyMapPreset}
          instrument={instrument}
          soundPreset={soundPreset}
          onSoundPresetChange={handleSoundPresetChange}
          onToggleSustain={handleToggleSustain}
          onPlayNote={(note, targetOct) => playNote(note, targetOct)}
          onStopNote={(note, targetOct) => stopNote(note, targetOct)}
        />

        {/* CONTROLS */}
        <Controls
          volume={volume}
          onVolumeChange={handleVolumeChange}
          octave={octave}
          onOctaveChange={handleOctaveChange}
          keyMapPreset={keyMapPreset}
          onKeyMapPresetChange={setKeyMapPreset}
          instrument={instrument}
          orientationState={orientationState}
          onAngleChange={(angle) => orientationSensor.setManualAngle(angle)}
          onModeChange={(mode) => orientationSensor.setMode(mode)}
        />

        {/* KEYBOARD SHORTCUTS REFERENCE BAR */}
        <div className="mt-3 p-3 rounded-lg bg-zinc-900/80 border border-amber-900/30 text-[11px] text-amber-200/70 flex flex-wrap items-center justify-center gap-4 text-center">
          {keyMapPreset === 'daw_2handed' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-semibold text-amber-300">Left Hand (Oct 3):</span>
                <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded text-amber-400 border border-zinc-800">
                  Z X C V B N M (Black: S D G H J)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-semibold text-amber-300">Right Hand (Oct 4):</span>
                <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded text-amber-400 border border-zinc-800">
                  Q W E R T Y U (Black: 2 3 5 6 7)
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-semibold text-amber-300">Lower Octave:</span>
                <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded text-amber-400 border border-zinc-800">
                  Z X C V B N M (Black: 1 2 4 5 6)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-semibold text-amber-300">Center Octave:</span>
                <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded text-amber-400 border border-zinc-800">
                  A S D F G H J (Black: W E T Y U)
                </span>
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5">
            <span className="font-serif font-semibold text-amber-300">Sustain Pedal:</span>
            <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/40">
              SPACEBAR
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-semibold text-amber-300">Base Shift:</span>
            <span className="font-mono bg-zinc-950 px-1.5 py-0.5 rounded text-amber-400 border border-zinc-800">
              ← / → Arrow Keys
            </span>
          </div>
        </div>
      </main>

      <footer className="py-2.5 px-6 text-center text-[11px] text-zinc-500 border-t border-zinc-900 font-sans">
        Harmonian — Virtual Harmonium & Independent Piano Presets Web App powered by Web Audio API & Device Orientation Sensor
      </footer>
    </div>
  );
}

export default App;
