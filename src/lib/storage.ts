// src/lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cuentero_stories';
const SESSION_KEY = 'cuentero_current_story';

export type StoryItem = { id: string; createdAt: string; story: string };
export type StorySession = {
  id: string;
  story: string;
  title?: string;
  images?: string[];
  voiceId?: string;
  audioUri?: string;
   // Compat: audioUri se mantiene, pero usamos audioMap para múltiples voces
  audioMap?: Record<string, string>;
  meta?: any;
  createdAt: string;
};

export async function loadStories(): Promise<StoryItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveStory(text: string) {
  const entry: StoryItem = { id: String(Date.now()), createdAt: new Date().toISOString(), story: text };
  const arr = await loadStories();
  arr.unshift(entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
  return entry;
}

export async function getStory(id: string): Promise<StoryItem | undefined> {
  const all = await loadStories();
  return all.find(s => s.id === id);
}

export async function clearStories() {
  await AsyncStorage.removeItem(KEY);
}

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
