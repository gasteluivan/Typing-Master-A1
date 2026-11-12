/**
 * Adaptive Word Generator for Training Mode (Unranked)
 * Generates words weighted towards the player's weak keys and slowest bigrams
 */
import { PilotProfile, WordItem } from '../../shared/types';
import { WORD_POOLS } from '../../shared/words';

export function generateAdaptiveWords(profile: PilotProfile, count = 12): string[] {
  // 1. Identify weak keys (errors > 0)
  const weakKeys = Object.entries(profile.keyStats)
    .filter(([_, stats]) => stats.errors > 0)
    .sort((a, b) => b[1].errors - a[1].errors)
    .map(([k]) => k.toLowerCase());

  // All available words
  const allWords = [...WORD_POOLS.tier1, ...WORD_POOLS.tier2, ...WORD_POOLS.tier3];

  if (weakKeys.length === 0) {
    // If no weak keys yet, return random mix
    return allWords.slice(0, count);
  }

  // Score words by how many weak keys they contain
  const scoredWords = allWords.map((word) => {
    let score = 0;
    for (const key of weakKeys.slice(0, 5)) {
      if (word.includes(key)) {
        score += 2;
      }
    }
    return { word, score };
  });

  scoredWords.sort((a, b) => b.score - a.score);

  // Return top weighted words
  const result: string[] = [];
  for (const item of scoredWords) {
    if (!result.includes(item.word)) {
      result.push(item.word);
    }
    if (result.length >= count) break;
  }

  return result;
}
