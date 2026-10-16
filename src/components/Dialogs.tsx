import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Button, Eyebrow, Glass, Icon, IconButton, T } from './UI';
import { colors } from '../theme';
import { Preferences, useGameStore } from '../state/GameStore';

export function Dialogs({ modal, onClose, onPlay }: { modal: 'settings' | 'help' | null; onClose: () => void; onPlay: () => void }) {
  const { progress, dispatch } = useGameStore();
  const rows: { key: keyof Preferences; title: string; description: string }[] = [
    { key: 'music', title: 'موسيقى الأثير', description: 'أجواء هادئة ترافق رحلتك' },
    { key: 'effects', title: 'المؤثرات الصوتية', description: 'صوت البلورات وانكسار القفص' },
    { key: 'haptics', title: 'الاستجابة اللمسية', description: 'نبضات خفيفة على الأجهزة المدعومة' },
    { key: 'reducedMotion', title: 'تقليل الحركة', description: 'إيقاف حركة القوائم وتقليل الجزيئات' },
  ];
  return <Modal visible={modal !== null} transparent animationType={progress.settings.reducedMotion ? 'none' : 'fade'} onRequestClose={onClose}>
    <View style={s.backdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="إغلاق النافذة" /><Glass style={s.dialog}><ScrollView contentContainerStyle={{ padding: 28 }}><View style={s.titleRow}><IconButton name="x" label="إغلاق" onPress={onClose} /><Eyebrow>{modal === 'settings' ? 'على إيقاعك' : 'دليلك إلى السماء'}</Eyebrow></View>
      <T weight="extra" style={s.title}>{modal === 'settings' ? 'مساحتك الخاصة.' : 'الحرية تبدأ بلمسة.'}</T>
      {modal === 'settings' ? <>{rows.map(row => <View key={row.key} style={s.row}><Switch accessibilityLabel={row.title} value={progress.settings[row.key]} onValueChange={value => dispatch({ type: 'setting', key: row.key, value })} trackColor={{ false: '#34443e', true: '#86bd8d' }} thumbColor={progress.settings[row.key] ? '#e1f6d9' : '#a3b2a8'} /><View style={{ flex: 1, gap: 6 }}><T weight="bold" style={{ fontSize: 17 }}>{row.title}</T><T style={{ fontSize: 12, color: colors.muted }}>{row.description}</T></View></View>)}<T style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 24 }}>اللغة: العربية · يُحفظ تقدمك تلقائياً على هذا الجهاز</T></> : <>
        {[{ icon: 'move' as const, title: 'وجّه جناحيك', text: 'المس واسحب يميناً أو يساراً. على الحاسوب استخدم السهمين ← → أو المؤشر.' }, { icon: 'wind' as const, title: 'اعبر بين الأعمدة', text: 'ترتقي تلقائياً. اتبع الفتحات المضيئة وتجنّب الأعمدة الحيوية.' }, { icon: 'hexagon' as const, title: 'اجمع الضوء', text: 'كل بلورة تفتح لك أجنحة جديدة. وكل ارتفاع يكشف عالماً آخر.' }].map((item, i) => <View key={item.title} style={s.helpRow}><View style={{ flex: 1, gap: 7 }}><T weight="bold" style={{ fontSize: 18 }}>{item.title}</T><T style={{ fontSize: 13, lineHeight: 23, color: colors.muted }}>{item.text}</T></View><View style={s.helpIcon}><Icon name={item.icon} color={colors.mint} /></View></View>)}
        <T style={{ color: colors.muted, textAlign: 'center', fontSize: 12, marginVertical: 20 }}>يمكنك إيقاف الرحلة مؤقتاً في أي وقت. على الحاسوب اضغط Esc.</T><Button title="أنا مستعد للتحليق" onPress={onPlay} />
      </>}
    </ScrollView></Glass></View>
  </Modal>;
}
const s = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: 'rgba(0,8,6,0.8)', alignItems: 'center', justifyContent: 'center', padding: 20 }, dialog: { width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: '#10201a' }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { fontSize: 32, marginTop: 23, marginBottom: 20 }, row: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingVertical: 19, borderBottomWidth: 1, borderBottomColor: colors.border }, helpRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginVertical: 16 }, helpIcon: { width: 45, height: 45, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' } });
