/**
 * Hangar View: Customize Cannon Skins, Word Capsule Styles, Beam Trails and Backgrounds
 */
import React from 'react';
import { COSMETIC_ITEMS, saveProfile } from '../progression/profileStorage';
import { PilotProfile } from '../../shared/types';
import { ArrowLeft, Lock, Check } from 'lucide-react';

interface HangarModalProps {
  profile: PilotProfile;
  onUpdateProfile: (p: PilotProfile) => void;
  onBack: () => void;
}

export const HangarModal: React.FC<HangarModalProps> = ({ profile, onUpdateProfile, onBack }) => {
  const handleSelectSkin = (skinId: string) => {
    if (!profile.unlocks.cannonSkins.includes(skinId)) return;
    const updated = {
      ...profile,
      activeCustomization: {
        ...profile.activeCustomization,
        cannonSkin: skinId,
      },
    };
    saveProfile(updated);
    onUpdateProfile(updated);
  };

  const handleSelectCapsule = (styleId: string) => {
    if (!profile.unlocks.capsuleStyles.includes(styleId)) return;
    const updated = {
      ...profile,
      activeCustomization: {
        ...profile.activeCustomization,
        capsuleStyle: styleId,
      },
    };
    saveProfile(updated);
    onUpdateProfile(updated);
  };

  const handleSelectTrail = (trailId: string) => {
    if (!profile.unlocks.beamTrails.includes(trailId)) return;
    const updated = {
      ...profile,
      activeCustomization: {
        ...profile.activeCustomization,
        beamTrail: trailId,
      },
    };
    saveProfile(updated);
    onUpdateProfile(updated);
  };

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
          HANGAR DE PERSONALIZACIÓN
        </h2>
        <div className="text-xs font-mono text-cyan-400 font-bold">{profile.xp} XP</div>
      </div>

      <div className="w-full flex flex-col gap-6 mt-6">
        {/* Cannon Skins Section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            SKINS DE CAÑÓN DE DEFENSA
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {COSMETIC_ITEMS.cannonSkins.map((skin) => {
              const isUnlocked = profile.unlocks.cannonSkins.includes(skin.id);
              const isSelected = profile.activeCustomization.cannonSkin === skin.id;

              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => handleSelectSkin(skin.id)}
                  disabled={!isUnlocked}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-cyan-500/20 shadow-md ring-1 ring-cyan-400'
                      : isUnlocked
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer'
                      : 'bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-white text-sm">{skin.name}</span>
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: skin.color }}
                    />
                  </div>
                  <p className="text-xs font-hud text-slate-400">{skin.desc}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-cyan-400 font-bold">
                        <Check className="w-3.5 h-3.5" /> EQUIPADO
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-400 font-bold">DISPONIBLE</span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Lock className="w-3.5 h-3.5" /> {skin.reqXp} XP
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Word Capsule Styles */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            ESTILOS DE CÁPSULA DE PALABRA
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {COSMETIC_ITEMS.capsuleStyles.map((style) => {
              const isUnlocked = profile.unlocks.capsuleStyles.includes(style.id);
              const isSelected = profile.activeCustomization.capsuleStyle === style.id;

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleSelectCapsule(style.id)}
                  disabled={!isUnlocked}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-amber-950/60 border-amber-400 shadow-amber-500/20 shadow-md ring-1 ring-amber-400'
                      : isUnlocked
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer'
                      : 'bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="font-display font-bold text-white text-xs">{style.name}</span>
                  <p className="text-[11px] font-hud text-slate-400">{style.desc}</p>
                  <div className="text-[10px] font-mono pt-1 border-t border-slate-800">
                    {isSelected ? (
                      <span className="text-amber-400 font-bold">EQUIPADO</span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-400">DISPONIBLE</span>
                    ) : (
                      <span className="text-slate-500">{style.reqXp} XP</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Beam Trails */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
            ESTELAS DE RAYO LÁSER
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COSMETIC_ITEMS.beamTrails.map((trail) => {
              const isUnlocked = profile.unlocks.beamTrails.includes(trail.id);
              const isSelected = profile.activeCustomization.beamTrail === trail.id;

              return (
                <button
                  key={trail.id}
                  type="button"
                  onClick={() => handleSelectTrail(trail.id)}
                  disabled={!isUnlocked}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-400 shadow-purple-500/20 shadow-md ring-1 ring-purple-400'
                      : isUnlocked
                      ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer'
                      : 'bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="font-display font-bold text-white text-xs">{trail.name}</span>
                  <p className="text-[11px] font-hud text-slate-400">{trail.desc}</p>
                  <div className="text-[10px] font-mono pt-1 border-t border-slate-800">
                    {isSelected ? (
                      <span className="text-purple-400 font-bold">EQUIPADO</span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-400">DISPONIBLE</span>
                    ) : (
                      <span className="text-slate-500">{trail.reqXp} XP</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
