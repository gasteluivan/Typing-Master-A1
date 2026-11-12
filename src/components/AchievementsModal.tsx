/**
 * Achievements View: Grid of all 26 achievements with status, icon and rewards
 */
import React, { useState } from 'react';
import { ACHIEVEMENTS_LIST, AchievementDef } from '../progression/achievements';
import { PilotProfile } from '../../shared/types';
import { ArrowLeft, Award, CheckCircle2, Lock } from 'lucide-react';

interface AchievementsModalProps {
  profile: PilotProfile;
  onBack: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ profile, onBack }) => {
  const [filter, setFilter] = useState<'all' | 'speed' | 'accuracy' | 'mastery' | 'survival'>('all');

  const unlockedCount = Object.keys(profile.achievements).length;
  const filtered = ACHIEVEMENTS_LIST.filter((ach) => filter === 'all' || ach.category === filter);

  return (
    <div className="relative z-30 flex flex-col items-center min-h-screen w-full px-4 py-6 max-w-4xl mx-auto overflow-y-auto select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> VOLVER AL MENÚ
        </button>
        <h2 className="text-xl sm:text-2xl font-display font-black text-white">
          REGISTRO DE LOGROS
        </h2>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
          <Award className="w-4 h-4" /> {unlockedCount} / {ACHIEVEMENTS_LIST.length}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="w-full flex flex-wrap gap-2 mt-5">
        {(['all', 'speed', 'accuracy', 'mastery', 'survival'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
              filter === cat
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/30 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all'
              ? 'TODOS'
              : cat === 'speed'
              ? 'VELOCIDAD'
              : cat === 'accuracy'
              ? 'PRECISIÓN'
              : cat === 'mastery'
              ? 'MAESTRÍA'
              : 'SUPERVIVENCIA'}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {filtered.map((ach) => {
          const unlockedTimestamp = profile.achievements[ach.id];
          const isUnlocked = !!unlockedTimestamp;

          return (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition-all ${
                isUnlocked
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/50 border-slate-900 opacity-60'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                  isUnlocked
                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-600'
                }`}
              >
                {ach.icon}
              </div>

              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white text-sm">{ach.title}</span>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    +{ach.xpReward} XP
                  </span>
                </div>
                <p className="text-xs font-hud text-slate-300 mt-0.5 leading-relaxed">
                  {ach.description}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono">
                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Desbloqueado{' '}
                      {new Date(unlockedTimestamp).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Lock className="w-3 h-3" /> Bloqueado
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
