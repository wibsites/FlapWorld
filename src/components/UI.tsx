import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextProps, View, ViewStyle, StyleProp } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

export type IconName = React.ComponentProps<typeof Feather>['name'];
export const Icon = ({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) => <Feather name={name} size={size} color={color} />;
export function T({ style, weight = 'regular', latin = false, ...props }: TextProps & { weight?: 'regular' | 'medium' | 'bold' | 'extra'; latin?: boolean }) {
  const font = { regular: 'Tajawal_400Regular', medium: 'Tajawal_500Medium', bold: 'Tajawal_700Bold', extra: 'Tajawal_800ExtraBold' }[weight];
  return <Text {...props} style={[{ color: colors.text, fontFamily: font, fontSize: 16, textAlign: 'right', writingDirection: latin ? 'ltr' : 'rtl' }, style]} />;
}

export function IconButton({ name, label, onPress, active = false, style }: { name: IconName; label: string; onPress: () => void; active?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, active && { borderColor: colors.emerald }, pressed && { opacity: 0.6 }, style]}><Icon name={name} size={18} color={active ? colors.mint : colors.text} /></Pressable>;
}

export function Button({ title, onPress, icon = 'arrow-up-right', secondary = false, disabled = false, style }: { title: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPress={onPress} style={({ pressed }) => [styles.button, secondary ? styles.secondary : styles.primary, hovered && !disabled && { borderColor: '#e9ffdc', transform: [{ translateY: -2 }] }, pressed && { transform: [{ scale: 0.98 }] }, disabled && { opacity: 0.4 }, style]}>
    <Icon name={icon} size={21} color={secondary ? colors.text : '#13251b'} />
    <T weight="bold" style={{ color: secondary ? colors.text : '#13251b', fontSize: 18 }}>{title}</T>
  </Pressable>;
}

export function Glass({ children, style }: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <LinearGradient colors={['rgba(35,55,50,0.62)', 'rgba(10,22,21,0.85)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.glass, style]}>{children}</LinearGradient>;
}

export function Eyebrow({ children, color = colors.emerald }: React.PropsWithChildren<{ color?: string }>) {
  return <View style={styles.eyebrow}><T style={{ fontSize: 12, color, letterSpacing: 0.8 }} weight="medium">{children}</T><View style={{ width: 5, height: 5, backgroundColor: color, borderRadius: 3 }} /></View>;
}

const styles = StyleSheet.create({
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22,37,33,0.55)', borderWidth: 1, borderColor: colors.border, borderRadius: 13 },
  button: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 27, borderWidth: 1, borderRadius: 8 },
  primary: { backgroundColor: colors.mint, borderColor: '#d2f5c9', shadowColor: '#a5ebb2', shadowOpacity: 0.17, shadowRadius: 24, shadowOffset: { width: 0, height: 5 } },
  secondary: { backgroundColor: 'rgba(12,28,25,0.6)', borderColor: colors.border },
  glass: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' },
  eyebrow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
});
