import * as React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import * as Theme from '../theme';

// Usa tu THEME (o default) sin romper si exportaste distinto
const THEME = (Theme as any).THEME ?? (Theme as any).default ?? {};
const Stars = (Theme as any).Stars; // opcional: “estrellitas” de tu theme

type Props = {
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export default function Card({ title, subtitle, style, children }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: THEME.card ?? 'rgba(255,255,255,0.06)',
          borderColor: THEME.border ?? 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          borderRadius: 16,
          padding: 14,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Estrellitas decorativas si tu theme las exporta */}
      {Stars ? (
        <View style={{ position: 'absolute', inset: 0 }}>
          <Stars />
        </View>
      ) : null}

      {title ? (
        <Text
          style={{
            color: THEME.text ?? '#e6eef9',
            fontWeight: '700',
            fontSize: 16,
            marginBottom: subtitle ? 2 : 10,
          }}
        >
          {title}
        </Text>
      ) : null}

      {subtitle ? (
        <Text
          style={{
            color: THEME.textDim ?? '#a9b4d0',
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          {subtitle}
        </Text>
      ) : null}

      {children}
    </View>
  );
}
