import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bird } from '../components/Bird';
import { Backdrop } from '../components/Backdrop';
import { Button, Eyebrow, Glass, Icon, IconButton, IconName, T } from '../components/UI';
import { arabicNumber, colors } from '../theme';
import { useGameStore, Wing, wingCosts, World, worldRequirements } from '../state/GameStore';

export type Tab = 'home' | 'worlds' | 'wings' | 'records';
const tabs: { id: Tab; name: string; icon: IconName }[] = [
  { id: 'records', name: 'سجل الرحلات', icon: 'bar-chart-2' }, { id: 'wings', name: 'الأجنحة', icon: 'feather' },
  { id: 'worlds', name: 'العوالم', icon: 'globe' }, { id: 'home', name: 'الرئيسية', icon: 'grid' },
];
export const worldInfo: Record<World, { name: string; subtitle: string; color: string; number: string }> = {
  gardens: { name: 'الحدائق المعلّقة', subtitle: 'حيث تستعيد الطبيعة سماءها', color: '#9bdfc4', number: '01' },
  temple: { name: 'معبد الشمس', subtitle: 'أسرار من ذهب خلف الغيوم', color: '#e4c087', number: '02' },
  heights: { name: 'قمم الأثير', subtitle: 'على حافة الضوء واللانهاية', color: '#a6cfec', number: '03' },
};
const wingInfo: Record<Wing, { name: string; subtitle: string; color: string }> = {
  jade: { name: 'جناح اليشم', subtitle: 'روح الغابة. شجاعة البدايات.', color: '#8be0b8' },
  solar: { name: 'جناح الشمس', subtitle: 'ريش صُنع من الضوء.', color: '#e4c087' },
  frost: { name: 'جناح الصقيع', subtitle: 'هدوء السماء قبل العاصفة.', color: '#a6cfec' },
};

type Props = { tab: Tab; setTab: (tab: Tab) => void; onPlay: () => void; onSettings: () => void; onHelp: () => void; onIntro: () => void };

export function Home({ tab, setTab, onPlay, onSettings, onHelp, onIntro }: Props) {
  const { width, height } = useWindowDimensions();
  const mobile = width < 800;
  const { progress, dispatch, loaded, storageError } = useGameStore();
  const insets = useSafeAreaInsets();
  const world = worldInfo[progress.world];
  return <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
    <Backdrop reduced={progress.settings.reducedMotion} />
    <View style={[s.header, { paddingHorizontal: mobile ? 22 : 48 }]}>
      <View style={s.headerTools}>
        <IconButton name="settings" label="الإعدادات" onPress={onSettings} />
        {!mobile && <IconButton name={progress.settings.music ? 'volume-2' : 'volume-x'} label={progress.settings.music ? 'كتم الموسيقى' : 'تشغيل الموسيقى'} onPress={() => dispatch({ type: 'setting', key: 'music', value: !progress.settings.music })} />}
        <View style={s.currency}><T weight="bold" style={{ fontSize: 18 }}>{arabicNumber(progress.crystals)}</T><Icon name="hexagon" size={17} color={colors.mint} /></View>
      </View>
      {!mobile && <View style={s.nav}>{tabs.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={[s.navItem, tab === item.id && s.navActive]}><T weight={tab === item.id ? 'bold' : 'medium'} style={{ fontSize: 15, color: tab === item.id ? colors.text : colors.muted }}>{item.name}</T>{tab === item.id && <View style={s.navDot} />}</Pressable>)}</View>}
      <Pressable onPress={() => setTab('home')} accessibilityRole="button" accessibilityLabel="أثير — الرئيسية" style={s.brand}>
        <View><T weight="extra" style={{ fontSize: 31, lineHeight: 32 }}>أثير</T><T latin style={{ fontSize: 8, letterSpacing: 4, marginRight: -2, color: colors.muted }}>AETHER</T></View>
        <View style={{ transform: [{ rotate: '-25deg' }] }}><Icon name="feather" size={32} color={colors.mint} /></View>
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={[s.content, { paddingHorizontal: mobile ? 24 : 48, paddingBottom: mobile ? 100 + insets.bottom : 22 }]} showsVerticalScrollIndicator={false}>
      {tab === 'home' ? <>
        <View style={[s.hero, { minHeight: mobile ? 670 : Math.max(465, Math.min(580, height - 320)) }]}>
          <View pointerEvents="none" style={mobile ? s.mobileBirdArea : s.birdArea}>
            <View style={[s.orbit, { width: mobile ? 240 : 405, height: mobile ? 240 : 405 }]}><View style={s.orbitInner} /><View style={s.orbitDot} /></View>
            <Bird wing={progress.wing} size={mobile ? 300 : Math.min(500, width * 0.39)} reduced={progress.settings.reducedMotion} />
          </View>
          {!mobile && <View style={s.coordinates}><View style={{ width: 30, height: 1, backgroundColor: colors.emerald }} /><T latin style={{ fontSize: 9, letterSpacing: 2, color: '#7caaa0' }}>SPECIMEN  /  A–01</T></View>}
          <View style={[s.heroCopy, mobile && s.heroCopyMobile]}>
            <Eyebrow>مغامرة تتجاوز الأفق</Eyebrow>
            <T weight="extra" style={[s.heroTitle, mobile && s.heroTitleMobile]}>خُلقتَ{mobile ? ' ' : '\n'}لتكون حُرّاً.</T>
            <T style={[s.heroDescription, mobile && { textAlign: 'center', maxWidth: 320 }]}>اترك القفص خلفك. افرد جناحيك.{"\n"}واكتشف عالماً ينبض بالحياة فوق الغيوم.</T>
            <Button title={loaded ? 'ابدأ التحليق' : 'جارٍ التحضير…'} disabled={!loaded} onPress={onPlay} style={[s.playButton, mobile && { width: '100%', maxWidth: 330 }]} />
            <View style={[s.heroMeta, mobile && { justifyContent: 'center' }]}><T style={{ fontSize: 12, color: colors.muted }}>رحلة لا نهائية</T><View style={s.smallDot} /><T style={{ fontSize: 12, color: colors.muted }}>سماء واحدة. احتمالات بلا حدود.</T></View>
            <Pressable accessibilityRole="button" onPress={onHelp} style={s.helpLink}><T style={{ fontSize: 13, color: '#bdcbc3' }}>كيف تحلّق؟</T><Icon name="mouse-pointer" size={13} color="#bdcbc3" /></Pressable>
          </View>
          {!mobile && <Pressable onPress={() => setTab('worlds')} accessibilityRole="button" accessibilityLabel="استكشف العوالم" style={s.chapter}>
            <View style={s.chapterHead}><T latin style={s.micro}>CHAPTER {world.number}</T><View style={{ width: 26, height: 1, backgroundColor: '#65837b' }} /></View>
            <View style={s.chapterImage}><Image source={require('../../assets/bio-city.jpg')} style={{ width: '100%', height: 95 }} /><LinearGradient colors={['transparent', 'rgba(6,18,15,0.7)']} style={StyleSheet.absoluteFill} /><View style={s.chapterBadge}><T style={{ color: colors.mint, fontSize: 10 }}>العالم الحالي</T><View style={s.statusDot} /></View></View>
            <View style={s.chapterTitle}><Icon name="arrow-up-left" size={17} color={colors.muted} /><T weight="bold" style={{ fontSize: 15 }}>{world.name}</T></View>
            <T style={{ fontSize: 11, color: colors.muted }}>{world.subtitle}</T>
          </Pressable>}
          {!mobile && <View style={s.heroBottomLabel}><T latin style={{ color: '#7f9990', fontSize: 9, letterSpacing: 3 }}>NATURE. EVOLVED.</T><View style={{ width: 50, height: 1, backgroundColor: colors.border }} /></View>}
        </View>
        <View style={[s.sectionHeader, mobile && { marginTop: 0 }]}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><T latin style={s.micro}>YOUR NEXT HORIZON</T><View style={{ width: 24, height: 1, backgroundColor: colors.border }} /></View><T style={{ fontSize: 14 }} weight="medium">كل رحلة… بداية جديدة</T></View>
        <View style={[s.bottomGrid, mobile && { flexDirection: 'column-reverse', gap: 12 }]}>
          <Pressable onPress={onIntro} accessibilityRole="button" accessibilityLabel="شاهد قصة الهروب" style={s.bottomItem}>
            <Glass style={s.storyCard}><View style={s.storyPreview}><Image source={require('../../assets/bio-city.jpg')} style={StyleSheet.absoluteFill} /><View style={s.playCircle}><Icon name="play" size={15} color={colors.mint} /></View></View><View style={{ flex: 1, gap: 7 }}><T style={s.cardEyebrow}>البداية</T><T weight="bold" style={{ fontSize: 18 }}>ما وراء القفص</T><T style={s.cardDescription}>لكل جناح حكاية. اكتشف حكايتك.</T></View></Glass>
          </Pressable>
          <Pressable onPress={() => setTab('records')} accessibilityRole="button" accessibilityLabel="عرض سجل الرحلات" style={s.bottomItem}>
            <Glass style={s.statCard}><View style={s.statBadge}><Icon name="award" size={25} color={colors.gold} /></View><View style={{ flex: 1, gap: 5 }}><T style={s.cardEyebrow}>أفضل ارتفاع</T><View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline', gap: 7 }}><T style={{ color: colors.muted, fontSize: 12 }}>متر</T><T weight="bold" style={{ fontSize: 30, lineHeight: 34 }}>{arabicNumber(progress.best).padStart(3, '٠')}</T></View><T style={s.cardDescription}>{progress.flights ? `${arabicNumber(progress.flights)} رحلات. والأجمل لم يأتِ بعد.` : 'السماء تنتظر رقمك الأول.'}</T></View></Glass>
          </Pressable>
          <Pressable onPress={() => setTab('worlds')} accessibilityRole="button" accessibilityLabel="استكشاف الحدائق المعلقة" style={s.bottomItem}>
            <Glass style={s.worldCard}><View style={s.worldIcon}><Icon name="compass" size={26} color={colors.mint} /></View><View style={{ flex: 1, gap: 7 }}><T style={s.cardEyebrow}>وجهتك التالية</T><T weight="bold" style={{ fontSize: 18 }}>{world.name}</T><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}><T style={s.cardDescription}>{world.subtitle}</T><View style={s.statusDot} /></View></View></Glass>
          </Pressable>
        </View>
        <View style={s.footer}><T latin style={{ fontSize: 9, color: '#5c7169', letterSpacing: 1.5 }}>AETHER  /  V.1.0</T><View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><T style={{ fontSize: 11, color: '#7b9086' }}>صُممت لتشعر بالحرية</T><Icon name="feather" size={12} color="#7b9086" /></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><T style={{ fontSize: 10, color: '#7b9086' }}>جاهز للتحليق</T><View style={s.statusDot} /></View></View>
      </> : <Collection tab={tab} mobile={mobile} onPlay={onPlay} />}
      {storageError && <T style={{ color: colors.gold, fontSize: 12, textAlign: 'center', marginTop: 12 }}>تعذّر حفظ التقدم على هذا الجهاز. يمكنك الاستمرار باللعب.</T>}
    </ScrollView>
    {mobile && <View style={[s.mobileNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>{tabs.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.name} accessibilityState={{ selected: tab === item.id }} onPress={() => setTab(item.id)} style={s.mobileNavItem}><Icon name={item.icon} size={19} color={tab === item.id ? colors.mint : colors.muted} /><T style={{ color: tab === item.id ? colors.mint : colors.muted, fontSize: 11 }} weight={tab === item.id ? 'bold' : 'regular'}>{item.name}</T></Pressable>)}</View>}
  </View>;
}

function Collection({ tab, mobile, onPlay }: { tab: Exclude<Tab, 'home'>; mobile: boolean; onPlay: () => void }) {
  const { progress, dispatch, loaded } = useGameStore();
  const heading = { worlds: 'خلف كل أفق، عالم.', wings: 'جناحاك. هويّتك.', records: 'أثرٌ في السماء.' }[tab];
  return <View style={{ paddingTop: mobile ? 35 : 65, paddingBottom: 40 }}>
    <Eyebrow>{tab === 'worlds' ? 'اكتشف عوالم أثير' : tab === 'wings' ? 'مجموعة الأجنحة' : 'سجل رحلاتك'}</Eyebrow>
    <T weight="extra" style={{ fontSize: mobile ? 36 : 52, marginTop: 16, marginBottom: 10 }}>{heading}</T>
    <T style={{ color: colors.muted, lineHeight: 26, marginBottom: 35 }}>{tab === 'worlds' ? 'ارتقِ أعلى لتفتح طرقاً جديدة. كل عالم له إيقاعه.' : tab === 'wings' ? 'اجمع البلورات في رحلاتك وافتح أجنحة تعبّر عنك. المظهر يتغير، والحرية واحدة.' : 'كل محاولة تأخذك أبعد. سجلك محفوظ على هذا الجهاز.'}</T>
    {tab === 'worlds' && <View style={[s.collectionGrid, mobile && { flexDirection: 'column' }]}>{(Object.keys(worldInfo) as World[]).map(id => {
      const info = worldInfo[id]; const locked = progress.best < worldRequirements[id]; const selected = progress.world === id;
      return <Glass key={id} style={[s.collectionCard, selected && { borderColor: colors.emerald }]}>
        <View style={{ height: 220, overflow: 'hidden' }}><Image source={require('../../assets/bio-city.jpg')} style={{ width: '100%', height: 300, transform: [{ scale: id === 'temple' ? 1.6 : id === 'heights' ? 1.2 : 1 }] }} /><View style={[StyleSheet.absoluteFill, { backgroundColor: id === 'temple' ? 'rgba(115,72,12,0.35)' : id === 'heights' ? 'rgba(44,80,135,0.4)' : 'transparent' }]} /><LinearGradient colors={['transparent', '#101d19']} style={StyleSheet.absoluteFill} /><View style={{ position: 'absolute', right: 20, top: 20 }}><T latin style={{ color: info.color, fontSize: 12, letterSpacing: 2 }}>WORLD {info.number}</T></View>{locked && <View style={s.lockBadge}><Icon name="lock" size={24} color={info.color} /></View>}</View>
        <View style={{ padding: 24, gap: 12 }}><T weight="bold" style={{ fontSize: 25 }}>{info.name}</T><T style={{ color: colors.muted, fontSize: 13 }}>{info.subtitle}</T><T style={{ color: info.color, fontSize: 12, marginVertical: 6 }}>{locked ? `يُفتح عند ارتفاع ${arabicNumber(worldRequirements[id])} متر` : selected ? 'عالمك الحالي' : 'جاهز للاستكشاف'}</T><Button disabled={locked || !loaded} secondary={!selected} title={locked ? 'لم يُفتح بعد' : selected ? 'حلّق هنا' : 'اختيار العالم'} icon={locked ? 'lock' : 'arrow-up-right'} onPress={() => { if (selected) onPlay(); else dispatch({ type: 'world', world: id }); }} /></View>
      </Glass>;
    })}</View>}
    {tab === 'wings' && <View style={[s.collectionGrid, mobile && { flexDirection: 'column' }]}>{(Object.keys(wingInfo) as Wing[]).map(id => {
      const info = wingInfo[id]; const owned = progress.owned.includes(id); const selected = progress.wing === id; const affordable = progress.crystals >= wingCosts[id];
      return <Glass key={id} style={[s.collectionCard, selected && { borderColor: colors.emerald }]}><View style={{ alignItems: 'center', paddingTop: 20 }}><Bird wing={id} size={230} reduced={progress.settings.reducedMotion} /></View><View style={{ padding: 24, gap: 12 }}><T weight="bold" style={{ fontSize: 24, color: info.color }}>{info.name}</T><T style={{ color: colors.muted, fontSize: 13 }}>{info.subtitle}</T><T style={{ color: colors.muted, fontSize: 12, marginVertical: 6 }}>{owned ? 'في مجموعتك' : `${arabicNumber(wingCosts[id])} بلورة · ${affordable ? 'متاح للفتح' : `تحتاج ${arabicNumber(wingCosts[id] - progress.crystals)} بلورة إضافية`}`}</T><Button title={selected ? 'مُجهّز الآن' : owned ? 'تجهيز الجناح' : 'فتح الجناح'} disabled={selected || (!owned && !affordable) || !loaded} icon={selected ? 'check' : owned ? 'feather' : 'unlock'} secondary={!selected} onPress={() => dispatch({ type: 'wing', wing: id })} /></View></Glass>;
    })}</View>}
    {tab === 'records' && <>
      <View style={[s.recordStats, mobile && { gap: 10 }]}>{[{ name: 'أفضل ارتفاع', value: progress.best, icon: 'award' as const }, { name: 'الرحلات', value: progress.flights, icon: 'wind' as const }, { name: 'البلورات', value: progress.crystals, icon: 'hexagon' as const }].map(stat => <Glass key={stat.name} style={{ flex: 1, padding: mobile ? 16 : 30, gap: 12, alignItems: 'center' }}><Icon name={stat.icon} color={colors.mint} /><T weight="bold" style={{ fontSize: 30 }}>{arabicNumber(stat.value)}</T><T style={{ fontSize: 12, color: colors.muted }}>{stat.name}</T></Glass>)}</View>
      {progress.runs.length === 0 ? <Glass style={{ padding: 45, marginTop: 24, alignItems: 'center', gap: 18 }}><Icon name="wind" size={40} color={colors.mint} /><T weight="bold" style={{ fontSize: 23 }}>قصتك لم تبدأ بعد.</T><T style={{ textAlign: 'center', color: colors.muted }}>رحلتك الأولى تنتظرك خلف هذه الغيوم.</T><Button title="ابدأ رحلتك الأولى" disabled={!loaded} onPress={onPlay} style={{ marginTop: 14 }} /></Glass> : <Glass style={{ marginTop: 24, padding: mobile ? 15 : 30 }}><T weight="bold" style={{ fontSize: 21, marginBottom: 20 }}>آخر الرحلات</T>{progress.runs.map((run, i) => <View key={run.id} style={s.runRow}><T style={{ fontSize: 12, color: colors.muted }}>{new Date(run.date).toLocaleDateString('ar-EG')}</T><T style={{ fontSize: 14, color: colors.mint }}>{arabicNumber(run.crystals)} ◇</T><T weight="bold">{arabicNumber(run.altitude)} م</T><View style={{ flex: 1 }}><T style={{ fontSize: 14 }}>{worldInfo[run.world].name}</T></View><T style={{ color: colors.muted, fontSize: 12 }}>{arabicNumber(i + 1)}</T></View>)}</Glass>}
    </>}
  </View>;
}

const s = StyleSheet.create({
  header: { height: 92, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: 'rgba(6,15,14,0.35)' },
  headerTools: { flexDirection: 'row', alignItems: 'center', gap: 9 }, currency: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, marginLeft: 6 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 }, nav: { flexDirection: 'row', height: '100%', gap: 35, alignItems: 'center' }, navItem: { height: '100%', justifyContent: 'center', position: 'relative', paddingHorizontal: 3 }, navActive: { borderBottomWidth: 1, borderBottomColor: colors.mint }, navDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 18, alignSelf: 'center', backgroundColor: colors.mint },
  content: { maxWidth: 1500, width: '100%', alignSelf: 'center' }, hero: { position: 'relative', justifyContent: 'center' },
  heroCopy: { width: '36%', alignSelf: 'flex-end', alignItems: 'flex-end', zIndex: 2, paddingTop: 25, paddingBottom: 45 }, heroCopyMobile: { width: '100%', alignItems: 'center', paddingTop: 295, paddingBottom: 30 },
  heroTitle: { fontSize: 76, lineHeight: 88, marginTop: 22, marginBottom: 14, letterSpacing: -2 }, heroTitleMobile: { fontSize: 46, lineHeight: 64, marginTop: 15, marginBottom: 8, textAlign: 'center', letterSpacing: -1 },
  heroDescription: { color: '#bcc9c0', fontSize: 16, lineHeight: 27, marginBottom: 27 }, playButton: { minWidth: 265 }, heroMeta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, alignItems: 'center', marginTop: 16 }, smallDot: { width: 3, height: 3, backgroundColor: '#768c82', borderRadius: 2 }, helpLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, paddingVertical: 5 },
  birdArea: { position: 'absolute', left: '17%', top: '3%', height: '91%', justifyContent: 'center', alignItems: 'center', zIndex: 1 }, mobileBirdArea: { position: 'absolute', top: 0, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', height: 300 },
  orbit: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(174,224,198,0.1)', borderRadius: 300, transform: [{ rotate: '-25deg' }, { scaleY: 0.85 }] }, orbitInner: { position: 'absolute', top: 25, left: 25, right: 25, bottom: 25, borderRadius: 300, borderWidth: 1, borderColor: 'rgba(174,224,198,0.06)' }, orbitDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#b5d4bf', position: 'absolute', top: '15%', left: '14%' },
  coordinates: { position: 'absolute', top: 57, left: 0, flexDirection: 'row', gap: 10, alignItems: 'center' }, chapter: { position: 'absolute', left: 0, bottom: 58, width: 183, zIndex: 2 }, chapterHead: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 13 }, micro: { fontSize: 9, letterSpacing: 1.6, color: '#8a9e94' }, chapterImage: { overflow: 'hidden', borderRadius: 6, borderWidth: 1, borderColor: colors.border }, chapterBadge: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }, chapterTitle: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 7 }, statusDot: { width: 4, height: 4, borderRadius: 3, backgroundColor: colors.emerald }, heroBottomLabel: { flexDirection: 'row', alignItems: 'center', gap: 13, position: 'absolute', bottom: 20, left: '35%' },
  sectionHeader: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 22, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, bottomGrid: { flexDirection: 'row', gap: 18 }, bottomItem: { flex: 1 }, storyCard: { height: 123, padding: 18, flexDirection: 'row', gap: 19, alignItems: 'center' }, storyPreview: { width: 78, height: 82, borderRadius: 5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, playCircle: { width: 34, height: 34, borderRadius: 20, backgroundColor: 'rgba(13,32,23,0.8)', borderWidth: 1, borderColor: '#78988a', alignItems: 'center', justifyContent: 'center' }, cardEyebrow: { fontSize: 11, color: '#a3b6aa' }, cardDescription: { fontSize: 11, color: '#859b8e' }, statCard: { height: 123, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 18 }, statBadge: { width: 53, height: 53, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(209,186,130,0.15)', backgroundColor: 'rgba(209,186,130,0.04)', alignItems: 'center', justifyContent: 'center' }, worldCard: { height: 123, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16 }, worldIcon: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '12deg' }] }, footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23 },
  mobileNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(9,19,17,0.97)', borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', paddingTop: 13 }, mobileNavItem: { flex: 1, alignItems: 'center', gap: 7 },
  collectionGrid: { flexDirection: 'row-reverse', gap: 22 }, collectionCard: { flex: 1, minWidth: 0 }, lockBadge: { position: 'absolute', top: 95, alignSelf: 'center', padding: 15, backgroundColor: 'rgba(8,20,17,0.8)', borderRadius: 40 }, recordStats: { flexDirection: 'row-reverse', gap: 22 }, runRow: { flexDirection: 'row', gap: 18, alignItems: 'center', paddingVertical: 19, borderTopWidth: 1, borderTopColor: colors.border },
});
