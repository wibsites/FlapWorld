import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, Picture, Skia, useImage } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Backdrop } from '../components/Backdrop';
import { birdSources } from '../components/Bird';
import { Button, Eyebrow, Glass, Icon, IconButton, T } from '../components/UI';
import { arabicNumber, colors } from '../theme';
import { advanceEngine, createEngine, HEIGHT, pauseFlight, resumeFlight, skipIntro, startFlight, steer, WIDTH, type Phase } from './engine';
import { makePainter } from './draw';
import { useSound } from './useSound';
import { worldInfo } from '../screens/Home';
import type { GameProps } from './types';

const emptyPicture = () => { const recorder = Skia.PictureRecorder(); recorder.beginRecording(); const picture = recorder.finishRecordingAsPicture(); recorder.dispose(); return picture; };
const getHUD = (phase: Phase = 'intro', altitude = 0, crystals = 0, introTime = 0) => ({ phase, altitude, crystals, introTime });

export default function GameScene({ world, wing, best, settings, storyOnly, onExit, onFinish }: GameProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(width / WIDTH, (height - insets.top - insets.bottom) / HEIGHT);
  const boardWidth = WIDTH * scale; const boardHeight = HEIGHT * scale;
  const engine = useRef(createEngine(world, true, Date.now() >>> 0));
  const [hud, setHUD] = useState(getHUD());
  const [error, setError] = useState<string | null>(null);
  const [assetsFailed, setAssetsFailed] = useState(false);
  const failedAsset = useCallback(() => setAssetsFailed(true), []);
  const city = useImage(require('../../assets/bio-city.jpg'), failedAsset);
  const bird = useImage(birdSources[wing], failedAsset);
  const pillar = useImage(require('../../assets/pillar.jpg'), failedAsset);
  const initialPicture = useMemo(emptyPicture, []);
  const picture = useSharedValue(initialPicture);
  const previousBest = useRef(best);
  const saved = useRef(false);
  const keyboard = useRef({ left: false, right: false });
  const sound = useSound(settings, hud.phase === 'playing' || hud.phase === 'intro');
  const current = useRef({ settings, onFinish, sound }); current.current = { settings, onFinish, sound };
  const syncHUD = useCallback(() => { const s = engine.current; setHUD(getHUD(s.phase, s.altitude, s.crystals, s.introTime)); }, []);
  const pause = useCallback(() => { pauseFlight(engine.current); syncHUD(); }, [syncHUD]);
  const resume = () => { resumeFlight(engine.current); syncHUD(); };
  const start = () => { startFlight(engine.current); syncHUD(); };
  const skip = () => { skipIntro(engine.current); syncHUD(); };
  const restart = () => { previousBest.current = best; engine.current = createEngine(world, false, Date.now() >>> 0); saved.current = false; syncHUD(); };

  useEffect(() => {
    if (!city || !bird || !pillar) return;
    const painter = makePainter({ city, bird, pillar });
    let frame = 0; let last = 0; let accumulator = 0; let lastHUD = 0; let previousPhase = engine.current.phase;
    const tick = (now: number) => {
      try {
        const state = engine.current;
        const dt = last ? (now - last) / 1000 : 0; last = now;
        state.reducedMotion = current.current.settings.reducedMotion;
        if (keyboard.current.left || keyboard.current.right) steer(state, state.bird.target + (keyboard.current.right ? 1 : -1) * 290 * Math.min(dt, 0.05));
        accumulator = advanceEngine(state, dt, accumulator);
        for (const event of state.events.splice(0)) current.current.sound(event);
        if (state.phase === 'gameover' && !saved.current) {
          saved.current = true;
          current.current.onFinish({ id: `${Date.now()}-${state.seed}`, altitude: state.altitude, crystals: state.crystals, world: state.world, date: new Date().toISOString() });
        }
        if (state.phase !== 'paused' && state.phase !== 'gameover' || state.phase !== previousPhase) picture.value = painter.draw(state);
        if (now - lastHUD > 100 || state.phase !== previousPhase) { syncHUD(); lastHUD = now; }
        previousPhase = state.phase;
        frame = requestAnimationFrame(tick);
      } catch { setError('تعذّر إكمال الرسم على هذا الجهاز. أعد فتح الرحلة للمحاولة مجدداً.'); }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); painter.dispose(); };
  }, [city, bird, pillar, picture, syncHUD]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') { keyboard.current = { left: false, right: false }; pause(); } });
    if (Platform.OS !== 'web') return () => subscription.remove();
    const down = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(event.key)) event.preventDefault();
      if (event.key === 'ArrowLeft') keyboard.current.left = true;
      if (event.key === 'ArrowRight') keyboard.current.right = true;
      if (event.key === 'Escape' && !event.repeat) { if (engine.current.phase === 'paused') resumeFlight(engine.current); else pauseFlight(engine.current); syncHUD(); }
      if (event.key === ' ' && !event.repeat) { if (engine.current.phase === 'intro') skipIntro(engine.current); else if (engine.current.phase === 'paused') resumeFlight(engine.current); else startFlight(engine.current); syncHUD(); }
    };
    const up = (event: KeyboardEvent) => { if (event.key === 'ArrowLeft') keyboard.current.left = false; if (event.key === 'ArrowRight') keyboard.current.right = false; };
    const blur = () => { keyboard.current = { left: false, right: false }; pause(); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    return () => { subscription.remove(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
  }, [pause, syncHUD]);

  const pan = useMemo(() => Gesture.Pan().minDistance(0).runOnJS(true).onBegin(event => {
    if (engine.current.phase === 'ready' && !storyOnly) startFlight(engine.current);
    steer(engine.current, event.x / scale, true); syncHUD();
  }).onUpdate(event => steer(engine.current, event.x / scale, true)), [scale, storyOnly, syncHUD]);
  const isReady = hud.phase === 'ready';
  const isOver = hud.phase === 'gameover';
  const isPaused = hud.phase === 'paused';

  return <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    <Backdrop reduced={settings.reducedMotion} />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(3,11,8,0.65)' }]} />
    {width > 1000 && <View style={s.sideCopy}><Eyebrow>رحلتك إلى الحرية</Eyebrow><T weight="extra" style={{ fontSize: 54, marginTop: 18 }}>أبعد من{`\n`}حدودك.</T><T style={{ color: colors.muted, lineHeight: 27, marginTop: 20 }}>اسحب لتوجّه جناحيك.{`\n`}اعبر الفتحات. واجمع الضوء.</T><View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 25 }}><Glass style={{ padding: 12 }}><Icon name="arrow-left" size={18} /></Glass><Glass style={{ padding: 12 }}><Icon name="arrow-right" size={18} /></Glass></View><Pressable accessibilityRole="button" onPress={onExit} style={{ marginTop: 40 }}><T style={{ color: colors.muted, fontSize: 13 }}>العودة إلى الأثير ←</T></Pressable></View>}
    <View style={[s.board, { width: boardWidth, height: boardHeight }]}>
      <GestureDetector gesture={pan}><View style={StyleSheet.absoluteFill} accessibilityLabel="ساحة التحليق: اسحب يميناً ويساراً لتجنب الأعمدة"><Canvas style={StyleSheet.absoluteFill}><Group transform={[{ scale }]}><Picture picture={picture} /></Group></Canvas></View></GestureDetector>
      <LinearGradient pointerEvents="none" colors={['rgba(3,15,10,0.75)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150 }} />
      {hud.phase !== 'intro' && <View pointerEvents="box-none" style={s.hud}>
        <IconButton name="pause" label="إيقاف مؤقت" onPress={pause} />
        <View style={{ alignItems: 'center' }}><T style={{ fontSize: 10, color: '#c0d1c5' }}>الارتفاع</T><T weight="extra" style={{ fontSize: 35, lineHeight: 42 }}>{arabicNumber(hud.altitude).padStart(3, '٠')}</T><T style={{ fontSize: 10, color: colors.muted }}>متر</T></View>
        <Glass style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}><T weight="bold">{arabicNumber(hud.crystals)}</T><Icon name="hexagon" size={16} color={colors.mint} /></Glass>
      </View>}
      {hud.phase === 'intro' && <View pointerEvents="box-none" style={StyleSheet.absoluteFill}><View style={{ position: 'absolute', top: 55, right: 28, left: 28, alignItems: 'center', gap: 10 }}><T latin style={{ fontSize: 10, color: colors.mint, letterSpacing: 4 }}>THE AWAKENING</T><T weight="bold" style={{ fontSize: 23, textAlign: 'center' }}>{hud.introTime < 1.7 ? 'لم تُخلق لتبقى هنا.' : hud.introTime < 3.3 ? 'اكسر حدودك.' : 'السماء لك.'}</T></View><Pressable onPress={skip} accessibilityRole="button" accessibilityLabel="تخطي المقدمة" style={s.skip}><T style={{ color: colors.muted, fontSize: 13 }}>تخطي المقدمة ←</T></Pressable></View>}
      {isReady && <View pointerEvents="box-none" style={StyleSheet.absoluteFill}><View style={s.readyCard}><Glass style={{ padding: 25, alignItems: 'center', gap: 15 }}><Eyebrow>{worldInfo[world].name}</Eyebrow><T weight="bold" style={{ fontSize: 28 }}>السماء تناديك.</T><T style={{ textAlign: 'center', color: colors.muted, fontSize: 13, lineHeight: 23 }}>اسحب يميناً أو يساراً لتوجيه الطائر.{`\n`}ابتعد عن الأعمدة واجمع البلورات.</T><Button title="حلّق الآن" onPress={start} style={{ width: '100%', minHeight: 52 }} />{storyOnly && <Pressable onPress={onExit}><T style={{ color: colors.muted, fontSize: 13 }}>العودة إلى الرئيسية</T></Pressable>}</Glass></View></View>}
      {(isPaused || isOver) && <View style={s.overlay}><Glass style={s.result}><Icon name={isOver ? 'feather' : 'pause'} size={30} color={colors.mint} /><Eyebrow>{isOver ? hud.altitude > previousBest.current ? 'أفق جديد! رقمك الأفضل' : 'كل نهاية… جناح لبداية' : 'خذ نَفَساً'}</Eyebrow><T weight="extra" style={{ fontSize: 33 }}>{isOver ? 'ستحلّق أبعد.' : 'السماء تنتظرك.'}</T><View style={{ flexDirection: 'row', gap: 40, paddingVertical: 13 }}><View style={{ alignItems: 'center', gap: 8 }}><T weight="bold" style={{ fontSize: 31 }}>{arabicNumber(hud.crystals)}</T><T style={{ color: colors.muted, fontSize: 12 }}>بلورة</T></View><View style={{ alignItems: 'center', gap: 8 }}><T weight="bold" style={{ fontSize: 31 }}>{arabicNumber(hud.altitude)}</T><T style={{ color: colors.muted, fontSize: 12 }}>متر</T></View></View><Button title={isOver ? 'حلّق مجدداً' : 'متابعة الرحلة'} icon={isOver ? 'rotate-ccw' : 'play'} onPress={isOver ? restart : resume} style={{ width: '100%', minHeight: 54 }} /><Button title="العودة إلى الرئيسية" secondary icon="home" onPress={onExit} style={{ width: '100%', minHeight: 50 }} />{isPaused && <T style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>العودة تنهي هذه المحاولة دون حفظها.</T>}</Glass></View>}
      {(error || assetsFailed) && <View style={s.overlay}><Glass style={s.result}><T weight="bold" style={{ fontSize: 24 }}>لم تكتمل الرحلة</T><T style={{ textAlign: 'center', color: colors.muted, lineHeight: 24 }}>{error ?? 'تعذّر تحميل رسوم اللعبة. تحقق من الاتصال وحاول مجدداً.'}</T><Button title="العودة للرئيسية" onPress={onExit} /></Glass></View>}
      {!city && !assetsFailed && <View style={s.overlay}><T>جارٍ فتح بوابة الأثير…</T></View>}
      {hud.phase === 'playing' && hud.altitude < 80 && <View pointerEvents="none" style={s.hint}><Icon name="move" size={20} color={colors.mint} /><T style={{ fontSize: 13, color: colors.mint }}>اسحب لتوجّه جناحيك</T></View>}
      <View pointerEvents="none" style={s.bottomLabel}><T latin style={{ fontSize: 8, letterSpacing: 3, color: '#abc4b4' }}>AETHER  /  {worldInfo[world].number}</T></View>
    </View>
  </View>;
}

const s = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, board: { overflow: 'hidden', backgroundColor: '#07150e', borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }, sideCopy: { position: 'absolute', right: 55, top: '29%', width: 230, alignItems: 'flex-end' }, hud: { position: 'absolute', top: 25, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, skip: { position: 'absolute', bottom: 50, alignSelf: 'center', padding: 15 }, readyCard: { position: 'absolute', left: 25, right: 25, top: '18%' }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,12,8,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }, result: { width: '100%', padding: 25, gap: 17, alignItems: 'center', backgroundColor: '#0b2018' }, hint: { position: 'absolute', bottom: 85, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 }, bottomLabel: { position: 'absolute', bottom: 22, alignSelf: 'center' } });
