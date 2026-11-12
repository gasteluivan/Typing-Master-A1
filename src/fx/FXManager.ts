/**
 * FXManager: Handles trauma camera shake, hitstop, zoom-punch,
 * object-pooled particles, shockwave rings, and floating score popups
 */
import { FLOW_CONFIG, SPEED_TIERS } from '../../shared/config';
import { SpeedTier } from '../../shared/types';
import { FloatingPopupItem, LaserBeam, RenderParticle, ShockwaveRing } from '../render/IRenderer';

export class FXManager {
  // Trauma Camera Shake: shake = trauma^2
  private trauma = 0.0;
  private traumaDecay = 1.6; // per second
  private shakeIntensityFactor = 1.0; // user setting (0 to 1)

  // Hit-stop & Slow-motion
  public hitstopTimer = 0.0; // seconds remaining in simulation freeze
  public slowmoTimer = 0.0; // seconds remaining in slow-motion
  public timeScale = 1.0;

  // Zoom-punch
  private zoomPunch = 0.0;
  private zoomPunchDecay = 3.0;

  // Object pools
  private particles: RenderParticle[] = [];
  private readonly maxParticles = 600;

  private shockwaves: ShockwaveRing[] = [];
  private popups: FloatingPopupItem[] = [];
  private lasers: LaserBeam[] = [];

  // Active milestone banner if any
  public activeBanner: { title: string; subtitle?: string; color: string; duration: number; elapsed: number } | null = null;

  public setShakeIntensity(factor: number): void {
    this.shakeIntensityFactor = Math.max(0, Math.min(1.5, factor));
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount * this.shakeIntensityFactor);
  }

  public triggerHitstop(durationMs: number): void {
    this.hitstopTimer = Math.max(this.hitstopTimer, durationMs / 1000);
  }

  public triggerSlowmo(durationMs: number, scale = 0.4): void {
    this.slowmoTimer = durationMs / 1000;
    this.timeScale = scale;
  }

  public triggerZoomPunch(amount = 0.03): void {
    this.zoomPunch = Math.min(0.06, this.zoomPunch + amount);
  }

  public showBanner(title: string, subtitle?: string, color = '#38bdf8', duration = 2.0): void {
    this.activeBanner = {
      title,
      subtitle,
      color,
      duration,
      elapsed: 0,
    };
  }

  public spawnLaser(startX: number, startY: number, endX: number, endY: number, tier: SpeedTier, isOverclock: boolean): void {
    const tierConfig = SPEED_TIERS[tier];
    this.lasers.push({
      startX,
      startY,
      endX,
      endY,
      progress: 0,
      color: isOverclock ? '#facc15' : tierConfig.color,
      glowColor: isOverclock ? 'rgba(234, 179, 8, 0.8)' : tierConfig.glowColor,
      width: isOverclock ? 5 : 3.5,
    });
  }

  public spawnShockwave(x: number, y: number, color = 'rgba(56, 189, 248, 0.8)'): void {
    this.shockwaves.push({
      id: `shock_${Date.now()}_${Math.random()}`,
      x,
      y,
      radius: 0.01,
      maxRadius: 0.35,
      strength: 1.0,
      duration: 0.5,
      elapsed: 0,
      color,
    });
  }

  public spawnWordExplosion(x: number, y: number, word: string, tier: SpeedTier, isPerfect: boolean): void {
    const tierConfig = SPEED_TIERS[tier];
    const particleCount = isPerfect ? 24 : 16;

    // Word letter fragments
    for (let i = 0; i < word.length; i++) {
      const angle = (Math.PI * 2 * i) / word.length + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 0.18 + 0.08;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.3 + 0.35,
        size: 14,
        color: tierConfig.color,
        alpha: 1.0,
        char: word[i],
      });
    }

    // Spark particles
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.25 + 0.05;
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.2,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.4 ? tierConfig.color : '#ffffff',
        alpha: 1.0,
      });
    }

    // Shockwave
    this.spawnShockwave(x, y, tierConfig.glowColor);

    // Screen Trauma & Zoom punch
    this.addTrauma(isPerfect ? 0.35 : 0.2);
    if (isPerfect) {
      this.triggerZoomPunch(0.025);
      this.triggerHitstop(50);
    }
  }

  public addScorePopup(
    x: number,
    y: number,
    points: number,
    ratingText?: string,
    tierText?: string
  ): void {
    // If popups exceed max limit (12), coalesce into existing recent popup
    if (this.popups.length >= FLOW_CONFIG.maxPopups) {
      const lastPopup = this.popups[this.popups.length - 1];
      const match = lastPopup.text.match(/\+(\d+)/);
      if (match) {
        const existing = parseInt(match[1], 10);
        lastPopup.text = `+${existing + points}`;
        lastPopup.scale = 1.35;
        lastPopup.alpha = 1.0;
        return;
      }
    }

    let color = '#38bdf8';
    if (ratingText === 'PERFECT') color = '#eab308';
    else if (ratingText === 'GREAT') color = '#22c55e';

    const subText = [ratingText, tierText].filter(Boolean).join(' • ');

    this.popups.push({
      id: `popup_${Date.now()}_${Math.random()}`,
      text: `+${points}`,
      subText: subText || undefined,
      x,
      y,
      scale: 0.4,
      alpha: 1.0,
      color,
      fontSize: ratingText === 'PERFECT' ? 24 : 18,
    });
  }

  private addParticle(p: RenderParticle): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift(); // discard oldest
    }
    this.particles.push(p);
  }

  public update(realDt: number): {
    shakeX: number;
    shakeY: number;
    zoom: number;
    lasers: LaserBeam[];
    shockwaves: ShockwaveRing[];
    particles: RenderParticle[];
    popups: FloatingPopupItem[];
  } {
    // 1. Hitstop countdown
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= realDt;
      if (this.hitstopTimer <= 0) {
        this.hitstopTimer = 0;
      }
    }

    // 2. Slowmo countdown
    if (this.slowmoTimer > 0) {
      this.slowmoTimer -= realDt;
      if (this.slowmoTimer <= 0) {
        this.slowmoTimer = 0;
        this.timeScale = 1.0;
      }
    }

    // 3. Trauma decay and shake calculation: shake = trauma^2
    this.trauma = Math.max(0, this.trauma - this.traumaDecay * realDt);
    const shakePower = Math.pow(this.trauma, 2) * this.shakeIntensityFactor;
    const maxOffset = 22; // max pixels offset
    const shakeX = (Math.random() * 2 - 1) * maxOffset * shakePower;
    const shakeY = (Math.random() * 2 - 1) * maxOffset * shakePower;

    // 4. Zoom punch decay
    this.zoomPunch = Math.max(0, this.zoomPunch - this.zoomPunchDecay * realDt);
    const zoom = 1.0 + this.zoomPunch;

    // 5. Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.progress += realDt * 8.0;
      if (l.progress >= 1.0) {
        this.lasers.splice(i, 1);
      }
    }

    // 6. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.elapsed += realDt;
      const progress = s.elapsed / s.duration;
      s.radius = progress * s.maxRadius;
      if (s.elapsed >= s.duration) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += realDt;
      p.x += p.vx * realDt;
      p.y += p.vy * realDt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 8. Update Popups (Rise 60px equivalent and ease-out-back)
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const popup = this.popups[i];
      // vertical rise
      popup.y -= realDt * 0.08;
      // scale towards 1.0
      if (popup.scale < 1.0) {
        popup.scale = Math.min(1.0, popup.scale + realDt * 5.0);
      }
      // fade out after rising
      popup.alpha -= realDt * 1.35;
      if (popup.alpha <= 0) {
        this.popups.splice(i, 1);
      }
    }

    // 9. Update Banner
    if (this.activeBanner) {
      this.activeBanner.elapsed += realDt;
      if (this.activeBanner.elapsed >= this.activeBanner.duration) {
        this.activeBanner = null;
      }
    }

    return {
      shakeX,
      shakeY,
      zoom,
      lasers: this.lasers,
      shockwaves: this.shockwaves,
      particles: this.particles,
      popups: this.popups,
    };
  }

  public clear(): void {
    this.particles = [];
    this.shockwaves = [];
    this.popups = [];
    this.lasers = [];
    this.trauma = 0;
    this.activeBanner = null;
  }
}
