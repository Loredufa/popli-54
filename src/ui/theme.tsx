// src/ui/theme.tsx
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { THEME } from '../theme';

export { THEME };

export const GradientBG: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flex: 1 }}>
    <LinearGradient colors={[THEME.bgTop, THEME.bgBottom]} style={{ position: 'absolute', inset: 0 }} />
    <View style={{ position: 'absolute', inset: 0 }}>
      {[...Array(20)].map((_, i) => (
        <View key={i} style={{ position: 'absolute', top: Math.random() * 700, left: Math.random() * 360, width: 2, height: 2, backgroundColor: THEME.accent, borderRadius: 2, opacity: 0.9 }} />
      ))}
    </View>
    {children}
  </View>
);

export const CardBox: React.FC<{ title?: string; children: React.ReactNode; style?: any }> = ({ title, children, style }) => (
  <Animated.View entering={FadeInUp.duration(600)} style={[{ backgroundColor: THEME.card, borderColor: THEME.border, borderWidth: 1, borderRadius: 16, padding: 14 }, style]}>
    {!!title && <Text style={{ color: THEME.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{title}</Text>}
    {children}
  </Animated.View>
);
