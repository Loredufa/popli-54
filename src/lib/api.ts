import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalize(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getApiBase(): string {
  const envBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  const extra = (Constants.expoConfig?.extra as any) || {};
  const localBase = extra.API_BASE_URL as string | undefined;
  const prodBase = extra.API_BASE_URL_PROD as string | undefined;
  let base = envBase || localBase || prodBase || '';

  // Si estamos en dispositivo/emulador y la base es localhost, intenta usar PROD
  if (Platform.OS !== 'web' && base.includes('localhost') && prodBase) {
    base = prodBase;
    console.warn('Usando API_BASE_URL_PROD porque localhost no es alcanzable desde el dispositivo');
  }
  if (!base) {
    console.warn('Falta EXPO_PUBLIC_API_BASE_URL o extra.API_BASE_URL; usando http://localhost:3000');
    base = 'http://localhost:3000';
  }
  return normalize(base);
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const full = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  console.log('[API] Resolved URL', full);
  return full;
}
