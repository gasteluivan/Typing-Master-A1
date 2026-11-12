/**
 * Canvas 2D Renderer for Typing Attack
 * High performance fallback with arcade cyberpunk aesthetic
 */
import { SPEED_TIERS } from '../../shared/config';
import { SpecialWordType, SpeedTier } from '../../shared/types';
import { IRenderer, RenderFrameState } from './IRenderer';

const SPECIAL_ICONS: Record<SpecialWordType, { symbol: string; label: string; color: string }> = {
  freeze: { symbol: '❄', label: 'FREEZE', color: '#38bdf8' },
  bomb: { symbol: '💣', label: 'BOMBA', color: '#f97316' },
  shield: { symbol: '🛡', label: 'ESCUDO', color: '#3b82f6' },
  repair: { symbol: '❤', label: 'REPARAR', color: '#22c55e' },
  multiplier: { symbol: '✖', label: '×2 MULT', color: '#eab308' },
};

export class Canvas2DRenderer implements IRenderer {
  public readonly id = 'canvas2d';
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 800;
  private height = 600;

  // Starfield background
  private stars: { x: number; y: number; size: number; speed: number; alpha: number }[] = [];

  public async init(container: HTMLElement, width: number, height: number): Promise<void> {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.setAttribute('data-testid', 'game-canvas');

    container.innerHTML = '';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // Initialize parallax stars
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  public isWebGL(): boolean {
    return false;
  }

  public render(state: RenderFrameState): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Camera shake & zoom
    ctx.save();
    if (!state.reducedEffects) {
      const zoom = state.cameraShake.zoom || 1.0;
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2 + state.cameraShake.x, -h / 2 + state.cameraShake.y);
    }

    // 1. Draw Starfield & Cosmic Background
    this.renderBackground(ctx, state);

    // 2. Draw Defense Line (Danger threshold)
    this.renderDefenseLine(ctx, state);

    // 3. Draw Laser Beams
    this.renderLasers(ctx, state);

    // 4. Draw Shockwaves
    this.renderShockwaves(ctx, state);

    // 5. Draw Active Falling Words
    this.renderWords(ctx, state);

    // 6. Draw Boss if present
    if (state.boss) {
      this.renderBoss(ctx, state);
    }

    // 7. Draw Cannon / Player Turret
    this.renderCannon(ctx, state);

    // 8. Draw Particles
    this.renderParticles(ctx, state);

    // 9. Draw Floating Popups (+120, PERFECT, etc.)
    this.renderPopups(ctx, state);

    // 10. Low Health Vignette Pulse & Overclock Aura
    this.renderScreenOverlays(ctx, state);

    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;

    // Background base
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (state.speedTier === 'GODSPEED') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#291e0a');
      grad.addColorStop(1, '#0c0a09');
    } else if (state.speedTier === 'OVERDRIVE') {
      grad.addColorStop(0, '#1e112a');
      grad.addColorStop(0.5, '#170c26');
      grad.addColorStop(1, '#080511');
    } else {
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.6, '#080e1e');
      grad.addColorStop(1, '#020617');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Parallax stars (accelerate with speed tier)
    let speedMult = 1.0;
    if (state.speedTier === 'FAST') speedMult = 1.4;
    else if (state.speedTier === 'TURBO') speedMult = 2.0;
    else if (state.speedTier === 'OVERDRIVE') speedMult = 3.2;
    else if (state.speedTier === 'GODSPEED') speedMult = 4.5;
    if (state.isOverclock) speedMult *= 1.5;

    ctx.fillStyle = state.speedTier === 'GODSPEED' ? '#fef08a' : '#ffffff';
    for (const star of this.stars) {
      star.y += star.speed * speedMult * (state.dt * 60);
      if (star.y > h) {
        star.y = 0;
        star.x = Math.random() * w;
      }
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // Subtle perspective grid at bottom
    ctx.strokeStyle = 'rgba(30, 58, 138, 0.25)';
    ctx.lineWidth = 1;
    const gridY = h * 0.85;
    ctx.beginPath();
    ctx.moveTo(0, gridY);
    ctx.lineTo(w, gridY);
    ctx.stroke();

    const perspectiveLines = 10;
    for (let i = 0; i <= perspectiveLines; i++) {
      const xTop = (w / perspectiveLines) * i;
      const xBottom = w * 0.5 + (xTop - w * 0.5) * 1.5;
      ctx.beginPath();
      ctx.moveTo(xTop, gridY);
      ctx.lineTo(xBottom, h);
      ctx.stroke();
    }
  }

  private renderDefenseLine(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const lineY = this.height * 0.88;

    // Pulsing danger glow if low lives
    const isCritical = state.lives <= 2;
    const pulse = isCritical ? Math.sin(state.timeMs * 0.008) * 0.4 + 0.6 : 0.4;

    ctx.save();
    ctx.strokeStyle = isCritical ? `rgba(239, 68, 68, ${pulse})` : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = isCritical ? 2.5 : 1.5;
    ctx.setLineDash([8, 6]);

    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(w, lineY);
    ctx.stroke();

    // Hazard markers
    ctx.setLineDash([]);
    ctx.fillStyle = isCritical ? '#ef4444' : '#f87171';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('CRITICAL DEFENSE PERIMETER', 16, lineY - 6);
    ctx.fillText('KEEP CLEAR', w - 90, lineY - 6);
    ctx.restore();
  }

  private renderWords(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;

    for (const word of state.words) {
      const px = word.x * w;
      const py = word.y * h;
      const isTarget = word.id === state.currentTargetId;

      ctx.save();
      ctx.translate(px, py);

      // Measure text
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      const typedPart = word.text.slice(0, word.typedIndex);
      const remainingPart = word.text.slice(word.typedIndex);
      const totalWidth = ctx.measureText(word.text).width;
      const capsuleW = totalWidth + 36;
      const capsuleH = 34;

      // Draw Capsule Background
      let capsuleBg = 'rgba(15, 23, 42, 0.85)';
      let borderColor = '#334155';
      let glowColor = 'rgba(51, 65, 85, 0.5)';

      if (word.specialType) {
        const spec = SPECIAL_ICONS[word.specialType];
        borderColor = spec.color;
        glowColor = spec.color;
        capsuleBg = 'rgba(30, 27, 75, 0.9)';
      }

      if (isTarget) {
        borderColor = '#38bdf8';
        glowColor = '#38bdf8';
      }

      // Special word subtle aura
      if (word.specialType && !state.reducedEffects) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12;
      }

      // Rounded capsule box
      ctx.fillStyle = capsuleBg;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isTarget ? 2 : 1.2;

      const r = 8;
      const x0 = -capsuleW / 2;
      const y0 = -capsuleH / 2;
      ctx.beginPath();
      ctx.roundRect(x0, y0, capsuleW, capsuleH, r);
      ctx.fill();
      ctx.stroke();

      // Target reticle brackets if targeted
      if (isTarget) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        const bLen = 6;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x0 - 4, y0 + bLen);
        ctx.lineTo(x0 - 4, y0 - 4);
        ctx.lineTo(x0 + bLen, y0 - 4);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x0 + capsuleW + 4, y0 + bLen);
        ctx.lineTo(x0 + capsuleW + 4, y0 - 4);
        ctx.lineTo(x0 + capsuleW - bLen, y0 - 4);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x0 - 4, y0 + capsuleH - bLen);
        ctx.lineTo(x0 - 4, y0 + capsuleH + 4);
        ctx.lineTo(x0 + bLen, y0 + capsuleH + 4);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x0 + capsuleW + 4, y0 + capsuleH - bLen);
        ctx.lineTo(x0 + capsuleW + 4, y0 + capsuleH + 4);
        ctx.lineTo(x0 + capsuleW - bLen, y0 + capsuleH + 4);
        ctx.stroke();
      }

      // Special item badge icon
      if (word.specialType) {
        const spec = SPECIAL_ICONS[word.specialType];
        ctx.font = '14px sans-serif';
        ctx.fillText(spec.symbol, x0 + 8, 5);
      }

      // Draw Typed Letters (Bright Green or Cyan) & Remaining Letters (White / Slate)
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      const textStartX = word.specialType ? x0 + 26 : -totalWidth / 2;

      if (typedPart) {
        ctx.fillStyle = '#22c55e'; // vivid emerald green for typed
        ctx.fillText(typedPart, textStartX, 0);
      }

      if (remainingPart) {
        const typedOffset = ctx.measureText(typedPart).width;
        // If next char is up, subtle highlight
        const nextChar = remainingPart[0];
        const rest = remainingPart.slice(1);

        if (isTarget) {
          ctx.fillStyle = '#f8fafc'; // highlighted next char
          ctx.fillText(nextChar, textStartX + typedOffset, 0);

          if (rest) {
            const nextCharOffset = ctx.measureText(nextChar).width;
            ctx.fillStyle = '#94a3b8'; // upcoming
            ctx.fillText(rest, textStartX + typedOffset + nextCharOffset, 0);
          }
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(remainingPart, textStartX + typedOffset, 0);
        }
      }

      ctx.restore();
    }
  }

  private renderBoss(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    if (!state.boss) return;
    const boss = state.boss;
    const w = this.width;
    const h = this.height;

    const bx = boss.x * w;
    const by = boss.y * h;

    ctx.save();
    ctx.translate(bx, by);

    // Dreadnought ship chassis
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(70, -20);
    ctx.lineTo(40, -40);
    ctx.lineTo(-40, -40);
    ctx.lineTo(-70, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Core glowing engine
    const corePulse = Math.sin(state.timeMs * 0.01) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(244, 63, 94, ${corePulse})`;
    ctx.beginPath();
    ctx.arc(0, -5, 16, 0, Math.PI * 2);
    ctx.fill();

    // Boss Title
    ctx.font = 'bold 15px Chakra Petch, sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.fillText(boss.title, 0, -50);

    // Health bar
    const barW = 180;
    const barH = 8;
    const hpRatio = Math.max(0, boss.hp / boss.maxHp);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(-barW / 2, -68, barW, barH);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-barW / 2, -68, barW * hpRatio, barH);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, -68, barW, barH);

    // Current phrase word
    const currentWord = boss.phrase[boss.currentWordIndex] || '';
    if (currentWord) {
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      const typed = currentWord.slice(0, boss.currentTypedIndex);
      const remaining = currentWord.slice(boss.currentTypedIndex);
      const totalW = ctx.measureText(currentWord).width;

      // Word plate
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 2;
      ctx.fillRect(-totalW / 2 - 12, 55, totalW + 24, 32);
      ctx.strokeRect(-totalW / 2 - 12, 55, totalW + 24, 32);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#22c55e';
      ctx.fillText(typed, -totalW / 2, 78);
      ctx.fillStyle = '#ffffff';
      const typedOffset = ctx.measureText(typed).width;
      ctx.fillText(remaining, -totalW / 2 + typedOffset, 78);
    }

    ctx.restore();
  }

  private renderCannon(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;
    const cx = state.cannon.x * w;
    const cy = state.cannon.y * h;
    const angle = state.cannon.angle; // -PI/2 is straight up
    const recoil = state.cannon.barrelRecoil;

    ctx.save();
    ctx.translate(cx, cy);

    // Turret Base
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = state.isOverclock ? '#eab308' : '#38bdf8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, 10, 32, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rotating Cannon Barrel
    ctx.save();
    ctx.rotate(angle + Math.PI / 2); // align to angle

    const barrelLength = 40 - recoil * 10;
    const barrelWidth = 14;

    ctx.fillStyle = state.isOverclock ? '#854d0e' : '#1e293b';
    ctx.strokeStyle = state.isOverclock ? '#facc15' : '#0284c7';
    ctx.lineWidth = 2;

    ctx.fillRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);
    ctx.strokeRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);

    // Muzzle tip
    if (state.cannon.isFiring) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -barrelLength, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Central core glowing light
    const tierConfig = SPEED_TIERS[state.speedTier];
    ctx.fillStyle = state.isOverclock ? '#facc15' : tierConfig.color;
    ctx.beginPath();
    ctx.arc(0, 5, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderLasers(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;

    for (const laser of state.lasers) {
      const sx = laser.startX * w;
      const sy = laser.startY * h;
      const ex = laser.endX * w;
      const ey = laser.endY * h;

      ctx.save();
      // Outer glow
      ctx.strokeStyle = laser.glowColor || 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = laser.width + 6;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = laser.width;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderShockwaves(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;

    for (const shock of state.shockwaves) {
      const sx = shock.x * w;
      const sy = shock.y * h;
      const currentR = shock.radius * Math.max(w, h);
      const alpha = Math.max(0, 1 - shock.elapsed / shock.duration) * shock.strength;

      if (alpha <= 0.01) continue;

      ctx.save();
      ctx.strokeStyle = shock.color || `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, currentR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;

    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.char) {
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText(p.char, p.x * w, p.y * h);
      } else {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderPopups(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;

    for (const popup of state.popups) {
      ctx.save();
      ctx.globalAlpha = popup.alpha;
      ctx.translate(popup.x * w, popup.y * h);
      ctx.scale(popup.scale, popup.scale);

      ctx.font = `bold ${popup.fontSize}px Chakra Petch, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 4;
      ctx.strokeText(popup.text, 0, 0);

      // Text fill
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, 0, 0);

      // Sub-label (e.g. PERFECT / +1.5x TURBO)
      if (popup.subText) {
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;
        ctx.strokeText(popup.subText, 0, popup.fontSize * 0.7);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(popup.subText, 0, popup.fontSize * 0.7);
      }

      ctx.restore();
    }
  }

  private renderScreenOverlays(ctx: CanvasRenderingContext2D, state: RenderFrameState): void {
    const w = this.width;
    const h = this.height;

    // Critical low health pulsating red vignette
    if (state.lives <= 2) {
      const pulse = Math.sin(state.timeMs * 0.007) * 0.2 + 0.3;
      const vigGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
      vigGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      vigGrad.addColorStop(1, `rgba(239, 68, 68, ${pulse})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Overclock golden energy aura along the bottom
    if (state.isOverclock) {
      const ocGrad = ctx.createLinearGradient(0, h * 0.8, 0, h);
      ocGrad.addColorStop(0, 'rgba(234, 179, 8, 0)');
      ocGrad.addColorStop(1, 'rgba(234, 179, 8, 0.25)');
      ctx.fillStyle = ocGrad;
      ctx.fillRect(0, h * 0.8, w, h * 0.2);
    }
  }

  public destroy(): void {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
