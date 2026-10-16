import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal_800ExtraBold } from '@expo-google-fonts/tajawal';
import { GameProvider, Run, useGameStore } from './src/state/GameStore';
import { Home, Tab } from './src/screens/Home';
import { Dialogs } from './src/components/Dialogs';
import { Button, T } from './src/components/UI';
import GameView from './src/game/GameView';
import { colors } from './src/theme';

class GameBoundary extends React.Component<React.PropsWithChildren<{ onExit: () => void }>, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <View style={s.loading}><T weight="bold" style={{ fontSize: 26 }}>تعذّر فتح بوابة الأثير</T><T style={{ color: colors.muted, textAlign: 'center', lineHeight: 25 }}>يتطلب الرسم متصفحاً يدعم WebGL أو تطبيق Expo على جهازك.</T><Button title="العودة للرئيسية" onPress={this.props.onExit} /></View>;
    return this.props.children;
  }
}

function Aether() {
  const [screen, setScreen] = useState<'home' | 'play' | 'story'>('home');
  const [tab, setTab] = useState<Tab>('home');
  const [modal, setModal] = useState<'settings' | 'help' | null>(null);
  const { progress, dispatch } = useGameStore();
  const onFinish = useCallback((run: Run) => dispatch({ type: 'finish', run }), [dispatch]);
  const onExit = useCallback(() => setScreen('home'), []);
  const play = () => { setModal(null); setScreen('play'); };
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <StatusBar style="light" />
    {screen === 'home' ? <Home tab={tab} setTab={setTab} onPlay={play} onSettings={() => setModal('settings')} onHelp={() => setModal('help')} onIntro={() => setScreen('story')} /> : <GameBoundary onExit={onExit}><GameView world={progress.world} wing={progress.wing} best={progress.best} settings={progress.settings} storyOnly={screen === 'story'} onFinish={onFinish} onExit={onExit} /></GameBoundary>}
    <Dialogs modal={modal} onClose={() => setModal(null)} onPlay={play} />
  </View>;
}

export default function App() {
  const [loaded, error] = useFonts({ Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal_800ExtraBold });
  if (!loaded && !error) return <View style={s.loading}><ActivityIndicator size="large" color={colors.mint} /></View>;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><GameProvider><Aether /></GameProvider></SafeAreaProvider></GestureHandlerRootView>;
}
const s = StyleSheet.create({ loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 35 } });
