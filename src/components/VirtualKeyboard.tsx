/**
 * Responsive Virtual & On-Screen Arcade Keyboard
 * Tactile touch response for mobile/tablets, finger guide zones, and next-key highlight.
 */
import React from 'react';
import { KEY_FINGER_MAP } from '../training/keyAnalytics';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  nextChar?: string;
  fingerGuideEnabled?: boolean;
  canOverclock?: boolean;
  onOverclock?: () => void;
  className?: string;
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-', '.'],
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  nextChar,
  fingerGuideEnabled = true,
  canOverclock = false,
  onOverclock,
  className = '',
}) => {
  const targetKey = nextChar ? nextChar.toLowerCase() : null;

  const handlePointerDown = (key: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onKeyPress(key);
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto px-1 py-1 sm:py-2 select-none flex flex-col items-center gap-1 sm:gap-1.5 ${className}`}
      data-testid="virtual-keyboard"
    >
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5 w-full">
          {row.map((k) => {
            const isTarget = targetKey === k;
            const fingerInfo = KEY_FINGER_MAP[k];
            const fingerColor = fingerInfo ? fingerInfo.color : '#38bdf8';

            let keyStyle = 'bg-slate-900/90 text-slate-200 border-slate-700/80 shadow-md';
            if (isTarget) {
              keyStyle = 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 shadow-amber-400/50 shadow-lg scale-110 z-10 animate-bounce';
            } else if (fingerGuideEnabled && fingerInfo) {
              keyStyle = `bg-slate-900/95 text-slate-100 border-t-2 shadow-sm`;
            }

            return (
              <button
                key={k}
                type="button"
                onPointerDown={(e) => handlePointerDown(k, e)}
                style={
                  fingerGuideEnabled && !isTarget && fingerInfo
                    ? { borderTopColor: fingerColor }
                    : undefined
                }
                className={`flex-1 max-w-[48px] h-9 sm:h-11 rounded-md sm:rounded-lg border text-xs sm:text-base font-mono font-bold flex items-center justify-center transition-all duration-75 active:scale-90 active:bg-cyan-500 active:text-slate-950 touch-manipulation ${keyStyle}`}
                aria-label={`Key ${k.toUpperCase()}`}
              >
                {k.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}

      {/* Bottom Bar: Space / Overclock Button */}
      <div className="flex w-full gap-2 px-1 max-w-lg mt-0.5">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (canOverclock && onOverclock) {
              onOverclock();
            } else {
              onKeyPress(' ');
            }
          }}
          className={`flex-1 h-9 sm:h-11 rounded-md sm:rounded-lg border text-xs sm:text-sm font-display font-bold uppercase tracking-wider flex items-center justify-center transition-all duration-100 active:scale-95 touch-manipulation ${
            canOverclock
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-400/60 shadow-lg animate-pulse font-extrabold'
              : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500'
          }`}
          aria-label={canOverclock ? 'Activar Overclock' : 'Espacio'}
        >
          {canOverclock ? '⚡ ¡ACTIVAR OVERCLOCK! (ESPACIO) ⚡' : 'ESPACIO'}
        </button>
      </div>
    </div>
  );
};
