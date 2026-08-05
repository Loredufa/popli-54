/* eslint-disable import/first -- los `jest.mock` se hoistean: los imports van despues a proposito. */
/**
 * El token de sesion paso de AsyncStorage en claro a SecureStore.
 *
 * Estos tests existen por una sola razon: si la migracion perezosa falla, TODOS
 * los usuarios se desloguean al actualizar la app. Es el unico incidente que
 * este cambio puede provocar y no lo detecta ningun typecheck.
 *
 * Si alguno se rompe, revisar el cambio: no ajustar el test.
 */

const mockAsyncStore = new Map<string, string>();
const mockSecureStore = new Map<string, string>();

/** Para simular un dispositivo donde SecureStore no funciona. */
let mockSecureRompe = false;

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (k: string) => (mockAsyncStore.has(k) ? mockAsyncStore.get(k)! : null),
    setItem: async (k: string, v: string) => { mockAsyncStore.set(k, v); },
    removeItem: async (k: string) => { mockAsyncStore.delete(k); },
  },
}));

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  WHEN_UNLOCKED: 'whenUnlocked',
  getItemAsync: async (k: string) => {
    if (mockSecureRompe) throw new Error('keystore no disponible');
    return mockSecureStore.has(k) ? mockSecureStore.get(k)! : null;
  },
  setItemAsync: async (k: string, v: string) => {
    if (mockSecureRompe) throw new Error('keystore no disponible');
    mockSecureStore.set(k, v);
  },
  deleteItemAsync: async (k: string) => {
    if (mockSecureRompe) throw new Error('keystore no disponible');
    mockSecureStore.delete(k);
  },
}));

import { CLAVE_TOKEN, clearToken, getToken, setToken } from '../tokenStore';

beforeEach(() => {
  mockAsyncStore.clear();
  mockSecureStore.clear();
  mockSecureRompe = false;
});

describe('setToken', () => {
  it('guarda en SecureStore y no en AsyncStorage', async () => {
    await setToken('tok-123');
    expect(mockSecureStore.get(CLAVE_TOKEN)).toBe('tok-123');
    expect(mockAsyncStore.has(CLAVE_TOKEN)).toBe(false);
  });
});

describe('getToken - camino normal', () => {
  it('devuelve null si no hay token en ningun lado', async () => {
    expect(await getToken()).toBeNull();
  });

  it('lee el token de SecureStore', async () => {
    mockSecureStore.set(CLAVE_TOKEN, 'tok-abc');
    expect(await getToken()).toBe('tok-abc');
  });

  it('no toca AsyncStorage si ya esta en SecureStore', async () => {
    mockSecureStore.set(CLAVE_TOKEN, 'tok-nuevo');
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-viejo');

    expect(await getToken()).toBe('tok-nuevo');
    // El legado queda, pero SecureStore manda: no hay riesgo de revivir uno viejo.
    expect(mockAsyncStore.get(CLAVE_TOKEN)).toBe('tok-viejo');
  });
});

describe('getToken - migracion desde AsyncStorage', () => {
  // Este es EL caso: usuario que venia de la version anterior de la app.
  it('devuelve el token legado sin desloguear', async () => {
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-legado');
    expect(await getToken()).toBe('tok-legado');
  });

  it('lo promueve a SecureStore', async () => {
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-legado');
    await getToken();
    expect(mockSecureStore.get(CLAVE_TOKEN)).toBe('tok-legado');
  });

  it('borra el rastro de AsyncStorage una vez promovido', async () => {
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-legado');
    await getToken();
    expect(mockAsyncStore.has(CLAVE_TOKEN)).toBe(false);
  });

  it('la segunda llamada ya lee de SecureStore', async () => {
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-legado');
    await getToken();
    expect(await getToken()).toBe('tok-legado');
  });
});

describe('getToken - SecureStore no disponible', () => {
  it('devuelve el token legado igual en vez de desloguear', async () => {
    // Un dispositivo sin keystore no puede costarle la sesion al usuario.
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-legado');
    mockSecureRompe = true;

    expect(await getToken()).toBe('tok-legado');
  });

  it('no borra el legado si la promocion fallo', async () => {
    // Si se borrara antes de confirmar la escritura, el token se perderia.
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-legado');
    mockSecureRompe = true;

    await getToken();
    expect(mockAsyncStore.get(CLAVE_TOKEN)).toBe('tok-legado');
  });
});

describe('clearToken', () => {
  it('borra de los dos backends', async () => {
    mockSecureStore.set(CLAVE_TOKEN, 'tok-1');
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-2');

    await clearToken();

    expect(mockSecureStore.has(CLAVE_TOKEN)).toBe(false);
    expect(mockAsyncStore.has(CLAVE_TOKEN)).toBe(false);
  });

  it('deja getToken en null: no revive una sesion cerrada', async () => {
    // Si clearToken olvidara el legado, el proximo getToken lo "recuperaria".
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-viejo');
    await clearToken();
    expect(await getToken()).toBeNull();
  });

  it('no lanza si SecureStore falla', async () => {
    mockAsyncStore.set(CLAVE_TOKEN, 'tok-1');
    mockSecureRompe = true;
    await expect(clearToken()).resolves.toBeUndefined();
    expect(mockAsyncStore.has(CLAVE_TOKEN)).toBe(false);
  });
});

describe('ciclo completo', () => {
  it('guardar, leer y borrar', async () => {
    await setToken('tok-ciclo');
    expect(await getToken()).toBe('tok-ciclo');
    await clearToken();
    expect(await getToken()).toBeNull();
  });
});
