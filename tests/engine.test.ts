import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceEngine, birdBounds, createEngine, FIXED_STEP, gateBounds, HEIGHT, overlaps, pauseFlight, resumeFlight, skipIntro, startFlight, steer, stepEngine, WIDTH } from '../src/game/engine';

test('cinematic shatters once and transitions into ready, not automatic flight', () => {
  const engine = createEngine();
  for (let i = 0; i < 310; i++) stepEngine(engine, FIXED_STEP);
  assert.equal(engine.phase, 'ready'); assert.equal(engine.altitude, 0);
  assert.deepEqual(engine.events, ['shatter']);
});
test('intro skipping is guarded and starts ready', () => {
  const engine = createEngine(); skipIntro(engine); assert.equal(engine.phase, 'ready');
  startFlight(engine); skipIntro(engine); assert.equal(engine.phase, 'playing');
});
test('steering is clamped, smoothed, and ignores non-finite input', () => {
  const engine = createEngine('gardens', false);
  steer(engine, 900); assert.equal(engine.bird.target, WIDTH - 22);
  stepEngine(engine, FIXED_STEP); assert.ok(engine.bird.x > WIDTH / 2 && engine.bird.x < WIDTH - 22);
  steer(engine, -20); assert.equal(engine.bird.target, 22);
  steer(engine, NaN); assert.equal(engine.bird.target, 22);
});
test('AABB is strict at edges and detects even a one-pixel overlap', () => {
  const a = { x: 0, y: 0, width: 20, height: 20 };
  assert.equal(overlaps(a, { x: 20, y: 0, width: 1, height: 1 }), false);
  assert.equal(overlaps(a, { x: 19, y: 19, width: 5, height: 5 }), true);
  assert.equal(overlaps(a, { x: 5, y: 5, width: 1, height: 1 }), true);
});
test('touch particles follow the pointer and respect reduced motion', () => {
  const engine = createEngine('gardens', false);
  steer(engine, 100, true, 250);
  assert.equal(engine.particles.length, 3);
  assert.ok(engine.particles.every(p => p.x === 100 && p.y === 250));
  engine.reducedMotion = true;
  steer(engine, 200, true, 300);
  assert.equal(engine.particles.length, 3);
});
test('colliding with a textured pillar ends a run once', () => {
  const engine = createEngine('gardens', false); startFlight(engine);
  const gate = engine.gates[0]!; gate.y = engine.bird.y - 50;
  engine.bird.x = 30; engine.bird.target = 30;
  assert.ok(overlaps(birdBounds(engine), gateBounds(gate)[0]));
  stepEngine(engine, FIXED_STEP); assert.equal(engine.phase, 'gameover');
  stepEngine(engine, FIXED_STEP); assert.deepEqual(engine.events, ['crash']);
});
test('a crystal can only be collected once and the open corridor is safe', () => {
  const engine = createEngine('gardens', false); startFlight(engine);
  const gate = engine.gates[0]!; gate.y = engine.bird.y - gate.height / 2;
  engine.bird.x = gate.gap; engine.bird.target = gate.gap;
  for (let i = 0; i < 5; i++) stepEngine(engine, FIXED_STEP);
  assert.equal(engine.phase, 'playing'); assert.equal(engine.crystals, 1); assert.deepEqual(engine.events, ['crystal']);
});
test('pause freezes physics and restores the previous phase', () => {
  const engine = createEngine('gardens', false);
  pauseFlight(engine); resumeFlight(engine); assert.equal(engine.phase, 'ready');
  startFlight(engine); stepEngine(engine, FIXED_STEP); pauseFlight(engine);
  const before = JSON.stringify(engine);
  for (let i = 0; i < 120; i++) stepEngine(engine, FIXED_STEP);
  assert.equal(JSON.stringify(engine), before);
  resumeFlight(engine); assert.equal(engine.phase, 'playing');
});
test('large frame deltas are capped to prevent a background catch-up collision', () => {
  const engine = createEngine('gardens', false); startFlight(engine);
  const remainder = advanceEngine(engine, 90, 0);
  assert.ok(engine.distance < 12); assert.ok(remainder < FIXED_STEP);
});
test('fixed-step simulation is deterministic across refresh rates', () => {
  const a = createEngine('gardens', false, 42); const b = createEngine('gardens', false, 42);
  startFlight(a); startFlight(b); let aa = 0; let bb = 0;
  for (let i = 0; i < 120; i++) aa = advanceEngine(a, 1 / 60, aa);
  for (let i = 0; i < 240; i++) bb = advanceEngine(b, 1 / 120, bb);
  assert.equal(a.distance, b.distance); assert.equal(a.altitude, b.altitude); assert.deepEqual(a.gates, b.gates);
});
test('long autopiloted flight keeps entities bounded and gates traversable', () => {
  const engine = createEngine('gardens', false, 42); startFlight(engine);
  for (let i = 0; i < 18000 && engine.phase === 'playing'; i++) {
    const next = engine.gates.find(g => g.y + g.height > engine.bird.y - 20 && g.y < engine.bird.y + 20) ?? engine.gates.find(g => g.y < engine.bird.y);
    if (next) steer(engine, next.gap);
    stepEngine(engine, FIXED_STEP);
    assert.ok(engine.particles.length <= 100); assert.ok(engine.gates.length <= 4);
    for (const gate of engine.gates) { assert.ok(gate.opening >= 135); assert.ok(gate.y < HEIGHT + 85); }
  }
  assert.equal(engine.phase, 'playing'); assert.ok(engine.altitude > 1500); assert.ok(engine.crystals > 10);
});
