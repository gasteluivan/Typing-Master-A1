/**
 * Profile storage, XP, Ranks, Streaks, Ghost storage and Key Analytics
 */
import { RANKS_CONFIG } from '../../shared/config';
import { PilotProfile, PilotRank, RunSummary } from '../../shared/types';
import { ACHIEVEMENTS_LIST, AchievementDef } from './achievements';

const STORAGE_KEY = 'typing_attack_profile_v2';
const GHOST_STORAGE_KEY = 'typing_attack_ghost_best';

export const COSMETIC_ITEMS = {
  cannonSkins: [
    { id: 'default', name: 'Plasma Base', desc: 'Cañón estándar de la flota', reqXp: 0, color: '#38bdf8' },
    { id: 'neon_cyan', name: 'Cyber Neon', desc: 'Estilo de retro-luz cian brillante', reqXp: 1200, color: '#06b6d4' },
    { id: 'crimson_void', name: 'Vacío Carmesí', desc: 'Forjado con aleación pesada', reqXp: 4000, color: '#f43f5e' },
    { id: 'solar_gold', name: 'Oro Solar', desc: 'Revestimiento dorado para ases', reqXp: 9000, color: '#eab308' },
    { id: 'obsidian', name: 'Obsidiana Estelar', desc: 'Material furtivo de alta densidad', reqXp: 15000, color: '#a855f7' },
  ],
  capsuleStyles: [
    { id: 'arcade', name: 'Arcade Classic', desc: 'Bordes redondeados de alta visibilidad', reqXp: 0 },
    { id: 'cyber', name: 'Cyber Grid', desc: 'Bisel angular con brackets luminosos', reqXp: 1500 },
    { id: 'holo', name: 'Holo Glass', desc: 'Superficie de cristal translúcido', reqXp: 5000 },
    { id: 'minimal', name: 'Wireframe Puro', desc: 'Contorno minimalista para enfoque total', reqXp: 10000 },
  ],
  beamTrails: [
    { id: 'laser', name: 'Láser de Fotones', desc: 'Rayo directo instantáneo', reqXp: 0 },
    { id: 'railgun', name: 'Rayo Railgun', desc: 'Estela eléctrica con chispas', reqXp: 2000 },
    { id: 'prismatic', name: 'Flujo Prismático', desc: 'Gradiente multicromático', reqXp: 6000 },
  ],
  backgroundPacks: [
    { id: 'deep_space', name: 'Cosmos Profundo', desc: 'Estrellas lejanas y polvo estelar', reqXp: 0 },
    { id: 'nebula_synth', name: 'Nebulosa Synthwave', desc: 'Gradiente retro púrpura y magenta', reqXp: 2500 },
    { id: 'aurora', name: 'Aurora Solar', desc: 'Vientos de plasma esmeralda', reqXp: 7500 },
  ],
};

const DEFAULT_PROFILE: PilotProfile = {
  xp: 0,
  rank: 'Cadete',
  streak: {
    current: 1,
    best: 1,
    lastPlayDate: '',
    protectionUsedThisWeek: false,
  },
  unlocks: {
    cannonSkins: ['default'],
    capsuleStyles: ['arcade'],
    beamTrails: ['laser'],
    backgroundPacks: ['deep_space'],
  },
  activeCustomization: {
    cannonSkin: 'default',
    capsuleStyle: 'arcade',
    beamTrail: 'laser',
    backgroundPack: 'deep_space',
  },
  achievements: {},
  keyStats: {},
  bigramStats: {},
  highScores: {
    classic: 0,
    daily: {},
  },
};

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function calculateRank(xp: number): PilotRank {
  let rank: PilotRank = 'Cadete';
  for (const r of RANKS_CONFIG) {
    if (xp >= r.xpThreshold) {
      rank = r.rank;
    }
  }
  return rank;
}

export function loadProfile(): PilotProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      unlocks: { ...DEFAULT_PROFILE.unlocks, ...(parsed.unlocks || {}) },
      activeCustomization: { ...DEFAULT_PROFILE.activeCustomization, ...(parsed.activeCustomization || {}) },
      achievements: parsed.achievements || {},
      keyStats: parsed.keyStats || {},
      bigramStats: parsed.bigramStats || {},
      highScores: { ...DEFAULT_PROFILE.highScores, ...(parsed.highScores || {}) },
    };
  } catch (err) {
    console.error('Failed to parse profile, fallback to default', err);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PilotProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function recordRunToProfile(
  summary: RunSummary,
  onNewAchievement?: (ach: AchievementDef) => void
): { profile: PilotProfile; newAchievements: AchievementDef[]; leveledUp: boolean } {
  const profile = loadProfile();
  const oldRank = profile.rank;

  // 1. Calculate XP gained from run (score / 15 + bonuses)
  const baseRunXp = Math.floor(summary.score / 15);
  const accuracyBonusXp = summary.accuracy >= 0.95 ? 150 : summary.accuracy >= 0.90 ? 75 : 0;
  const comboBonusXp = Math.floor(summary.maxCombo * 4);
  const totalGainedXp = Math.max(50, baseRunXp + accuracyBonusXp + comboBonusXp);

  profile.xp += totalGainedXp;
  profile.rank = calculateRank(profile.xp);
  const leveledUp = profile.rank !== oldRank;

  // 2. Update High Scores
  if (summary.gameMode === 'classic') {
    if (summary.score > (profile.highScores.classic || 0)) {
      profile.highScores.classic = summary.score;
      // Save ghost of best classic run
      if (summary.inputLog && summary.inputLog.length > 0) {
        saveGhost(summary);
      }
    }
  } else if (summary.gameMode === 'daily') {
    const today = getTodayDateString();
    const currDaily = profile.highScores.daily[today] || 0;
    if (summary.score > currDaily) {
      profile.highScores.daily[today] = summary.score;
    }
  }

  // 3. Update Daily Streak
  const today = getTodayDateString();
  if (profile.streak.lastPlayDate !== today) {
    if (profile.streak.lastPlayDate) {
      const last = new Date(profile.streak.lastPlayDate);
      const current = new Date(today);
      const diffDays = Math.round((current.getTime() - last.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        profile.streak.current += 1;
        profile.streak.best = Math.max(profile.streak.best, profile.streak.current);
      } else if (diffDays > 1) {
        if (!profile.streak.protectionUsedThisWeek) {
          // Use weekly streak protection!
          profile.streak.protectionUsedThisWeek = true;
          profile.streak.current += 1;
        } else {
          profile.streak.current = 1;
        }
      }
    } else {
      profile.streak.current = 1;
    }
    profile.streak.lastPlayDate = today;
  }

  // 4. Update Key and Bigram Stats from input log
  if (summary.inputLog) {
    let lastKeyTime = 0;
    let lastKey = '';

    for (const log of summary.inputLog) {
      const k = log.key.toLowerCase();
      if (!profile.keyStats[k]) {
        profile.keyStats[k] = { hits: 0, errors: 0, totalLatencyMs: 0, countLatency: 0 };
      }
      if (log.correct) {
        profile.keyStats[k].hits += 1;
        if (lastKeyTime > 0) {
          const latency = log.t - lastKeyTime;
          if (latency > 20 && latency < 2000) {
            profile.keyStats[k].totalLatencyMs += latency;
            profile.keyStats[k].countLatency += 1;

            // Bigram stats
            if (lastKey && lastKey.length === 1 && k.length === 1) {
              const pair = `${lastKey}${k}`;
              if (!profile.bigramStats[pair]) {
                profile.bigramStats[pair] = { pair, totalLatencyMs: 0, count: 0 };
              }
              profile.bigramStats[pair].totalLatencyMs += latency;
              profile.bigramStats[pair].count += 1;
            }
          }
        }
      } else {
        profile.keyStats[k].errors += 1;
      }
      lastKeyTime = log.t;
      lastKey = k;
    }
  }

  // 5. Evaluate Unlocked Achievements
  const newAchievements: AchievementDef[] = [];
  const now = Date.now();

  for (const ach of ACHIEVEMENTS_LIST) {
    if (profile.achievements[ach.id]) continue; // already unlocked

    let unlocked = false;
    if (ach.id === 'first_blood' && summary.wordsCleared >= 1) unlocked = true;
    if (ach.id === 'wpm_35' && summary.peakWpm >= 35) unlocked = true;
    if (ach.id === 'wpm_55' && summary.peakWpm >= 55 && summary.accuracy >= 0.92) unlocked = true;
    if (ach.id === 'wpm_80' && summary.peakWpm >= 80) unlocked = true;
    if (ach.id === 'wpm_100' && summary.peakWpm >= 100) unlocked = true;
    if (ach.id === 'combo_10' && summary.maxCombo >= 10) unlocked = true;
    if (ach.id === 'combo_25' && summary.maxCombo >= 25) unlocked = true;
    if (ach.id === 'combo_50' && summary.maxCombo >= 50) unlocked = true;
    if (ach.id === 'flawless_run' && summary.accuracy === 1.0 && summary.wordsCleared >= 15) unlocked = true;
    if (ach.id === 'boss_slayer_1' && summary.bossesDefeated >= 1) unlocked = true;
    if (ach.id === 'boss_slayer_2' && summary.bossesDefeated >= 2) unlocked = true;
    if (ach.id === 'level_5' && summary.levelReached >= 5) unlocked = true;
    if (ach.id === 'level_15' && summary.levelReached >= 15) unlocked = true;
    if (ach.id === 'level_25' && summary.levelReached >= 25) unlocked = true;
    if (ach.id === 'streak_3' && profile.streak.current >= 3) unlocked = true;
    if (ach.id === 'streak_7' && profile.streak.current >= 7) unlocked = true;
    if (ach.id === 'daily_challenger' && summary.gameMode === 'daily') unlocked = true;
    if (ach.id === 'rank_pilot' && profile.xp >= 1000) unlocked = true;
    if (ach.id === 'rank_ace' && profile.xp >= 3500) unlocked = true;
    if (ach.id === 'rank_commander' && profile.xp >= 8000) unlocked = true;

    if (unlocked) {
      profile.achievements[ach.id] = now;
      profile.xp += ach.xpReward;
      newAchievements.push(ach);
      if (onNewAchievement) {
        onNewAchievement(ach);
      }
    }
  }

  // 6. Check cosmetic unlocks
  for (const skin of COSMETIC_ITEMS.cannonSkins) {
    if (profile.xp >= skin.reqXp && !profile.unlocks.cannonSkins.includes(skin.id)) {
      profile.unlocks.cannonSkins.push(skin.id);
    }
  }
  for (const style of COSMETIC_ITEMS.capsuleStyles) {
    if (profile.xp >= style.reqXp && !profile.unlocks.capsuleStyles.includes(style.id)) {
      profile.unlocks.capsuleStyles.push(style.id);
    }
  }
  for (const trail of COSMETIC_ITEMS.beamTrails) {
    if (profile.xp >= trail.reqXp && !profile.unlocks.beamTrails.includes(trail.id)) {
      profile.unlocks.beamTrails.push(trail.id);
    }
  }
  for (const bg of COSMETIC_ITEMS.backgroundPacks) {
    if (profile.xp >= bg.reqXp && !profile.unlocks.backgroundPacks.includes(bg.id)) {
      profile.unlocks.backgroundPacks.push(bg.id);
    }
  }

  saveProfile(profile);

  return { profile, newAchievements, leveledUp };
}

export function saveGhost(summary: RunSummary): void {
  try {
    const compactGhost = {
      score: summary.score,
      date: summary.date,
      inputLog: summary.inputLog?.slice(0, 1500), // clamp size
    };
    localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(compactGhost));
  } catch (err) {
    console.warn('Could not save ghost data', err);
  }
}

export function loadGhost(): { score: number; inputLog: import('../../shared/types').KeystrokeLog[] } | null {
  try {
    const raw = localStorage.getItem(GHOST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}
