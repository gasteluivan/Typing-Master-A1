/**
 * Title Screen: Hero lockup, Mode Selection (Classic, Daily, Training),
 * Pilot Rank & XP progress, and Navigation to Hangar, Achievements, and Analytics.
 */
import React from 'react';
import { PilotProfile } from '../../shared/types';
import { Play, Calendar, Target, Award, Wrench, BarChart2, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { RANKS_CONFIG } from '../../shared/config';

interface TitleScreenProps {
  profile: PilotProfile;
  onStartGame: (mode: 'classic' | 'daily' | 'training') => void;
  onOpenTraining: () => void;
  onOpenAnalytics: () => void;
  onOpenHangar: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  profile,
  onStartGame,
  onOpenTraining,
  onOpenAnalytics,
  onOpenHangar,
  onOpenAchievements,
  onOpenSettings,
}) => {
  // Rank threshold progress
  const currentRankConfig = RANKS_CONFIG.find((r) => r.rank === profile.rank) || RANKS_CONFIG[0];
  const nextRankConfig = RANKS_CONFIG.find((r) => r.xpThreshold > profile.xp);
  const currentThreshold = currentRankConfig.xpThreshold;
  const nextThreshold = nextRankConfig ? nextRankConfig.xpThreshold : currentThreshold;
  const xpProgress = nextRankConfig
    ? Math.min(100, Math.round(((profile.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyCompleted = !!profile.highScores.daily[todayStr];

  return (
    <div className="relative z-30 flex flex-col items-center justify-between min-h-screen w-full px-4 py-6 sm:py-10 max-w-5xl mx-auto overflow-y-auto">
      {/* Top Bar: Pilot Card & Streak */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-800 border border-cyan-400/50 flex items-center justify-center font-display font-extrabold text-white text-lg shadow-cyan-500/20 shadow-md">
            {profile.rank[0]}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white text-base">PILOTO CADETE</span>
              <span className={`text-xs font-mono font-bold uppercase ${currentRankConfig.badgeColor}`}>
                [{profile.rank}]
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>{profile.xp} XP</span>
              {nextRankConfig && (
                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${xpProgress}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Streak & Stats Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-600/40 text-amber-300 text-xs font-mono">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            <span>RACHA: {profile.streak.current} DÍAS</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>RÉCORD: {(profile.highScores.classic || 0).toLocaleString()} PTS</span>
          </div>
        </div>
      </div>

      {/* Hero Title Lockup */}
      <div className="my-auto text-center flex flex-col items-center py-6 sm:py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-semibold tracking-wider mb-4 shadow-cyan-500/20 shadow-md">
          <Sparkles className="w-3.5 h-3.5" /> FASE 2: EDICIÓN VELOCIDAD & JUICE
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 drop-shadow-lg">
          TYPING ATTACK
        </h1>

        <p className="mt-3 max-w-md text-sm sm:text-base text-slate-300 font-hud font-medium">
          Defiende la estación orbital tecleando palabras a máxima velocidad. Encadena combos, desata Overclock y pulveriza jefes.
        </p>

        {/* Primary Play CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button
            type="button"
            data-start="true"
            onClick={() => onStartGame('classic')}
            className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-extrabold text-base tracking-wider uppercase transition-all duration-150 shadow-cyan-500/40 shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            MODO CLÁSICO
          </button>

          <button
            type="button"
            onClick={() => onStartGame('daily')}
            className="py-3.5 px-5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-display font-bold text-sm tracking-wider uppercase transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-amber-500/10 shadow-md"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            {dailyCompleted ? 'DESAFÍO (COMPLETADO)' : 'DESAFÍO DIARIO'}
          </button>
        </div>
      </div>

      {/* Bottom Sub-Menus Bar */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4">
        <button
          type="button"
          onClick={onOpenTraining}
          className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Target className="w-4 h-4 text-emerald-400" />
          <span>ENTRENAMIENTO</span>
        </button>

        <button
          type="button"
          onClick={onOpenAnalytics}
          className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span>MAPA DE CALOR</span>
        </button>

        <button
          type="button"
          onClick={onOpenHangar}
          className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Wrench className="w-4 h-4 text-purple-400" />
          <span>HANGAR / SKINS</span>
        </button>

        <button
          type="button"
          onClick={onOpenAchievements}
          className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>LOGROS (26)</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span>AJUSTES</span>
        </button>
      </div>

      {/* Control Hint Footer */}
      <div className="mt-4 text-center text-xs font-mono text-slate-500">
        Teclea cualquier letra para disparar • Espacio: Overclock • Esc: Pausa • Teclado táctil disponible
      </div>
    </div>
  );
};
