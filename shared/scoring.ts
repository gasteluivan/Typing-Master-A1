/**
 * Pure scoring calculation functions used by client and verification backend
 */
import { FLOW_CONFIG, SPEED_TIERS, TIMING_THRESHOLDS } from './config';
import { ScoreCalculationInput, ScoreResult, TimingRating } from './types';

export function calculateTimingRating(timeAliveMs: number, totalFallTimeMs: number): TimingRating {
  if (totalFallTimeMs <= 0) {
    return { rating: 'GOOD', multiplier: 1.0, bonusPercent: 0 };
  }

  const ratio = timeAliveMs / totalFallTimeMs;
  if (ratio <= TIMING_THRESHOLDS.parTimeRatio) {
    return { rating: 'PERFECT', multiplier: 1.5, bonusPercent: 50 };
  }
  if (ratio <= TIMING_THRESHOLDS.greatTimeRatio) {
    return { rating: 'GREAT', multiplier: 1.25, bonusPercent: 25 };
  }
  return { rating: 'GOOD', multiplier: 1.0, bonusPercent: 0 };
}

export function calculateWordScore(input: ScoreCalculationInput): ScoreResult {
  const {
    wordLength,
    fallProgress,
    timeAliveMs,
    totalFallTimeMs,
    combo,
    speedTier,
    rollingAccuracy,
    isOverclock,
  } = input;

  // Base score based on word length
  const base = Math.max(10, wordLength * 10);

  // Height bonus: Higher up on screen (lower fallProgress) grants up to +50% bonus
  // clamped between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, fallProgress));
  const heightBonus = 1.0 + (1.0 - clampedProgress) * 0.5;

  // Timing bonus (par-time)
  const timingRating = calculateTimingRating(timeAliveMs, totalFallTimeMs);
  const timingBonus = timingRating.multiplier;

  // Combo multiplier: scales smoothly with combo count
  // e.g. combo 0 -> 1.0, combo 10 -> 1.5, combo 20 -> 2.0 (cap at 2.5)
  const comboMultiplier = 1.0 + Math.min(combo * 0.05, 2.0);

  // Speed multiplier: active ONLY if rollingAccuracy >= minAccuracyForTierBonus (92%)
  const tierConfig = SPEED_TIERS[speedTier] || SPEED_TIERS.NORMAL;
  const speedMultiplier =
    rollingAccuracy >= FLOW_CONFIG.minAccuracyForTierBonus
      ? tierConfig.multiplier
      : 1.0;

  // Overclock multiplier
  const overclockMultiplier = isOverclock ? FLOW_CONFIG.overclockMultiplier : 1.0;

  // HARD CAP 6.0: points = round( base * heightBonus * timingBonus * min(comboMult * speedMult * overclockMult, 6.0) )
  const rawCombinedMult = comboMultiplier * speedMultiplier * overclockMultiplier;
  const cappedCombinedMult = Math.min(rawCombinedMult, FLOW_CONFIG.maxMultiplierCap);

  const rawScore = base * heightBonus * timingBonus * cappedCombinedMult;
  const points = Math.max(1, Math.round(rawScore));

  return {
    base,
    heightBonus,
    timingRating,
    comboMultiplier,
    speedMultiplier,
    overclockMultiplier,
    totalMultiplier: cappedCombinedMult,
    points,
  };
}

/**
 * Instantaneous WPM (sWPM) calculated over a rolling time window
 */
export function calculateSWPM(correctCharsInWindow: number, windowDurationSec: number): number {
  if (windowDurationSec <= 0) return 0;
  // Standard WPM definition: (characters / 5) / (seconds / 60)
  const words = correctCharsInWindow / 5;
  const minutes = windowDurationSec / 60;
  return Math.max(0, Math.round(words / minutes));
}

/**
 * Determine speed tier from sWPM and rolling accuracy
 */
export function determineSpeedTier(sWpm: number, rollingAccuracy: number): {
  tier: import('./types').SpeedTier;
  bonusActive: boolean;
} {
  const bonusActive = rollingAccuracy >= FLOW_CONFIG.minAccuracyForTierBonus;

  if (sWpm >= SPEED_TIERS.GODSPEED.minWpm) return { tier: 'GODSPEED', bonusActive };
  if (sWpm >= SPEED_TIERS.OVERDRIVE.minWpm) return { tier: 'OVERDRIVE', bonusActive };
  if (sWpm >= SPEED_TIERS.TURBO.minWpm) return { tier: 'TURBO', bonusActive };
  if (sWpm >= SPEED_TIERS.FAST.minWpm) return { tier: 'FAST', bonusActive };
  return { tier: 'NORMAL', bonusActive };
}
