# Typing Attack — Arcade Speed & Precision Typing Defense

Typing Attack es un videojuego de defensa orbital arcade donde destruir naves hostiles requiere mecanografiar a alta velocidad y con máxima precisión.

## Características de la Fase 2 ("Juice", Velocidad & Retención)

1. **Sistema de Flujo y Tiers de Velocidad:**
   - **NORMAL** (< 35 WPM, ×1.0)
   - **FAST** (≥ 35 WPM, ×1.25) — Cañón con estela cian
   - **TURBO** (≥ 55 WPM, ×1.5) — Partículas + aberración cromática suave
   - **OVERDRIVE** (≥ 80 WPM, ×2.0) — Parallax acelerado + bloom
   - **GODSPEED** (≥ 100 WPM, ×2.5) — Aura dorada, música al máximo
   - *Condición de activación:* El multiplicador solo se aplica si la precisión móvil reciente es **≥ 92%**.

2. **Bonificación de Reacción (Par-Time) y Tope de Multiplicador:**
   - Destruir antes del 50% de caída: **PERFECT** (+50% base).
   - Destruir antes del 75%: **GREAT** (+25% base).
   - Tope físico inquebrantable de multiplicador total en **6.0×**.

3. **Gráficos & Renderers:**
   - **WebGL2:** Shaders GLSL de post-proceso fusionados (aberración radial, scanlines CRT, shockwaves de impacto, viñeta, gradiente de color por tier).
   - **Canvas 2D:** Fallback automático si no hay WebGL2 o hay pérdida de contexto.
   - **Gobernador de Calidad Adaptativo:** Ajusta los presets (Alto / Medio / Bajo) dinámicamente si los FPS bajan de 50.

4. **Audio Procedural Dinámico (Web Audio API):**
   - Música por capas: Pad ambiente (Base) → Bajo (FAST) → Batería (TURBO) → Arpegio synth (OVERDRIVE/GODSPEED).
   - SFX afinados en escala musical con pitch progresivo según el combo.
   - Modo Música Externa para compatibilidad con reproductores de música de fondo.

5. **Entrenamiento y Diagnóstico de Mecanografía:**
   - Mapa de calor de errores por tecla en teclado visual interactivo.
   - Detección de bigramas lentos (pares de teclas con mayor latencia).
   - Consejos didácticos basados en reglas para mejorar la digitación.
   - Teclado táctil en pantalla con zonas de color por dedo para dispositivos móviles y tablets.

6. **Progreso y Retención:**
   - Rangos de piloto: Cadete, Piloto, Ás, Comandante, Leyenda.
   - 26 logros desbloqueables con recompensas de XP.
   - Hangar de personalización cosmética (skins de cañón, cápsulas y estelas).
   - Racha de días consecutivos con protección semanal.

## Comandos de Ejecución y Pruebas

```bash
# Instalar dependencias
npm install

# Ejecutar pruebas unitarias de lógica pura
npm test

# Compilar para producción
npm run build

# Desplegar reglas de Firestore (usando Firebase CLI)
firebase deploy --only firestore:rules
```
