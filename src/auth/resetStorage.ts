import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_RESET_EMAIL_KEY = 'last_reset_email';

export async function saveLastResetEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  try {
    await AsyncStorage.setItem(LAST_RESET_EMAIL_KEY, normalized);
  } catch {
    // best effort; si falla seguimos sin romper el flujo
  }
}

export async function loadLastResetEmail() {
  try {
    return await AsyncStorage.getItem(LAST_RESET_EMAIL_KEY);
  } catch {
    return null;
  }
}

export async function clearLastResetEmail() {
  try {
    await AsyncStorage.removeItem(LAST_RESET_EMAIL_KEY);
  } catch {
    // noop
  }
}
