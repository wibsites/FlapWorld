import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageStyle, StyleProp } from 'react-native';
import { Wing } from '../state/GameStore';

export const birdSources = { jade: require('../../assets/bird.png'), solar: require('../../assets/bird-solar.png'), frost: require('../../assets/bird-frost.png') };

export function Bird({ size = 400, reduced = false, style, wing = 'jade' }: { size?: number; reduced?: boolean; style?: StyleProp<ImageStyle>; wing?: Wing }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { float.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([Animated.timing(float, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(float, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    animation.start(); return () => animation.stop();
  }, [float, reduced]);
  return <Animated.Image accessibilityLabel="طائر أثير الآلي بأجنحة بلورية" source={birdSources[wing]} resizeMode="contain" style={[{ width: size, height: size, transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [8, -12] }) }, { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '0deg'] }) }] }, style]} />;
}
