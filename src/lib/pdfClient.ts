import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Buffer } from 'buffer';
import { apiUrl } from './api';

export async function downloadStoryPdfToGallery(opts: {
  storyText: string;
  title?: string;
  images?: string[];
}): Promise<{ fileUri: string; assetUri: string }> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permiso de galeria denegado');

  const res = await fetch(apiUrl('/api/story/pdf'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      story_text: opts.storyText,
      title: opts.title,
      images: opts.images,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'No se pudo generar el PDF');
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const base64 = buffer.toString('base64');
  const fileUri = `${FileSystem.documentDirectory}cuento-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  const assetUri = await MediaLibrary.saveToLibraryAsync(fileUri);
  return { fileUri, assetUri };
}
