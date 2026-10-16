import type { Preferences, Run, Wing, World } from '../state/GameStore';
export type GameProps = { world: World; wing: Wing; best: number; settings: Preferences; storyOnly: boolean; onExit: () => void; onFinish: (run: Run) => void };
