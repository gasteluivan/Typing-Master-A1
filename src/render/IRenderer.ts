/**
 * Interface for renderers (WebGL2 with PixiJS/custom GLSL shaders or Canvas2D fallback)
 */
import { BossEntity, SpecialWordType, SpeedTier, WordItem } from '../../shared/types';

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0 to 1
  color: string;
  glowColor: string;
  width: number;
  impactParticleBurst?: boolean;
}

export interface ShockwaveRing {
  id: string;
  x: number; // 0 to 1
  y: number; // 0 to 1
  radius: number; // 0 to 1 normalized
  maxRadius: number;
  strength: number; // 0 to 1
  duration: number;
  elapsed: number;
  color?: string;
}

export interface RenderParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  char?: string; // letter fragments
}

export interface FloatingPopupItem {
  id: string;
  text: string;
  subText?: string;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  color: string;
  fontSize: number;
  isMilestone?: boolean;
}

export interface RenderFrameState {
  timeMs: number;
  dt: number;
  words: WordItem[];
  currentTargetId: string | null;
  cannon: {
    x: number; // normalized (0.5 center)
    y: number; // normalized (~0.95 bottom)
    angle: number; // radians
    isFiring: boolean;
    skin: string;
    beamTrail: string;
    barrelRecoil: number; // 0 to 1
  };
  boss?: BossEntity;
  lasers: LaserBeam[];
  shockwaves: ShockwaveRing[];
  particles: RenderParticle[];
  popups: FloatingPopupItem[];
  speedTier: SpeedTier;
  isOverclock: boolean;
  lives: number;
  maxLives: number;
  cameraShake: { x: number; y: number; zoom: number };
  qualityPreset: 'HIGH' | 'MED' | 'LOW';
  reducedEffects: boolean;
  backgroundPack: string;
}

export interface IRenderer {
  readonly id: string;
  init(container: HTMLElement, width: number, height: number): Promise<void>;
  resize(width: number, height: number): void;
  render(state: RenderFrameState): void;
  destroy(): void;
  isWebGL(): boolean;
}
