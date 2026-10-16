import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Preferences } from '../state/GameStore';

export function useSound(settings: Preferences, active: boolean) {
  const ambient = useAudioPlayer(require('../../assets/ambient.wav'));
  const chime = useAudioPlayer(require('../../assets/chime.wav'));
  const shatter = useAudioPlayer(require('../../assets/shatter.wav'));
  const crash = useAudioPlayer(require('../../assets/crash.wav'));
  useEffect(() => {
    ambient.loop = true; ambient.volume = 0.25;
    if (active && settings.music) ambient.play(); else ambient.pause();
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') ambient.pause();
      else if (active && settings.music) ambient.play();
    });
    return () => { subscription.remove(); ambient.pause(); };
  }, [ambient, settings.music, active]);
  return useCallback((event: 'crystal' | 'crash' | 'shatter') => {
    if (settings.effects) {
      const player = event === 'crystal' ? chime : event === 'crash' ? crash : shatter;
      player.volume = event === 'crystal' ? 0.4 : 0.3;
      void player.seekTo(0).then(() => player.play()).catch(() => undefined);
    }
    if (settings.haptics && Platform.OS !== 'web') {
      void (event === 'crystal' ? Haptics.selectionAsync() : Haptics.impactAsync(event === 'crash' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined);
    }
  }, [settings.effects, settings.haptics, chime, crash, shatter]);
}
