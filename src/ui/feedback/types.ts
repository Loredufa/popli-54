// src/ui/feedback/types.ts
import { Feather } from '@expo/vector-icons';
import { THEME } from '../../theme';

export type FeedbackKind = 'success' | 'error' | 'warning' | 'info';

export type ToastOptions = {
  kind?: FeedbackKind;
  title: string;
  message?: string;
  /** ms antes de que se descarte solo. */
  duration?: number;
};

export type DialogOptions = {
  kind?: FeedbackKind;
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Sin esta etiqueta el diálogo sale con un único botón (solo avisa). */
  cancelLabel?: string;
  /** Tiñe el botón de confirmar en rojo: borrar cuento, borrar voz, salir. */
  destructive?: boolean;
};

/** Ícono y color de acento por tipo de mensaje. */
export const KIND_STYLE: Record<
  FeedbackKind,
  { icon: keyof typeof Feather.glyphMap; color: string }
> = {
  success: { icon: 'check-circle', color: THEME.success },
  error: { icon: 'alert-octagon', color: THEME.error },
  warning: { icon: 'alert-triangle', color: THEME.warning },
  info: { icon: 'info', color: THEME.info },
};
