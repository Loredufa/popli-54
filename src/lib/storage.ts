// src/lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cuentero_stories';

export type StoryItem = { id: string; createdAt: string; story: string };

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
