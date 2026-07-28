/* eslint-disable import/first -- los `jest.mock` se hoistean: los imports van despues a proposito. */
/**
 * Las voces grabadas viven en `documentDirectory/voices/` y su registro en AsyncStorage.
 *
 * Si la grabacion desaparece, la voz no sirve -clonar con ella falla al leer el audio de
 * referencia- pero seguia listada para siempre. `loadNamedVoices` ahora devuelve solo las
 * usables, SIN borrar el registro: un fallo transitorio no puede costarle a una familia una
 * grabacion que hizo a proposito.
 */

const mockExisting = new Set<string>();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  getInfoAsync: async (uri: string) => ({ exists: mockExisting.has(uri) }),
  makeDirectoryAsync: async () => {},
  copyAsync: async () => {},
  deleteAsync: async () => {},
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

import {
  loadNamedVoices,
  saveNamedVoice,
  deleteNamedVoice,
  VoiceLimitError,
  MAX_NAMED_VOICES,
  type NamedVoiceData,
} from '../voicePrefs';

const NAMED_VOICES_KEY = 'cuentero_named_voices';

const MAMA: NamedVoiceData = {
  id: '1', label: 'Mama', localUri: 'file:///docs/voices/voice-1.m4a', createdAt: 'x',
};
const PAPA: NamedVoiceData = {
  id: '2', label: 'Papa', localUri: 'file:///docs/voices/voice-2.m4a', createdAt: 'x',
};
/** Registrada, pero su archivo ya no esta. */
const ABUELA: NamedVoiceData = {
  id: '3', label: 'Abuela', localUri: 'file:///docs/voices/voice-3.m4a', createdAt: 'x',
};

function store(): Map<string, string> {
  return (globalThis as any).__AS_STORE__;
}

function seed(voices: NamedVoiceData[]) {
  store().set(NAMED_VOICES_KEY, JSON.stringify(voices));
}

function stored(): NamedVoiceData[] {
  return JSON.parse(store().get(NAMED_VOICES_KEY) ?? '[]');
}

beforeEach(() => {
  store().clear();
  mockExisting.clear();
  mockExisting.add(MAMA.localUri);
  mockExisting.add(PAPA.localUri);
  // ABUELA a proposito no: su grabacion se perdio.
});

describe('loadNamedVoices', () => {
  it('oculta las voces cuya grabacion ya no existe', async () => {
    seed([MAMA, ABUELA, PAPA]);
    const voces = await loadNamedVoices();
    expect(voces.map((v) => v.label)).toEqual(['Mama', 'Papa']);
  });

  it('NO borra el registro de la voz rota', async () => {
    seed([MAMA, ABUELA, PAPA]);
    await loadNamedVoices();
    expect(stored().map((v) => v.id)).toEqual(['1', '3', '2']);
  });

  it('la voz reaparece si el archivo vuelve a estar', async () => {
    seed([MAMA, ABUELA]);
    expect(await loadNamedVoices()).toHaveLength(1);

    mockExisting.add(ABUELA.localUri);
    expect((await loadNamedVoices()).map((v) => v.label)).toEqual(['Mama', 'Abuela']);
  });

  it('devuelve vacio sin registro o con JSON corrupto', async () => {
    expect(await loadNamedVoices()).toEqual([]);
    store().set(NAMED_VOICES_KEY, '{no es json');
    expect(await loadNamedVoices()).toEqual([]);
  });
});

describe('saveNamedVoice', () => {
  it('cuenta el tope sobre las voces usables, no sobre los registros', async () => {
    // 3 registros = tope alcanzado, pero una esta rota: tiene que dejar grabar.
    seed([MAMA, PAPA, ABUELA]);
    await expect(saveNamedVoice({ label: 'Tia', tempUri: 'file:///tmp/nueva.m4a' }))
      .resolves.toMatchObject({ label: 'Tia' });
  });

  it('guardar una voz nueva no borra el registro de la rota', async () => {
    seed([MAMA, PAPA, ABUELA]);
    await saveNamedVoice({ label: 'Tia', tempUri: 'file:///tmp/nueva.m4a' });

    expect(stored().map((v) => v.label)).toEqual(['Mama', 'Papa', 'Abuela', 'Tia']);
  });

  it('bloquea al llegar al tope de voces usables', async () => {
    const usables = Array.from({ length: MAX_NAMED_VOICES }, (_, i) => ({
      id: `u${i}`, label: `Voz ${i}`, localUri: `file:///docs/voices/u${i}.m4a`, createdAt: 'x',
    }));
    usables.forEach((v) => mockExisting.add(v.localUri));
    seed(usables);

    await expect(saveNamedVoice({ label: 'Extra', tempUri: 'file:///tmp/x.m4a' }))
      .rejects.toBeInstanceOf(VoiceLimitError);
  });
});

describe('deleteNamedVoice', () => {
  it('borra solo la pedida y conserva el resto, incluida la rota', async () => {
    seed([MAMA, ABUELA, PAPA]);
    await deleteNamedVoice('1');

    expect(stored().map((v) => v.id)).toEqual(['3', '2']);
  });
});
