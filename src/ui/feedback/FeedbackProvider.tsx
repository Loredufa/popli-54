// src/ui/feedback/FeedbackProvider.tsx
import * as React from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import PopliDialog from './PopliDialog';
import PopliToast from './PopliToast';
import { registerFeedbackApi } from './feedbackBridge';
import type { DialogOptions, FeedbackKind, ToastOptions } from './types';

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3500;

type ToastItem = ToastOptions & { id: number; kind: FeedbackKind };

type FeedbackApi = {
  toast: (options: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  /** Resuelve true si el usuario confirma. */
  dialog: (options: DialogOptions) => Promise<boolean>;
};

const FeedbackContext = React.createContext<FeedbackApi | null>(null);

export function useFeedback() {
  const ctx = React.useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback debe usarse dentro de <FeedbackProvider>');
  return ctx;
}

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [dialog, setDialog] = React.useState<DialogOptions | null>(null);
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);
  const nextId = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const item: ToastItem = { ...options, id, kind: options.kind ?? 'info' };
      setToasts((prev) => [...prev, item].slice(-MAX_TOASTS));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), options.duration ?? DEFAULT_DURATION),
      );
    },
    [dismiss],
  );

  const showDialog = React.useCallback((options: DialogOptions) => {
    // Un diálogo pendiente se resuelve como cancelado antes de abrir el siguiente.
    resolveRef.current?.(false);
    setDialog(options);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const resolveDialog = React.useCallback((confirmed: boolean) => {
    setDialog(null);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(confirmed);
  }, []);

  const api = React.useMemo<FeedbackApi>(
    () => ({
      toast: showToast,
      success: (title, message) => showToast({ kind: 'success', title, message }),
      error: (title, message) => showToast({ kind: 'error', title, message }),
      warning: (title, message) => showToast({ kind: 'warning', title, message }),
      info: (title, message) => showToast({ kind: 'info', title, message }),
      dialog: showDialog,
    }),
    [showToast, showDialog],
  );

  // Deja la misma API disponible fuera de React (PlaybackContext, helpers).
  React.useEffect(() => {
    registerFeedbackApi({ toast: showToast, dialog: showDialog });
    return () => registerFeedbackApi(null);
  }, [showToast, showDialog]);

  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
      <PopliDialog options={dialog} onResolve={resolveDialog} />
    </FeedbackContext.Provider>
  );
};

/**
 * Los toasts van dentro de un <Modal> y no de una View absoluta: las pantallas
 * con `presentation: 'modal'` (record-voice, recuperar contraseña) se dibujan en
 * una ventana nativa aparte en iOS y taparían cualquier overlay hermano del Stack.
 */
const ToastHost: React.FC<{ toasts: ToastItem[]; onDismiss: (id: number) => void }> = ({
  toasts,
  onDismiss,
}) => {
  if (!toasts.length) return null;

  const list = (
    <View pointerEvents="box-none" style={styles.host}>
      {toasts.map((t) => (
        <PopliToast
          key={t.id}
          kind={t.kind}
          title={t.title}
          message={t.message}
          onDismiss={() => onDismiss(t.id)}
        />
      ))}
    </View>
  );

  // En web un <Modal> secuestra el foco de la página; ahí basta con el overlay.
  if (Platform.OS === 'web') return <View pointerEvents="box-none" style={styles.webHost}>{list}</View>;

  return (
    <Modal visible transparent statusBarTranslucent animationType="none">
      {/* SafeAreaProvider propio: el host vive fuera del <Stack>, así que no hereda
          ninguno, y además un Modal es una ventana aparte con sus propios insets. */}
      <SafeAreaProvider>
        <SafeAreaView edges={['top']} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {list}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  host: { paddingTop: 12, paddingHorizontal: 16 },
  webHost: { position: 'absolute', top: 0, left: 0, right: 0 },
});

export default FeedbackProvider;
