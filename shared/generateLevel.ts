/**
 * Pure deterministic level generation
 */
import { PRNG } from './rng';
import { BossEntity, SpecialWordType, WordItem } from './types';
import { WORD_POOLS } from './words';

export interface LevelConfig {
  level: number;
  seed: string;
  wordCount: number;
  baseSpeed: number; // units per second (0 to 1)
  spawnIntervalMs: number;
  event: 'normal' | 'speed_storm' | 'zigzag' | 'cloaked';
  isBossLevel: boolean;
  boss?: BossEntity;
  words: {
    text: string;
    speed: number;
    delayMs: number;
    x: number;
    specialType?: SpecialWordType;
  }[];
}

const SPECIAL_TYPES: SpecialWordType[] = ['freeze', 'bomb', 'shield', 'repair', 'multiplier'];

export function generateLevel(level: number, baseSeed: string | number): LevelConfig {
  const seedString = `${baseSeed}_lvl_${level}`;
  const rng = new PRNG(seedString);

  const isBossLevel = level % 10 === 0;

  // Level speed scaling
  // level 1: ~0.08 / s (takes ~12.5s to fall)
  // level 5: ~0.12 / s
  // level 10: ~0.16 / s
  // level 20+: up to ~0.28 / s
  const baseSpeed = Math.min(0.07 + (level - 1) * 0.012, 0.32);

  // Number of regular words in level
  const wordCount = isBossLevel ? 6 : Math.min(8 + (level - 1) * 2, 28);

  // Event selection
  let event: LevelConfig['event'] = 'normal';
  if (!isBossLevel && level >= 3) {
    const eventRoll = rng.next();
    if (eventRoll < 0.25) {
      event = 'speed_storm';
    } else if (eventRoll < 0.45 && level >= 5) {
      event = 'zigzag';
    } else if (eventRoll < 0.60 && level >= 8) {
      event = 'cloaked';
    }
  }

  // Word pool selection according to level
  let primaryPool: readonly string[] = WORD_POOLS.tier1;
  let secondaryPool: readonly string[] = WORD_POOLS.tier2;

  if (level >= 8) {
    primaryPool = WORD_POOLS.tier3;
    secondaryPool = WORD_POOLS.tier2;
  } else if (level >= 4) {
    primaryPool = WORD_POOLS.tier2;
    secondaryPool = WORD_POOLS.tier1;
  }

  const generatedWords: LevelConfig['words'] = [];
  let currentDelay = 800; // first word spawns after 800ms

  for (let i = 0; i < wordCount; i++) {
    // Choose pool
    const pool = rng.next() < 0.75 ? primaryPool : secondaryPool;
    const text = rng.choice(pool).toLowerCase();

    // Horizontal position: avoid right against edges (0.12 to 0.88)
    const x = rng.nextFloat(0.12, 0.88);

    // Speed variation per word (+- 15%)
    let speed = baseSpeed * rng.nextFloat(0.9, 1.15);
    if (event === 'speed_storm') {
      speed *= 1.35;
    }

    // Special word probability: ~15% chance
    let specialType: SpecialWordType | undefined = undefined;
    if (rng.next() < 0.16) {
      specialType = rng.choice(SPECIAL_TYPES);
    }

    generatedWords.push({
      text,
      speed,
      delayMs: currentDelay,
      x,
      specialType,
    });

    // Stagger spawn intervals
    const interval = Math.max(1200, (4500 - level * 160) * rng.nextFloat(0.85, 1.15));
    currentDelay += interval;
  }

  // If Boss Level, build Boss entity
  let boss: BossEntity | undefined = undefined;
  if (isBossLevel) {
    const bossTemplate = WORD_POOLS.bossPhrases[(Math.floor(level / 10) - 1) % WORD_POOLS.bossPhrases.length];
    const totalBossHp = bossTemplate.words.reduce((sum, w) => sum + w.length, 0);

    boss = {
      id: `boss_${level}`,
      title: bossTemplate.title,
      phrase: bossTemplate.words,
      currentWordIndex: 0,
      currentTypedIndex: 0,
      maxHp: totalBossHp,
      hp: totalBossHp,
      x: 0.5,
      y: 0.15,
      minionTimer: 0,
      minionInterval: 3500,
    };
  }

  return {
    level,
    seed: seedString,
    wordCount,
    baseSpeed,
    spawnIntervalMs: 2500,
    event,
    isBossLevel,
    boss,
    words: generatedWords,
  };
}
