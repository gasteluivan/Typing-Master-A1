/**
 * Core Game Engine: Orchestrates simulation loop, flow system,
 * deterministic level spawning, special abilities, boss battles,
 * performance governor, and audio/fx triggers.
 */
import { FLOW_CONFIG, SPEED_TIERS } from '../../shared/config';
import { generateLevel, LevelConfig } from '../../shared/generateLevel';
import { calculateSWPM, calculateWordScore, determineSpeedTier } from '../../shared/scoring';
import {
  BossEntity,
  KeystrokeLog,
  RunSummary,
  SpecialWordType,
  SpeedTier,
  WordItem,
} from '../../shared/types';
import { SoundManager } from '../audio/SoundManager';
import { FXManager } from '../fx/FXManager';
import { IRenderer, RenderFrameState } from '../render/IRenderer';

export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface GameEngineOptions {
  sound: SoundManager;
  fx: FXManager;
  renderer: IRenderer;
  onStateChange?: (state: GameState) => void;
  onScoreUpdate?: (score: number, combo: number, wpm: number, tier: SpeedTier) => void;
  onGameOver?: (summary: RunSummary) => void;
}

export class GameEngine {
  public state: GameState = 'title';
  public gameMode: 'classic' | 'daily' | 'training' = 'classic';
  public seed = 'arcade_master';

  // Game run metrics
  public level = 1;
  public score = 0;
  public combo = 0;
  public maxCombo = 0;
  public lives = 5;
  public maxLives = 5;
  public wordsCleared = 0;
  public bossesDefeated = 0;
  public powerupsUsed = 0;
  public runStartTime = 0;
  public hasShield = false;

  // Active entities
  public activeWords: WordItem[] = [];
  public currentTargetId: string | null = null;
  public boss: BossEntity | undefined = undefined;
  private levelConfig: LevelConfig | null = null;
  private wordSpawnQueue: {
    text: string;
    speed: number;
    delayMs: number;
    x: number;
    specialType?: SpecialWordType;
  }[] = [];
  private levelTimer = 0;

  // Flow & Speed system
  public flowMeter = 0; // 0 to 100
  public speedTier: SpeedTier = 'NORMAL';
  public sWpm = 0;
  public peakWpm = 0;
  public rollingAccuracy = 1.0;
  public isOverclock = false;
  private overclockTimer = 0;
  private tierHoldTimer = 0; // hysteresis
  private lastKeystrokeTime = 0;

  // Special effects timers
  private freezeTimer = 0;
  private multiplierTimer = 0;

  // Input & analytics recording
  public keystrokeLog: KeystrokeLog[] = [];
  private rollingKeystrokes: { t: number; correct: boolean }[] = [];
  private recentCharsInWindow: { t: number }[] = [];
  public wpmTimeline: { tSec: number; wpm: number }[] = [];
  private wpmTimelineSampleTimer = 0;

  // Cannon state
  public cannon = {
    x: 0.5,
    y: 0.94,
    angle: -Math.PI / 2,
    isFiring: false,
    barrelRecoil: 0,
    skin: 'default',
    beamTrail: 'laser',
  };

  // Performance Governor
  public qualityPreset: 'HIGH' | 'MED' | 'LOW' = 'HIGH';
  public reducedEffects = false;
  private frameTimes: number[] = [];
  private lastFrameTimestamp = 0;
  private isAutoGovernorActive = true;

  // Subsystems
  public sound: SoundManager;
  public fx: FXManager;
  public renderer: IRenderer;

  // Callbacks
  private onStateChange?: (state: GameState) => void;
  private onScoreUpdate?: (score: number, combo: number, wpm: number, tier: SpeedTier) => void;
  private onGameOver?: (summary: RunSummary) => void;

  // Animation frame id
  private rafId: number | null = null;
  private isRunning = false;

  constructor(options: GameEngineOptions) {
    this.sound = options.sound;
    this.fx = options.fx;
    this.renderer = options.renderer;
    this.onStateChange = options.onStateChange;
    this.onScoreUpdate = options.onScoreUpdate;
    this.onGameOver = options.onGameOver;
  }

  public startGame(mode: 'classic' | 'daily' | 'training', customSeed?: string, startLevel = 1): void {
    this.gameMode = mode;
    this.seed = customSeed || (mode === 'daily' ? `daily_${new Date().toISOString().split('T')[0]}` : `run_${Date.now()}`);
    this.level = startLevel;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lives = mode === 'training' ? 999 : 5;
    this.maxLives = 5;
    this.wordsCleared = 0;
    this.bossesDefeated = 0;
    this.powerupsUsed = 0;
    this.hasShield = false;

    this.flowMeter = 0;
    this.speedTier = 'NORMAL';
    this.sWpm = 0;
    this.peakWpm = 0;
    this.rollingAccuracy = 1.0;
    this.isOverclock = false;
    this.overclockTimer = 0;
    this.tierHoldTimer = 0;
    this.lastKeystrokeTime = 0;

    this.freezeTimer = 0;
    this.multiplierTimer = 0;

    this.keystrokeLog = [];
    this.rollingKeystrokes = [];
    this.recentCharsInWindow = [];
    this.wpmTimeline = [{ tSec: 0, wpm: 0 }];
    this.wpmTimelineSampleTimer = 0;

    this.activeWords = [];
    this.currentTargetId = null;
    this.boss = undefined;

    this.runStartTime = performance.now();
    this.lastFrameTimestamp = performance.now();

    this.fx.clear();
    this.loadLevel(this.level);

    this.setState('playing');
    this.sound.startMusic(this.level);

    if (!this.isRunning) {
      this.isRunning = true;
      this.loop = this.loop.bind(this);
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  public pauseGame(): void {
    if (this.state === 'playing') {
      this.setState('paused');
      this.sound.stopMusic();
    }
  }

  public resumeGame(): void {
    if (this.state === 'paused') {
      this.setState('playing');
      this.lastFrameTimestamp = performance.now();
      this.sound.startMusic(this.level);
    }
  }

  public restartGame(): void {
    this.startGame(this.gameMode, this.seed, 1);
  }

  private setState(newState: GameState): void {
    this.state = newState;
    document.body.dataset.state = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  private loadLevel(lvl: number): void {
    this.level = lvl;
    this.levelConfig = generateLevel(lvl, this.seed);
    this.wordSpawnQueue = [...this.levelConfig.words];
    this.levelTimer = 0;
    this.boss = this.levelConfig.boss;

    // Level Announcement Banner
    this.fx.showBanner(
      this.levelConfig.isBossLevel ? `¡ALERTA DE JEFE: NIVEL ${lvl}!` : `NIVEL ${lvl}`,
      this.levelConfig.event !== 'normal' ? `EVENTO: ${this.levelConfig.event.toUpperCase()}` : undefined,
      this.levelConfig.isBossLevel ? '#f43f5e' : '#38bdf8',
      2.0
    );
  }

  // --- INPUT HANDLING ---

  public handleKeyPress(rawKey: string): void {
    if (this.state !== 'playing') return;

    const key = rawKey.toLowerCase();
    const now = performance.now();
    const runTimeMs = now - this.runStartTime;

    // 1. Space Bar -> Activate Overclock if flowMeter is 100
    if (rawKey === ' ' || rawKey === 'Space') {
      if (this.flowMeter >= FLOW_CONFIG.maxFlowMeter && !this.isOverclock) {
        this.activateOverclock();
        return;
      }
    }

    if (key.length !== 1) return; // ignore meta keys

    // Check target word or find new match
    let targetWord = this.activeWords.find((w) => w.id === this.currentTargetId);

    // If no target locked, find oldest active word starting with this letter
    if (!targetWord) {
      const candidates = this.activeWords.filter(
        (w) => w.typedIndex === 0 && w.text.startsWith(key)
      );
      if (candidates.length > 0) {
        // Target lowest on screen (highest y)
        candidates.sort((a, b) => b.y - a.y);
        targetWord = candidates[0];
        this.currentTargetId = targetWord.id;
      }
    }

    // Check boss if no normal word matched and boss is active
    let isBossHit = false;
    if (!targetWord && this.boss) {
      const bossCurrentWord = this.boss.phrase[this.boss.currentWordIndex] || '';
      const expectedChar = bossCurrentWord[this.boss.currentTypedIndex];
      if (expectedChar && expectedChar.toLowerCase() === key) {
        isBossHit = true;
      }
    }

    const isMatch = (targetWord && targetWord.text[targetWord.typedIndex] === key) || isBossHit;

    // Log Keystroke
    this.keystrokeLog.push({
      t: Math.round(runTimeMs),
      key,
      correct: !!isMatch,
      targetChar: targetWord ? targetWord.text[targetWord.typedIndex] : undefined,
      wordId: targetWord?.id,
    });

    // Update rolling accuracy
    this.rollingKeystrokes.push({ t: now, correct: !!isMatch });
    if (this.rollingKeystrokes.length > FLOW_CONFIG.rollingAccuracyWindow) {
      this.rollingKeystrokes.shift();
    }
    const correctCount = this.rollingKeystrokes.filter((k) => k.correct).length;
    this.rollingAccuracy = correctCount / this.rollingKeystrokes.length;

    this.lastKeystrokeTime = now;

    if (isMatch) {
      // Correct stroke!
      this.sound.playKeyHit();
      this.recentCharsInWindow.push({ t: now });

      // Increase flow meter
      this.flowMeter = Math.min(
        FLOW_CONFIG.maxFlowMeter,
        this.flowMeter + FLOW_CONFIG.flowGainPerChar
      );

      // Aim cannon at target
      if (targetWord) {
        const dx = targetWord.x - this.cannon.x;
        const dy = targetWord.y - this.cannon.y;
        this.cannon.angle = Math.atan2(dy, dx);
        this.cannon.isFiring = true;
        this.cannon.barrelRecoil = 1.0;

        targetWord.typedIndex += 1;

        // Spawn rapid laser beam
        this.fx.spawnLaser(
          this.cannon.x,
          this.cannon.y,
          targetWord.x,
          targetWord.y,
          this.speedTier,
          this.isOverclock
        );

        // Check if word completed!
        if (targetWord.typedIndex >= targetWord.text.length) {
          this.destroyWord(targetWord);
        }
      } else if (isBossHit && this.boss) {
        // Aim at boss
        const dx = this.boss.x - this.cannon.x;
        const dy = this.boss.y - this.cannon.y;
        this.cannon.angle = Math.atan2(dy, dx);
        this.cannon.isFiring = true;
        this.cannon.barrelRecoil = 1.0;

        this.boss.currentTypedIndex += 1;
        this.boss.hp = Math.max(0, this.boss.hp - 1);

        this.fx.spawnLaser(
          this.cannon.x,
          this.cannon.y,
          this.boss.x,
          this.boss.y,
          this.speedTier,
          this.isOverclock
        );

        const currentWord = this.boss.phrase[this.boss.currentWordIndex];
        if (this.boss.currentTypedIndex >= currentWord.length) {
          this.boss.currentWordIndex += 1;
          this.boss.currentTypedIndex = 0;
          this.sound.playWordDestroyed(this.combo, true);

          if (this.boss.currentWordIndex >= this.boss.phrase.length) {
            this.defeatBoss();
          }
        }
      }
    } else {
      // Error stroke!
      this.sound.playKeyError();
      this.combo = 0;
      this.flowMeter = Math.max(0, this.flowMeter - FLOW_CONFIG.flowLossPerError);
      this.fx.addTrauma(0.15);
    }
  }

  private destroyWord(word: WordItem): void {
    const now = performance.now();
    const timeAliveMs = now - word.spawnTime;
    const isPerfect = timeAliveMs <= word.totalFallTime * 0.5;

    // Calculate score
    const scoreResult = calculateWordScore({
      wordLength: word.text.length,
      fallProgress: word.y,
      timeAliveMs,
      totalFallTimeMs: word.totalFallTime,
      combo: this.combo,
      speedTier: this.speedTier,
      rollingAccuracy: this.rollingAccuracy,
      isOverclock: this.isOverclock || this.multiplierTimer > 0,
      specialType: word.specialType,
    });

    this.score += scoreResult.points;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.wordsCleared += 1;

    // Audio & FX
    this.sound.playWordDestroyed(this.combo, isPerfect);
    this.fx.spawnWordExplosion(word.x, word.y, word.text, this.speedTier, isPerfect);

    // Floating Popup
    const ratingLabel = isPerfect ? 'PERFECT' : scoreResult.timingRating.rating === 'GREAT' ? 'GREAT' : undefined;
    const tierLabel = this.speedTier !== 'NORMAL' ? `+${scoreResult.speedMultiplier}x ${this.speedTier}` : undefined;
    this.fx.addScorePopup(word.x, word.y, scoreResult.points, ratingLabel, tierLabel);

    // Milestone announcement check
    if (this.combo === 10 || this.combo === 25 || this.combo === 50 || this.combo === 100) {
      this.fx.showBanner(`COMBO ×${this.combo}!`, '¡PRECISIÓN EN CADENA!', '#facc15', 1.8);
      this.fx.triggerZoomPunch(0.04);
    }

    // Special word ability trigger
    if (word.specialType) {
      this.activateSpecial(word.specialType);
    }

    // Remove word
    this.activeWords = this.activeWords.filter((w) => w.id !== word.id);
    if (this.currentTargetId === word.id) {
      this.currentTargetId = null;
    }

    // Check if level clear
    this.checkLevelProgression();
  }

  private activateSpecial(type: SpecialWordType): void {
    this.powerupsUsed += 1;
    this.sound.playSpecial(type);

    if (type === 'freeze') {
      this.freezeTimer = 4.0; // 4s freeze
      this.fx.showBanner('CERO ABSOLUTO ❄', 'PALABRAS RALENTIZADAS POR 4s', '#38bdf8', 1.5);
    } else if (type === 'bomb') {
      this.fx.showBanner('DETONACIÓN TÁCTICA 💣', 'PANTALLA LIMPIA', '#f97316', 1.5);
      this.fx.addTrauma(0.5);
      for (const w of [...this.activeWords]) {
        this.fx.spawnWordExplosion(w.x, w.y, w.text, this.speedTier, false);
        this.score += 25; // reduced points per cleared word
      }
      this.activeWords = [];
      this.currentTargetId = null;
      this.checkLevelProgression();
    } else if (type === 'shield') {
      this.hasShield = true;
      this.fx.showBanner('ESCUDO ACTIVADO 🛡', 'PRÓXIMO IMPACTO ABSORBIDO', '#3b82f6', 1.5);
    } else if (type === 'repair') {
      this.lives = Math.min(this.maxLives, this.lives + 1);
      this.sound.setLowHp(this.lives <= 2);
      this.fx.showBanner('SISTEMAS REPARADOS ❤', '+1 CORAZÓN DE ENERGÍA', '#22c55e', 1.5);
    } else if (type === 'multiplier') {
      this.multiplierTimer = 8.0; // 8s of 2x boost
      this.fx.showBanner('MULTIPLICADOR ×2 ✖', 'DOBLE PUNTAJE POR 8s', '#eab308', 1.5);
    }
  }

  public activateOverclock(): void {
    if (this.flowMeter < FLOW_CONFIG.maxFlowMeter || this.isOverclock) return;
    this.isOverclock = true;
    this.overclockTimer = FLOW_CONFIG.overclockDurationMs / 1000;
    this.flowMeter = 0;
    this.sound.playOverclock();
    this.fx.showBanner('¡OVERCLOCK ACTIVADO!', 'SOBRECARGA DE ENERGÍA ×2', '#eab308', 2.0);
    this.fx.triggerZoomPunch(0.04);
    this.fx.addTrauma(0.3);
  }

  private defeatBoss(): void {
    if (!this.boss) return;
    this.bossesDefeated += 1;
    this.score += 1500;
    this.fx.spawnWordExplosion(this.boss.x, this.boss.y, 'DREADNOUGHT', 'GODSPEED', true);
    this.fx.showBanner('¡JEFE DESTRUIDO!', '+1500 PUNTOS DE BONO', '#f43f5e', 3.0);
    this.fx.triggerSlowmo(600, 0.4);
    this.fx.addTrauma(0.8);
    this.boss = undefined;
    this.checkLevelProgression();
  }

  private handleBreach(word: WordItem): void {
    // Word reached bottom
    this.activeWords = this.activeWords.filter((w) => w.id !== word.id);
    if (this.currentTargetId === word.id) {
      this.currentTargetId = null;
    }

    if (this.hasShield) {
      // Shield absorbs breach!
      this.hasShield = false;
      this.fx.showBanner('¡ESCUDO DEFENSIVO AGOTADO!', 'FALLO ABSORBIDO', '#3b82f6', 1.5);
      this.fx.addTrauma(0.3);
      this.sound.playSpecial('shield');
      return;
    }

    // Damage taken
    this.lives = Math.max(0, this.lives - 1);
    this.combo = 0;
    this.flowMeter = 0; // empties meter
    this.dropTierOneLevel(); // loses one flow tier

    this.fx.addTrauma(0.45);
    this.fx.spawnShockwave(word.x, 0.88, 'rgba(239, 68, 68, 0.9)');
    this.sound.playKeyError();

    this.sound.setLowHp(this.lives <= 2);

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  private dropTierOneLevel(): void {
    if (this.speedTier === 'GODSPEED') this.speedTier = 'OVERDRIVE';
    else if (this.speedTier === 'OVERDRIVE') this.speedTier = 'TURBO';
    else if (this.speedTier === 'TURBO') this.speedTier = 'FAST';
    else this.speedTier = 'NORMAL';
  }

  private checkLevelProgression(): void {
    // Next level if queue empty, no words left, and boss dead
    if (this.wordSpawnQueue.length === 0 && this.activeWords.length === 0 && !this.boss) {
      this.loadLevel(this.level + 1);
    }
  }

  private triggerGameOver(): void {
    this.setState('gameover');
    this.sound.stopMusic();
    this.fx.triggerSlowmo(700, 0.35);

    // Build run summary
    const durationSec = Math.max(1, (performance.now() - this.runStartTime) / 1000);
    const avgWpm = Math.round((this.wordsCleared * 5) / (durationSec / 60));

    // Calculate consistency: standard deviation of keystroke intervals
    let consistencyMs = 0;
    if (this.keystrokeLog.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.keystrokeLog.length; i++) {
        intervals.push(this.keystrokeLog[i].t - this.keystrokeLog[i - 1].t);
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
      consistencyMs = Math.round(Math.sqrt(variance));
    }

    const summary: RunSummary = {
      runId: `run_${Date.now()}`,
      date: new Date().toISOString(),
      gameMode: this.gameMode,
      score: this.score,
      wordsCleared: this.wordsCleared,
      maxCombo: this.maxCombo,
      peakWpm: this.peakWpm,
      avgWpm,
      accuracy: Math.round(this.rollingAccuracy * 100) / 100,
      consistencyMs,
      maxTier: this.speedTier,
      levelReached: this.level,
      bossesDefeated: this.bossesDefeated,
      powerupsUsed: this.powerupsUsed,
      inputLog: this.keystrokeLog,
      weakKeys: [],
      slowBigrams: [],
    };

    if (this.onGameOver) {
      this.onGameOver(summary);
    }
  }

  // --- MAIN SIMULATION LOOP (Decoupled & Clamped dt <= 0.05s) ---

  private loop(timestamp: number): void {
    if (!this.isRunning) return;

    const rawDt = Math.max(0.001, (timestamp - this.lastFrameTimestamp) / 1000);
    this.lastFrameTimestamp = timestamp;
    const realDt = Math.min(rawDt, 0.05); // clamped dt

    // Performance Governor: measure frame times
    if (this.isAutoGovernorActive) {
      this.frameTimes.push(rawDt * 1000);
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
        const avgFrameMs = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        if (avgFrameMs > 22 && this.qualityPreset === 'HIGH') {
          this.qualityPreset = 'MED';
        } else if (avgFrameMs > 25 && this.qualityPreset === 'MED') {
          this.qualityPreset = 'LOW';
        }
      }
    }

    if (this.state === 'playing') {
      // Advance FX (ticking in realDt)
      const fxState = this.fx.update(realDt);

      // Simulation ticks in simDt (respects hitstop and slowmo)
      const simDt = this.fx.hitstopTimer > 0 ? 0 : realDt * this.fx.timeScale;

      if (simDt > 0) {
        this.updateSimulation(simDt, timestamp);
      }

      // Update Cannon barrel recoil
      this.cannon.barrelRecoil = Math.max(0, this.cannon.barrelRecoil - realDt * 4.0);
      this.cannon.isFiring = false;

      // Render frame
      const frameState: RenderFrameState = {
        timeMs: timestamp,
        dt: realDt,
        words: this.activeWords,
        currentTargetId: this.currentTargetId,
        cannon: this.cannon,
        boss: this.boss,
        lasers: fxState.lasers,
        shockwaves: fxState.shockwaves,
        particles: fxState.particles,
        popups: fxState.popups,
        speedTier: this.speedTier,
        isOverclock: this.isOverclock,
        lives: this.lives,
        maxLives: this.maxLives,
        cameraShake: {
          x: fxState.shakeX,
          y: fxState.shakeY,
          zoom: fxState.zoom,
        },
        qualityPreset: this.qualityPreset,
        reducedEffects: this.reducedEffects,
        backgroundPack: 'deep_space',
      };

      this.renderer.render(frameState);

      // Notify UI
      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.score, this.combo, this.sWpm, this.speedTier);
      }
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  private updateSimulation(dt: number, timestamp: number): void {
    this.levelTimer += dt * 1000;

    // 1. Spawning words from queue
    while (
      this.wordSpawnQueue.length > 0 &&
      this.levelTimer >= this.wordSpawnQueue[0].delayMs
    ) {
      const item = this.wordSpawnQueue.shift()!;
      const totalFallTime = (0.88 / item.speed) * 1000;

      this.activeWords.push({
        id: `w_${Date.now()}_${Math.random()}`,
        text: item.text,
        typedIndex: 0,
        x: item.x,
        y: 0.05,
        speed: item.speed,
        spawnTime: performance.now(),
        totalFallTime,
        specialType: item.specialType,
      });
    }

    // 2. Boss minion spawning if boss active
    if (this.boss) {
      this.boss.minionTimer += dt * 1000;
      if (this.boss.minionTimer >= this.boss.minionInterval) {
        this.boss.minionTimer = 0;
        const minionWord = 'drone';
        this.activeWords.push({
          id: `boss_minion_${Date.now()}`,
          text: minionWord,
          typedIndex: 0,
          x: Math.random() * 0.7 + 0.15,
          y: this.boss.y + 0.05,
          speed: 0.12,
          spawnTime: performance.now(),
          totalFallTime: (0.88 / 0.12) * 1000,
          isBossMinion: true,
        });
      }
    }

    // 3. Falling words movement & breach check
    const freezeFactor = this.freezeTimer > 0 ? 0.35 : 1.0;
    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - dt);
    }
    if (this.multiplierTimer > 0) {
      this.multiplierTimer = Math.max(0, this.multiplierTimer - dt);
    }

    for (let i = this.activeWords.length - 1; i >= 0; i--) {
      const word = this.activeWords[i];
      word.y += word.speed * freezeFactor * dt;

      // Event zig-zag movement
      if (this.levelConfig?.event === 'zigzag') {
        word.x += Math.sin((timestamp * 0.003) + i) * dt * 0.08;
        word.x = Math.max(0.1, Math.min(0.9, word.x));
      }

      // Check breach of defense line (y >= 0.88)
      if (word.y >= 0.88) {
        this.handleBreach(word);
      }
    }

    // 4. Overclock timer
    if (this.isOverclock) {
      this.overclockTimer -= dt;
      if (this.overclockTimer <= 0) {
        this.isOverclock = false;
      }
    }

    // 5. Flow meter decay when paused typing > 1.5s
    const timeSinceLastKey = performance.now() - this.lastKeystrokeTime;
    if (timeSinceLastKey > FLOW_CONFIG.flowDecayPauseMs && !this.isOverclock) {
      this.flowMeter = Math.max(
        0,
        this.flowMeter - FLOW_CONFIG.flowDecayRatePerSec * dt
      );
    }

    // 6. Recalculate sWPM (characters in last 5s / 5 / (5/60))
    const now = performance.now();
    this.recentCharsInWindow = this.recentCharsInWindow.filter(
      (c) => now - c.t <= FLOW_CONFIG.rollingWindowMs
    );
    this.sWpm = calculateSWPM(this.recentCharsInWindow.length, FLOW_CONFIG.rollingWindowMs / 1000);
    this.peakWpm = Math.max(this.peakWpm, this.sWpm);

    // 7. Speed Tier evaluation with hysteresis & accuracy gate
    const targetTierInfo = determineSpeedTier(this.sWpm, this.rollingAccuracy);
    const oldTier = this.speedTier;

    if (targetTierInfo.tier !== this.speedTier) {
      // If going up: immediate upgrade!
      const tierRank: Record<SpeedTier, number> = {
        NORMAL: 0,
        FAST: 1,
        TURBO: 2,
        OVERDRIVE: 3,
        GODSPEED: 4,
      };

      if (tierRank[targetTierInfo.tier] > tierRank[this.speedTier]) {
        this.speedTier = targetTierInfo.tier;
        this.tierHoldTimer = FLOW_CONFIG.tierHysteresisMs / 1000;
        this.sound.playTierUp(this.speedTier);
        this.fx.showBanner(
          `¡${SPEED_TIERS[this.speedTier].label}!`,
          `BONO DE VELOCIDAD ${SPEED_TIERS[this.speedTier].multiplier}×`,
          SPEED_TIERS[this.speedTier].color,
          1.8
        );
      } else {
        // Going down: apply hysteresis hold timer
        this.tierHoldTimer -= dt;
        if (this.tierHoldTimer <= 0) {
          this.speedTier = targetTierInfo.tier;
        }
      }
    }

    // Update sound layered music state
    this.sound.updateGameState(this.speedTier, this.combo);

    // 8. Sample WPM timeline for post-match analytics
    this.wpmTimelineSampleTimer += dt;
    if (this.wpmTimelineSampleTimer >= 1.0) {
      this.wpmTimelineSampleTimer = 0;
      const tSec = Math.round((now - this.runStartTime) / 1000);
      this.wpmTimeline.push({ tSec, wpm: this.sWpm });
    }
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.sound.destroy();
    this.renderer.destroy();
  }
}
