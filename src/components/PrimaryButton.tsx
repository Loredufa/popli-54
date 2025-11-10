import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { THEME } from '../../src/theme';

type Props = {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  onPress?: () => void;
};

export function PrimaryButton({ label, icon = 'play', disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: { pressed: boolean }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled ? '#2a3d63' : THEME.primary,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: THEME.primary,
        shadowOpacity: pressed ? 0.15 : 0.35,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 14,
        marginTop: 12,
      })}
    >
      <Feather name={icon} size={18} color="#0b1226" style={{ marginRight: 8 }} />
      <Text style={{ color: '#0b1226', fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export default PrimaryButton;
