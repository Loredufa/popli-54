/* eslint-disable @typescript-eslint/no-require-imports -- `isolateModules` necesita require(). */
/**
 * La biblioteca guarda rutas RELATIVAS y las resuelve contra el `documentDirectory` vigente.
 *
 * El motivo: en iOS el path del contenedor lleva un UUID que el sistema regenera en cada
 * actualizacion de la app. Un indice con rutas absolutas apunta a la nada despues de un update
 * y la biblioteca se ve vacia, con los archivos intactos en la carpeta nueva.
 *
 * Estos tests simulan esa mudanza cargando el modulo dos veces con `documentDirectory` distinto.
 */

const DOC_A = 'file:///container-A/Documents/';
const DOC_B = 'file:///container-B/Documents/';

const LIBRARY_KEY = 'cuentero_library';
const LEGACY_MIGRATED_KEY = 'cuentero_library_migrated_v1';

// El store vive en globalThis: `jest.isolateModules` reinicia el registro de modulos, y si el
// estado fuera local al mock se perderia justo entre las dos cargas que estos tests comparan.
jest.mock('@react-native-async-storage/async-storage', () => {
  const g = globalThis as any;
  g.__AS_STORE__ = g.__AS_STORE__ || new Map<string, string>();
  const store: Map<string, string> = g.__AS_STORE__;
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: async (k: string, v: string) => { store.set(k, v); },
      removeItem: async (k: string) => { store.delete(k); },
    },
  };
});

jest.mock('expo-file-system/legacy', () => ({
  // Getter, no valor fijo: `ROOT` lo lee al evaluar el modulo, y cada carga simula un contenedor.
  get documentDirectory() { return (globalThis as any).__DOC_DIR__; },
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  getInfoAsync: async () => ({ exists: true }),
  makeDirectoryAsync: async () => {},
  writeAsStringAsync: async () => {},
  readAsStringAsync: async () => { throw new Error('sin archivo'); },
  copyAsync: async () => {},
  downloadAsync: async () => {},
  deleteAsync: async () => {},
}));

type LibraryModule = typeof import('../storyLibrary');

/** Carga el modulo como si la app corriera con ese `documentDirectory`. */
function loadLibrary(documentDirectory: string): LibraryModule {
  (globalThis as any).__DOC_DIR__ = documentDirectory;
  let mod: LibraryModule | undefined;
  jest.isolateModules(() => { mod = require('../storyLibrary'); });
  return mod!;
}

/** El store se crea a demanda: la factory del mock recien corre al primer `require`. */
function store(): Map<string, string> {
  const g = globalThis as any;
  g.__AS_STORE__ = g.__AS_STORE__ || new Map<string, string>();
  return g.__AS_STORE__;
}

/** Indice tal como lo escribian las versiones viejas: rutas absolutas, sin `folder`. */
const LEGACY_ENTRY = {
  id: '1730000000000',
  title: 'El dragon dormilon',
  slug: 'el-dragon-dormilon',
  dir: `${DOC_A}cuentos/el-dragon-dormilon-1730000000000/`,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  coverUri: `${DOC_A}cuentos/el-dragon-dormilon-1730000000000/ilustraciones/01-intro.png`,
  hasAudio: true,
  hasPdf: false,
};

const FOLDER = 'el-dragon-dormilon-1730000000000/';

beforeEach(() => {
  store().clear();
  // Sin esto, `migrateLegacyIndex` intenta importar el indice `cuentero_stories`.
  store().set(LEGACY_MIGRATED_KEY, '1');
});

describe('indice viejo con rutas absolutas', () => {
  beforeEach(() => {
    store().set(LIBRARY_KEY, JSON.stringify([LEGACY_ENTRY]));
  });

  it('sobrevive a un cambio de contenedor y reapunta al nuevo', async () => {
    const lib = loadLibrary(DOC_B);
    const [entry] = await lib.loadLibrary();

    expect(entry).toBeDefined();
    expect(entry.title).toBe('El dragon dormilon');
    expect(entry.folder).toBe(FOLDER);
    expect(entry.dir).toBe(`${DOC_B}cuentos/${FOLDER}`);
    expect(entry.coverFile).toBe('ilustraciones/01-intro.png');
    expect(entry.coverUri).toBe(`${DOC_B}cuentos/${FOLDER}ilustraciones/01-intro.png`);
  });

  it('no altera nada cuando el contenedor es el mismo (caso Android)', async () => {
    const lib = loadLibrary(DOC_A);
    const [entry] = await lib.loadLibrary();

    expect(entry.dir).toBe(LEGACY_ENTRY.dir);
    expect(entry.coverUri).toBe(LEGACY_ENTRY.coverUri);
  });

  it('conserva los metadatos de la entrada', async () => {
    const lib = loadLibrary(DOC_B);
    const [entry] = await lib.loadLibrary();

    expect(entry.id).toBe(LEGACY_ENTRY.id);
    expect(entry.slug).toBe(LEGACY_ENTRY.slug);
    expect(entry.createdAt).toBe(LEGACY_ENTRY.createdAt);
    expect(entry.hasAudio).toBe(true);
    expect(entry.hasPdf).toBe(false);
  });
});

describe('persistencia del indice', () => {
  it('nunca escribe rutas absolutas', async () => {
    store().set(LIBRARY_KEY, JSON.stringify([LEGACY_ENTRY]));
    const lib = loadLibrary(DOC_B);

    // Cualquier operacion que reescriba el indice deja la forma nueva.
    await lib.deleteStoryBundle('id-que-no-existe');

    const [stored] = JSON.parse(store().get(LIBRARY_KEY)!);
    expect(stored.folder).toBe(FOLDER);
    expect(stored.coverFile).toBe('ilustraciones/01-intro.png');
    expect(stored.dir).toBeUndefined();
    expect(stored.coverUri).toBeUndefined();
  });

  it('sobrevive un round-trip sin degradarse', async () => {
    store().set(LIBRARY_KEY, JSON.stringify([LEGACY_ENTRY]));
    const lib = loadLibrary(DOC_B);
    await lib.deleteStoryBundle('id-que-no-existe');

    const [entry] = await lib.loadLibrary();
    expect(entry.dir).toBe(`${DOC_B}cuentos/${FOLDER}`);
    expect(entry.coverUri).toBe(`${DOC_B}cuentos/${FOLDER}ilustraciones/01-intro.png`);
  });

  it('un indice ya migrado se mueve de contenedor otra vez sin problema', async () => {
    store().set(LIBRARY_KEY, JSON.stringify([{
      id: '1', title: 'Nuevo', slug: 'nuevo', folder: 'nuevo-1/',
      createdAt: 'x', updatedAt: 'x', coverFile: 'ilustraciones/01-intro.png',
      hasAudio: false, hasPdf: false,
    }]));

    const [entry] = await loadLibrary(DOC_B).loadLibrary();
    expect(entry.dir).toBe(`${DOC_B}cuentos/nuevo-1/`);
    expect(entry.coverUri).toBe(`${DOC_B}cuentos/nuevo-1/ilustraciones/01-intro.png`);
  });
});

describe('indices rotos', () => {
  it('descarta entradas sin carpeta derivable en vez de romper la pantalla', async () => {
    store().set(LIBRARY_KEY, JSON.stringify([
      { id: 'x', title: 'roto', slug: 'roto', hasAudio: false, hasPdf: false },
      LEGACY_ENTRY,
    ]));

    const entries = await loadLibrary(DOC_B).loadLibrary();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(LEGACY_ENTRY.id);
  });

  it('devuelve lista vacia si el JSON esta corrupto', async () => {
    store().set(LIBRARY_KEY, '{no es json');
    expect(await loadLibrary(DOC_B).loadLibrary()).toEqual([]);
  });

  it('tolera una entrada sin portada', async () => {
    store().set(LIBRARY_KEY, JSON.stringify([{ ...LEGACY_ENTRY, coverUri: null }]));
    const [entry] = await loadLibrary(DOC_B).loadLibrary();

    expect(entry.coverFile).toBeNull();
    expect(entry.coverUri).toBeNull();
    expect(entry.dir).toBe(`${DOC_B}cuentos/${FOLDER}`);
  });
});
