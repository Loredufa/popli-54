// src/ui/feedback/PopliToast.tsx
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { THEME } from '../../theme';
import { KIND_STYLE, type FeedbackKind } from './types';

type Props = {
  kind: FeedbackKind;
  title: string;
  message?: string;
  onDismiss: () => void;
};

/**
 * Aviso transitorio con el lenguaje visual de la app: tarjeta glass sobre el
 * navy, borde fino y el mismo glow que los botones, teñido según el tipo.
 */
export function PopliToast({ kind, title, message, onDismiss }: Props) {
  const { icon, color } = KIND_STYLE[kind];

  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      exiting={FadeOutUp.duration(200)}
      layout={Layout.duration(220)}
    >
      <Pressable
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityLabel={message ? `${title}. ${message}` : title}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: `${color}55`,
            shadowColor: color,
            shadowOpacity: pressed ? 0.15 : 0.35,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: `${color}26`, borderColor: `${color}66` }]}>
          <Feather name={icon} size={18} color={color} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {!!message && (
            <Text style={styles.message} numberOfLines={4}>
              {message}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Opaco, no THEME.card: el toast flota sobre pantallas de cualquier color.
    backgroundColor: '#16213f',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 8,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: { flex: 1, paddingTop: 2 },
  title: { color: THEME.text, fontSize: 15, fontWeight: '800' },
  message: { color: THEME.textDim, fontSize: 13, lineHeight: 18, marginTop: 3 },
});

export default PopliToast;
