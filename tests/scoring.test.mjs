import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, roles, scale, maxScore, scoreAnswers } from '../quiz-data.mjs';

test('nine balanced questions have exactly three response options', () => {
  assert.equal(questions.length, 9);
  assert.deepEqual(scale, ['Рідко', 'Іноді', 'Часто']);
  for (const key of Object.keys(roles)) assert.equal(questions.filter(q => q.role === key).length, 3);
  assert.equal(maxScore, 6);
});

test('each distinct profile identifies its role without changing other scores', () => {
  for (const key of Object.keys(roles)) {
    const result = scoreAnswers(questions.map(q => q.role === key ? 2 : 0));
    assert.equal(result.kind, 'single');
    assert.deepEqual(result.leaders, [key]);
    assert.equal(result.scores[key], 6);
    for (const other of Object.keys(roles).filter(r => r !== key)) assert.equal(result.scores[other], 0);
  }
});

test('rarely and isolated occasional responses do not force a role', () => {
  const answers = Array(9).fill(0);
  assert.equal(scoreAnswers(answers).kind, 'low');
  answers[0] = 1;
  assert.equal(scoreAnswers(answers).kind, 'low');
});

test('equal occasional and frequent answers report all three roles', () => {
  for (const value of [1, 2]) {
    const result = scoreAnswers(Array(9).fill(value));
    assert.equal(result.kind, 'mixed');
    assert.equal(result.leaders.length, 3);
    assert.deepEqual(result.scores, { victim: value * 3, rescuer: value * 3, persecutor: value * 3 });
  }
});

test('a one-point difference is mixed and a two-point difference is distinct', () => {
  const answers = questions.map(q => q.role === 'persecutor' ? 0 : 2);
  const rescuerIndex = questions.findIndex(q => q.role === 'rescuer');
  answers[rescuerIndex] = 1;
  assert.deepEqual(scoreAnswers(answers).leaders, ['victim', 'rescuer']);
  assert.equal(scoreAnswers(answers).kind, 'mixed');
  answers[rescuerIndex] = 0;
  assert.equal(scoreAnswers(answers).kind, 'single');
});

test('editing an answer adjusts only the assigned role', () => {
  const answers = Array(9).fill(0);
  const before = scoreAnswers(answers);
  answers[0] = 2;
  const after = scoreAnswers(answers);
  assert.equal(after.scores.victim, before.scores.victim + 2);
  assert.equal(after.scores.rescuer, before.scores.rescuer);
  assert.equal(after.scores.persecutor, before.scores.persecutor);
});

test('missing, sparse, old-length and out-of-range answers are rejected', () => {
  for (const invalid of [null, [], Array(8).fill(1), Array(10).fill(1), Array(18).fill(1), Array(9), Array(9).fill(null), Array(9).fill('1'), Array(9).fill(NaN), Array(9).fill(-1), Array(9).fill(3), Array(9).fill(1.5)]) {
    assert.throws(() => scoreAnswers(invalid), TypeError);
  }
});
