// src/components/SparkSpinner.tsx
// Notita musical girando, para las esperas de generación de voz. Vivía dentro de
// StoryReader; se extrajo para reusarla en la botonera de narración compartida.
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Animated, Easing } from 'react-native';
import { THEME } from '../ui/theme';

export default function SparkSpinner({ size = 16 }: { size?: number }) {
  const spin = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Feather name="music" size={size} color={THEME.accent} />
    </Animated.View>
  );
}
