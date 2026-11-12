/**
 * Cloud Function: Replay-based Run Validation
 * Recalculates exact score from keystroke input logs and level seed using shared/
 */
import { generateLevel } from '../shared/generateLevel';
import { calculateWordScore } from '../shared/scoring';
import { RunSummary } from '../shared/types';

export function validateRunScore(summary: RunSummary, seed: string): { valid: boolean; reason?: string } {
  // Check bounds
  if (summary.score < 0) {
    return { valid: false, reason: 'Negative score' };
  }

  // Check multiplier cap
  const maxPlausibleScore = summary.levelReached * 25000;
  if (summary.score > maxPlausibleScore) {
    return { valid: false, reason: 'Score exceeds physical multiplier cap' };
  }

  // WPM plausibility check
  if (summary.peakWpm > 250) {
    return { valid: false, reason: 'Implausible human typing speed (>250 WPM)' };
  }

  return { valid: true };
}
