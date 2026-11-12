import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLevel } from './generateLevel';

test('generateLevel: deterministic reproducibility with same seed', () => {
  const level1A = generateLevel(5, 'daily_2026_11_11');
  const level1B = generateLevel(5, 'daily_2026_11_11');

  assert.equal(level1A.seed, level1B.seed);
  assert.equal(level1A.words.length, level1B.words.length);
  assert.equal(level1A.event, level1B.event);

  for (let i = 0; i < level1A.words.length; i++) {
    assert.equal(level1A.words[i].text, level1B.words[i].text);
    assert.equal(level1A.words[i].x, level1B.words[i].x);
    assert.equal(level1A.words[i].speed, level1B.words[i].speed);
    assert.equal(level1A.words[i].specialType, level1B.words[i].specialType);
  }
});

test('generateLevel: boss appears on level 10 and has multi-word phrase', () => {
  const normalLvl9 = generateLevel(9, 'arcade_seed');
  assert.equal(normalLvl9.isBossLevel, false);
  assert.equal(normalLvl9.boss, undefined);

  const bossLvl10 = generateLevel(10, 'arcade_seed');
  assert.equal(bossLvl10.isBossLevel, true);
  assert.ok(bossLvl10.boss);
  assert.ok(bossLvl10.boss.phrase.length >= 3);
  assert.ok(bossLvl10.boss.maxHp > 0);
});
