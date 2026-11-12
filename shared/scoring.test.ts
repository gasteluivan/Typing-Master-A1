import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWordScore, calculateTimingRating, determineSpeedTier, calculateSWPM } from './scoring';

test('scoring: multiplier hard cap never exceeds 6.0', () => {
  // Test with extreme parameters that would exceed 6.0 without cap:
  // combo=50 (comboMult = 3.0), speedTier='GODSPEED' (speedMult = 2.5), overclock=true (overclockMult = 2.0)
  // 3.0 * 2.5 * 2.0 = 15.0 >> 6.0
  const result = calculateWordScore({
    wordLength: 10,
    fallProgress: 0.1,
    timeAliveMs: 1000,
    totalFallTimeMs: 4000,
    combo: 50,
    speedTier: 'GODSPEED',
    rollingAccuracy: 0.98,
    isOverclock: true,
  });

  assert.equal(result.totalMultiplier, 6.0, 'Total combined multiplier must be capped at exactly 6.0');
  assert.ok(result.points > 0);
});

test('scoring: speed tier bonus requires rolling accuracy >= 92%', () => {
  // TURBO tier with 95% accuracy -> speed multiplier should be 1.5
  const resultHighAcc = calculateWordScore({
    wordLength: 5,
    fallProgress: 0.5,
    timeAliveMs: 1500,
    totalFallTimeMs: 4000,
    combo: 0,
    speedTier: 'TURBO',
    rollingAccuracy: 0.95,
    isOverclock: false,
  });
  assert.equal(resultHighAcc.speedMultiplier, 1.5, 'TURBO bonus should be active when accuracy >= 92%');

  // TURBO tier with 88% accuracy (<92%) -> speed multiplier should drop to 1.0
  const resultLowAcc = calculateWordScore({
    wordLength: 5,
    fallProgress: 0.5,
    timeAliveMs: 1500,
    totalFallTimeMs: 4000,
    combo: 0,
    speedTier: 'TURBO',
    rollingAccuracy: 0.88,
    isOverclock: false,
  });
  assert.equal(resultLowAcc.speedMultiplier, 1.0, 'Speed bonus must be disabled when accuracy < 92%');
});

test('timing: parTime awards PERFECT, GREAT, and GOOD ratings', () => {
  // Destroyed before 50% fall time -> PERFECT (+50% base, mult 1.5)
  const perfect = calculateTimingRating(1800, 4000);
  assert.equal(perfect.rating, 'PERFECT');
  assert.equal(perfect.multiplier, 1.5);

  // Destroyed at 60% fall time -> GREAT (+25% base, mult 1.25)
  const great = calculateTimingRating(2500, 4000);
  assert.equal(great.rating, 'GREAT');
  assert.equal(great.multiplier, 1.25);

  // Destroyed at 85% fall time -> GOOD (mult 1.0)
  const good = calculateTimingRating(3500, 4000);
  assert.equal(good.rating, 'GOOD');
  assert.equal(good.multiplier, 1.0);
});

test('sWPM and tier determination', () => {
  // 50 chars in 5s = 10 words in 5/60 min = 120 WPM
  const wpm = calculateSWPM(50, 5);
  assert.equal(wpm, 120);

  const godspeed = determineSpeedTier(120, 0.95);
  assert.equal(godspeed.tier, 'GODSPEED');
  assert.equal(godspeed.bonusActive, true);

  const lowAccGodspeed = determineSpeedTier(120, 0.85);
  assert.equal(lowAccGodspeed.tier, 'GODSPEED');
  assert.equal(lowAccGodspeed.bonusActive, false);
});
