// src/lib/storyLibrary.ts
//
// Biblioteca de cuentos guardados. Un cuento guardado es UNA carpeta con todo adentro:
//
//   documentDirectory/cuentos/<slug>-<id>/
//     cuento.json                 manifiesto
//     cuento.txt                  texto plano
//     cuento.pdf                  libro con imagenes grandes
//     ilustraciones/01-<slot>.png
//     narracion/<voz>.mp3         solo las voces que ya tenian audio generado
//
// Todo vive en el almacenamiento privado de la app: ningun dato del cuento sale del dispositivo.
//
// Este modulo es la UNICA fuente de verdad de la biblioteca. Antes la logica de guardado vivia
// dentro de app/maker.tsx, escribia en `cuentero_stories` con un esquema que contradecia al de
// src/lib/storage.ts, y ninguna pantalla la leia.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { IllustrationSlot } from '../story/types';

const LIBRARY_KEY = 'cuentero_library';
const LEGACY_INDEX_KEY = 'cuentero_stories';
const LEGACY_MIGRATED_KEY = 'cuentero_library_migrated_v1';

export const MAX_STORIES_SAVED = 10;
export const DEFAULT_STORY_TITLE = 'Tu cuento';

const ROOT = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + 'cuentos/';

const BASE64_ENCODING = (FileSystem as any)?.EncodingType?.Base64 ?? 'base64';

/* ------------------------------- tipos ------------------------------- */

export type SavedIllustration = { slot: IllustrationSlot; label: string; file: string };
export type SavedNarration = { voiceId: string; label: string; file: string };

/** Contenido de `cuento.json`. Los campos `file` son relativos a la carpeta del cuento. */
export type StoryManifest = {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  story: string;
  meta?: any;
  illustrations: SavedIllustration[];
  audio: SavedNarration[];
  musicTrackId?: string;
  pdfFile?: string | null;
};

/** Entrada del indice en AsyncStorage: lo justo para pintar la lista sin abrir cada carpeta. */
export type SavedStoryEntry = {
  id: string;
  title: string;
  slug: string;
  dir: string;
  createdAt: string;
  updatedAt: string;
  coverUri?: string | null;
  hasAudio: boolean;
  hasPdf: boolean;
  metaSummary?: { age_range?: string; skill?: string; tone?: string };
};

/** Cuento guardado ya resuelto a URIs absolutas, listo para reproducir. */
export type LoadedStory = {
  entry: SavedStoryEntry;
  manifest: StoryManifest;
  illustrationUris: { slot: IllustrationSlot; label: string; uri: string }[];
  audioUris: { voiceId: string; label: string; uri: string }[];
  pdfUri: string | null;
};

export type SaveStoryInput = {
  /** Si viene, se actualiza esa entrada en vez de crear una nueva. */
  existingId?: string | null;
  title: string;
  story: string;
  meta?: any;
  illustrations: { slot: IllustrationSlot; label: string; uri?: string | null }[];
  /** `voiceId -> uri`. Solo se guarda lo que ya existe; nunca se genera audio nuevo aca. */
  audioMap: Record<string, string>;
  voiceLabels?: Record<string, string>;
  musicTrackId?: string;
  /** Se llama para producir el PDF. Si falla o devuelve null, el cuento se guarda igual. */
  exportPdf?: () => Promise<string | null>;
};

/* ------------------------------ helpers ------------------------------ */

// Marcas diacriticas combinantes (las que deja NFD al separar acentos).
const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

export function slugify(value: string) {
  const basic = (value || '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return basic || 'cuento';
}

export async function ensureDir(path: string) {
  if (!path) return;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export function guessImageExtension(uri: string) {
  if (/\.png($|\?)/i.test(uri)) return 'png';
  if (/\.jpe?g($|\?)/i.test(uri)) return 'jpg';
  if (/\.webp($|\?)/i.test(uri)) return 'webp';
  if (/^data:image\/png/i.test(uri)) return 'png';
  if (/^data:image\/jpe?g/i.test(uri)) return 'jpg';
  if (/^data:image\/webp/i.test(uri)) return 'webp';
  return 'png';
}

export function extToMime(ext: string) {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'png':
    default:
      return 'image/png';
  }
}

export async function deleteFileQuiet(uri?: string | null) {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // el archivo puede no existir, o ser un asset de galeria que no nos pertenece
  }
}

/** Copia un asset (remoto, `data:` o `file://`) dentro de la carpeta del cuento. */
async function copyAssetInto(dir: string, fileName: string, sourceUri: string): Promise<string | null> {
  const target = `${dir}${fileName}`;
  try {
    if (sourceUri.startsWith('data:')) {
      const base64 = sourceUri.split(',')[1] ?? '';
      await FileSystem.writeAsStringAsync(target, base64, {
        encoding: BASE64_ENCODING as FileSystem.EncodingType,
      });
      return fileName;
    }
    if (/^https?:/i.test(sourceUri)) {
      await FileSystem.downloadAsync(sourceUri, target);
      return fileName;
    }
    await FileSystem.copyAsync({ from: sourceUri, to: target });
    return fileName;
  } catch {
    return null;
  }
}

function audioExtension(uri: string) {
  return uri.toLowerCase().includes('.wav') ? 'wav' : 'mp3';
}

/* ------------------------------- indice ------------------------------ */

async function readIndex(): Promise<SavedStoryEntry[]> {
  const raw = await AsyncStorage.getItem(LIBRARY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedStoryEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(entries: SavedStoryEntry[]) {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
}

async function readManifest(dir: string): Promise<StoryManifest | null> {
  try {
    const raw = await FileSystem.readAsStringAsync(`${dir}cuento.json`);
    return JSON.parse(raw) as StoryManifest;
  } catch {
    return null;
  }
}

/** Lista los cuentos guardados, mas recientes primero. Corre la migracion una sola vez. */
export async function loadLibrary(): Promise<SavedStoryEntry[]> {
  await migrateLegacyIndex();
  return readIndex();
}

export async function loadStoryBundle(id: string): Promise<LoadedStory | null> {
  const entries = await readIndex();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return null;
  const manifest = await readManifest(entry.dir);
  if (!manifest) return null;
  return {
    entry,
    manifest,
    illustrationUris: (manifest.illustrations || []).map((item) => ({
      slot: item.slot,
      label: item.label,
      uri: `${entry.dir}${item.file}`,
    })),
    audioUris: (manifest.audio || []).map((item) => ({
      voiceId: item.voiceId,
      label: item.label,
      uri: `${entry.dir}${item.file}`,
    })),
    pdfUri: manifest.pdfFile ? `${entry.dir}${manifest.pdfFile}` : null,
  };
}

export async function deleteStoryBundle(id: string): Promise<void> {
  const entries = await readIndex();
  const entry = entries.find((e) => e.id === id);
  await writeIndex(entries.filter((e) => e.id !== id));
  if (entry?.dir) {
    await deleteFileQuiet(entry.dir);
  }
}

/* ------------------------------ guardado ----------------------------- */

/**
 * Arma (o actualiza) la carpeta del cuento y devuelve su entrada de biblioteca.
 *
 * Importante: el audio se COPIA, no se referencia. `audioMap` puede apuntar a `cacheDirectory`
 * -que el SO desaloja- o a un asset de galeria que el usuario puede borrar; si guardaramos la
 * URI, el cuento "guardado" dejaria de sonar sin aviso.
 */
export async function saveStoryBundle(input: SaveStoryInput): Promise<SavedStoryEntry> {
  if (!ROOT) throw new Error('Este dispositivo no permite guardar archivos.');

  const entries = await readIndex();
  const previous = input.existingId ? entries.find((e) => e.id === input.existingId) ?? null : null;

  const title = input.title?.trim() || DEFAULT_STORY_TITLE;
  const id = previous?.id ?? String(Date.now());
  const slug = previous?.slug ?? slugify(title);
  const dir = previous?.dir ?? `${ROOT}${slug}-${id}/`;
  const createdAt = previous?.createdAt ?? new Date().toISOString();
  const updatedAt = new Date().toISOString();

  // El PDF sobrevive entre guardados: solo lo produce /maker, asi que si volvemos a guardar
  // desde /story-audio (que no exporta PDF) hay que conservar el que ya estaba.
  const previousManifest = previous ? await readManifest(dir) : null;

  await ensureDir(dir);
  const illustrationsDir = `${dir}ilustraciones/`;
  const narrationDir = `${dir}narracion/`;
  // Estas dos carpetas se regeneran enteras en cada guardado, para no dejar ilustraciones ni
  // narraciones viejas colgadas cuando el contenido del cuento cambio.
  await deleteFileQuiet(illustrationsDir);
  await deleteFileQuiet(narrationDir);
  await ensureDir(illustrationsDir);
  await ensureDir(narrationDir);

  try {
    await FileSystem.writeAsStringAsync(`${dir}cuento.txt`, input.story ?? '');

    const illustrations: SavedIllustration[] = [];
    for (let i = 0; i < input.illustrations.length; i += 1) {
      const item = input.illustrations[i];
      if (!item.uri) continue;
      const ext = guessImageExtension(item.uri);
      const name = `${String(i + 1).padStart(2, '0')}-${slugify(item.slot)}.${ext}`;
      const written = await copyAssetInto(illustrationsDir, name, item.uri);
      if (written) {
        illustrations.push({ slot: item.slot, label: item.label, file: `ilustraciones/${written}` });
      }
    }

    const audio: SavedNarration[] = [];
    for (const [voiceId, uri] of Object.entries(input.audioMap || {})) {
      if (!uri || uri.startsWith('blob:')) continue;
      const name = `${slugify(voiceId)}.${audioExtension(uri)}`;
      const written = await copyAssetInto(narrationDir, name, uri);
      if (written) {
        audio.push({ voiceId, label: input.voiceLabels?.[voiceId] || voiceId, file: `narracion/${written}` });
      }
    }

    // El PDF es un extra: si el export falla, el cuento igual queda guardado y reproducible.
    let pdfFile: string | null = previousManifest?.pdfFile ?? null;
    if (input.exportPdf) {
      try {
        const pdfUri = await input.exportPdf();
        if (pdfUri) {
          pdfFile = await copyAssetInto(dir, 'cuento.pdf', pdfUri);
          await deleteFileQuiet(pdfUri);
        }
      } catch {
        // nos quedamos con el PDF anterior, si habia
      }
    }
    if (pdfFile && !(await FileSystem.getInfoAsync(`${dir}${pdfFile}`)).exists) {
      pdfFile = null;
    }

    const manifest: StoryManifest = {
      id,
      title,
      slug,
      createdAt,
      updatedAt,
      story: input.story ?? '',
      meta: input.meta ?? undefined,
      illustrations,
      audio,
      musicTrackId: input.musicTrackId,
      pdfFile,
    };
    await FileSystem.writeAsStringAsync(`${dir}cuento.json`, JSON.stringify(manifest));

    const entry: SavedStoryEntry = {
      id,
      title,
      slug,
      dir,
      createdAt,
      updatedAt,
      coverUri: illustrations.length ? `${dir}${illustrations[0].file}` : null,
      hasAudio: audio.length > 0,
      hasPdf: Boolean(pdfFile),
      metaSummary: input.meta
        ? { age_range: input.meta?.age_range, skill: input.meta?.skill, tone: input.meta?.tone }
        : undefined,
    };

    const next = [entry, ...entries.filter((e) => e.id !== id)];
    while (next.length > MAX_STORIES_SAVED) {
      const removed = next.pop();
      if (removed?.dir) await deleteFileQuiet(removed.dir);
    }
    await writeIndex(next);

    return entry;
  } catch (err) {
    // Si era un cuento nuevo, no dejamos una carpeta a medio armar. Si estabamos actualizando
    // uno ya guardado, la dejamos: el manifiesto viejo sigue siendo mejor que nada.
    if (!previous) await deleteFileQuiet(dir);
    throw err;
  }
}

/* ----------------------------- migracion ----------------------------- */

/**
 * Importa best-effort lo que habia en `cuentero_stories` (indice que ninguna pantalla llegaba a
 * mostrar). Las entradas viejas no tienen carpeta propia, asi que armamos una copiando los
 * archivos que sigan existiendo. Cualquier fallo se ignora: es data que hoy el usuario no ve.
 */
export async function migrateLegacyIndex(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(LEGACY_MIGRATED_KEY)) return;
    await AsyncStorage.setItem(LEGACY_MIGRATED_KEY, '1');

    const raw = await AsyncStorage.getItem(LEGACY_INDEX_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return;

    for (const item of parsed.slice(0, MAX_STORIES_SAVED)) {
      try {
        let story = typeof item?.story === 'string' ? item.story : '';
        let meta = item?.meta;
        let illustrations: { slot: IllustrationSlot; label: string; uri?: string | null }[] = [];

        if (typeof item?.metadataUri === 'string' && item.metadataUri) {
          const metaRaw = await FileSystem.readAsStringAsync(item.metadataUri);
          const parsedMeta = JSON.parse(metaRaw);
          story = typeof parsedMeta?.story === 'string' ? parsedMeta.story : story;
          meta = parsedMeta?.meta ?? meta;
          if (Array.isArray(parsedMeta?.illustrations)) {
            illustrations = parsedMeta.illustrations.map((ill: any) => ({
              slot: (ill?.slot ?? 'intro') as IllustrationSlot,
              label: typeof ill?.label === 'string' ? ill.label : '',
              uri: ill?.uri ?? null,
            }));
          }
        } else if (Array.isArray(item?.illustrations)) {
          illustrations = item.illustrations.map((ill: any) => ({
            slot: (ill?.slot ?? 'intro') as IllustrationSlot,
            label: typeof ill?.label === 'string' ? ill.label : '',
            uri: ill?.uri ?? null,
          }));
        }

        if (!story.trim()) continue;

        const legacyPdf = typeof item?.fileUri === 'string' ? item.fileUri : null;
        await saveStoryBundle({
          title: typeof item?.title === 'string' ? item.title : DEFAULT_STORY_TITLE,
          story,
          meta,
          illustrations,
          audioMap: {},
          exportPdf: legacyPdf ? async () => legacyPdf : undefined,
        });
      } catch {
        // seguimos con el resto
      }
    }
  } catch {
    // la migracion nunca puede romper el arranque de la biblioteca
  }
}
