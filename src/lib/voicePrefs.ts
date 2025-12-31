import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cuentero_voice_id';

export async function saveVoicePreference(voiceId: string) {
  await AsyncStorage.setItem(KEY, voiceId);
}

export async function loadVoicePreference(): Promise<string | null> {
  const value = await AsyncStorage.getItem(KEY);
  return value || null;
}
