/**
 * Game Over & Post-Match Analytics Modal
 * Instant restart (<1s), WPM graph, accuracy, consistency, XP and unlocked achievements.
 */
import React from 'react';
import { RunSummary } from '../../shared/types';
import { AchievementDef } from '../progression/achievements';
import { RotateCcw, Home, Award, TrendingUp, Zap, Target, Clock, ShieldCheck } from 'lucide-react';

interface GameOverModalProps {
  summary: RunSummary;
  newAchievements: AchievementDef[];
  leveledUp: boolean;
  newRank?: string;
  wpmTimeline: { tSec: number; wpm: number }[];
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  newAchievements,
  leveledUp,
  newRank,
  wpmTimeline,
  onRestart,
  onHome,
}) => {
  // Generate SVG points for WPM timeline chart
  const maxWpm = Math.max(60, ...wpmTimeline.map((p) => p.wpm));
  const maxTime = Math.max(1, wpmTimeline[wpmTimeline.length - 1]?.tSec || 1);
  const chartW = 320;
  const chartH = 65;

  const points = wpmTimeline
    .map((p) => {
      const x = (p.tSec / maxTime) * chartW;
      const y = chartH - (p.wpm / maxWpm) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 text-slate-100 my-auto">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-rose-400">
            FIN DE LA MISIÓN • SECTOR 0{summary.levelReached}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white mt-1">
            DEFENSA COMPROMETIDA
          </h2>
          <div className="mt-2 text-2xl sm:text-3xl font-display font-extrabold text-cyan-400 tabular-nums">
            {summary.score.toLocaleString()} <span className="text-sm font-mono text-slate-400">PTS</span>
          </div>
        </div>

        {/* Level Up Banner */}
        {leveledUp && newRank && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2.5">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs font-mono font-bold text-amber-300">¡NUEVO RANGO ALCANZADO!</div>
                <div className="text-base font-display font-black text-white">{newRank}</div>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold">ASCENSO</span>
          </div>
        )}

        {/* 6 Core Telemetry Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> WPM PICO
            </div>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1 tabular-nums">
              {summary.peakWpm}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> WPM MEDIO
            </div>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1 tabular-nums">
              {summary.avgWpm}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> PRECISIÓN
            </div>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1 tabular-nums">
              {Math.round(summary.accuracy * 100)}%
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> CONSISTENCIA
            </div>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1 tabular-nums">
              ±{summary.consistencyMs}ms
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <Award className="w-3.5 h-3.5 text-amber-400" /> MÁX COMBO
            </div>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1 tabular-nums">
              ×{summary.maxCombo}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> PALABRAS
            </div>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1 tabular-nums">
              {summary.wordsCleared}
            </span>
          </div>
        </div>

        {/* WPM Timeline Graph */}
        {wpmTimeline.length > 2 && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>CURVA DE VELOCIDAD (WPM A LO LARGO DEL TIEMPO)</span>
              <span>PICO: {maxWpm} WPM</span>
            </div>
            <div className="w-full h-18 relative pt-1">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            </div>
          </div>
        )}

        {/* New Achievements list */}
        {newAchievements.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase">
              ¡LOGROS DESBLOQUEADOS! (+{newAchievements.reduce((s, a) => s + a.xpReward, 0)} XP)
            </span>
            <div className="flex flex-col gap-1.5">
              {newAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-amber-950/40 border border-amber-500/40"
                >
                  <span className="text-xl">{ach.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-display font-bold text-white">{ach.title}</span>
                    <span className="text-[11px] font-hud text-slate-300">{ach.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-display font-extrabold text-sm sm:text-base tracking-wider uppercase transition-all shadow-cyan-500/30 shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            REINTENTO INSTANTÁNEO
          </button>

          <button
            type="button"
            onClick={onHome}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-display font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            MENÚ
          </button>
        </div>
      </div>
    </div>
  );
};
