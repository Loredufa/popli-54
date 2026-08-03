/* eslint-disable import/first -- los `jest.mock` se hoistean: los imports van despues a proposito. */
/**
 * El locale que se manda a narrar sale de dos piezas: el idioma de la app y la variedad regional.
 * La variedad es la eleccion del usuario en Ajustes, y si no eligio nada, la region del
 * dispositivo.
 *
 * Lo que estos tests protegen es la PRECEDENCIA (la eleccion pisa al dispositivo) y el hecho de
 * que la resolucion NO valida el par (idioma, region): "en-AR" se manda tal cual y es la API la
 * que decide que AR no es una variedad de ingles. Duplicar esa tabla aca seria garantia de que
 * las dos se desincronicen.
 */

let mockRegion: string | null = 'AR';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ regionCode: mockRegion }],
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  (globalThis as any).__AS_STORE__ = store;
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: async (k: string, v: string) => { store.set(k, v); },
      removeItem: async (k: string) => { store.delete(k); },
    },
  };
});

import { loadAccentPreferences, saveAccentPreference, ACCENT_OPTIONS } from '../accentPrefs';
import { getNarrationLocale, resolveNarrationLocale } from '../narrationLocale';

const PREF_KEY = 'cuentero_narration_accent';
const store = () => (globalThis as any).__AS_STORE__ as Map<string, string>;

beforeEach(() => {
  store().clear();
  mockRegion = 'AR';
});

describe('resolveNarrationLocale', () => {
  it('pega idioma y region', () => {
    expect(resolveNarrationLocale('es', 'AR')).toBe('es-AR');
  });

  it('normaliza la forma: idioma en minuscula, region en mayuscula', () => {
    expect(resolveNarrationLocale('ES', 'ar')).toBe('es-AR');
  });

  it('sin region devuelve el idioma pelado', () => {
    expect(resolveNarrationLocale('en', null)).toBe('en');
    expect(resolveNarrationLocale('en', undefined)).toBe('en');
  });

  // No es tarea de la app decidir si AR es una variedad de ingles: eso lo resuelve la API.
  it('no valida el par idioma/region: manda en-AR tal cual', () => {
    expect(resolveNarrationLocale('en', 'AR')).toBe('en-AR');
  });
});

describe('preferencia de acento', () => {
  it('sin preferencia usa la region del dispositivo', async () => {
    expect(await getNarrationLocale('es')).toBe('es-AR');
  });

  it('la preferencia guardada le gana a la region del dispositivo', async () => {
    await saveAccentPreference('es', 'MX');
    expect(await getNarrationLocale('es')).toBe('es-MX');
  });

  // El motivo de guardarla por idioma y no global.
  it('se guarda por idioma, sin pisarse entre si', async () => {
    await saveAccentPreference('es', 'AR');
    await saveAccentPreference('en', 'US');
    expect(await getNarrationLocale('es')).toBe('es-AR');
    expect(await getNarrationLocale('en')).toBe('en-US');
  });

  it('un idioma sin preferencia sigue cayendo al dispositivo', async () => {
    await saveAccentPreference('es', 'MX');
    expect(await getNarrationLocale('en')).toBe('en-AR');
  });

  it('null borra la eleccion y vuelve a automatico', async () => {
    await saveAccentPreference('es', 'MX');
    await saveAccentPreference('es', null);
    expect(await loadAccentPreferences()).toEqual({});
    expect(await getNarrationLocale('es')).toBe('es-AR');
  });

  it('sin region del dispositivo ni preferencia manda el idioma solo', async () => {
    mockRegion = null;
    expect(await getNarrationLocale('es')).toBe('es');
  });

  it('un JSON roto no deja al usuario sin narracion', async () => {
    store().set(PREF_KEY, '{no es json');
    expect(await loadAccentPreferences()).toEqual({});
    expect(await getNarrationLocale('es')).toBe('es-AR');
  });
});

describe('ACCENT_OPTIONS', () => {
  it('no ofrece variedades para japones', () => {
    expect(ACCENT_OPTIONS.ja).toEqual([]);
  });

  it('usa codigos de region ISO de dos letras', () => {
    for (const opciones of Object.values(ACCENT_OPTIONS)) {
      for (const { region } of opciones ?? []) {
        expect(region).toMatch(/^[A-Z]{2}$/);
      }
    }
  });

  it('no repite regiones dentro de un idioma', () => {
    for (const opciones of Object.values(ACCENT_OPTIONS)) {
      const regiones = (opciones ?? []).map((o) => o.region);
      expect(new Set(regiones).size).toBe(regiones.length);
    }
  });
});
