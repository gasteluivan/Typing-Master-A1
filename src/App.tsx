/**
 * Typing Attack — Juice & Speed Edition (Phase 2)
 * Full Game Architecture with WebGL2 / GLSL shaders, procedural audio,
 * responsive mobile controls, flow system, and learning analytics.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameState } from './game/GameEngine';
import { Canvas2DRenderer } from './render/Canvas2DRenderer';
import { WebGLRenderer } from './render/WebGLRenderer';
import { SoundManager } from './audio/SoundManager';
import { FXManager } from './fx/FXManager';
import { PilotProfile, RunSummary, SpeedTier } from '../shared/types';
import { loadProfile, recordRunToProfile, saveProfile } from './progression/profileStorage';
import { AchievementDef } from './progression/achievements';
import { WORD_POOLS } from '../shared/words';

// Components
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { AnalyticsView } from './components/AnalyticsView';
import { HangarModal } from './components/HangarModal';
import { AchievementsModal } from './components/AchievementsModal';
import { TrainingView } from './components/TrainingView';
import { VirtualKeyboard } from './components/VirtualKeyboard';

type SubModal = 'none' | 'training' | 'analytics' | 'hangar' | 'achievements' | 'settings';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Engine & Subsystems
  const engineRef = useRef<GameEngine | null>(null);
  const soundRef = useRef<SoundManager>(new SoundManager());
  const fxRef = useRef<FXManager>(new FXManager());

  // UI State (throttled / discrete updates so React doesn't re-render at 60Hz)
  const [gameState, setGameState] = useState<GameState>('title');
  const [activeModal, setActiveModal] = useState<SubModal>('none');
  const [profile, setProfile] = useState<PilotProfile>(() => loadProfile());

  // Live HUD metrics
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [speedTier, setSpeedTier] = useState<SpeedTier>('NORMAL');
  const [flowMeter, setFlowMeter] = useState(0);
  const [isOverclock, setIsOverclock] = useState(false);
  const [lives, setLives] = useState(5);
  const [maxLives, setMaxLives] = useState(5);
  const [level, setLevel] = useState(1);
  const [hasShield, setHasShield] = useState(false);
  const [rollingAccuracy, setRollingAccuracy] = useState(1.0);

  // Game Over Run Summary
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);
  const [leveledUp, setLeveledUp] = useState(false);
  const [wpmTimeline, setWpmTimeline] = useState<{ tSec: number; wpm: number }[]>([]);

  // Settings & Responsiveness
  const [qualityPreset, setQualityPreset] = useState<'HIGH' | 'MED' | 'LOW'>('HIGH');
  const [reducedEffects, setReducedEffects] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(1.0);
  const [fingerGuideEnabled, setFingerGuideEnabled] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVol, setMasterVol] = useState(0.8);
  const [musicVol, setMusicVol] = useState(0.6);
  const [sfxVol, setSfxVol] = useState(0.8);
  const [externalMusicActive, setExternalMusicActive] = useState(false);

  // Next key to type for virtual keyboard hint
  const [nextCharHint, setNextCharHint] = useState<string | undefined>(undefined);

  // Default showKeyboard to false so mobile never auto-enables the keyboard
  useEffect(() => {
    setShowKeyboard(false);
  }, []);

  // Initialize Game Engine & Renderer once
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || window.innerWidth || 800;
    const height = mountRef.current.clientHeight || window.innerHeight || 600;

    // Try WebGLRenderer with Canvas2DRenderer fallback
    const renderer = new WebGLRenderer();

    renderer.init(mountRef.current, width, height).catch((err) => {
      console.warn('WebGL init fallback error:', err);
    });

    const engine = new GameEngine({
      sound: soundRef.current,
      fx: fxRef.current,
      renderer,
      onStateChange: (newState) => {
        setGameState(newState);
      },
      onScoreUpdate: (curScore, curCombo, curWpm, curTier) => {
        setScore(curScore);
        setCombo(curCombo);
        setWpm(curWpm);
        setSpeedTier(curTier);

        if (engineRef.current) {
          setFlowMeter(engineRef.current.flowMeter);
          setIsOverclock(engineRef.current.isOverclock);
          setLives(engineRef.current.lives);
          setMaxLives(engineRef.current.maxLives);
          setLevel(engineRef.current.level);
          setHasShield(engineRef.current.hasShield);
          setRollingAccuracy(engineRef.current.rollingAccuracy);

          // Find next character for virtual keyboard hint
          const currentWord = engineRef.current.activeWords.find(
            (w) => w.id === engineRef.current?.currentTargetId
          );
          if (currentWord) {
            setNextCharHint(currentWord.text[currentWord.typedIndex]);
          } else if (engineRef.current.boss) {
            const b = engineRef.current.boss;
            const bw = b.phrase[b.currentWordIndex] || '';
            setNextCharHint(bw[b.currentTypedIndex]);
          } else {
            setNextCharHint(undefined);
          }
        }
      },
      onGameOver: (summary) => {
        const { profile: updatedProfile, newAchievements: unlocked, leveledUp: lvlUp } = recordRunToProfile(summary);
        setProfile(updatedProfile);
        setLastSummary(summary);
        setNewAchievements(unlocked);
        setLeveledUp(lvlUp);
        if (engineRef.current) {
          setWpmTimeline(engineRef.current.wpmTimeline);
        }
      },
    });

    engineRef.current = engine;

    // Handle ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: rw, height: rh } = entry.contentRect;
        if (rw > 0 && rh > 0) {
          renderer.resize(rw, rh);
        }
      }
    });

    resizeObserver.observe(mountRef.current);

    // Check autostart query param (?autostart=1)
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startGame('classic');
    }

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
    };
  }, []);

  // Update Settings in Engine and Sound
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.qualityPreset = qualityPreset;
      engineRef.current.reducedEffects = reducedEffects;
    }
    fxRef.current.setShakeIntensity(shakeIntensity);
    soundRef.current.setVolumes(masterVol, musicVol, sfxVol, isMuted);
    soundRef.current.externalMusicActive = externalMusicActive;
  }, [qualityPreset, reducedEffects, shakeIntensity, masterVol, musicVol, sfxVol, isMuted, externalMusicActive]);

  // Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in an open sub-modal or typing in an input
      if (activeModal !== 'none') {
        if (e.key === 'Escape') {
          setActiveModal('none');
        }
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          engineRef.current?.pauseGame();
          return;
        } else if (gameState === 'paused') {
          engineRef.current?.resumeGame();
          return;
        }
      }

      // Title screen Enter / Space triggers start
      if (gameState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startGame('classic');
        return;
      }

      if (gameState === 'playing' && engineRef.current) {
        if (e.key === ' ') {
          e.preventDefault(); // prevent scroll
          engineRef.current.handleKeyPress(' ');
        } else if (e.key.length === 1) {
          engineRef.current.handleKeyPress(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeModal]);

  // Actions
  const startGame = useCallback((mode: 'classic' | 'daily' | 'training', customSeed?: string) => {
    setActiveModal('none');
    setShowKeyboard(false); // Ensure keyboard is not enabled when entering the game
    engineRef.current?.startGame(mode, customSeed);
  }, []);

  const handleStartLesson = useCallback((lessonId: string) => {
    const lesson = (WORD_POOLS.trainingLessons as any)[lessonId];
    if (lesson) {
      setActiveModal('none');
      setShowKeyboard(false);
      engineRef.current?.startGame('training', `lesson_${lessonId}`);
    }
  }, []);

  const handleStartAdaptive = useCallback(() => {
    setActiveModal('none');
    setShowKeyboard(false);
    engineRef.current?.startGame('training', `adaptive_${Date.now()}`);
  }, []);

  const handleVirtualKeyPress = useCallback((key: string) => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.handleKeyPress(key);
    }
  }, [gameState]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-hud"
    >
      {/* Hidden real input for hardware or manual keyboard */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="opacity-0 absolute -top-96 left-0 pointer-events-none"
        aria-hidden="true"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        onChange={(e) => {
          const val = e.target.value;
          if (val && val.length > 0) {
            const char = val[val.length - 1];
            engineRef.current?.handleKeyPress(char);
            e.target.value = '';
          }
        }}
      />

      {/* Live Canvas Mount */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full z-0 touch-none overflow-hidden"
      />

      {/* Arcade Scanlines & CRT vignette overlay */}
      {!reducedEffects && (
        <div className="absolute inset-0 pointer-events-none z-10 scanlines crt-vignette opacity-70" />
      )}

      {/* Title Screen */}
      {gameState === 'title' && activeModal === 'none' && (
        <TitleScreen
          profile={profile}
          onStartGame={startGame}
          onOpenTraining={() => setActiveModal('training')}
          onOpenAnalytics={() => setActiveModal('analytics')}
          onOpenHangar={() => setActiveModal('hangar')}
          onOpenAchievements={() => setActiveModal('achievements')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* Active Game HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          score={score}
          combo={combo}
          wpm={wpm}
          rollingAccuracy={rollingAccuracy}
          speedTier={speedTier}
          flowMeter={flowMeter}
          isOverclock={isOverclock}
          lives={lives}
          maxLives={maxLives}
          level={level}
          hasShield={hasShield}
          isMuted={isMuted}
          showKeyboard={showKeyboard}
          onPause={() => engineRef.current?.pauseGame()}
          onToggleMute={() => setIsMuted((m) => !m)}
          onToggleKeyboard={() => setShowKeyboard((k) => !k)}
          onOpenSettings={() => setActiveModal('settings')}
          onTriggerOverclock={() => engineRef.current?.activateOverclock()}
        />
      )}

      {/* Responsive Virtual Keyboard (Bottom Docked) */}
      {(gameState === 'playing' || gameState === 'paused') && showKeyboard && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-auto p-1 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
          <VirtualKeyboard
            onKeyPress={handleVirtualKeyPress}
            nextChar={nextCharHint}
            fingerGuideEnabled={fingerGuideEnabled}
            canOverclock={flowMeter >= 100 && !isOverclock}
            onOverclock={() => engineRef.current?.activateOverclock()}
          />
        </div>
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => engineRef.current?.resumeGame()}
          onRestart={() => engineRef.current?.restartGame()}
          onHome={() => {
            engineRef.current?.destroy();
            setGameState('title');
          }}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && lastSummary && (
        <GameOverModal
          summary={lastSummary}
          newAchievements={newAchievements}
          leveledUp={leveledUp}
          newRank={profile.rank}
          wpmTimeline={wpmTimeline}
          onRestart={() => engineRef.current?.restartGame()}
          onHome={() => setGameState('title')}
        />
      )}

      {/* Sub-Views & Modals */}
      {activeModal === 'training' && (
        <TrainingView
          profile={profile}
          onStartLesson={handleStartLesson}
          onStartAdaptive={handleStartAdaptive}
          onBack={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'analytics' && (
        <AnalyticsView
          profile={profile}
          onBack={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'hangar' && (
        <HangarModal
          profile={profile}
          onUpdateProfile={(p) => setProfile(p)}
          onBack={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'achievements' && (
        <AchievementsModal
          profile={profile}
          onBack={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          qualityPreset={qualityPreset}
          reducedEffects={reducedEffects}
          shakeIntensity={shakeIntensity}
          fingerGuideEnabled={fingerGuideEnabled}
          showKeyboard={showKeyboard}
          masterVol={masterVol}
          musicVol={musicVol}
          sfxVol={sfxVol}
          isMuted={isMuted}
          externalMusicActive={externalMusicActive}
          onUpdateQuality={setQualityPreset}
          onUpdateReducedEffects={setReducedEffects}
          onUpdateShake={setShakeIntensity}
          onUpdateFingerGuide={setFingerGuideEnabled}
          onUpdateShowKeyboard={setShowKeyboard}
          onUpdateVolumes={(m, mus, s, muted) => {
            setMasterVol(m);
            setMusicVol(mus);
            setSfxVol(s);
            setIsMuted(muted);
          }}
          onUpdateExternalMusic={setExternalMusicActive}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
