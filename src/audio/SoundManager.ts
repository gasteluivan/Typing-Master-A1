/**
 * Dynamic Procedural Web Audio Engine
 * Layered adaptive synth music (Pad -> Arp -> Bass -> Beat) + musical pitch-scaled SFX
 */
import { SpeedTier } from '../../shared/types';

// Musical scale for combo pitch progression (A minor pentatonic: A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5)
const PITCH_SCALE_HZ = [
  220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5,
];

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  public masterVolume = 0.8;
  public musicVolume = 0.6;
  public sfxVolume = 0.8;
  public isMuted = false;
  public externalMusicActive = false; // If true, disable procedural BGM

  // Layered music state
  private isMusicPlaying = false;
  private musicStep = 0;
  private musicIntervalId: any = null;
  private currentTier: SpeedTier = 'NORMAL';
  private currentCombo = 0;
  private levelBpm = 118;

  // Heartbeat loop timer
  private heartbeatIntervalId: any = null;
  private isLowHp = false;

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, music: number, sfx: number, muted = false): void {
    this.masterVolume = master;
    this.musicVolume = music;
    this.sfxVolume = sfx;
    this.isMuted = muted;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : master, this.ctx.currentTime);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
    }
  }

  // --- SFX METHODS ---

  public playKeyHit(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playKeyError(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playWordDestroyed(combo: number, isPerfect = false): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Pitch scaling with combo
    const pitchIdx = Math.min(combo, PITCH_SCALE_HZ.length - 1);
    const baseFreq = PITCH_SCALE_HZ[pitchIdx];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isPerfect ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * (isPerfect ? 1.5 : 1.2), now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isPerfect ? 0.25 : 0.18));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playTierUp(tier: SpeedTier): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = tier === 'GODSPEED' ? 440 : 330;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.5, now + 0.35);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playSpecial(type: string): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'freeze') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    } else if (type === 'bomb') {
      // Noise burst for bomb
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    } else if (type === 'shield' || type === 'repair') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.3);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.25);
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playOverclock(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  public setLowHp(active: boolean): void {
    this.isLowHp = active;
    if (active && !this.heartbeatIntervalId) {
      this.heartbeatIntervalId = setInterval(() => {
        if (!this.isLowHp) return;
        this.playHeartbeat();
      }, 900);
    } else if (!active && this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private playHeartbeat(): void {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- PROCEDURAL LAYERED MUSIC (Web Audio) ---

  public startMusic(level = 1): void {
    this.initContext();
    if (this.isMusicPlaying || this.externalMusicActive) return;

    this.isMusicPlaying = true;
    this.levelBpm = Math.min(115 + level * 2, 140);
    const beatIntervalMs = (60 / this.levelBpm / 2) * 1000; // 8th note interval

    this.musicStep = 0;
    this.musicIntervalId = setInterval(() => {
      this.tickMusicStep();
    }, beatIntervalMs);
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.setLowHp(false);
  }

  public updateGameState(tier: SpeedTier, combo: number): void {
    this.currentTier = tier;
    this.currentCombo = combo;
  }

  private tickMusicStep(): void {
    if (!this.ctx || !this.musicGain || this.isMuted || this.externalMusicActive) return;
    const now = this.ctx.currentTime;
    const step = this.musicStep % 16;
    this.musicStep++;

    // Layer 1: Ambient synth pad / root pulse (Always on)
    if (step === 0 || step === 8) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now); // A2

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.5);
    }

    // Layer 2: Bassline (Active in FAST and above, or combo >= 5)
    if ((this.currentTier !== 'NORMAL' || this.currentCombo >= 5) && step % 4 === 0) {
      const bassNotes = [55, 55, 65.4, 73.4]; // A1, C2, D2
      const note = bassNotes[(step / 4) % bassNotes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    // Layer 3: Percussion beat / kick & hi-hat (Active in TURBO and above)
    if (this.currentTier === 'TURBO' || this.currentTier === 'OVERDRIVE' || this.currentTier === 'GODSPEED') {
      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.12);
      }
      // Hi-hat on every step
      if (step % 2 === 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(6000 + Math.random() * 1000, now);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.03);
      }
    }

    // Layer 4: High energetic arpeggio (Active in OVERDRIVE and GODSPEED)
    if (this.currentTier === 'OVERDRIVE' || this.currentTier === 'GODSPEED') {
      const arpNotes = [440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25];
      const freq = arpNotes[step % arpNotes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = this.currentTier === 'GODSPEED' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  public destroy(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
