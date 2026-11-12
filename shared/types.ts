/**
 * Shared types between Game Engine, Scoring, Renderers, and Validation
 */

export type SpeedTier = 'NORMAL' | 'FAST' | 'TURBO' | 'OVERDRIVE' | 'GODSPEED';

export interface SpeedTierConfig {
  tier: SpeedTier;
  minWpm: number;
  multiplier: number;
  label: string;
  color: string;
  glowColor: string;
  badgeBg: string;
}

export type SpecialWordType = 'freeze' | 'bomb' | 'shield' | 'repair' | 'multiplier';

export interface WordItem {
  id: string;
  text: string;
  typedIndex: number; // how many characters have been typed
  x: number; // 0 to 1 normalized horizontal position
  y: number; // 0 to 1 normalized vertical position (falls from 0 to 1)
  speed: number; // speed per second
  spawnTime: number; // timestamp in ms
  totalFallTime: number; // estimated duration from y=0 to y=1 in ms
  specialType?: SpecialWordType;
  isBossMinion?: boolean;
}

export interface BossEntity {
  id: string;
  title: string;
  phrase: string[]; // sequence of words to type
  currentWordIndex: number;
  currentTypedIndex: number;
  maxHp: number;
  hp: number;
  x: number;
  y: number;
  minionTimer: number;
  minionInterval: number;
}

export interface ScoreCalculationInput {
  wordLength: number;
  fallProgress: number; // 0 (top) to 1 (breached bottom)
  timeAliveMs: number;
  totalFallTimeMs: number;
  combo: number;
  speedTier: SpeedTier;
  rollingAccuracy: number;
  isOverclock: boolean;
  specialType?: SpecialWordType;
}

export interface TimingRating {
  rating: 'PERFECT' | 'GREAT' | 'GOOD';
  multiplier: number;
  bonusPercent: number;
}

export interface ScoreResult {
  base: number;
  heightBonus: number;
  timingRating: TimingRating;
  comboMultiplier: number;
  speedMultiplier: number;
  overclockMultiplier: number;
  totalMultiplier: number;
  points: number;
}

export interface KeystrokeLog {
  t: number; // milliseconds since run start
  key: string;
  correct: boolean;
  targetChar?: string;
  wordId?: string;
}

export interface KeyStats {
  hits: number;
  errors: number;
  totalLatencyMs: number;
  countLatency: number;
}

export interface BigramStats {
  pair: string;
  totalLatencyMs: number;
  count: number;
}

export interface RunSummary {
  runId: string;
  date: string;
  gameMode: 'classic' | 'daily' | 'training';
  score: number;
  wordsCleared: number;
  maxCombo: number;
  peakWpm: number;
  avgWpm: number;
  accuracy: number;
  consistencyMs: number; // std dev of keystroke intervals
  maxTier: SpeedTier;
  levelReached: number;
  bossesDefeated: number;
  powerupsUsed: number;
  inputLog?: KeystrokeLog[];
  weakKeys: string[];
  slowBigrams: string[];
}

export interface PilotProfile {
  xp: number;
  rank: PilotRank;
  streak: {
    current: number;
    best: number;
    lastPlayDate: string; // YYYY-MM-DD
    protectionUsedThisWeek: boolean;
  };
  unlocks: {
    cannonSkins: string[];
    capsuleStyles: string[];
    beamTrails: string[];
    backgroundPacks: string[];
  };
  activeCustomization: {
    cannonSkin: string;
    capsuleStyle: string;
    beamTrail: string;
    backgroundPack: string;
  };
  achievements: Record<string, number>; // id -> timestamp
  keyStats: Record<string, KeyStats>;
  bigramStats: Record<string, BigramStats>;
  highScores: {
    classic: number;
    daily: Record<string, number>;
  };
}

export type PilotRank = 'Cadete' | 'Piloto' | 'Ás' | 'Comandante' | 'Leyenda';
