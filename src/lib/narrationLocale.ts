import { getLocales } from 'expo-localization';
import { AppLocale } from '../i18n/translations';
import { loadAccentPreferences } from './accentPrefs';

/**
 * El locale que se le manda a `/api/tts/narrate`, tipo "es-AR".
 *
 * Antes iba hardcodeado, y encima distinto segun la pantalla: 'es-AR' en PlaybackContext y
 * 'es-LATAM' en story-audio. O sea que la variedad no tenia nada que ver con el usuario.
 *
 * Sale de dos piezas:
 *   - idioma: el de la app (`appLocale`), que es de donde tambien sale `storyLanguage` en maker.
 *   - region: lo que el usuario eligio en Ajustes, y si no eligio nada, la del dispositivo.
 *
 * Ojo con lo que NO hace: no valida que la region sea una variedad real de ese idioma. Eso lo
 * decide la API (lib/ttsInstruction.ts), que es donde vive la tabla. Alguien en Argentina pidiendo
 * un cuento en ingles manda "en-AR" tal cual y el servidor resuelve que AR no es una variedad de
 * ingles, asi que narra sin pedir acento. Tener la tabla en un solo lado es a proposito: duplicarla
 * aca seria garantia de que las dos se desincronicen.
 */

/** Region del dispositivo en ISO ("AR", "MX"), o `null` si no se puede saber. */
export function getDeviceRegion(): string | null {
  try {
    // En web `regionCode` puede venir null aunque haya locales.
    return getLocales()[0]?.regionCode ?? null;
  } catch {
    return null;
  }
}

/** Pieza pura, para poder testear la resolucion sin tocar AsyncStorage ni el dispositivo. */
export function resolveNarrationLocale(
  appLocale: AppLocale | string,
  region: string | null | undefined,
): string {
  const language = String(appLocale || 'es').toLowerCase();
  return region ? `${language}-${region.toUpperCase()}` : language;
}

/**
 * Se lee en el momento de narrar, no al montar: si el usuario acaba de cambiar el acento en
 * Ajustes, la proxima narracion ya sale con el nuevo sin depender de que algun provider se haya
 * re-renderizado.
 */
export async function getNarrationLocale(appLocale: AppLocale): Promise<string> {
  const prefs = await loadAccentPreferences();
  return resolveNarrationLocale(appLocale, prefs[appLocale] ?? getDeviceRegion());
}
