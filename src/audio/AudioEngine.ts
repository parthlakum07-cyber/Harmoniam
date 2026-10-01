// Web Audio API Polyphonic Audio Engine for Harmonium & Independent Piano Presets (Bright Piano, Pure Strings, Pure Flute)

export type InstrumentType = 'harmonium' | 'piano';
export type SoundPreset = 'bright_piano' | 'strings' | 'flute';

type VoiceState = 'ACTIVE' | 'SUSTAINED' | 'RELEASED';

interface Voice {
  id: string;
  noteKey: string;
  oscillators: OscillatorNode[];
  subOscillator?: OscillatorNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  filter: BiquadFilterNode;
  gainNode: GainNode;
  preset: SoundPreset | 'harmonium';
  state: VoiceState;
  startTime: number;
}

export const NOTE_SEMITONES: Record<string, number> = {
  'C': 0,
  'C#': 1,
  'D': 2,
  'D#': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'G': 7,
  'G#': 8,
  'A': 9,
  'A#': 10,
  'B': 11
};

export function getNoteFrequency(noteName: string, octave: number): number {
  const semitone = NOTE_SEMITONES[noteName] ?? 0;
  const midiNote = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

class HarmonianAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private activeVoices: Map<string, Voice> = new Map();
  private sustainedVoices: Voice[] = [];
  private lastPressTime: Map<string, number> = new Map();

  private isSustainActive: boolean = false;
  private currentInstrument: InstrumentType = 'harmonium';
  private currentSoundPreset: SoundPreset = 'bright_piano';
  private userVolume: number = 0.7;
  private angleVolumeMultiplier: number = 0.58;
  private maxVoiceLimit: number = 16;
  private voiceCounter: number = 0;

  constructor() {
    // Lazy AudioContext initialization
  }

  public async initAudio(): Promise<boolean> {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master output node
      this.masterGain = this.ctx.createGain();
      this.updateMasterGain();
      this.masterGain.connect(this.ctx.destination);

      // Dry path (90%)
      this.dryGainNode = this.ctx.createGain();
      this.dryGainNode.gain.setValueAtTime(0.90, this.ctx.currentTime);
      this.dryGainNode.connect(this.masterGain);

      // Room Reverb path (10%)
      this.initReverb();
      this.initNoiseBuffer();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx.state === 'running';
  }

  private initReverb(): void {
    if (!this.ctx || !this.masterGain) return;

    try {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 1.2);
      const impulse = this.ctx.createBuffer(2, length, sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 3.2);
        left[i] = (Math.random() * 2 - 1) * decay * 0.4;
        right[i] = (Math.random() * 2 - 1) * decay * 0.4;
      }

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = impulse;

      this.reverbGainNode = this.ctx.createGain();
      this.reverbGainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.reverbNode.connect(this.reverbGainNode);
      this.reverbGainNode.connect(this.masterGain);
    } catch {
      this.reverbNode = null;
      this.reverbGainNode = null;
    }
  }

  /**
   * Synthesize noise buffer for realistic flute breath articulation
   */
  private initNoiseBuffer(): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.0;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  public isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  private updateMasterGain(): void {
    if (!this.masterGain || !this.ctx) return;
    if (this.currentInstrument === 'harmonium') {
      const effectiveVolume = Math.max(0, Math.min(1, this.userVolume * this.angleVolumeMultiplier));
      this.masterGain.gain.setTargetAtTime(effectiveVolume, this.ctx.currentTime, 0.02);
    } else {
      const effectiveVolume = Math.max(0, Math.min(1, this.userVolume));
      this.masterGain.gain.setTargetAtTime(effectiveVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setUserVolume(volume: number): void {
    this.userVolume = volume;
    this.updateMasterGain();
  }

  public setAngleVolumeMultiplier(multiplier: number): void {
    this.angleVolumeMultiplier = multiplier;
    if (this.currentInstrument === 'harmonium') {
      this.updateMasterGain();
    }
  }

  public setInstrument(type: InstrumentType): void {
    if (this.currentInstrument === type) return;
    this.currentInstrument = type;
    this.stopAllNotes();
    this.updateMasterGain();
  }

  public getInstrument(): InstrumentType {
    return this.currentInstrument;
  }

  public setSoundPreset(preset: SoundPreset): void {
    if (this.currentSoundPreset === preset) return;
    this.currentSoundPreset = preset;
    this.stopAllNotes();
  }

  public getSoundPreset(): SoundPreset {
    return this.currentSoundPreset;
  }

  public setSustain(active: boolean): void {
    this.isSustainActive = active;
    if (!active) {
      const voicesToRelease = [...this.sustainedVoices];
      this.sustainedVoices = [];
      voicesToRelease.forEach((voice) => {
        this.releaseSingleVoice(voice, 0.25);
      });
    }
  }

  public getSustain(): boolean {
    return this.isSustainActive;
  }

  private checkVoiceLimit(): void {
    const totalVoicesCount = this.activeVoices.size + this.sustainedVoices.length;
    if (totalVoicesCount >= this.maxVoiceLimit) {
      if (this.sustainedVoices.length > 0) {
        const oldestSustained = this.sustainedVoices.shift();
        if (oldestSustained) {
          this.releaseSingleVoice(oldestSustained, 0.05);
        }
      } else {
        const oldestActiveKey = this.activeVoices.keys().next().value;
        if (oldestActiveKey) {
          const oldestVoice = this.activeVoices.get(oldestActiveKey);
          if (oldestVoice) {
            this.releaseSingleVoice(oldestVoice, 0.05);
            this.activeVoices.delete(oldestActiveKey);
          }
        }
      }
    }
  }

  public playNote(noteName: string, octave: number): string {
    if (!this.ctx || !this.masterGain) {
      this.initAudio();
      if (!this.ctx || !this.masterGain) return '';
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const noteKey = `${noteName}${octave}`;
    this.checkVoiceLimit();

    // RETRIGGER LOGIC: If a voice is physically ACTIVE on keydown, softly fade it (30ms fade)
    if (this.activeVoices.has(noteKey)) {
      const existingVoice = this.activeVoices.get(noteKey)!;
      this.releaseSingleVoice(existingVoice, 0.03);
      this.activeVoices.delete(noteKey);
    }

    if (this.currentInstrument === 'harmonium') {
      return this.playHarmoniumNote(noteName, octave, noteKey);
    } else {
      // Independent sound presets (Zero layering)
      if (this.currentSoundPreset === 'bright_piano') {
        return this.playBrightPianoNote(noteName, octave, noteKey);
      } else if (this.currentSoundPreset === 'strings') {
        return this.playPureStringsNote(noteName, octave, noteKey);
      } else {
        return this.playPureFluteNote(noteName, octave, noteKey);
      }
    }
  }

  /**
   * Synthesize Harmonium dual-reed sound
   */
  private playHarmoniumNote(noteName: string, octave: number, noteKey: string): string {
    if (!this.ctx || !this.dryGainNode) return '';
    const freq = getNoteFrequency(noteName, octave);
    const now = this.ctx.currentTime;
    const voiceId = `voice_${++this.voiceCounter}`;

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(0.4, now + 0.025);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.2, now);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.5, now);
    lfoGain.gain.setValueAtTime(1.5, now);
    lfo.connect(lfoGain);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);
    lfoGain.connect(osc1.frequency);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * Math.pow(2, 3 / 1200), now);
    lfoGain.connect(osc2.frequency);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    const oscMix = this.ctx.createGain();
    oscMix.gain.setValueAtTime(0.5, now);

    const subMix = this.ctx.createGain();
    subMix.gain.setValueAtTime(0.3, now);

    osc1.connect(oscMix);
    osc2.connect(oscMix);
    subOsc.connect(subMix);

    oscMix.connect(filter);
    subMix.connect(filter);
    filter.connect(voiceGain);

    voiceGain.connect(this.dryGainNode);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    subOsc.start(now);

    const voice: Voice = {
      id: voiceId,
      noteKey,
      oscillators: [osc1, osc2],
      subOscillator: subOsc,
      lfo,
      lfoGain,
      filter,
      gainNode: voiceGain,
      preset: 'harmonium',
      state: 'ACTIVE',
      startTime: now,
    };

    this.activeVoices.set(noteKey, voice);
    return noteKey;
  }

  /**
   * 1. PRESET: 🎹 PURE BRIGHT PIANO (ZERO STRINGS, ZERO FLUTE)
   */
  private playBrightPianoNote(noteName: string, octave: number, noteKey: string): string {
    if (!this.ctx || !this.dryGainNode) return '';
    const freq = getNoteFrequency(noteName, octave);
    const now = this.ctx.currentTime;
    const voiceId = `voice_${++this.voiceCounter}`;

    const lastTime = this.lastPressTime.get(noteKey) || 0;
    const timeDelta = now - lastTime;
    this.lastPressTime.set(noteKey, now);

    const velocityBoost = timeDelta < 0.45 ? Math.min(0.2, (0.45 - timeDelta) * 0.35) : 0;
    const peakGain = 0.75 + velocityBoost;

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.003); // Instant hammer hit
    const decayDuration = Math.max(0.4, 1.2 - octave * 0.1);
    const sustainLevel = peakGain * 0.28;
    voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel), now + decayDuration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3600, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + decayDuration);

    const oscFundamental = this.ctx.createOscillator();
    oscFundamental.type = 'sine';
    oscFundamental.frequency.setValueAtTime(freq, now);

    const fundGain = this.ctx.createGain();
    fundGain.gain.setValueAtTime(0.55, now);
    oscFundamental.connect(fundGain);

    const oscBrightSaw = this.ctx.createOscillator();
    oscBrightSaw.type = 'sawtooth';
    oscBrightSaw.frequency.setValueAtTime(freq, now);

    const brightSawGain = this.ctx.createGain();
    brightSawGain.gain.setValueAtTime(0.25 + velocityBoost * 0.2, now);
    oscBrightSaw.connect(brightSawGain);

    const oscSparkle = this.ctx.createOscillator();
    oscSparkle.type = 'triangle';
    oscSparkle.frequency.setValueAtTime(freq * 2, now);

    const sparkleGain = this.ctx.createGain();
    sparkleGain.gain.setValueAtTime(0.20, now);
    oscSparkle.connect(sparkleGain);

    const hammerOsc = this.ctx.createOscillator();
    hammerOsc.type = 'sine';
    hammerOsc.frequency.setValueAtTime(freq * 4.8, now);

    const hammerGain = this.ctx.createGain();
    hammerGain.gain.setValueAtTime(0.40 + velocityBoost * 0.4, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    hammerOsc.connect(hammerGain);

    fundGain.connect(filter);
    brightSawGain.connect(filter);
    sparkleGain.connect(filter);
    hammerGain.connect(filter);
    filter.connect(voiceGain);

    voiceGain.connect(this.dryGainNode);
    if (this.reverbNode) {
      voiceGain.connect(this.reverbNode);
    }

    oscFundamental.start(now);
    oscBrightSaw.start(now);
    oscSparkle.start(now);
    hammerOsc.start(now);

    const voice: Voice = {
      id: voiceId,
      noteKey,
      oscillators: [oscFundamental, oscBrightSaw, oscSparkle, hammerOsc],
      filter,
      gainNode: voiceGain,
      preset: 'bright_piano',
      state: 'ACTIVE',
      startTime: now,
    };

    this.activeVoices.set(noteKey, voice);
    return noteKey;
  }

  /**
   * 2. PRESET: 🎻 PURE ORCHESTRAL STRINGS (ZERO PIANO, ZERO FLUTE)
   */
  private playPureStringsNote(noteName: string, octave: number, noteKey: string): string {
    if (!this.ctx || !this.dryGainNode) return '';
    const freq = getNoteFrequency(noteName, octave);
    const now = this.ctx.currentTime;
    const voiceId = `voice_${++this.voiceCounter}`;

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(0.55, now + 0.12); // Slow 120ms attack swell

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(0.8, now);

    // 3 Detuned Ensemble Oscillators (0c, +5c, -5c)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * Math.pow(2, 5 / 1200), now);

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(freq * Math.pow(2, -5 / 1200), now);

    const mixGain1 = this.ctx.createGain();
    mixGain1.gain.setValueAtTime(0.35, now);

    const mixGain2 = this.ctx.createGain();
    mixGain2.gain.setValueAtTime(0.35, now);

    const mixGain3 = this.ctx.createGain();
    mixGain3.gain.setValueAtTime(0.30, now);

    osc1.connect(mixGain1);
    osc2.connect(mixGain2);
    osc3.connect(mixGain3);

    mixGain1.connect(filter);
    mixGain2.connect(filter);
    mixGain3.connect(filter);

    filter.connect(voiceGain);
    voiceGain.connect(this.dryGainNode);
    if (this.reverbNode) {
      voiceGain.connect(this.reverbNode);
    }

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    const voice: Voice = {
      id: voiceId,
      noteKey,
      oscillators: [osc1, osc2, osc3],
      filter,
      gainNode: voiceGain,
      preset: 'strings',
      state: 'ACTIVE',
      startTime: now,
    };

    this.activeVoices.set(noteKey, voice);
    return noteKey;
  }

  /**
   * 3. PRESET: 🪈 PURE WOODWIND FLUTE (ZERO PIANO, ZERO STRINGS)
   */
  private playPureFluteNote(noteName: string, octave: number, noteKey: string): string {
    if (!this.ctx || !this.dryGainNode) return '';
    const freq = getNoteFrequency(noteName, octave);
    const now = this.ctx.currentTime;
    const voiceId = `voice_${++this.voiceCounter}`;

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(0.50, now + 0.035); // Gentle attack (35ms)

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    // Flute Vibrato LFO (4.8 Hz rate, 1.2 Hz pitch depth)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.8, now);
    lfoGain.gain.setValueAtTime(1.2, now);
    lfo.connect(lfoGain);

    // Fundamental Sine/Triangle wave
    const mainOsc = this.ctx.createOscillator();
    mainOsc.type = 'sine';
    mainOsc.frequency.setValueAtTime(freq, now);
    lfoGain.connect(mainOsc.frequency);

    const subHarmonicOsc = this.ctx.createOscillator();
    subHarmonicOsc.type = 'triangle';
    subHarmonicOsc.frequency.setValueAtTime(freq, now);

    const octaveHarmonicOsc = this.ctx.createOscillator();
    octaveHarmonicOsc.type = 'sine';
    octaveHarmonicOsc.frequency.setValueAtTime(freq * 2, now);

    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.65, now);

    const subHarmonicGain = this.ctx.createGain();
    subHarmonicGain.gain.setValueAtTime(0.25, now);

    const octaveHarmonicGain = this.ctx.createGain();
    octaveHarmonicGain.gain.setValueAtTime(0.10, now);

    mainOsc.connect(mainGain);
    subHarmonicOsc.connect(subHarmonicGain);
    octaveHarmonicOsc.connect(octaveHarmonicGain);

    mainGain.connect(filter);
    subHarmonicGain.connect(filter);
    octaveHarmonicGain.connect(filter);

    // Breath Noise Component (Filtered noise transient during attack)
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2400, now);
      noiseFilter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04); // 40ms subtle breath

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(filter);

      noiseSource.start(now);
    }

    filter.connect(voiceGain);
    voiceGain.connect(this.dryGainNode);
    if (this.reverbNode) {
      voiceGain.connect(this.reverbNode);
    }

    lfo.start(now);
    mainOsc.start(now);
    subHarmonicOsc.start(now);
    octaveHarmonicOsc.start(now);

    const voice: Voice = {
      id: voiceId,
      noteKey,
      oscillators: [mainOsc, subHarmonicOsc, octaveHarmonicOsc],
      lfo,
      lfoGain,
      filter,
      gainNode: voiceGain,
      preset: 'flute',
      state: 'ACTIVE',
      startTime: now,
    };

    this.activeVoices.set(noteKey, voice);
    return noteKey;
  }

  public stopNote(noteName: string, octave: number): void {
    const noteKey = `${noteName}${octave}`;
    const activeVoice = this.activeVoices.get(noteKey);

    if (!activeVoice) return;

    if (this.isSustainActive) {
      activeVoice.state = 'SUSTAINED';
      this.sustainedVoices.push(activeVoice);
      this.activeVoices.delete(noteKey);
    } else {
      this.activeVoices.delete(noteKey);
      const relTime = activeVoice.preset === 'strings' ? 0.45 : activeVoice.preset === 'flute' ? 0.25 : 0.35;
      this.releaseSingleVoice(activeVoice, relTime);
    }
  }

  private releaseSingleVoice(voice: Voice, releaseDuration: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    voice.state = 'RELEASED';

    try {
      voice.gainNode.gain.cancelScheduledValues(now);
      const currentGain = Math.max(0.0001, voice.gainNode.gain.value);
      voice.gainNode.gain.setValueAtTime(currentGain, now);
      voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseDuration);
    } catch {
      // Scheduling safety
    }

    setTimeout(() => {
      try {
        voice.oscillators.forEach((osc) => osc.stop());
        if (voice.subOscillator) voice.subOscillator.stop();
        if (voice.lfo) voice.lfo.stop();
        voice.gainNode.disconnect();
      } catch {
        // Cleanup safety
      }
    }, releaseDuration * 1000 + 40);
  }

  public stopAllNotes(): void {
    const voicesToStop = [...Array.from(this.activeVoices.values()), ...this.sustainedVoices];
    this.activeVoices.clear();
    this.sustainedVoices = [];
    voicesToStop.forEach((voice) => {
      this.releaseSingleVoice(voice, 0.05);
    });
  }
}

export const audioEngine = new HarmonianAudioEngine();
