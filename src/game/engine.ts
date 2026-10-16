import type { World } from '../state/GameStore';

export const WIDTH = 390;
export const HEIGHT = 760;
export const FIXED_STEP = 1 / 60;
export type Phase = 'intro' | 'ready' | 'playing' | 'paused' | 'gameover';
export type Rect = { x: number; y: number; width: number; height: number };
export type Gate = { id: number; y: number; gap: number; opening: number; height: number; collected: boolean };
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; kind: 'trail' | 'crystal' | 'touch' };
export type Engine = {
  phase: Phase; previousPhase: 'ready' | 'playing'; time: number; introTime: number; distance: number; altitude: number; crystals: number;
  bird: { x: number; y: number; target: number; tilt: number }; gates: Gate[]; particles: Particle[]; seed: number; nextId: number; world: World;
  trailClock: number; reducedMotion: boolean; events: ('crystal' | 'crash' | 'shatter')[]; shatterPlayed: boolean;
};

export function createEngine(world: World = 'gardens', intro = true, seed = 1907): Engine {
  const state: Engine = { phase: intro ? 'intro' : 'ready', previousPhase: 'ready', time: 0, introTime: 0, distance: 0, altitude: 0, crystals: 0, bird: { x: WIDTH / 2, y: HEIGHT * 0.68, target: WIDTH / 2, tilt: 0 }, gates: [], particles: [], seed, nextId: 0, world, trailClock: 0, reducedMotion: false, events: [], shatterPlayed: false };
  state.gates.push(makeGate(state, -130));
  return state;
}

function random(state: Engine) {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}
function makeGate(state: Engine, y: number): Gate {
  const difficulty = state.world === 'gardens' ? 0 : state.world === 'temple' ? 14 : 24;
  const opening = Math.max(135, 190 - state.altitude / 75 - difficulty);
  const margin = opening / 2 + 26;
  return { id: state.nextId++, y, gap: margin + random(state) * (WIDTH - margin * 2), opening, height: 160, collected: false };
}
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
export const birdBounds = (state: Engine): Rect => ({ x: state.bird.x - 11, y: state.bird.y - 14, width: 22, height: 28 });
export const gateBounds = (gate: Gate): [Rect, Rect] => [
  { x: 0, y: gate.y, width: gate.gap - gate.opening / 2, height: gate.height },
  { x: gate.gap + gate.opening / 2, y: gate.y, width: WIDTH - gate.gap - gate.opening / 2, height: gate.height },
];
export function steer(state: Engine, x: number, touch = false) {
  if (state.phase !== 'ready' && state.phase !== 'playing') return;
  if (!Number.isFinite(x)) return;
  state.bird.target = Math.max(22, Math.min(WIDTH - 22, x));
  if (touch && !state.reducedMotion) burst(state, state.bird.target, state.bird.y + 80, 3, 'touch');
}
export function startFlight(state: Engine) { if (state.phase === 'ready') state.phase = 'playing'; }
export function pauseFlight(state: Engine) {
  if (state.phase === 'playing' || state.phase === 'ready') { state.previousPhase = state.phase; state.phase = 'paused'; }
}
export function resumeFlight(state: Engine) { if (state.phase === 'paused') state.phase = state.previousPhase; }
export function skipIntro(state: Engine) { if (state.phase === 'intro') { state.introTime = 5; state.phase = 'ready'; } }

function burst(state: Engine, x: number, y: number, count: number, kind: Particle['kind']) {
  const budget = state.reducedMotion ? 28 : 100;
  for (let i = 0; i < count && state.particles.length < budget; i++) {
    const angle = random(state) * Math.PI * 2;
    const speed = 15 + random(state) * 90;
    const life = 0.4 + random(state) * 0.6;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed + 28, life, maxLife: life, size: 1 + random(state) * 2.5, kind });
  }
}

export function stepEngine(state: Engine, dt: number) {
  if (state.phase === 'paused' || state.phase === 'gameover') return;
  dt = Math.max(0, Math.min(dt, 1 / 30));
  state.time += dt;
  if (state.phase === 'intro') {
    state.introTime += dt;
    if (state.introTime >= 1.7 && !state.shatterPlayed) { state.shatterPlayed = true; state.events.push('shatter'); }
    if (state.introTime >= 5) state.phase = 'ready';
    return;
  }
  state.bird.y = HEIGHT * 0.68 + Math.sin(state.time * 3) * 3;
  const delta = state.bird.target - state.bird.x;
  state.bird.x += Math.max(-290 * dt, Math.min(290 * dt, delta * Math.min(1, dt * 12)));
  state.bird.tilt += (Math.max(-0.24, Math.min(0.24, delta / 150)) - state.bird.tilt) * Math.min(1, dt * 8);
  for (const p of state.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  state.particles = state.particles.filter(p => p.life > 0);
  state.trailClock += dt;
  if (state.trailClock > (state.reducedMotion ? 0.15 : 0.04)) { state.trailClock = 0; burst(state, state.bird.x - 8, state.bird.y + 23, 1, 'trail'); }
  if (state.phase !== 'playing') return;
  const speed = (state.world === 'gardens' ? 112 : state.world === 'temple' ? 132 : 148) + Math.min(65, state.altitude / 22);
  const movement = speed * dt;
  state.distance += movement;
  state.altitude = Math.floor(state.distance * 0.4);
  const body = birdBounds(state);
  for (const gate of state.gates) {
    gate.y += movement;
    if (gateBounds(gate).some(bounds => overlaps(body, bounds))) {
      state.phase = 'gameover'; state.events.push('crash');
      burst(state, state.bird.x, state.bird.y, 25, 'crystal');
      return;
    }
    const crystal = { x: gate.gap - 15, y: gate.y + gate.height / 2 - 18, width: 30, height: 36 };
    if (!gate.collected && overlaps(body, crystal)) { gate.collected = true; state.crystals += 1; state.events.push('crystal'); burst(state, gate.gap, crystal.y + 18, state.reducedMotion ? 4 : 16, 'crystal'); }
  }
  state.gates = state.gates.filter(gate => gate.y < HEIGHT + 80);
  const last = state.gates[state.gates.length - 1];
  if (!last || last.y > 210) state.gates.push(makeGate(state, last ? last.y - 390 : -180));
}

export function advanceEngine(state: Engine, elapsed: number, accumulator: number) {
  accumulator += Math.max(0, Math.min(elapsed, 0.1));
  let steps = 0;
  while (accumulator >= FIXED_STEP && steps < 6) { stepEngine(state, FIXED_STEP); accumulator -= FIXED_STEP; steps++; }
  return accumulator;
}
