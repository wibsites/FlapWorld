export type Wing = 'jade' | 'solar' | 'frost';
export type World = 'gardens' | 'temple' | 'heights';
export type Run = { id: string; altitude: number; crystals: number; world: World; date: string };
export type Preferences = { music: boolean; effects: boolean; haptics: boolean; reducedMotion: boolean };
export type Progress = { best: number; crystals: number; flights: number; wing: Wing; world: World; owned: Wing[]; runs: Run[]; settings: Preferences };
export const initialProgress: Progress = {
  best: 0, crystals: 0, flights: 0, wing: 'jade', world: 'gardens', owned: ['jade'], runs: [],
  settings: { music: true, effects: true, haptics: true, reducedMotion: false },
};
export type Action = { type: 'hydrate'; value: Progress } | { type: 'finish'; run: Run } | { type: 'setting'; key: keyof Preferences; value: boolean } | { type: 'wing'; wing: Wing } | { type: 'world'; world: World };
export const wingCosts: Record<Wing, number> = { jade: 0, solar: 40, frost: 100 };
export const worldRequirements: Record<World, number> = { gardens: 0, temple: 500, heights: 1500 };

export function progressReducer(state: Progress, action: Action): Progress {
  switch (action.type) {
    case 'hydrate': return action.value;
    case 'finish':
      if (state.runs.some(run => run.id === action.run.id)) return state;
      return { ...state, best: Math.max(state.best, action.run.altitude), crystals: state.crystals + action.run.crystals, flights: state.flights + 1, runs: [action.run, ...state.runs].slice(0, 20) };
    case 'setting': return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'world': return state.best >= worldRequirements[action.world] ? { ...state, world: action.world } : state;
    case 'wing': {
      if (state.owned.includes(action.wing)) return { ...state, wing: action.wing };
      const cost = wingCosts[action.wing];
      return state.crystals >= cost ? { ...state, wing: action.wing, owned: [...state.owned, action.wing], crystals: state.crystals - cost } : state;
    }
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const nonnegative = (v: unknown, fallback = 0) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
const wings: Wing[] = ['jade', 'solar', 'frost'];
const worlds: World[] = ['gardens', 'temple', 'heights'];

export function restoreProgress(raw: unknown): Progress {
  if (!isRecord(raw)) return initialProgress;
  const settings = { ...initialProgress.settings };
  if (isRecord(raw.settings)) for (const key of Object.keys(settings) as (keyof Preferences)[]) {
    if (typeof raw.settings[key] === 'boolean') settings[key] = raw.settings[key];
  }
  const owned: Wing[] = ['jade', ...wings.filter(wing => wing !== 'jade' && Array.isArray(raw.owned) && raw.owned.includes(wing))];
  const best = nonnegative(raw.best);
  const world = worlds.find(value => value === raw.world && best >= worldRequirements[value]) ?? 'gardens';
  const runs = Array.isArray(raw.runs) ? raw.runs.filter((run): run is Run => isRecord(run) && typeof run.id === 'string' && typeof run.date === 'string' && !Number.isNaN(Date.parse(run.date)) && worlds.includes(run.world as World) && typeof run.altitude === 'number' && Number.isFinite(run.altitude) && run.altitude >= 0 && typeof run.crystals === 'number' && Number.isInteger(run.crystals) && run.crystals >= 0).slice(0, 20) : [];
  return { best, crystals: nonnegative(raw.crystals), flights: nonnegative(raw.flights), wing: owned.find(wing => wing === raw.wing) ?? 'jade', world, owned, runs, settings };
}
