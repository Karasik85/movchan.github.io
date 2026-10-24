import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, roles, maxScore, scoreAnswers } from '../quiz-data.mjs';

test('each role has six questions and the same maximum', () => {
  assert.equal(questions.length, 18);
  for (const key of Object.keys(roles)) {
    assert.equal(questions.filter(question => question.role === key).length * 4, maxScore);
  }
});

test('all three distinct response profiles identify the intended role', () => {
  for (const key of Object.keys(roles)) {
    const response = questions.map(question => question.role === key ? 4 : 0);
    const result = scoreAnswers(response);
    assert.equal(result.kind, 'single');
    assert.deepEqual(result.leaders, [key]);
    assert.equal(result.scores[key], 24);
    for (const other of Object.keys(roles).filter(role => role !== key)) assert.equal(result.scores[other], 0);
  }
});

test('low scores never force a label', () => {
  for (const value of [0, 1]) assert.equal(scoreAnswers(Array(18).fill(value)).kind, 'low');
});

test('ties show every tied role', () => {
  const result = scoreAnswers(Array(18).fill(3));
  assert.equal(result.kind, 'mixed');
  assert.equal(result.leaders.length, 3);
  assert.deepEqual(result.scores, { victim: 18, rescuer: 18, persecutor: 18 });
});

test('close scores retain both roles without including a lower third', () => {
  const response = questions.map(question => question.role === 'victim' ? 3 : question.role === 'rescuer' ? 3 : 0);
  response[questions.findIndex(question => question.role === 'rescuer')] = 1;
  const result = scoreAnswers(response);
  assert.equal(result.kind, 'mixed');
  assert.deepEqual(result.leaders, ['victim', 'rescuer']);
  response[questions.findIndex(question => question.role === 'rescuer')] = 0;
  assert.equal(scoreAnswers(response).kind, 'single');
});

test('editing an answer changes the score for exactly its assigned role', () => {
  const response = Array(18).fill(2);
  const before = scoreAnswers(response);
  response[0] = 4;
  const after = scoreAnswers(response);
  assert.equal(after.scores.victim, before.scores.victim + 2);
  assert.equal(after.scores.rescuer, before.scores.rescuer);
  assert.equal(after.scores.persecutor, before.scores.persecutor);
});

test('incomplete, sparse and invalid responses cannot produce results', () => {
  for (const invalid of [null, [], Array(17).fill(2), Array(19).fill(2), Array(18), Array(18).fill(null), Array(18).fill('2'), Array(18).fill(NaN), Array(18).fill(-1), Array(18).fill(5), Array(18).fill(2.5)]) {
    assert.throws(() => scoreAnswers(invalid), TypeError);
  }
});
