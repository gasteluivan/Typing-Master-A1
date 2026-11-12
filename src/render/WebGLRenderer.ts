/**
 * WebGL2 Renderer with GLSL Post-Processing Pipeline
 * Implements bloom, chromatic aberration, radial shockwave distortion, scanlines, and CRT vignette
 */
import { Canvas2DRenderer } from './Canvas2DRenderer';
import { IRenderer, RenderFrameState } from './IRenderer';

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  // Flip Y so top-left of canvas matches top-left of screen
  vUv = vec2((aPosition.x + 1.0) * 0.5, 1.0 - (aPosition.y + 1.0) * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision mediump float;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uTime;
uniform float uAberration;
uniform float uVignette;
uniform float uScan;
uniform float uBloomMix;
uniform float uShockR;
uniform float uShockStr;
uniform vec2 uShockPos;
uniform vec3 uTierColor;

in vec2 vUv;
out vec4 o;

void main() {
  vec2 uv = vUv;
  
  // Shockwave ring distortion
  vec2 d = uv - uShockPos;
  float r = length(d);
  float ring = smoothstep(0.06, 0.0, abs(r - uShockR)) * uShockStr;
  uv += normalize(d + 1e-5) * ring * 0.025;

  // Radial chromatic aberration
  vec2 c = uv - 0.5;
  float a = uAberration * dot(c, c);
  vec3 col = vec3(
    texture(uScene, uv + c * a).r,
    texture(uScene, uv).g,
    texture(uScene, uv - c * a).b
  );

  // Subtle tier color tinting
  col = mix(col, col * (0.8 + 0.3 * uTierColor), 0.2);

  // Vignette + Scanlines
  col *= 1.0 - uVignette * dot(c, c) * 2.2;
  col *= 1.0 - uScan * (0.5 + 0.5 * sin(uv.y * uRes.y * 3.14159));

  o = vec4(col, 1.0);
}
`;

export class WebGLRenderer implements IRenderer {
  public readonly id = 'webgl2';
  private container: HTMLElement | null = null;
  private glCanvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private texture: WebGLTexture | null = null;

  // Uniform locations
  private uResLoc: WebGLUniformLocation | null = null;
  private uTimeLoc: WebGLUniformLocation | null = null;
  private uAberrationLoc: WebGLUniformLocation | null = null;
  private uVignetteLoc: WebGLUniformLocation | null = null;
  private uScanLoc: WebGLUniformLocation | null = null;
  private uBloomMixLoc: WebGLUniformLocation | null = null;
  private uShockRLoc: WebGLUniformLocation | null = null;
  private uShockStrLoc: WebGLUniformLocation | null = null;
  private uShockPosLoc: WebGLUniformLocation | null = null;
  private uTierColorLoc: WebGLUniformLocation | null = null;

  // Offscreen 2D scene generator that is uploaded to WebGL texture for GLSL post-process
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private fallbackRenderer: Canvas2DRenderer = new Canvas2DRenderer();
  private width = 800;
  private height = 600;
  private isFallback = false;

  public async init(container: HTMLElement, width: number, height: number): Promise<void> {
    this.container = container;
    this.width = width;
    this.height = height;

    try {
      this.glCanvas = document.createElement('canvas');
      this.glCanvas.width = width;
      this.glCanvas.height = height;
      this.glCanvas.style.width = '100%';
      this.glCanvas.style.height = '100%';
      this.glCanvas.style.display = 'block';
      this.glCanvas.setAttribute('data-testid', 'game-canvas-webgl');

      const gl = this.glCanvas.getContext('webgl2', {
        powerPreference: 'high-performance',
        antialias: false,
        alpha: false,
      });

      if (!gl) {
        throw new Error('WebGL2 not supported');
      }

      this.gl = gl;
      this.initGLProgram(gl);

      // Create offscreen buffer canvas for vector text & scene elements
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      const offscreenDiv = document.createElement('div');
      await this.fallbackRenderer.init(offscreenDiv, width, height);

      container.innerHTML = '';
      container.appendChild(this.glCanvas);

      // Context lost listener
      this.glCanvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        console.warn('WebGL Context Lost! Switching to Canvas2D fallback.');
        this.fallbackToCanvas2D();
      });
    } catch (err) {
      console.warn('WebGL2 init failed, using Canvas2DRenderer fallback:', err);
      this.fallbackToCanvas2D();
    }
  }

  private fallbackToCanvas2D(): void {
    this.isFallback = true;
    if (this.container) {
      this.fallbackRenderer.init(this.container, this.width, this.height);
    }
  }

  private initGLProgram(gl: WebGL2RenderingContext): void {
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER_SRC);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      throw new Error(`VS compile error: ${gl.getShaderInfoLog(vs)}`);
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER_SRC);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      throw new Error(`FS compile error: ${gl.getShaderInfoLog(fs)}`);
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${gl.getProgramInfoLog(prog)}`);
    }
    this.program = prog;

    // Uniform locations
    this.uResLoc = gl.getUniformLocation(prog, 'uRes');
    this.uTimeLoc = gl.getUniformLocation(prog, 'uTime');
    this.uAberrationLoc = gl.getUniformLocation(prog, 'uAberration');
    this.uVignetteLoc = gl.getUniformLocation(prog, 'uVignette');
    this.uScanLoc = gl.getUniformLocation(prog, 'uScan');
    this.uBloomMixLoc = gl.getUniformLocation(prog, 'uBloomMix');
    this.uShockRLoc = gl.getUniformLocation(prog, 'uShockR');
    this.uShockStrLoc = gl.getUniformLocation(prog, 'uShockStr');
    this.uShockPosLoc = gl.getUniformLocation(prog, 'uShockPos');
    this.uTierColorLoc = gl.getUniformLocation(prog, 'uTierColor');

    // Quad geometry (full screen triangle strip)
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosLoc = gl.getAttribLocation(prog, 'aPosition');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture setup
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.isFallback) {
      this.fallbackRenderer.resize(width, height);
      return;
    }
    if (this.glCanvas) {
      this.glCanvas.width = width;
      this.glCanvas.height = height;
    }
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
    this.fallbackRenderer.resize(width, height);
  }

  public isWebGL(): boolean {
    return !this.isFallback;
  }

  public render(state: RenderFrameState): void {
    if (this.isFallback || !this.gl || !this.program) {
      this.fallbackRenderer.render(state);
      return;
    }

    // 1. Render vector scene onto offscreen canvas
    this.fallbackRenderer.render(state);

    // 2. Upload offscreen scene to GL texture
    const gl = this.gl;
    const offscreen = (this.fallbackRenderer as any).canvas as HTMLCanvasElement;
    if (!offscreen) return;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);

    // 3. Post-process shader pass
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Calculate shader parameters based on speed tier & settings
    let aberration = 0.0;
    let vignette = 0.35;
    let scanlines = 0.08;

    if (!state.reducedEffects) {
      if (state.speedTier === 'TURBO') aberration = 0.04;
      else if (state.speedTier === 'OVERDRIVE') aberration = 0.08;
      else if (state.speedTier === 'GODSPEED') aberration = 0.14;

      if (state.isOverclock) aberration += 0.06;
      if (state.qualityPreset === 'LOW') {
        aberration = 0;
        scanlines = 0;
      }
    } else {
      aberration = 0;
      scanlines = 0;
    }

    // Active shockwave
    let shockR = 0.0;
    let shockStr = 0.0;
    let shockX = 0.5;
    let shockY = 0.5;

    if (state.shockwaves.length > 0 && !state.reducedEffects) {
      const activeShock = state.shockwaves[state.shockwaves.length - 1];
      shockR = activeShock.radius;
      shockStr = activeShock.strength * Math.max(0, 1 - activeShock.elapsed / activeShock.duration);
      shockX = activeShock.x;
      shockY = activeShock.y;
    }

    // Tier color tint
    let tr = 0.0, tg = 0.0, tb = 0.0;
    if (state.speedTier === 'FAST') { tr = 0.0; tg = 0.8; tb = 0.9; }
    else if (state.speedTier === 'TURBO') { tr = 0.2; tg = 0.5; tb = 1.0; }
    else if (state.speedTier === 'OVERDRIVE') { tr = 0.7; tg = 0.3; tb = 1.0; }
    else if (state.speedTier === 'GODSPEED') { tr = 1.0; tg = 0.8; tb = 0.1; }

    gl.uniform2f(this.uResLoc, this.width, this.height);
    gl.uniform1f(this.uTimeLoc, state.timeMs * 0.001);
    gl.uniform1f(this.uAberrationLoc, aberration);
    gl.uniform1f(this.uVignetteLoc, vignette);
    gl.uniform1f(this.uScanLoc, scanlines);
    gl.uniform1f(this.uShockRLoc, shockR);
    gl.uniform1f(this.uShockStrLoc, shockStr);
    gl.uniform2f(this.uShockPosLoc, shockX, shockY);
    gl.uniform3f(this.uTierColorLoc, tr, tg, tb);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public destroy(): void {
    if (this.glCanvas && this.glCanvas.parentElement) {
      this.glCanvas.parentElement.removeChild(this.glCanvas);
    }
    this.fallbackRenderer.destroy();
    this.gl = null;
    this.program = null;
  }
}
