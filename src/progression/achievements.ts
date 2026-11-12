/**
 * 25+ Achievements definition for Typing Attack
 */
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'speed' | 'accuracy' | 'mastery' | 'survival';
  xpReward: number;
}

export const ACHIEVEMENTS_LIST: AchievementDef[] = [
  // Speed
  { id: 'first_blood', title: 'Primer Disparo', description: 'Destruye tu primera palabra con éxito.', icon: '🎯', category: 'speed', xpReward: 50 },
  { id: 'wpm_35', title: 'Velocidad Crucero', description: 'Alcanza el tier FAST (≥35 WPM).', icon: '🚀', category: 'speed', xpReward: 100 },
  { id: 'wpm_55', title: 'Propulsión Turbo', description: 'Activa el tier TURBO (≥55 WPM con ≥92% de precisión).', icon: '⚡', category: 'speed', xpReward: 200 },
  { id: 'wpm_80', title: 'Sobremarcha', description: 'Desata el modo OVERDRIVE (≥80 WPM).', icon: '🔥', category: 'speed', xpReward: 350 },
  { id: 'wpm_100', title: 'Velocidad Divina', description: 'Rompe la barrera de los 100 WPM (Tier GODSPEED).', icon: '👑', category: 'speed', xpReward: 500 },
  { id: 'overclock_master', title: 'Overclock Activado', description: 'Llena la barra de flujo y activa Overclock (Barra Espaciadora).', icon: '🔋', category: 'speed', xpReward: 150 },

  // Accuracy & Combos
  { id: 'combo_10', title: 'En Cadena', description: 'Consigue un combo de 10 palabras consecutivas.', icon: '🔗', category: 'accuracy', xpReward: 100 },
  { id: 'combo_25', title: 'Francotirador', description: 'Alcanza un combo de 25 palabras.', icon: '🎖', category: 'accuracy', xpReward: 250 },
  { id: 'combo_50', title: 'Sinfonía Mecánica', description: 'Alcanza un combo de 50 palabras sin ningún fallo.', icon: '⭐', category: 'accuracy', xpReward: 500 },
  { id: 'flawless_run', title: 'Precisión Impecable', description: 'Termina una partida completa con 100% de precisión.', icon: '💎', category: 'accuracy', xpReward: 600 },
  { id: 'par_time_streak', title: 'Sello Perfecto', description: 'Destruye 5 palabras seguidas con calificación PERFECT.', icon: '⏱', category: 'accuracy', xpReward: 300 },
  { id: 'sub_second_burst', title: 'Reflejos de Titanio', description: 'Destruye una palabra en menos de 0.8 segundos.', icon: '⚡', category: 'accuracy', xpReward: 200 },

  // Mastery & Progression
  { id: 'boss_slayer_1', title: 'Caída del Titán', description: 'Derrota a tu primer jefe en el nivel 10.', icon: '👾', category: 'mastery', xpReward: 400 },
  { id: 'boss_slayer_2', title: 'Destructor de Dreadnoughts', description: 'Derrota al jefe del nivel 20.', icon: '🛸', category: 'mastery', xpReward: 600 },
  { id: 'level_5', title: 'Bautismo de Fuego', description: 'Supera el nivel 5.', icon: '🛡', category: 'mastery', xpReward: 150 },
  { id: 'level_15', title: 'Veterano de la Flota', description: 'Alcanza el nivel 15.', icon: '🌌', category: 'mastery', xpReward: 350 },
  { id: 'level_25', title: 'Leyenda del Cuadrante', description: 'Alcanza el nivel 25.', icon: '🏆', category: 'mastery', xpReward: 800 },
  { id: 'rank_pilot', title: 'Ascenso: Piloto', description: 'Alcanza el rango de Piloto.', icon: '🎖', category: 'mastery', xpReward: 200 },
  { id: 'rank_ace', title: 'Ascenso: Ás', description: 'Alcanza el rango de Ás.', icon: '🌟', category: 'mastery', xpReward: 400 },
  { id: 'rank_commander', title: 'Ascenso: Comandante', description: 'Alcanza el rango de Comandante.', icon: '🎖', category: 'mastery', xpReward: 700 },

  // Survival & Specials
  { id: 'freeze_saviour', title: 'Cero Absoluto', description: 'Recoge una palabra especial Freeze ❄.', icon: '❄', category: 'survival', xpReward: 100 },
  { id: 'nuke_all', title: 'Detonación Táctica', description: 'Usa una palabra Bomba 💣 para limpiar la pantalla.', icon: '💣', category: 'survival', xpReward: 100 },
  { id: 'shield_up', title: 'Escudo Desplegado', description: 'Activa un escudo de energía defensivo 🛡.', icon: '🛡', category: 'survival', xpReward: 100 },
  { id: 'streak_3', title: 'Disciplina Diaria', description: 'Juega 3 días seguidos.', icon: '📅', category: 'survival', xpReward: 250 },
  { id: 'streak_7', title: 'Semana de Oro', description: 'Consigue una racha de 7 días consecutivos.', icon: '🔥', category: 'survival', xpReward: 600 },
  { id: 'daily_challenger', title: 'Misión Diaria', description: 'Completa un Desafío Diario.', icon: '🌍', category: 'survival', xpReward: 200 },
];
