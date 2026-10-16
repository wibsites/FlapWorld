import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { Action, initialProgress, Progress, progressReducer, restoreProgress } from './progress';
export * from './progress';

const Context = createContext<{ progress: Progress; dispatch: React.Dispatch<Action>; loaded: boolean; storageError: boolean } | null>(null);
const STORAGE_KEY = 'aether.progress.v1';

export function GameProvider({ children }: React.PropsWithChildren) {
  const [progress, dispatch] = useReducer(progressReducer, initialProgress);
  const [loaded, setLoaded] = React.useState(false);
  const [storageError, setStorageError] = React.useState(false);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (active && raw) dispatch({ type: 'hydrate', value: restoreProgress(JSON.parse(raw)) });
    }).catch(() => { if (active) setStorageError(true); }).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (loaded) writes.current = writes.current.then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress))).catch(() => { setStorageError(true); });
  }, [loaded, progress]);
  return <Context.Provider value={{ progress, dispatch, loaded, storageError }}>{children}</Context.Provider>;
}

export function useGameStore() {
  const context = useContext(Context);
  if (!context) throw new Error('GameProvider is missing');
  return context;
}
