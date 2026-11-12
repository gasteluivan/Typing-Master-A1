/**
 * Typing Analytics & Rule-based Finger Coach
 */
import { KeyStats, PilotProfile } from '../../shared/types';

export interface FingerAssignment {
  finger: string;
  hand: 'left' | 'right';
  color: string;
}

export const KEY_FINGER_MAP: Record<string, FingerAssignment> = {
  // Left Pinky
  'q': { finger: 'Meñique Izquierdo', hand: 'left', color: '#f43f5e' },
  'a': { finger: 'Meñique Izquierdo', hand: 'left', color: '#f43f5e' },
  'z': { finger: 'Meñique Izquierdo', hand: 'left', color: '#f43f5e' },
  '1': { finger: 'Meñique Izquierdo', hand: 'left', color: '#f43f5e' },

  // Left Ring
  'w': { finger: 'Anular Izquierdo', hand: 'left', color: '#fb923c' },
  's': { finger: 'Anular Izquierdo', hand: 'left', color: '#fb923c' },
  'x': { finger: 'Anular Izquierdo', hand: 'left', color: '#fb923c' },
  '2': { finger: 'Anular Izquierdo', hand: 'left', color: '#fb923c' },

  // Left Middle
  'e': { finger: 'Medio Izquierdo', hand: 'left', color: '#facc15' },
  'd': { finger: 'Medio Izquierdo', hand: 'left', color: '#facc15' },
  'c': { finger: 'Medio Izquierdo', hand: 'left', color: '#facc15' },
  '3': { finger: 'Medio Izquierdo', hand: 'left', color: '#facc15' },

  // Left Index
  'r': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },
  't': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },
  'f': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },
  'g': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },
  'v': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },
  'b': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },
  '4': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },
  '5': { finger: 'Índice Izquierdo', hand: 'left', color: '#4ade80' },

  // Thumbs
  ' ': { finger: 'Pulgar', hand: 'right', color: '#38bdf8' },

  // Right Index
  'y': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },
  'u': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },
  'h': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },
  'j': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },
  'n': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },
  'm': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },
  '6': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },
  '7': { finger: 'Índice Derecho', hand: 'right', color: '#2dd4bf' },

  // Right Middle
  'i': { finger: 'Medio Derecho', hand: 'right', color: '#818cf8' },
  'k': { finger: 'Medio Derecho', hand: 'right', color: '#818cf8' },
  ',': { finger: 'Medio Derecho', hand: 'right', color: '#818cf8' },
  '8': { finger: 'Medio Derecho', hand: 'right', color: '#818cf8' },

  // Right Ring
  'o': { finger: 'Anular Derecho', hand: 'right', color: '#c084fc' },
  'l': { finger: 'Anular Derecho', hand: 'right', color: '#c084fc' },
  '.': { finger: 'Anular Derecho', hand: 'right', color: '#c084fc' },
  '9': { finger: 'Anular Derecho', hand: 'right', color: '#c084fc' },

  // Right Pinky
  'p': { finger: 'Meñique Derecho', hand: 'right', color: '#f472b6' },
  'ñ': { finger: 'Meñique Derecho', hand: 'right', color: '#f472b6' },
  '-': { finger: 'Meñique Derecho', hand: 'right', color: '#f472b6' },
  '0': { finger: 'Meñique Derecho', hand: 'right', color: '#f472b6' },
};

export interface CoachAdvice {
  key: string;
  advice: string;
  errorRate: number;
  finger: string;
}

export function generateFingerCoaching(profile: PilotProfile): CoachAdvice[] {
  const advices: CoachAdvice[] = [];
  const entries = Object.entries(profile.keyStats);

  // Sort by error count
  const withErrors = entries
    .map(([k, stats]) => {
      const total = stats.hits + stats.errors;
      const errorRate = total > 5 ? stats.errors / total : 0;
      return { key: k, stats, errorRate };
    })
    .filter((item) => item.stats.errors >= 2 && item.errorRate > 0.08)
    .sort((a, b) => b.stats.errors - a.stats.errors);

  for (const item of withErrors.slice(0, 3)) {
    const fingerInfo = KEY_FINGER_MAP[item.key.toLowerCase()];
    const fingerName = fingerInfo ? fingerInfo.finger : 'un dedo específico';

    let tip = `Tu tecla más errada es la "${item.key.toUpperCase()}": mantén la posición base y practica alcanzarla usando tu ${fingerName}.`;
    if (fingerInfo?.hand === 'right' && item.key.toLowerCase() === 'p') {
      tip = `La tecla "P" requiere precisión: usa el meñique derecho sin levantar la palma del teclado.`;
    } else if (item.key.toLowerCase() === 'c' || item.key.toLowerCase() === 'b') {
      tip = `La tecla "${item.key.toUpperCase()}" en la fila inferior se pulsa con el ${fingerName}. Evita cruzar los dedos.`;
    }

    advices.push({
      key: item.key,
      advice: tip,
      errorRate: Math.round(item.errorRate * 100),
      finger: fingerName,
    });
  }

  if (advices.length === 0) {
    advices.push({
      key: 'ritmo',
      advice: '¡Excelente precisión! Para acelerar tu sWPM, concéntrate en mantener un ritmo constante sin pausas entre palabras.',
      errorRate: 0,
      finger: 'Ambas manos',
    });
  }

  return advices;
}

export function getSlowestBigrams(profile: PilotProfile, count = 5): { pair: string; avgMs: number }[] {
  const list = Object.values(profile.bigramStats)
    .filter((b) => b.count >= 3)
    .map((b) => ({
      pair: b.pair,
      avgMs: Math.round(b.totalLatencyMs / b.count),
    }))
    .sort((a, b) => b.avgMs - a.avgMs);

  return list.slice(0, count);
}
