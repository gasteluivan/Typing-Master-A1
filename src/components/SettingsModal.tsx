/**
 * Settings Modal: Quality presets, photosensitivity toggles,
 * trauma shake slider, audio mixers and accessibility options.
 */
import React from 'react';
import { X, Sliders, Eye, Volume2, Monitor, Keyboard } from 'lucide-react';

interface SettingsModalProps {
  qualityPreset: 'HIGH' | 'MED' | 'LOW';
  reducedEffects: boolean;
  shakeIntensity: number;
  fingerGuideEnabled: boolean;
  showKeyboard: boolean;
  masterVol: number;
  musicVol: number;
  sfxVol: number;
  isMuted: boolean;
  externalMusicActive: boolean;
  onUpdateQuality: (q: 'HIGH' | 'MED' | 'LOW') => void;
  onUpdateReducedEffects: (val: boolean) => void;
  onUpdateShake: (val: number) => void;
  onUpdateFingerGuide: (val: boolean) => void;
  onUpdateShowKeyboard: (val: boolean) => void;
  onUpdateVolumes: (master: number, music: number, sfx: number, muted: boolean) => void;
  onUpdateExternalMusic: (val: boolean) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  qualityPreset,
  reducedEffects,
  shakeIntensity,
  fingerGuideEnabled,
  showKeyboard,
  masterVol,
  musicVol,
  sfxVol,
  isMuted,
  externalMusicActive,
  onUpdateQuality,
  onUpdateReducedEffects,
  onUpdateShake,
  onUpdateFingerGuide,
  onUpdateShowKeyboard,
  onUpdateVolumes,
  onUpdateExternalMusic,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-display font-bold text-white">AJUSTES & ACCESIBILIDAD</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Cerrar ajustes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs sm:text-sm">
          {/* Quality Presets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>PRESET DE RENDIMIENTO GRÁFICO</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['HIGH', 'MED', 'LOW'] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onUpdateQuality(q)}
                  className={`py-2 px-3 rounded-lg border font-mono font-bold text-xs transition-all cursor-pointer ${
                    qualityPreset === q
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-cyan-500/20 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {q === 'HIGH' ? 'ALTO (GLSL)' : q === 'MED' ? 'MEDIO' : 'BAJO (60 FPS)'}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Safety / Photosensitivity */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="font-display font-bold text-white">Efectos Reducidos (Fotosensibilidad)</span>
              </div>
              <input
                type="checkbox"
                checked={reducedEffects}
                onChange={(e) => onUpdateReducedEffects(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-hud">
              Desactiva aberración cromática, destellos rápidos y reduce las ondas expansivas para evitar fatiga visual.
            </p>
          </div>

          {/* Camera Shake Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center font-mono text-xs text-slate-300">
              <span>INTENSIDAD DE SACUDIDA DE PANTALLA (TRAUMA)</span>
              <span>{Math.round(shakeIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={shakeIntensity}
              onChange={(e) => onUpdateShake(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Touch Keyboard & Finger Guide Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-display font-bold text-white text-xs">Teclado Táctil</span>
                <span className="text-[10px] text-slate-400">Para móviles/tablets</span>
              </div>
              <input
                type="checkbox"
                checked={showKeyboard}
                onChange={(e) => onUpdateShowKeyboard(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-display font-bold text-white text-xs">Guía de Dedos</span>
                <span className="text-[10px] text-slate-400">Zonas de color por dedo</span>
              </div>
              <input
                type="checkbox"
                checked={fingerGuideEnabled}
                onChange={(e) => onUpdateFingerGuide(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Mixers */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="font-display font-bold text-white">Audio Procedural & SFX</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMuted}
                  onChange={(e) => onUpdateVolumes(masterVol, musicVol, sfxVol, e.target.checked)}
                  className="w-3.5 h-3.5 accent-rose-500 rounded"
                />
                Silenciar
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400">MÚSICA PROCEDURAL</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVol}
                  disabled={isMuted}
                  onChange={(e) => onUpdateVolumes(masterVol, parseFloat(e.target.value), sfxVol, isMuted)}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400">EFECTOS (SFX)</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVol}
                  disabled={isMuted}
                  onChange={(e) => onUpdateVolumes(masterVol, musicVol, parseFloat(e.target.value), isMuted)}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
              <div className="flex flex-col">
                <span className="text-xs font-display font-bold text-slate-200">Música Externa (Spotify/YouTube)</span>
                <span className="text-[10px] text-slate-400">Desactiva BGM interna y mantiene SFX</span>
              </div>
              <input
                type="checkbox"
                checked={externalMusicActive}
                onChange={(e) => onUpdateExternalMusic(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-display font-bold text-sm tracking-wider uppercase transition-all cursor-pointer"
        >
          GUARDAR Y CONTINUAR
        </button>
      </div>
    </div>
  );
};
