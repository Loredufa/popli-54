// src/ui/feedback/PopliDialog.tsx
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { THEME } from '../../theme';
import { KIND_STYLE, type DialogOptions } from './types';

type Props = {
  options: DialogOptions | null;
  onResolve: (confirmed: boolean) => void;
};

/** Estrellas del panel, con posiciones fijas para que no bailen entre renders. */
const STARS = Array.from({ length: 14 }, (_, i) => ({
  top: ((i * 73.137) % 100) + '%',
  left: ((i * 137.508) % 100) + '%',
  opacity: [0.35, 0.6, 0.85, 0.5][i % 4],
}));

export function PopliDialog({ options, onResolve }: Props) {
  const visible = !!options;
  const kind = options?.kind ?? 'info';
  const { icon, color } = KIND_STYLE[kind];
  const confirmColor = options?.destructive ? THEME.error : THEME.primary;
  const hasCancel = !!options?.cancelLabel;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => onResolve(false)}
    >
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        {/* Tocar fuera equivale a cancelar, nunca a confirmar. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => onResolve(false)} />
        <Animated.View entering={FadeInDown.duration(280)} style={styles.panel}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {STARS.map((s, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: s.top as any,
                  left: s.left as any,
                  width: 2,
                  height: 2,
                  borderRadius: 2,
                  backgroundColor: THEME.accent,
                  opacity: s.opacity,
                }}
              />
            ))}
          </View>

          <View style={[styles.badge, { backgroundColor: `${color}26`, borderColor: `${color}66` }]}>
            <Feather name={icon} size={26} color={color} />
          </View>

          <Text style={styles.title}>{options?.title}</Text>
          {!!options?.message && <Text style={styles.message}>{options.message}</Text>}

          <View style={styles.actions}>
            {hasCancel && (
              <Pressable
                onPress={() => onResolve(false)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={styles.ghostLabel}>{options?.cancelLabel}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => onResolve(true)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: confirmColor,
                  shadowColor: confirmColor,
                  shadowOpacity: pressed ? 0.15 : 0.35,
                  flex: hasCancel ? 1 : undefined,
                },
              ]}
            >
              <Text style={styles.confirmLabel}>{options?.confirmLabel ?? 'OK'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    // Anclado en vez de flex:1: en web el contenedor del Modal se ajusta al alto
    // del contenido y el panel quedaría descentrado.
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#16213f',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: THEME.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 12,
  },
  badge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: THEME.textDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    alignSelf: 'stretch',
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: { color: THEME.textDim, fontSize: 15, fontWeight: '700' },
  confirmBtn: {
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 6,
  },
  confirmLabel: { color: THEME.onPrimary, fontSize: 15, fontWeight: '800' },
});

export default PopliDialog;
