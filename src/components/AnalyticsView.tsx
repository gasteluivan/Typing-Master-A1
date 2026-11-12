/**
 * Analytics View: Interactive Keyboard Error Heatmap,
 * Rule-based finger coaching tips and slow bigram pairs.
 */
import React, { useState } from 'react';
import { PilotProfile } from '../../shared/types';
import { generateFingerCoaching, getSlowestBigrams, KEY_FINGER_MAP } from '../training/keyAnalytics';
import { ArrowLeft, Lightbulb, Activity, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AnalyticsViewProps {
  profile: PilotProfile;
  onBack: () => void;
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-', '.'],
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ profile, onBack }) => {
  const [selectedKey, setSelectedKey] = useState<string>('a');
  const coachingTips = generateFingerCoaching(profile);
  const slowBigrams = getSlowestBigrams(profile);

  const selectedStats = profile.keyStats[selectedKey.toLowerCase()] || {
    hits: 0,
    errors: 0,
    totalLatencyMs: 0,
    countLatency: 0,
  };
  const totalPresses = selectedStats.hits + selectedStats.errors;
  const errorRate = totalPresses > 0 ? Math.round((selectedStats.errors / totalPresses) * 100) : 0;
  const avgLatency =
    selectedStats.countLatency > 0
      ? Math.round(selectedStats.totalLatencyMs / selectedStats.countLatency)
      : 0;
  const fingerInfo = KEY_FINGER_MAP[selectedKey.toLowerCase()];

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
          DIAGNÓSTICO & MAPA DE CALOR
        </h2>
        <div className="w-16" />
      </div>

      {/* Heatmap Section */}
      <div className="w-full mt-6 flex flex-col items-center p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex justify-between items-center w-full mb-4">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            MAPA DE CALOR DEL TECLADO (SELECCIONA UNA TECLA)
          </span>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 100% Precisión
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Errores leves
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Errores altos
            </span>
          </div>
        </div>

        {/* Visual Keyboard Grid */}
        <div className="w-full flex flex-col items-center gap-1.5 max-w-xl">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1.5 w-full">
              {row.map((k) => {
                const stats = profile.keyStats[k.toLowerCase()];
                const isSelected = selectedKey.toLowerCase() === k.toLowerCase();
                const total = stats ? stats.hits + stats.errors : 0;
                const errPct = total > 0 ? stats!.errors / total : 0;

                let keyColor = 'bg-slate-800/80 text-slate-400 border-slate-700';
                if (total > 0) {
                  if (errPct === 0) keyColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70';
                  else if (errPct < 0.15) keyColor = 'bg-yellow-950/80 text-yellow-300 border-yellow-500/70';
                  else keyColor = 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-rose-500/20 shadow-sm';
                }

                if (isSelected) {
                  keyColor += ' ring-2 ring-cyan-400 scale-105 z-10';
                }

                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSelectedKey(k)}
                    className={`flex-1 max-w-[48px] h-10 sm:h-12 rounded-lg border text-sm sm:text-base font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${keyColor}`}
                  >
                    <span>{k.toUpperCase()}</span>
                    {total > 0 && (
                      <span className="text-[9px] font-sans opacity-70">
                        {errPct > 0 ? `${Math.round(errPct * 100)}%` : '✓'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Selected Key Telemetry Breakdown */}
        <div className="w-full max-w-xl mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-[10px] font-mono text-slate-400">TECLA</span>
            <div className="text-xl font-display font-extrabold text-white uppercase">{selectedKey}</div>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400">DEDO SUGERIDO</span>
            <div className="text-xs font-display font-bold text-cyan-300 mt-1">
              {fingerInfo ? fingerInfo.finger : 'Estándar'}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400">TASA DE ERROR</span>
            <div className={`text-base font-display font-extrabold mt-0.5 ${errorRate > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {errorRate}%
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400">LATENCIA MEDIA</span>
            <div className="text-base font-display font-extrabold text-white mt-0.5">
              {avgLatency > 0 ? `${avgLatency} ms` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Coaching Tips & Bigrams Section */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Rule-Based Finger Coaching */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
            <Lightbulb className="w-4 h-4" /> CONSEJOS DIDÁCTICOS DEL ENTRENADOR
          </div>
          <div className="flex flex-col gap-2.5">
            {coachingTips.map((tip, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex gap-2.5">
                <span className="text-amber-400 text-sm font-bold">#{i + 1}</span>
                <p className="text-xs text-slate-200 font-hud leading-relaxed">
                  {tip.advice}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Slowest Bigrams */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400">
            <Activity className="w-4 h-4" /> BIGRAMAS MÁS LENTOS (PARES DE TECLAS)
          </div>
          {slowBigrams.length === 0 ? (
            <p className="text-xs text-slate-400 font-hud p-3">
              Juega unas cuantas partidas para que el analizador detecte las transiciones con mayor fricción.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {slowBigrams.map((b) => (
                <div key={b.pair} className="flex justify-between items-center p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/50 text-purple-300 font-mono font-bold text-xs">
                      {b.pair.toUpperCase()}
                    </span>
                    <span className="text-xs font-hud text-slate-300">Transición</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white tabular-nums">
                    {b.avgMs} ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
