/**
 * SoundManager.ts
 * Procedural anime audio engine using Web Audio API.
 * Synthesizes romantic anime piano melodies, ambient nature soundscapes,
 * footstep sound effects, UI clicks, and affection chimes without external dependencies.
 */

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private isBgmPlaying = false;
  private bgmTimeoutId: number | null = null;
  private noteIndex = 0;

  private masterVolume = 0.7;
  private bgmVolume = 0.5;
  private sfxVolume = 0.8;
  private ambientVolume = 0.4;

  private ambientIntervalId: number | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startAmbient();
      this.startBGM();
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // --- Volume Controls ---
  public setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setBgmVolume(v: number) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(v: number) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolumes() {
    return {
      master: this.masterVolume,
      bgm: this.bgmVolume,
      sfx: this.sfxVolume,
    };
  }

  // --- Romantic Anime Piano BGM ---
  // A peaceful, nostalgic chord progression reminiscent of anime soundtracks:
  // Fmaj7 -> G6 -> Em7 -> Am7 -> Dm7 -> G7 -> Cmaj7
  private chordProgression = [
    // Fmaj7 (F3, A3, C4, E4)
    { bass: 174.61, chord: [220.0, 261.63, 329.63, 392.0], melody: [523.25, 493.88, 392.0, 329.63] },
    // G6 (G3, B3, D4, E4)
    { bass: 196.0, chord: [246.94, 293.66, 329.63, 392.0], melody: [392.0, 440.0, 493.88, 587.33] },
    // Em7 (E3, G3, B3, D4)
    { bass: 164.81, chord: [196.0, 246.94, 293.66, 392.0], melody: [659.25, 587.33, 493.88, 392.0] },
    // Am7 (A3, C4, E4, G4)
    { bass: 220.0, chord: [261.63, 329.63, 392.0, 440.0], melody: [440.0, 523.25, 659.25, 523.25] },
    // Dm7 (D3, F3, A3, C4)
    { bass: 146.83, chord: [220.0, 261.63, 349.23, 440.0], melody: [523.25, 440.0, 349.23, 392.0] },
    // G7sus4 -> G7
    { bass: 196.0, chord: [261.63, 293.66, 392.0, 440.0], melody: [440.0, 392.0, 329.63, 293.66] },
    // Cmaj7 (C3, E3, G3, B3)
    { bass: 130.81, chord: [261.63, 329.63, 392.0, 493.88], melody: [523.25, 659.25, 783.99, 659.25] },
  ];

  public startBGM() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.playNextChordPattern();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimeoutId !== null) {
      window.clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }

  private playNextChordPattern() {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    const bar = this.chordProgression[this.noteIndex % this.chordProgression.length];
    this.noteIndex++;

    const now = this.ctx.currentTime;
    const barDuration = 3.6; // Peaceful tempo ~67 BPM

    // Play soft bass note
    this.playPianoTone(bar.bass, now, 2.8, 0.22, "sine");

    // Play gentle arpeggiated chord
    bar.chord.forEach((freq, i) => {
      const delay = 0.25 * i;
      this.playPianoTone(freq, now + delay, 2.2, 0.12, "triangle");
    });

    // Play sparkling melody notes
    bar.melody.forEach((freq, i) => {
      const delay = 0.8 * i + 0.4;
      this.playPianoTone(freq, now + delay, 1.8, 0.14, "sine");
    });

    this.bgmTimeoutId = window.setTimeout(() => {
      this.playNextChordPattern();
    }, barDuration * 1000);
  }

  private playPianoTone(freq: number, startTime: number, duration: number, volume: number, type: OscillatorType) {
    if (!this.ctx || !this.bgmGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Lowpass filter to give warm, felted acoustic piano timbre
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, startTime);
      filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);

      // Natural piano envelope: instant attack, exponential decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    } catch {
      // Audio context might be closing or busy
    }
  }

  // --- Ambient Soundscape (Gentle Wind, Birdsong, Water) ---
  private startAmbient() {
    if (this.ambientIntervalId !== null) return;

    // Periodic gentle bird chirps
    this.ambientIntervalId = window.setInterval(() => {
      if (!this.ctx || Math.random() > 0.45) return;
      this.playBirdChirp();
    }, 4500);
  }

  private playBirdChirp() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 2200 + Math.random() * 800;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";

      // Two quick trills
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 200, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 800, now + 0.22);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  // --- Sound Effects (SFX) ---
  public playFootstep(surface: "grass" | "stone" | "wood" = "stone") {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (surface === "grass") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.07);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      } else if (surface === "wood") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220 + Math.random() * 40, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      } else {
        // Stone
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320 + Math.random() * 50, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      }

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  public playAffectionChime() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Sparkling harp/celeste chime: E5, G#5, B5, E6
      const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const noteStart = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.8);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.85);
      });
    } catch {
      // Ignore
    }
  }

  public playDialogueVoice(char: "player" | "ren" = "ren") {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const baseFreq = char === "player" ? 440 + Math.random() * 60 : 280 + Math.random() * 40;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 80, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  public playUIHover() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.04);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  public playUIClick() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();
