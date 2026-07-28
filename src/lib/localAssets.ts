// src/lib/localAssets.ts
//
// Chequeo de archivos locales antes de usarlos.
//
// Regla del proyecto: una URI guardada en AsyncStorage NO es garantia de que el archivo siga
// existiendo. Hay dos formas de perderlo, y las dos pasan en produccion:
//
//   - `cacheDirectory`: Android lo purga cuando le falta espacio, y tambien al actualizar la app.
//   - `documentDirectory`: sobrevive en Android, pero en iOS el path del contenedor lleva un UUID
//     que el sistema regenera en cada actualizacion.
//
// Si no se valida, expo-av tira `FileNotFoundException (ENOENT)` y `<Image>` queda en blanco.
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** `true` si la URI se puede abrir ahora mismo. Las remotas y `data:` se dan por buenas. */
export async function localAssetExists(uri?: string | null): Promise<boolean> {
  if (!uri || !uri.trim()) return false;
  // Las blob: URI de web mueren al recargar la pagina.
  if (uri.startsWith('blob:')) return false;
  if (Platform.OS === 'web') return true;
  // Remotas o data URI: no hay archivo local que chequear.
  if (!uri.startsWith('file:')) return true;
  const info = await FileSystem.getInfoAsync(uri).catch(() => null);
  return info?.exists === true;
}

/** Devuelve el mapa sin las entradas cuyo archivo ya no esta en disco. */
export async function pruneMissingAssets(
  map: Record<string, string>,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(map).map(async ([key, uri]) =>
      (await localAssetExists(uri)) ? ([key, uri] as const) : null,
    ),
  );
  const alive: Record<string, string> = {};
  entries.forEach((entry) => { if (entry) alive[entry[0]] = entry[1]; });
  return alive;
}

/**
 * Reemplaza por `null` las URIs que ya no existen, CONSERVANDO las posiciones: las ilustraciones
 * se corresponden por indice con las escenas del plan, asi que compactar el array las correria
 * de escena.
 */
export async function nullifyMissingAssets(
  uris: (string | null | undefined)[],
): Promise<(string | null)[]> {
  return Promise.all(
    uris.map(async (uri) => ((await localAssetExists(uri)) ? (uri as string) : null)),
  );
}
