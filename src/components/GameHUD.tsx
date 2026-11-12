/**
 * Game HUD: Live arcade telemetry, Flow energy meter, Speed Tier badges,
 * vitality sockets, combo multiplier and responsive controls.
 */
import React from 'react';
import { FLOW_CONFIG, SPEED_TIERS } from '../../shared/config';
import { SpeedTier } from '../../shared/types';
import { Pause, Volume2, VolumeX, Settings, Keyboard, Shield, Zap } from 'lucide-react';

interface GameHUDProps {
  score: number;
  combo: number;
  wpm: number;
  rollingAccuracy: number;
  speedTier: SpeedTier;
  flowMeter: number;
  isOverclock: boolean;
  lives: number;
  maxLives: number;
  level: number;
  hasShield: boolean;
  isMuted: boolean;
  showKeyboard: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onToggleKeyboard: () => void;
  onOpenSettings: () => void;
  onTriggerOverclock: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  combo,
  wpm,
  rollingAccuracy,
  speedTier,
  flowMeter,
  isOverclock,
  lives,
  maxLives,
  level,
  hasShield,
  isMuted,
  showKeyboard,
  onPause,
  onToggleMute,
  onToggleKeyboard,
  onOpenSettings,
  onTriggerOverclock,
}) => {
  const tierConfig = SPEED_TIERS[speedTier];
  const isAccuracyGood = rollingAccuracy >= FLOW_CONFIG.minAccuracyForTierBonus;
  const isCritical = lives <= 2;
  const flowPercent = Math.min(100, Math.round(flowMeter));
  const canOverclock = flowMeter >= FLOW_CONFIG.maxFlowMeter && !isOverclock;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 sm:p-4 select-none">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* Left Cluster: Score, Combo & Level */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          {/* Level badge */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-[10px] sm:text-xs font-mono font-bold tracking-wider text-cyan-400">
              SECTOR 0{level}
            </span>
            {hasShield && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/90 border border-blue-500/60 text-[10px] sm:text-xs font-mono font-bold text-blue-300 animate-pulse">
                <Shield className="w-3 h-3 text-blue-400" /> ESCUDO
              </span>
            )}
          </div>

          {/* Hero Score */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight text-white drop-shadow-md tabular-nums">
              {score.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase text-slate-400 tracking-wider">
              PTS
            </span>
          </div>

          {/* Combo Pip */}
          {combo > 1 && (
            <div className="flex items-center gap-1.5 animate-pulse">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs sm:text-sm font-display font-bold">
                COMBO ×{combo}
              </span>
            </div>
          )}
        </div>

        {/* Center Cluster: Speed Tier & Flow Telemetry */}
        <div className="flex flex-col items-center pointer-events-auto max-w-[200px] sm:max-w-xs text-center">
          {/* Speed Tier Badge */}
          <div
            className={`px-3 py-1 rounded-full border text-xs sm:text-sm font-display font-extrabold tracking-wider transition-all duration-200 flex items-center gap-1.5 ${tierConfig.badgeBg}`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{tierConfig.label}</span>
            <span className="opacity-75 text-[10px] sm:text-xs">
              (×{tierConfig.multiplier})
            </span>
          </div>

          {/* Live sWPM readout */}
          <div className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs font-mono text-slate-300">
            <span>
              <strong className="text-white font-bold">{wpm}</strong> WPM
            </span>
            <span className="text-slate-600">•</span>
            <span className={isAccuracyGood ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
              {Math.round(rollingAccuracy * 100)}% PREC
            </span>
          </div>

          {/* Flow Energy Meter Bar */}
          <div className="w-28 sm:w-44 mt-1.5 flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
              <span>FLUJO</span>
              <span className={canOverclock ? 'text-amber-400 font-bold animate-pulse' : ''}>
                {canOverclock ? '¡LISTO! [ESPACIO]' : `${flowPercent}%`}
              </span>
            </div>
            <div
              onClick={() => {
                if (canOverclock) onTriggerOverclock();
              }}
              className={`h-2 sm:h-2.5 w-full bg-slate-900/90 rounded-full border overflow-hidden p-0.5 transition-all ${
                canOverclock
                  ? 'border-amber-400 shadow-amber-400/50 shadow-md cursor-pointer animate-pulse'
                  : 'border-slate-700'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  isOverclock
                    ? 'bg-amber-400 shadow-amber-300 shadow-sm'
                    : canOverclock
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                    : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                }`}
                style={{ width: `${isOverclock ? 100 : flowPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Cluster: Vitality Hearts & Action Buttons */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Heart vitality sockets */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-lg bg-slate-900/80 border border-slate-800">
            {Array.from({ length: maxLives }).map((_, i) => {
              const active = i < lives;
              return (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm flex items-center justify-center transition-all ${
                    active
                      ? isCritical
                        ? 'bg-rose-500 shadow-rose-500/50 shadow-sm animate-pulse'
                        : 'bg-emerald-500 shadow-emerald-500/30 shadow-sm'
                      : 'bg-slate-800 border border-slate-700/60'
                  }`}
                  title={active ? 'Vida activa' : 'Vida perdida'}
                />
              );
            })}
          </div>

          {/* Quick Utility Icon Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleKeyboard}
              className={`p-1.5 sm:p-2 rounded-lg border transition-all text-slate-300 hover:text-white ${
                showKeyboard
                  ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-700 hover:bg-slate-800'
              }`}
              title="Alternar teclado en pantalla / Guía de dedos"
              aria-label="Alternar teclado táctil"
            >
              <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Silenciar audio (M)"
              aria-label="Silenciar audio"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Ajustes gráficos y controles"
              aria-label="Ajustes"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={onPause}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="Pausar juego (Esc / P)"
              aria-label="Pausa"
            >
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Center Banner Announcement */}
      {/* Handled in FXManager / canvas, but also mirrored cleanly */}
    </div>
  );
};
