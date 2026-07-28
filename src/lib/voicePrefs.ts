import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const PREF_KEY = 'cuentero_voice_id';
const NAMED_VOICES_KEY = 'cuentero_named_voices';
const VOICES_DIR = `${FileSystem.documentDirectory}voices/`;

export async function saveVoicePreference(voiceId: string) {
  await AsyncStorage.setItem(PREF_KEY, voiceId);
}

export async function loadVoicePreference(): Promise<string | null> {
  return (await AsyncStorage.getItem(PREF_KEY)) || null;
}

export type NamedVoiceData = {
  id: string;
  label: string;
  localUri: string;
  createdAt: string;
};

// Tope definido por la usuaria: 3 voces (mamá, papá, y una tercera —
// abuela/abuelo/tía). Al llegar al tope se bloquea grabar una nueva y se
// indica borrar una existente en "Mis voces", en vez de descartar la más
// vieja en silencio (son grabaciones intencionales, con nombre — descartar
// sin avisar sorprendería a un familiar que acaba de grabarse).
export const MAX_NAMED_VOICES = 3;

export class VoiceLimitError extends Error {
  constructor() {
    super(`Ya tenés ${MAX_NAMED_VOICES} voces guardadas. Borrá una en "Mis voces" para grabar otra.`);
    this.name = 'VoiceLimitError';
  }
}

async function ensureVoicesDir() {
  const info = await FileSystem.getInfoAsync(VOICES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(VOICES_DIR, { intermediates: true });
  }
}

export async function loadNamedVoices(): Promise<NamedVoiceData[]> {
  const raw = await AsyncStorage.getItem(NAMED_VOICES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NamedVoiceData[]) : [];
  } catch {
    return [];
  }
}

export function voiceLabelExists(label: string, existing: NamedVoiceData[]): boolean {
  const norm = label.trim().toLowerCase();
  return existing.some((v) => v.label.trim().toLowerCase() === norm);
}

export async function saveNamedVoice(opts: { label: string; tempUri: string }): Promise<NamedVoiceData> {
  const existing = await loadNamedVoices();
  if (existing.length >= MAX_NAMED_VOICES) {
    throw new VoiceLimitError();
  }
  await ensureVoicesDir();

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = opts.tempUri.split('.').pop() || 'm4a';
  const localUri = `${VOICES_DIR}voice-${id}.${ext}`;
  await FileSystem.copyAsync({ from: opts.tempUri, to: localUri });

  const entry: NamedVoiceData = {
    id,
    label: opts.label.trim(),
    localUri,
    createdAt: new Date().toISOString(),
  };
  const updated = [...existing, entry];
  await AsyncStorage.setItem(NAMED_VOICES_KEY, JSON.stringify(updated));
  return entry;
}

export async function deleteNamedVoice(id: string): Promise<void> {
  const existing = await loadNamedVoices();
  const target = existing.find((v) => v.id === id);
  const updated = existing.filter((v) => v.id !== id);
  await AsyncStorage.setItem(NAMED_VOICES_KEY, JSON.stringify(updated));
  if (target?.localUri) {
    await FileSystem.deleteAsync(target.localUri, { idempotent: true }).catch(() => {});
  }
}

export const FALLBACK_VOICE_ID = 'alloy';

export type DeleteNamedVoiceResult = {
  /** Voz que quedó seleccionada: la misma de antes, o el fallback si borramos la activa. */
  nextVoiceId: string;
  /** `true` si hubo que cambiar la voz seleccionada. */
  preferenceReset: boolean;
  /** `audioMap` sin la narración de la voz borrada. */
  audioMap: Record<string, string>;
};

/**
 * Borra una voz grabada y limpia TODO lo que la referencia: el registro, el archivo de la
 * grabación, la preferencia de narrador (si era la activa) y la narración ya generada con esa
 * voz. Sin esto quedaban entradas `custom:<id>` colgadas en `audioMap` y en la sesión, apuntando
 * a una voz que ya no existe.
 */
export async function deleteNamedVoiceCascade(
  id: string,
  opts: { currentVoiceId?: string; audioMap?: Record<string, string> } = {},
): Promise<DeleteNamedVoiceResult> {
  const { currentVoiceId, audioMap = {} } = opts;
  const composedId = `custom:${id}`;

  await deleteNamedVoice(id);

  const orphanAudioUri = audioMap[composedId];
  if (orphanAudioUri) {
    await FileSystem.deleteAsync(orphanAudioUri, { idempotent: true }).catch(() => {});
  }
  const { [composedId]: _removed, ...restAudio } = audioMap;

  const preferenceReset = currentVoiceId === composedId;
  if (preferenceReset) {
    await saveVoicePreference(FALLBACK_VOICE_ID);
  }

  return {
    nextVoiceId: preferenceReset ? FALLBACK_VOICE_ID : (currentVoiceId ?? FALLBACK_VOICE_ID),
    preferenceReset,
    audioMap: restAudio,
  };
}
