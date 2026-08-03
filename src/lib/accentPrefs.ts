import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLocale } from '../i18n/translations';

/**
 * Que variedad regional del idioma quiere escuchar el usuario en la narracion.
 *
 * Se guarda POR IDIOMA a proposito: alguien puede querer rioplatense cuando el cuento es en
 * español y americano cuando es en ingles, al mismo tiempo. Un solo valor global no alcanzaria.
 *
 * Ausente = automatico, o sea usar la region del dispositivo (ver narrationLocale.ts).
 */
const PREF_KEY = 'cuentero_narration_accent';

export type AccentPrefs = Partial<Record<AppLocale, string>>;

export async function loadAccentPreferences(): Promise<AccentPrefs> {
  const raw = await AsyncStorage.getItem(PREF_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as AccentPrefs) : {};
  } catch {
    // Un JSON roto no puede dejar al usuario sin narracion: se ignora y vuelve a automatico.
    return {};
  }
}

/** Guarda la variedad para un idioma. `null` borra la eleccion y vuelve a automatico. */
export async function saveAccentPreference(
  locale: AppLocale,
  region: string | null,
): Promise<AccentPrefs> {
  const current = await loadAccentPreferences();
  const next = { ...current };
  if (region) {
    next[locale] = region;
  } else {
    delete next[locale];
  }
  await AsyncStorage.setItem(PREF_KEY, JSON.stringify(next));
  return next;
}

/**
 * Opciones que ofrece el selector de Ajustes, por idioma.
 *
 * Las etiquetas son nombres de variedades, no copy de UI: un hispanohablante eligiendo el acento
 * del español ve nombres en español. Por eso NO van en translations.ts — solo el titulo de la
 * seccion y la opcion "Automatico" se traducen.
 *
 * Es una lista corta a proposito. La tabla completa de pares (idioma, region) validos vive en la
 * API (lib/ttsInstruction.ts) y es la autoridad: soporta mas paises que estos. Lo que no este aca
 * se cubre solo con "Automatico". Si alguna vez esta lista ofreciera una region que la API no
 * conoce, la API degrada sola a una instruccion sin variedad — la opcion no haria efecto, pero
 * nada se rompe.
 */
export const ACCENT_OPTIONS: Partial<Record<AppLocale, { region: string; label: string }[]>> = {
  es: [
    // "Rioplatense" y no "Argentina": cruza Argentina y Uruguay, y es el rasgo que el A/B a oido
    // mostro que el modelo si recoge.
    { region: 'AR', label: 'Rioplatense' },
    { region: 'MX', label: 'México' },
    { region: 'ES', label: 'España' },
    { region: 'CO', label: 'Colombia' },
    { region: 'CL', label: 'Chile' },
    { region: 'PE', label: 'Perú' },
  ],
  en: [
    { region: 'US', label: 'American' },
    { region: 'GB', label: 'British' },
    { region: 'AU', label: 'Australian' },
  ],
  pt: [
    { region: 'BR', label: 'Brasil' },
    { region: 'PT', label: 'Portugal' },
  ],
  // Japones sin opciones: no hay una variedad regional que valga la pena pedirle al modelo.
  ja: [],
};
