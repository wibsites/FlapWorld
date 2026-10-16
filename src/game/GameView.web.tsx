import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { T } from '../components/UI';
import { colors } from '../theme';
import type { GameProps } from './types';

const loadScene = () => import('./GameScene');
const options = { locateFile: (file: string) => `/${file}` };
export default function GameView(props: GameProps) {
  return <WithSkiaWeb getComponent={loadScene} componentProps={props} opts={options} fallback={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: colors.background }}><ActivityIndicator color={colors.mint} /><T>تتهيّأ السماء لرحلتك…</T></View>} />;
}
