# Typing Attack — Hoja de Ruta (Roadmap)

## Fase 1: Mecánicas Base (Completada)
- Motor determinista con semilla.
- Caída de palabras y torreta con puntería.
- Canvas 2D inicial y cálculo de WPM.

## Fase 2: "Juice", Bonus de Velocidad, FX y Retención (Completada)
- **Bonus de Velocidad (Flow):** Tiers Normal (<35), FAST (≥35), TURBO (≥55), OVERDRIVE (≥80), GODSPEED (≥100) condicionados a precisión móvil ≥ 92%.
- **Par-Time & Scoring:** Calificaciones PERFECT (+50%), GREAT (+25%), GOOD (+0%) con tope estricto de multiplicador global a 6.0x.
- **Medidor de Flujo & Overclock:** Barra energética acumulativa con activación de sobrecarga temporal (`Espacio` o botón táctil).
- **Juice & Renderers:** Render dual WebGL2 con pipeline de post-proceso GLSL (aberración cromática radial, scanlines, shockwave, bloom, viñeta) y fallback Canvas2D.
- **Audio Procedural Dinámico:** 4 capas musicales adaptativas por Web Audio API (Pad, Bajo, Batería, Arpegio) y SFX en escala musical pentatónica con pitch variable por combo.
- **Variedad de Gameplay:** Palabras especiales doradas (Freeze ❄, Bomba 💣, Escudo 🛡, Reparar ❤, Multiplicador ✖) y batallas contra jefes Titán cada 10 niveles.
- **Progreso y Retención:** Rangos de piloto (Cadete a Leyenda), XP, racha diaria con protección semanal, 26 logros, desbloqueables cosméticos de hangar (skins, cápsulas, estelas).
- **Didáctica & Diagnóstico:** Mapa de calor de errores por tecla, detector de bigramas lentos, guía de dedos con zonas de color y modo de entrenamiento adaptativo.
- **Diseño Responsivo:** Adaptación fluida a dispositivos móviles, tablets y escritorios con teclado táctil arcade integrado.

## Fase 3: Integración Musical & Modo DJ (Futuro)
- Sincronización con APIs de Spotify / YouTube Music vía OAuth.
- BPM matching en tiempo real entre la música externa y la velocidad de caída de palabras.

## Fase 4: Multijugador en Tiempo Real (Futuro)
- Duelos 1v1 con WebSockets y penalizaciones de ataque (enviar palabras basura o pantalla de humo al rival).
- Salas clasificatorias con emparejamiento ELO.

## Fase 5: Modding & Editor de Niveles de la Comunidad (Futuro)
- Editor de diccionarios personalizados por temática (médico, legal, programación en Rust/TS/Go).
- Compartir listas de palabras y desafíos con códigos QR.
