// src/components/IconButton.tsx
// Botón redondeado con ícono. Vivía dentro de StoryReader; se extrajo para que la
// botonera de narración se pueda dibujar también sobre el texto del cuento.
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable } from 'react-native';
import { THEME } from '../ui/theme';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  accessibilityLabel?: string;
};

export default function IconButton({ icon, onPress, disabled, size = 42, accessibilityLabel }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.29),
        backgroundColor: disabled ? '#2a3d63' : THEME.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
        shadowColor: THEME.primary,
        shadowOpacity: pressed ? 0.15 : 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      })}
    >
      <Feather name={icon} size={Math.round(size * 0.43)} color="#0b1226" />
    </Pressable>
  );
}
