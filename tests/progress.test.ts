import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress, progressReducer, restoreProgress, type Run } from '../src/state/progress';

const run: Run = { id: 'run-1', altitude: 520, crystals: 3, world: 'gardens', date: '2026-10-16T10:00:00Z' };
test('run completion saves rewards and best only once', () => {
  const next = progressReducer(initialProgress, { type: 'finish', run });
  assert.equal(next.best, 520); assert.equal(next.crystals, 3); assert.equal(next.flights, 1);
  assert.deepEqual(progressReducer(next, { type: 'finish', run }), next);
});
test('locked worlds and unaffordable wings cannot be selected', () => {
  assert.equal(progressReducer(initialProgress, { type: 'world', world: 'temple' }), initialProgress);
  assert.equal(progressReducer(initialProgress, { type: 'wing', wing: 'solar' }), initialProgress);
});
test('wing purchases charge once; owned wings can be re-equipped for free', () => {
  const next = progressReducer({ ...initialProgress, crystals: 45 }, { type: 'wing', wing: 'solar' });
  assert.equal(next.crystals, 5); assert.equal(next.wing, 'solar'); assert.deepEqual(next.owned, ['jade', 'solar']);
  assert.equal(progressReducer(next, { type: 'wing', wing: 'solar' }).crystals, 5);
});
test('worlds unlock at their exact altitude requirement', () => {
  const next = progressReducer({ ...initialProgress, best: 500 }, { type: 'world', world: 'temple' });
  assert.equal(next.world, 'temple');
});
test('malformed persisted data is sanitized without granting rewards', () => {
  assert.deepEqual(restoreProgress(null), initialProgress);
  const restored = restoreProgress({ best: Infinity, crystals: -12, flights: 'fake', wing: 'solar', world: 'heights', owned: ['invalid'], runs: [null, {}, { ...run, crystals: Infinity }], settings: { music: 'true', reducedMotion: true } });
  assert.equal(restored.best, 0); assert.equal(restored.crystals, 0); assert.equal(restored.wing, 'jade'); assert.equal(restored.world, 'gardens'); assert.equal(restored.runs.length, 0); assert.equal(restored.settings.reducedMotion, true); assert.equal(restored.settings.music, true);
});
test('persistence roundtrip preserves valid progress and settings', () => {
  const next = progressReducer(initialProgress, { type: 'finish', run });
  assert.deepEqual(restoreProgress(JSON.parse(JSON.stringify(next))), next);
});
test('history is bounded but cumulative flight counts are preserved', () => {
  let state = initialProgress;
  for (let i = 0; i < 30; i++) state = progressReducer(state, { type: 'finish', run: { ...run, id: String(i) } });
  assert.equal(state.runs.length, 20); assert.equal(state.flights, 30); assert.equal(state.crystals, 90);
});
