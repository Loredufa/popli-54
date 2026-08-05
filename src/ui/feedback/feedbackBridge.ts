// src/ui/feedback/feedbackBridge.ts
import type { DialogOptions, ToastOptions } from './types';

/**
 * Misma API que `useFeedback()`, pero accesible desde fuera de React. La usan los
 * contextos y los helpers, y también las pantallas: al ser una constante de módulo
 * no hay que arrastrarla por las listas de dependencias de los useCallback.
 * El FeedbackProvider se registra al montarse.
 */
type Core = {
  toast: (options: ToastOptions) => void;
  dialog: (options: DialogOptions) => Promise<boolean>;
};

let api: Core | null = null;

export function registerFeedbackApi(next: Core | null) {
  api = next;
}

function emit(options: ToastOptions) {
  if (!api) {
    // Antes de que monte el provider no hay dónde pintarlo; no perdemos el aviso.
    console.warn('[feedback] toast sin provider:', options.title, options.message ?? '');
    return;
  }
  api.toast(options);
}

export const feedback = {
  toast: emit,
  success: (title: string, message?: string) => emit({ kind: 'success', title, message }),
  error: (title: string, message?: string) => emit({ kind: 'error', title, message }),
  warning: (title: string, message?: string) => emit({ kind: 'warning', title, message }),
  info: (title: string, message?: string) => emit({ kind: 'info', title, message }),
  dialog: (options: DialogOptions) => {
    if (!api) {
      console.warn('[feedback] dialog sin provider:', options.title, options.message ?? '');
      return Promise.resolve(false);
    }
    return api.dialog(options);
  },
};
