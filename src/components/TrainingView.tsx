/**
 * Training View: Progressive row lessons and adaptive practice
 */
import React from 'react';
import { WORD_POOLS } from '../../shared/words';
import { PilotProfile } from '../../shared/types';
import { ArrowLeft, Target, Play, BookOpen } from 'lucide-react';

interface TrainingViewProps {
  profile: PilotProfile;
  onStartLesson: (lessonId: string) => void;
  onStartAdaptive: () => void;
  onBack: () => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  profile,
  onStartLesson,
  onStartAdaptive,
  onBack,
}) => {
  const lessons = Object.values(WORD_POOLS.trainingLessons);

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
          CENTRO DE ENTRENAMIENTO & LECCIONES
        </h2>
        <div className="w-16" />
      </div>

      <div className="w-full flex flex-col gap-5 mt-6">
        {/* Adaptive Practice Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
              <Target className="w-4 h-4" /> MODO RECOMENDADO
            </div>
            <h3 className="text-xl font-display font-black text-white">
              Práctica Adaptativa (Basada en tus Errores)
            </h3>
            <p className="text-xs font-hud text-slate-300 max-w-lg">
              Genera palabras dirigidas específicamente a tus teclas y bigramas con mayor fricción. Sin penalización de vidas.
            </p>
          </div>

          <button
            type="button"
            data-start="true"
            onClick={onStartAdaptive}
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm tracking-wider uppercase transition-all shadow-emerald-500/30 shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            INICIAR ADAPTATIVO
          </button>
        </div>

        {/* Progressive Row Lessons */}
        <div className="flex flex-col gap-3 mt-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> LECCIONES PROGRESIVAS DE TECLADO
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="font-display font-bold text-white text-base">{lesson.title}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lesson.keys.map((k) => (
                      <span
                        key={k}
                        className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-cyan-300"
                      >
                        {k.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-2 truncate">
                    Muestra: {lesson.words.slice(0, 5).join(', ')}...
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartLesson(lesson.id)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-display font-bold tracking-wider text-slate-200 hover:text-white uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" /> PRACTICAR ESTA FILA
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
