// src/lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'cuentero_current_story';

export type StorySession = {
  id: string;
  story: string;
  title?: string;
  images?: string[];
  voiceId?: string;
  audioUri?: string;
   // Compat: audioUri se mantiene, pero usamos audioMap para múltiples voces
  audioMap?: Record<string, string>;
  /** Track de música elegido para este cuento (id de `musicPlayer.TRACKS`). */
  musicTrackId?: string;
  /** Id en la biblioteca si este cuento ya se guardó, para que volver a guardar actualice
   * la misma carpeta en vez de crear otra entrada. */
  savedId?: string;
  meta?: any;
  createdAt: string;
};

export async function saveCurrentSession(session: StorySession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadCurrentSession(): Promise<StorySession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StorySession;
  } catch {
    return null;
  }
}

export async function clearCurrentSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
