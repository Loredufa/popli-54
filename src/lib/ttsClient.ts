import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { apiUrl } from './api';

const DEFAULT_TIMEOUT_MS = 45000;
// El backend puede esperar hasta ~210s (90s de wait inicial + 120s de polling,
// ver RUNPOD_POLL_BUDGET_MS en poplicuentos-api/lib/tts.ts) antes de darse por
// vencido con RunPod. Este timeout tiene que ser mayor a eso, si no la app
// aborta la conexión antes de que el backend termine de esperar su propia respuesta.
const CUSTOM_VOICE_TIMEOUT_MS = 240000;
const BASE64_ENCODING =
  (FileSystem as any)?.EncodingType?.Base64 ?? 'base64';

function extFromFormat(format: string | null): { ext: string; mime: string } {
  if (format === 'wav') return { ext: 'wav', mime: 'audio/wav' };
  return { ext: 'mp3', mime: 'audio/mpeg' };
}

async function readReferenceAudioB64(uri?: string | null): Promise<string | undefined> {
  if (!uri) return undefined;
  return FileSystem.readAsStringAsync(uri, { encoding: BASE64_ENCODING as FileSystem.EncodingType });
}

async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export type VoiceOption = {
  id: string;
  label: string;
  description: string;
  idealFor: string;
  timbre: string;
  sample_text?: string;
};

export async function fetchVoices(): Promise<VoiceOption[]> {
  const res = await fetch(apiUrl('/api/tts/voices'));
  if (!res.ok) {
    throw new Error(`No se pudieron cargar las voces (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data.voices) ? (data.voices as VoiceOption[]) : [];
}

export async function fetchVoicePreview(voiceId: string, locale = 'es-LATAM'): Promise<string> {
  console.log('[TTS] preview start', { voiceId, locale });
  const res = await fetchWithTimeout(apiUrl('/api/tts/preview'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_id: voiceId, locale }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `No se pudo generar la muestra de voz (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const base64 = buffer.toString('base64');
  if (Platform.OS === 'web') {
    const dataUri = `data:audio/mpeg;base64,${base64}`;
    console.log('[TTS] preview ready (web data uri)');
    return dataUri;
  }
  const fileUri = `${FileSystem.cacheDirectory}voice-preview-${voiceId}.mp3`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: BASE64_ENCODING as FileSystem.EncodingType });
  console.log('[TTS] preview ready', fileUri);
  return fileUri;
}

export type NarrationResult = { fileUri: string; assetUri: string };

export async function fetchNarrationTemp(opts: {
  storyText: string;
  voiceId: string;
  locale?: string;
  referenceAudioUri?: string | null;
}): Promise<string> {
  console.log('[TTS] narrate start', { len: opts.storyText?.length, voiceId: opts.voiceId, locale: opts.locale });
  const referenceAudioB64 = await readReferenceAudioB64(opts.referenceAudioUri);
  const timeout = referenceAudioB64 ? CUSTOM_VOICE_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const res = await fetchWithTimeout(apiUrl('/api/tts/narrate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      story_text: opts.storyText,
      voice_id: opts.voiceId,
      locale: opts.locale || 'es-LATAM',
      reference_audio_b64: referenceAudioB64,
    }),
  }, timeout);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `No se pudo generar la narracion (${res.status})`);
  }
  const { ext, mime } = extFromFormat(res.headers.get('X-TTS-Format'));
  const buffer = Buffer.from(await res.arrayBuffer());
  const base64 = buffer.toString('base64');
  if (Platform.OS === 'web') {
    const dataUri = `data:${mime};base64,${base64}`;
    console.log('[TTS] narrate ready (web data uri)');
    return dataUri;
  }
  const fileUri = `${FileSystem.cacheDirectory}narracion-temp-${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: BASE64_ENCODING as FileSystem.EncodingType });
  console.log('[TTS] narrate ready', fileUri);
  return fileUri;
}

export async function downloadNarrationToGallery(opts: {
  storyText: string;
  voiceId: string;
  locale?: string;
  referenceAudioUri?: string | null;
}): Promise<NarrationResult> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permiso de galeria denegado');

  const referenceAudioB64 = await readReferenceAudioB64(opts.referenceAudioUri);
  const timeout = referenceAudioB64 ? CUSTOM_VOICE_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const res = await fetchWithTimeout(apiUrl('/api/tts/narrate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      story_text: opts.storyText,
      voice_id: opts.voiceId,
      locale: opts.locale || 'es-LATAM',
      reference_audio_b64: referenceAudioB64,
    }),
  }, timeout);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'No se pudo generar la narracion');
  }
  const { ext } = extFromFormat(res.headers.get('X-TTS-Format'));
  const buffer = Buffer.from(await res.arrayBuffer());
  const base64 = buffer.toString('base64');
  const fileUri = `${FileSystem.documentDirectory}narracion-${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: BASE64_ENCODING as FileSystem.EncodingType });
  const assetUri = await MediaLibrary.saveToLibraryAsync(fileUri);
  return { fileUri, assetUri };
}
