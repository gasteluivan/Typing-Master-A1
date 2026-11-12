/**
 * Game configuration constants and rules
 */
import { SpeedTier, SpeedTierConfig, PilotRank } from './types';

export const SPEED_TIERS: Record<SpeedTier, SpeedTierConfig> = {
  NORMAL: {
    tier: 'NORMAL',
    minWpm: 0,
    multiplier: 1.0,
    label: 'NORMAL',
    color: '#94a3b8', // slate-400
    glowColor: 'rgba(148, 163, 184, 0.4)',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  FAST: {
    tier: 'FAST',
    minWpm: 35,
    multiplier: 1.25,
    label: 'FAST',
    color: '#06b6d4', // cyan-500
    glowColor: 'rgba(6, 182, 212, 0.6)',
    badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20 shadow-md',
  },
  TURBO: {
    tier: 'TURBO',
    minWpm: 55,
    multiplier: 1.5,
    label: 'TURBO',
    color: '#3b82f6', // blue-500
    glowColor: 'rgba(59, 130, 246, 0.7)',
    badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-500/50 shadow-blue-500/30 shadow-md',
  },
  OVERDRIVE: {
    tier: 'OVERDRIVE',
    minWpm: 80,
    multiplier: 2.0,
    label: 'OVERDRIVE',
    color: '#a855f7', // purple-500
    glowColor: 'rgba(168, 85, 247, 0.8)',
    badgeBg: 'bg-purple-950/80 text-purple-200 border-purple-500/60 shadow-purple-500/40 shadow-lg',
  },
  GODSPEED: {
    tier: 'GODSPEED',
    minWpm: 100,
    multiplier: 2.5,
    label: 'GODSPEED',
    color: '#eab308', // gold / yellow-500
    glowColor: 'rgba(234, 179, 8, 0.9)',
    badgeBg: 'bg-amber-950/80 text-amber-200 border-amber-400 shadow-amber-400/50 shadow-xl animate-pulse',
  },
};

export const FLOW_CONFIG = {
  minAccuracyForTierBonus: 0.92, // rolling accuracy must be >= 92% to receive tier multiplier
  tierHysteresisMs: 1500, // hold tier for 1.5s before dropping
  maxMultiplierCap: 6.0, // HARD CAP for combined combo * speed * overclock
  rollingWindowMs: 5000, // 5 second window for sWPM calculation
  rollingAccuracyWindow: 30, // last 30 keystrokes
  maxPopups: 12, // max active floating popups before coalescing
  overclockDurationMs: 5000, // 5 seconds of Overclock mode
  overclockMultiplier: 2.0,
  maxFlowMeter: 100,
  flowGainPerChar: 4,
  flowLossPerError: 15,
  flowDecayPauseMs: 1500, // decay starts after 1.5s of no typing
  flowDecayRatePerSec: 20,
};

export const TIMING_THRESHOLDS = {
  parTimeRatio: 0.5, // destroyed before 50% fall time = PERFECT (+50% base)
  greatTimeRatio: 0.75, // destroyed before 75% fall time = GREAT (+25% base)
};

export const RANKS_CONFIG: { rank: PilotRank; xpThreshold: number; badgeColor: string }[] = [
  { rank: 'Cadete', xpThreshold: 0, badgeColor: 'text-slate-400' },
  { rank: 'Piloto', xpThreshold: 1000, badgeColor: 'text-cyan-400' },
  { rank: 'Ás', xpThreshold: 3500, badgeColor: 'text-blue-400' },
  { rank: 'Comandante', xpThreshold: 8000, badgeColor: 'text-purple-400' },
  { rank: 'Leyenda', xpThreshold: 18000, badgeColor: 'text-amber-400' },
];
