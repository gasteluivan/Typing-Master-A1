/**
 * Word vocabulary for typing attack, curated for dynamic gameplay
 */

export const WORD_POOLS = {
  // Short words (length 3-4): levels 1-3
  tier1: [
    'sol', 'luz', 'red', 'mar', 'gas', 'rey', 'ley', 'voz', 'zen', 'sur',
    'pan', 'rio', 'ola', 'paz', 'uno', 'dos', 'tres', 'aire', 'nave', 'fase',
    'rayo', 'meta', 'cero', 'alfa', 'beta', 'base', 'onda', 'foto', 'dato', 'chip',
    'nodo', 'puls', 'core', 'byte', 'fire', 'bolt', 'grid', 'warp', 'echo', 'flux',
    'viga', 'boca', 'fiel', 'ruta', 'zoom', 'halo', 'glow', 'apex', 'byte', 'code',
  ],

  // Medium words (length 5-6): levels 4-8
  tier2: [
    'laser', 'motor', 'radar', 'pixel', 'turbo', 'pulso', 'acero', 'robot', 'cable', 'fibra',
    'servo', 'reloj', 'plano', 'fuego', 'vuelo', 'casco', 'metal', 'titan', 'cyber', 'solar',
    'fusil', 'drone', 'sigma', 'delta', 'vortex', 'plasma', 'atomic', 'vector', 'matrix', 'stream',
    'circuito', 'sensor', 'cohete', 'prisma', 'escudo', 'orbital', 'quantum', 'satelite', 'orbital',
    'furia', 'canon', 'campo', 'mando', 'rango', 'ritmo', 'golpe', 'carga', 'salto', 'trazo',
  ],

  // Advanced words (length 7-9): levels 9+
  tier3: [
    'reactor', 'blindaje', 'gravedad', 'impulsor', 'terminal', 'telemetria', 'secuencia', 'velocidad',
    'frecuencia', 'analizador', 'sintesis', 'resonancia', 'propulsion', 'fotovoltaico', 'sideral',
    'cibernetico', 'algoritmo', 'hiperespacio', 'particula', 'antimateria', 'astronave', 'sobrecarga',
    'sobrecalentar', 'supernova', 'atmosfera', 'disipador', 'modulador', 'nanotecnologia', 'vibracion',
    'interfaz', 'sincronia', 'mecanismo', 'acelerador', 'potencia', 'condensador', 'transistor',
  ],

  // Boss phrases (each phrase is 3-5 words)
  bossPhrases: [
    { title: 'CENTINELA TITÁN', words: ['nucleo', 'sobrecalentado', 'falla', 'critica'] },
    { title: 'DREADNOUGHT VÓRTEX', words: ['colapso', 'gravitacional', 'inminente', 'evacuar'] },
    { title: 'LEVIATÁN CYBERNETIC', words: ['iniciar', 'secuencia', 'purga', 'absoluta'] },
    { title: 'NODO MAESTRO OMEGA', words: ['desactivar', 'matriz', 'defensa', 'suprema', 'ahora'] },
    { title: 'HIPER-IA SINGULARIDAD', words: ['redistribuir', 'energia', 'escudo', 'destructor'] },
  ],

  // Training tiers by keyboard rows
  trainingLessons: {
    homeRow: {
      id: 'home_row',
      title: 'Fila Base (ASDF JKLÑ)',
      keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      words: ['hada', 'falda', 'gala', 'saga', 'ala', 'gas', 'faja', 'sala', 'alfa', 'flan', 'laja', 'falsa', 'dada'],
    },
    topRow: {
      id: 'top_row',
      title: 'Fila Superior (QWERTY UIOP)',
      keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      words: ['torre', 'perro', 'puerto', 'trigo', 'poeta', 'repite', 'tiro', 'puro', 'equipo', 'tope', 'ruta', 'rito'],
    },
    bottomRow: {
      id: 'bottom_row',
      title: 'Fila Inferior (ZXCVBNM)',
      keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
      words: ['zona', 'vaca', 'banco', 'caza', 'mano', 'vino', 'cine', 'barco', 'nieve', 'vaso', 'nexo', 'boxeo'],
    },
    numbers: {
      id: 'numbers',
      title: 'Números y Código (1234567890)',
      keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      words: ['fase1', 'nodo2', 'core3', 'mk4', 'v5', 't6', 'sub7', 'sec8', 'gen9', 'p0', 'bot4', 'win99'],
    },
    symbols: {
      id: 'symbols',
      title: 'Símbolos de Programación',
      keys: ['-', '_', '.', '/', ':', ';', '!', '?'],
      words: ['data.js', 'run_test', 'api/v1', 'port:3000', 'status:ok', 'exit(0);', 'flag!', 'ping?'],
    },
  },
};
