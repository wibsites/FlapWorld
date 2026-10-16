import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const motes = Array.from({ length: 23 }, (_, i) => ({ x: ((i * 37 + 13) % 100), y: ((i * 23 + 7) % 100), size: i % 4 === 0 ? 3 : 1.5 }));

export function Backdrop({ reduced = false }: { reduced?: boolean }) {
  const { width } = useWindowDimensions();
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) { drift.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(drift, { toValue: 1, duration: 14000, useNativeDriver: true }), Animated.timing(drift, { toValue: 0, duration: 14000, useNativeDriver: true })]));
    loop.start(); return () => loop.stop();
  }, [drift, reduced]);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Image source={require('../../assets/bio-city.jpg')} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: width > 800 ? 0.66 : 0.59 }]} />
    <LinearGradient colors={['rgba(6,14,14,0.1)', 'rgba(5,12,12,0.14)', '#080f10']} locations={[0, 0.52, 1]} style={StyleSheet.absoluteFill} />
    <LinearGradient colors={['rgba(5,13,12,0.1)', 'rgba(5,13,12,0.0)', 'rgba(5,13,12,0.85)']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: drift.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }), transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [20, -35] }) }] }]}>
      {motes.map((mote, i) => <View key={i} style={{ position: 'absolute', left: `${mote.x}%`, top: `${mote.y}%`, width: mote.size, height: mote.size, borderRadius: 3, backgroundColor: i % 3 === 0 ? '#e7d8a2' : '#c5f8dc', shadowColor: '#92fbd1', shadowRadius: 6, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 } }} />)}
    </Animated.View>
  </View>;
}
