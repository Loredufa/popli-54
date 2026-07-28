/* eslint-disable import/first -- los `jest.mock` se hoistean: los imports van despues a proposito. */
/**
 * Una URI guardada en AsyncStorage NO garantiza que el archivo siga existiendo:
 *
 *   - `cacheDirectory`: Android lo purga cuando le falta espacio, y al actualizar la app.
 *   - `documentDirectory`: en iOS el path del contenedor cambia en cada actualizacion.
 *
 * Sin estos chequeos, expo-av tira `FileNotFoundException (ENOENT)` -el bug de "no se puede
 * volver a reproducir el cuento"- y `<Image>` queda en blanco sin ofrecer regenerar nada.
 */

const mockExisting = new Set<string>();
/** Simula un `getInfoAsync` que falla (permisos, storage desmontado). */
const mockFailure = { on: false };

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  getInfoAsync: async (uri: string) => {
    if (mockFailure.on) throw new Error('permiso denegado');
    return { exists: mockExisting.has(uri) };
  },
}));

import { Platform } from 'react-native';
import { localAssetExists, pruneMissingAssets, nullifyMissingAssets } from '../localAssets';

const PRESENTE = 'file:///cache/narracion-temp-111.wav';
const PURGADO = 'file:///cache/narracion-temp-222.wav';
const OTRO_PRESENTE = 'file:///docs/illustrations/intro.png';

beforeEach(() => {
  mockExisting.clear();
  mockExisting.add(PRESENTE);
  mockExisting.add(OTRO_PRESENTE);
  mockFailure.on = false;
});

describe('localAssetExists', () => {
  it('corre sobre una plataforma nativa (si no, estos casos no prueban nada)', () => {
    expect(Platform.OS).not.toBe('web');
  });

  it('acepta un archivo que sigue en disco', async () => {
    await expect(localAssetExists(PRESENTE)).resolves.toBe(true);
  });

  it('rechaza un archivo que el sistema purgo del cache', async () => {
    await expect(localAssetExists(PURGADO)).resolves.toBe(false);
  });

  it('rechaza vacios, null y undefined', async () => {
    await expect(localAssetExists('')).resolves.toBe(false);
    await expect(localAssetExists('   ')).resolves.toBe(false);
    await expect(localAssetExists(null)).resolves.toBe(false);
    await expect(localAssetExists(undefined)).resolves.toBe(false);
  });

  it('rechaza blob:, que muere al recargar la pagina en web', async () => {
    await expect(localAssetExists('blob:http://localhost/abc')).resolves.toBe(false);
  });

  it('acepta remotas y data URI sin tocar el disco', async () => {
    await expect(localAssetExists('https://cdn.ejemplo.com/a.mp3')).resolves.toBe(true);
    await expect(localAssetExists('data:audio/mpeg;base64,AAAA')).resolves.toBe(true);
  });

  it('trata un getInfoAsync que explota como archivo ausente', async () => {
    mockFailure.on = true;
    await expect(localAssetExists(PRESENTE)).resolves.toBe(false);
  });
});

describe('pruneMissingAssets', () => {
  it('conserva solo las entradas cuyo archivo sigue existiendo', async () => {
    const limpio = await pruneMissingAssets({ shimmer: PRESENTE, 'custom:1': PURGADO });
    expect(limpio).toEqual({ shimmer: PRESENTE });
  });

  it('devuelve el mapa intacto si no falta nada', async () => {
    const entrada = { shimmer: PRESENTE, otra: OTRO_PRESENTE };
    await expect(pruneMissingAssets(entrada)).resolves.toEqual(entrada);
  });

  it('devuelve vacio si se purgo todo', async () => {
    await expect(pruneMissingAssets({ shimmer: PURGADO })).resolves.toEqual({});
  });

  it('tolera un mapa vacio', async () => {
    await expect(pruneMissingAssets({})).resolves.toEqual({});
  });
});

describe('nullifyMissingAssets', () => {
  it('anula las faltantes SIN correr de posicion a las demas', async () => {
    // Las ilustraciones se corresponden por indice con las escenas del plan: compactar el
    // array pondria la imagen del final en la escena de la mitad.
    const resultado = await nullifyMissingAssets([PURGADO, OTRO_PRESENTE, PURGADO, PRESENTE]);
    expect(resultado).toEqual([null, OTRO_PRESENTE, null, PRESENTE]);
  });

  it('conserva el largo del array', async () => {
    const resultado = await nullifyMissingAssets([PURGADO, PURGADO, PURGADO]);
    expect(resultado).toEqual([null, null, null]);
  });

  it('tolera huecos ya nulos', async () => {
    await expect(nullifyMissingAssets([null, PRESENTE, undefined]))
      .resolves.toEqual([null, PRESENTE, null]);
  });

  it('tolera un array vacio', async () => {
    await expect(nullifyMissingAssets([])).resolves.toEqual([]);
  });
});
