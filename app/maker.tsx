// app/maker.tsx
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router, type Href } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, ScrollView, Share, Text, TextInput, View, Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../src/auth/AuthProvider';
import AppNavbar, { type NavbarMenuItem } from '../src/components/AppNavbar';
import { clearCurrentSession } from '../src/lib/storage';
import {
  DEFAULT_STORY_TITLE,
  ensureDir,
  extToMime,
  guessImageExtension,
  saveStoryBundle,
  slugify,
} from '../src/lib/storyLibrary';
import { sanitizeAudioMap, useStory } from '../src/story/StoryContext';
import { CardBox, GradientBG, THEME } from '../src/ui/theme';
import type {
  IllustrationSlot, IllustrationPlan, IllustrationResult,
  IllustrationApiScene, IllustrationApiPlan,
} from '../src/story/types';
import { sceneKeyForSlot } from '../src/story/types';
import { buildIllustrationPlan, splitStoryParagraphs } from '../src/story/plan';

const HOME_ROUTE = '/(tabs)/index' as Href;
const LOGIN_ROUTE = '/login' as Href;
import { buildMenuItems } from '../src/constants/menu';
import { useLanguage } from '../src/i18n/LanguageContext';




/* ------------- HABILIDADES ------------- */
const SKILLS = [
  'Identificar emociones', 'Tolerancia a la frustracion', 'Empatia', 'Pedir ayuda', 'Asertividad', 'Compartir/turnos', 'Gratitud', 'Perseverancia', 'Cooperacion', 'Escucha activa', 'Autocontrol', 'Resolucion de conflictos', 'Autoestima', 'Amabilidad', 'Mindfulness/respiracion', 'Regulacion del miedo', 'Gestion de celos', 'Adaptacion a cambios', 'Curiosidad segura', 'Cuidado del entorno',
];

/* ----- Edad ----- */
const AGE_OPTIONS = [
  { value: '2-5' as const, label: '2-5 anos' },
  { value: '6-10' as const, label: '6-10 anos' },
];

/* ---- Idioma del cuento ---- */
const STORY_LANGUAGE_OPTIONS = [
  { value: 'es' as const, label: 'Español' },
  { value: 'en' as const, label: 'English' },
  { value: 'pt' as const, label: 'Português' },
  { value: 'ja' as const, label: '日本語' },
];

/* ---- Categorías narrativas ---- */
type StoryCategory = 'disparatado' | 'literario' | 'rimas';
const CATEGORY_OPTIONS: { value: StoryCategory; tKey: string }[] = [
  { value: 'disparatado', tKey: 'category_disparatado' },
  { value: 'literario', tKey: 'category_literario' },
  { value: 'rimas', tKey: 'category_rimas' },
];

/* ---- Géneros (solo 6-10) ---- */
const GENRE_OPTIONS: { value: string; tKey: string }[] = [
  { value: 'misterio', tKey: 'genre_misterio' },
  { value: 'amor', tKey: 'genre_amor' },
  { value: 'terror', tKey: 'genre_terror' },
  { value: 'aventura', tKey: 'genre_aventura' },
  { value: 'ciencia_ficcion', tKey: 'genre_ciencia_ficcion' },
  { value: 'fantasia', tKey: 'genre_fantasia' },
];

/* ---------------- HELPERS ---------------- */
function extractJsonBlock(text: string) {
  const fence = /```json([\s\S]*?)```/i.exec(text);
  if (fence?.[1]) try { return JSON.parse(fence[1]); } catch { }
  const brace = text.match(/\{[\s\S]*\}$/m);
  if (brace) try { return JSON.parse(brace[0]); } catch { }
  return null;
}
function stripJsonBlock(text: string) {
  return text.replace(/```json[\s\S]*?```/gi, '').replace(/\{[\s\S]*\}$/m, '').trim();
}
const WEB_PROXY_PATH = ((Constants.expoConfig?.extra as any)?.WEB_PROXY_PATH as string) || '/proxy-api';
const API_EXTRA = (Constants.expoConfig?.extra as any) || {};

const WEB_PROXY_PORTS = ['19006', '19007', '19008'];

function shouldUseWebProxy() {
  if (Platform.OS !== 'web') return false;
  if (process?.env?.EXPO_PUBLIC_DISABLE_WEB_PROXY === '1') return false;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : undefined;
  const port = typeof window !== 'undefined' ? window.location.port : undefined;
  if (!hostname || !['localhost', '127.0.0.1', '::1'].includes(hostname)) return false;
  if (!port) return false;
  return WEB_PROXY_PORTS.includes(port);
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function resolveDirectRoot() {
  const apiBase = API_EXTRA.API_BASE_URL as string | undefined;
  if (!apiBase) throw new Error('Falta API_BASE_URL en app.json (expo.extra).');
  if (/^https?:/i.test(apiBase)) {
    const clean = apiBase.replace(/\/+$/, '');
    return /\/api(\/|$)/i.test(clean) ? clean.replace(/\/api.*$/i, '') : clean;
  }
  return apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
}

const DIRECT_ROOT = resolveDirectRoot();

function directUrl(path: string) {
  return `${DIRECT_ROOT}${normalizePath(path)}`;
}

function proxyUrl(path: string) {
  return `${WEB_PROXY_PATH}${normalizePath(path)}`;
}

type FetchJSONOptions = {
  allowProxy?: boolean;
};

async function fetchJSON<T>(path: string, body: any, opts: FetchJSONOptions = {}): Promise<T> {
  const attempts: Array<{ url: string; retryOnNotFound: boolean }> = [];
  if (opts.allowProxy && shouldUseWebProxy()) {
    attempts.push({ url: proxyUrl(path), retryOnNotFound: true });
  }
  attempts.push({ url: directUrl(path), retryOnNotFound: false });

  let lastErr: any = null;
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        let msg = `API ${res.status}`;
        if (ct.includes('application/json')) {
          const d = await res.json().catch(() => ({} as any));
          if ((d as any)?.error) msg += `: ${(d as any).error}`;
        }
        const error: any = new Error(msg);
        error.code = res.status;
        throw error;
      }
      return (await res.json()) as T;
    } catch (err: any) {
      lastErr = err;
      const shouldRetry = attempt.retryOnNotFound && (err?.code === 404 || err?.message?.includes('404'));
      if (!shouldRetry) break;
    }
  }
  throw lastErr ?? new Error('No se pudo contactar con la API');
}

async function callBackend(payload: any): Promise<string> {
  const { content } = await fetchJSON<{ content?: string }>('/api/story', payload, { allowProxy: true });
  return (content || '').trim();
}
async function callIllustrations(payload: {
  age_range: '2-5' | '6-10'; theme: string; skill: string; characters?: string; tone?: string; locale?: string; story?: string;
  beats?: Array<{ slot: IllustrationSlot; label: string; excerpt: string; order: number }>;
  count?: number;
  scene_index?: IllustrationApiScene;
  plan?: IllustrationApiPlan;
  synopsis?: string;
}): Promise<{ images: string[]; plan: IllustrationApiPlan | null; synopsis: string | null }> {
  const { images, plan, synopsis } = await fetchJSON<{ images?: string[]; plan?: IllustrationApiPlan | null; synopsis?: string | null }>('/api/illustrate', {
    ...payload,
    num_images: payload.count ?? 3,
  }, { allowProxy: true });
  return { images: Array.isArray(images) ? images : [], plan: plan ?? null, synopsis: synopsis ?? null };
}


function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toImprenta(text: string) {
  return (text || '').toLocaleUpperCase('es-ES');
}

const BRAND_SUFFIX = 'by PopliLandia';

const ILLUSTRATION_DIR =
  (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + 'illustrations/';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_ENCODING =
  (FileSystem as any)?.EncodingType?.Base64 ?? 'base64';

function bytesToBase64(bytes: Uint8Array) {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    const hasB2 = i + 1 < bytes.length;
    const hasB3 = i + 2 < bytes.length;
    const triplet = (b1 << 16) | ((hasB2 ? b2 : 0) << 8) | (hasB3 ? b3 : 0);
    const enc1 = (triplet >> 18) & 0x3f;
    const enc2 = (triplet >> 12) & 0x3f;
    const enc3 = (triplet >> 6) & 0x3f;
    const enc4 = triplet & 0x3f;
    output += BASE64_CHARS[enc1];
    output += BASE64_CHARS[enc2];
    output += hasB2 ? BASE64_CHARS[enc3] : '=';
    output += hasB3 ? BASE64_CHARS[enc4] : '=';
  }
  return output;
}

async function readFileAsDataUri(path: string, mime: string) {
  const base64 = await FileSystem.readAsStringAsync(path, {
    encoding: BASE64_ENCODING as FileSystem.EncodingType,
  });
  return `data:${mime};base64,${base64}`;
}

async function fetchAsBase64(uri: string) {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

async function remoteUriToDataUri(uri: string, mime: string, slot: IllustrationSlot, idx: number) {
  if (FileSystem.documentDirectory || FileSystem.cacheDirectory) {
    const ext = guessImageExtension(uri);
    const tempFile = `${ILLUSTRATION_DIR}${slugify(`${slot}`)}-pdf-${Date.now()}-${idx}.${ext}`;
    await ensureDir(ILLUSTRATION_DIR);
    await FileSystem.downloadAsync(uri, tempFile);
    try {
      return await readFileAsDataUri(tempFile, mime);
    } finally {
      await FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(() => { });
    }
  }

  const base64 = await fetchAsBase64(uri);
  return `data:${mime};base64,${base64}`;
}

async function ensureDataUri(uri: string, slot: IllustrationSlot, idx: number) {
  if (uri.startsWith('data:')) return uri;
  const ext = guessImageExtension(uri);
  const mime = extToMime(ext);
  if (uri.startsWith('file://')) {
    return readFileAsDataUri(uri, mime);
  }
  if (/^https?:/i.test(uri)) {
    return remoteUriToDataUri(uri, mime, slot, idx);
  }
  return uri;
}

async function persistIllustrationAsset(uri: string, slot: IllustrationSlot, index: number) {
  if (!FileSystem.documentDirectory && !FileSystem.cacheDirectory) return uri;
  await ensureDir(ILLUSTRATION_DIR);
  const ext = guessImageExtension(uri);
  const fileName = `${slugify(slot)}-${Date.now()}-${index}.${ext}`;
  const targetUri = `${ILLUSTRATION_DIR}${fileName}`;

  if (uri.startsWith('data:image/')) {
    const base64 = uri.split(',')[1] ?? '';
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: BASE64_ENCODING as FileSystem.EncodingType,
    });
    return targetUri;
  }

  try {
    await FileSystem.downloadAsync(uri, targetUri);
    return targetUri;
  } catch {
    return uri;
  }
}

function mergeIllustrationResult(
  prev: IllustrationResult[],
  plan: IllustrationPlan[],
  slot: IllustrationSlot,
  uri: string | null,
): IllustrationResult[] {
  const bySlot = new Map(prev.map((item) => [item.slot, item] as const));
  const scene = plan.find((s) => s.slot === slot);
  if (scene) bySlot.set(slot, { ...scene, uri });
  return plan.map((s) => bySlot.get(s.slot) ?? { ...s, uri: null });
}

/* --------------- UI PRIMITIVES --------------- */
const Chip: React.FC<{ label: string; selected?: boolean; onPress?: () => void }> = ({ label, selected, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({
    opacity: pressed ? 0.7 : 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1,
    borderColor: selected ? THEME.primary : THEME.border, backgroundColor: selected ? 'rgba(90,160,255,0.15)' : 'transparent',
    marginRight: 8, marginBottom: 8,
  })}>
    <Text style={{ color: selected ? THEME.accent : THEME.textDim, fontSize: 13 }}>{label}</Text>
  </Pressable>
);
const PrimaryButton: React.FC<{ label: string; icon?: keyof typeof Feather.glyphMap; disabled?: boolean; onPress?: () => void }> =
  ({ label, icon = 'moon', disabled, onPress }) => (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => ({
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: disabled ? '#2a3d63' : THEME.primary,
      paddingVertical: 14, borderRadius: 14, shadowColor: THEME.primary, shadowOpacity: pressed ? 0.15 : 0.35, shadowOffset: { width: 0, height: 8 }, shadowRadius: 14,
    })}>
      <Feather name={icon} size={18} color="#0b1226" style={{ marginRight: 8 }} />
      <Text style={{ color: '#0b1226', fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );

/* -------------------- SCREEN -------------------- */
export default function MakerScreen() {
  const { user, logout, loading: authLoading } = useAuth();
  const { t, appLocale } = useLanguage();
  const menuItems = buildMenuItems(t);
  const {
    storyText, setStoryText, meta, setMeta, theme, setTheme,
    illustrationPlan, setIllustrationPlan, illustrations, setIllustrations,
    audioMap, setAudioMap, musicTrackId, savedId, setSavedId, clearStory,
  } = useStory();
  const [ageRange, setAgeRange] = React.useState<'2-5' | '6-10' | ''>('');
  const [skill, setSkill] = React.useState('');
  const [characters, setCharacters] = React.useState('');
  const [locale] = React.useState<'es-AR' | 'es-LATAM'>('es-LATAM');
  const [minutes, setMinutes] = React.useState(4);
  const [storyLanguage, setStoryLanguage] = React.useState<'es' | 'en' | 'pt' | 'ja'>('es');
  const [category, setCategory] = React.useState<StoryCategory | ''>('');
  const [genre, setGenre] = React.useState('');
  const hasOverriddenStoryLanguage = React.useRef(false);

  const [loading, setLoading] = React.useState(false);
  const [illustrationLoading, setIllustrationLoading] = React.useState<Record<IllustrationSlot, boolean>>({
    intro: false, conflict: false, resolution: false,
  });
  // Derivado (no state propio) para que el botón "Ilustrar" no se reactive hasta que las 3 escenas terminen.
  const imgLoading = illustrationLoading.intro || illustrationLoading.conflict || illustrationLoading.resolution;
  const speakingRef = React.useRef(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [savingStory, setSavingStory] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace(LOGIN_ROUTE);
    }
  }, [authLoading, user]);

  // Sync story language with app locale unless user has overridden it manually
  React.useEffect(() => {
    if (!hasOverriddenStoryLanguage.current) {
      setStoryLanguage(appLocale as 'es' | 'en' | 'pt' | 'ja');
    }
  }, [appLocale]);

  // Reset genre when switching to 2-5 age group
  React.useEffect(() => {
    if (ageRange !== '6-10') setGenre('');
  }, [ageRange]);

  const greetingName = React.useMemo(() => {
    if (!user) return '';
    const base = (user.first_name || user.email || '').trim();
    if (!base) return '';
    return base.split(' ')[0];
  }, [user]);

  const canGenerate = !!ageRange && !!theme && !!skill && !loading;

  const skillsContent = React.useMemo(() => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', paddingRight: 8 }}>
        {SKILLS.map((s) => (<Chip key={s} label={s} selected={skill === s} onPress={() => setSkill(s)} />))}
      </View>
    </ScrollView>
  ), [skill]);

  const storyParagraphs = React.useMemo(() => splitStoryParagraphs(storyText), [storyText]);

  const paragraphs = React.useMemo(() => {
    if (!storyText.trim()) return [] as string[];
    return storyParagraphs.length ? storyParagraphs : [storyText.trim()];
  }, [storyParagraphs, storyText]);

  const planWithResults = React.useMemo(() => {
    if (!storyText) return [] as IllustrationResult[];
    const basePlan = illustrationPlan.length ? illustrationPlan : buildIllustrationPlan(storyText);
    const bySlot = new Map(illustrations.map((item) => [item.slot, item]));
    return basePlan.map((item) => bySlot.get(item.slot) ?? { ...item, uri: null });
  }, [storyText, illustrationPlan, illustrations]);

  const groupedIllustrations = React.useMemo(() => {
    const groups = new Map<number, { before: IllustrationResult[]; after: IllustrationResult[] }>();
    planWithResults.forEach((item) => {
      const bucket = item.placement === 'before' ? 'before' : 'after';
      const entry = groups.get(item.paragraphIndex) ?? { before: [], after: [] };
      entry[bucket].push(item);
      groups.set(item.paragraphIndex, entry);
    });
    return groups;
  }, [planWithResults]);

  const hasIllustrations = React.useMemo(
    () => planWithResults.some((item) => Boolean(item.uri)),
    [planWithResults],
  );
  const imagesForPdf = React.useMemo(
    () => planWithResults.map((item) => item.uri).filter(Boolean) as string[],
    [planWithResults],
  );

  const illustrateButtonLabel = React.useMemo(() => {
    if (imgLoading) return 'Ilustrando...';
    return hasIllustrations ? t.btn_reillustrate : t.btn_illustrate;
  }, [imgLoading, hasIllustrations, t]);

  const renderIllustrationItem = (item: IllustrationResult, key: string) => {
    if (!item.uri) {
      const isSceneLoading = illustrationLoading[item.slot];
      return (
        <View key={key} style={{ marginVertical: 12 }}>
          <View style={{ borderWidth: 1, borderColor: THEME.border, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: 'rgba(11,18,38,0.3)' }}>
            {isSceneLoading ? (
              <ActivityIndicator color={THEME.accent} style={{ marginBottom: 8 }} />
            ) : (
              <Feather name='image' size={24} color={THEME.accent} style={{ marginBottom: 8 }} />
            )}
            <Text style={{ color: THEME.textDim, textAlign: 'center' }}>
              {isSceneLoading ? 'Generando ilustracion...' : `Ilustracion pendiente: ${item.label}`}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View key={key} style={{ marginVertical: 12 }}>
        <Image
          source={{ uri: item.uri }}
          style={{
            width: '100%',
            height: undefined,
            aspectRatio: 3 / 4,
            maxHeight: 420,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: THEME.border,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
          resizeMode='contain'
        />
      </View>
    );
  };

  const createStoryHtml = React.useCallback(async () => {
    const baseTitle = theme?.trim() || DEFAULT_STORY_TITLE;
    const displayTitle = `${baseTitle} ${BRAND_SUFFIX}`;
    const displayTitleUpper = toImprenta(displayTitle);
    const escapedDisplayTitle = escapeHtml(displayTitleUpper);

    const imagesForSections: Array<{ dataUri: string; label: string } | null> = [];
    for (const [idx, item] of planWithResults.entries()) {
      if (!item.uri) {
        imagesForSections.push(null);
        continue;
      }
      try {
        const dataUri = await ensureDataUri(item.uri, item.slot, idx);
        imagesForSections.push({ dataUri, label: `${escapeHtml(item.label)}-${idx + 1}` });
      } catch (imageErr) {
        console.warn('No se pudo incluir ilustracion en PDF', item.uri, imageErr);
        imagesForSections.push(null);
      }
    }

    const paragraphSource = paragraphs.length ? paragraphs : (storyText ? [storyText.trim()] : []);
    const paragraphBlocks = paragraphSource
      .map((block) => `<p class="paragraph">${escapeHtml(toImprenta(block))}</p>`);

    // Stars: golden-angle distribution for uniform coverage
    const makeStarsSvg = (count: number) => {
      const circles = Array.from({ length: count }, (_, i) => {
        const cx = ((i * 137.508) % 100).toFixed(1);
        const cy = ((i * 73.137) % 100).toFixed(1);
        const r  = [0.7, 1, 1.2, 1.5, 0.8][i % 5];
        const op = [0.35, 0.55, 0.7, 0.85, 0.5, 0.65][i % 6];
        const fill = i % 8 === 0 ? '#9fd2ff' : i % 5 === 0 ? '#c8e8ff' : 'white';
        return `<circle cx="${cx}%" cy="${cy}%" r="${r}" fill="${fill}" opacity="${op}"/>`;
      }).join('');
      return `<div class="stars"><svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${circles}</svg></div>`;
    };
    const STARS = makeStarsSvg(55);

    const CSS = `
    @page { size: A4; margin: 15mm 18mm; }
    * { box-sizing: border-box; }
    body { font-family: "Arial Rounded MT Bold", "Trebuchet MS", "Comic Sans MS", sans-serif;
           background: #0e1630; color: #e7eefc; margin: 0; padding: 0;
           -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; min-height: 227mm;
            display: flex; flex-direction: column; padding: 0;
            position: relative; overflow: hidden;
            background: linear-gradient(160deg, #0e1630 0%, #162040 55%, #0a1220 100%);
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .stars { position: absolute; inset: 0; width: 100%; height: 100%;
             pointer-events: none; z-index: 0; }
    .glow { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
            filter: blur(40px); -webkit-filter: blur(40px); }
    .glow-center { width: 280px; height: 280px; top: 30%; left: 50%;
                   transform: translate(-50%, -50%);
                   background: radial-gradient(circle, rgba(90,160,255,0.18) 0%, transparent 70%); }
    .glow-bottom { width: 200px; height: 160px; bottom: 10%; right: 15%;
                   background: radial-gradient(circle, rgba(90,160,255,0.1) 0%, transparent 70%); }
    .page-inner { position: relative; z-index: 1; display: flex; flex-direction: column;
                  flex: 1; min-height: 227mm; padding: 0; }
    .cover { align-items: center; text-align: center; padding: 22mm 12mm 16mm; gap: 8mm; }
    .cover-title { font-size: 38px; font-weight: 900; letter-spacing: 2px;
                   text-transform: uppercase; color: #e7eefc; line-height: 1.2;
                   margin: 0 0 8px 0;
                   text-shadow: 0 0 24px rgba(90,160,255,0.6), 0 2px 8px rgba(0,0,0,0.9); }
    .cover-brand { font-size: 15px; font-weight: 700; letter-spacing: 4px;
                   text-transform: uppercase; color: #9fd2ff; margin: 0; }
    .cover-image { max-width: 260px; margin: 10mm auto 0; border-radius: 16px; overflow: hidden;
                   border: 2px solid rgba(90,160,255,0.45);
                   box-shadow: 0 0 24px rgba(90,160,255,0.25); }
    .cover-image img { width: 100%; height: auto; display: block; border-radius: 14px; }
    .story-page .page-inner { justify-content: flex-start; }
    .image-wrap { width: 100%; border-radius: 16px; overflow: hidden; margin-bottom: 8mm;
                  border: 2px solid rgba(90,160,255,0.3);
                  box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .image-wrap img { width: 100%; height: auto; display: block; }
    .image-wrap-bottom { margin-bottom: 0; margin-top: 8mm; }
    .text-block { flex: 1; }
    .paragraph { font-size: 26px; font-weight: 800; letter-spacing: 1.5px;
                 line-height: 1.65; text-transform: uppercase; margin: 0 0 10px 0;
                 color: #e7eefc;
                 text-shadow: 0 1px 6px rgba(0,0,0,0.7); }
    .page-num { font-size: 13px; font-weight: 700; letter-spacing: 3px;
                text-transform: uppercase; color: #9fd2ff; text-align: center;
                margin-top: auto; padding-top: 6mm; }
    `;

    const pages: string[] = [];

    // Portada
    const coverImg = imagesForSections[0];
    pages.push(`
      <div class="page cover">
        ${STARS}
        <div class="glow glow-center"></div>
        <div class="glow glow-bottom"></div>
        <div class="page-inner cover">
          <p class="cover-title">${escapedDisplayTitle}</p>
          <p class="cover-brand">✦ POPLI ✦</p>
          ${coverImg ? `<div class="cover-image"><img src="${coverImg.dataUri}" alt="portada" /></div>` : ''}
        </div>
      </div>
    `);

    if (!paragraphBlocks.length) {
      pages.push(`
        <div class="page story-page">
          ${STARS}
          <div class="page-inner"><p class="paragraph">CUENTO SIN CONTENIDO.</p></div>
        </div>
      `);
    } else {
      const totalSections = 3;
      const totalParagraphs = paragraphBlocks.length;
      const baseCount = Math.floor(totalParagraphs / totalSections);
      const remainder = totalParagraphs % totalSections;
      let cursor = 0;

      for (let i = 0; i < totalSections; i += 1) {
        const take = baseCount + (i < remainder ? 1 : 0);
        const slice = paragraphBlocks.slice(cursor, cursor + take);
        cursor += take;
        const textHtml = slice.length ? slice.join('\n') : '';
        const img = imagesForSections[i];
        const imageOnTop = i !== 1;
        const imageBlock = img
          ? `<div class="image-wrap${imageOnTop ? '' : ' image-wrap-bottom'}"><img src="${img.dataUri}" alt="${img.label}" /></div>`
          : '';
        pages.push(`
          <div class="page story-page">
            ${STARS}
            <div class="glow glow-bottom"></div>
            <div class="page-inner">
              ${imageOnTop ? imageBlock : ''}
              <div class="text-block">${textHtml}</div>
              ${!imageOnTop ? imageBlock : ''}
              <div class="page-num">${i + 1}</div>
            </div>
          </div>
        `);
      }
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapedDisplayTitle}</title>
  <style>${CSS}</style>
</head>
<body>
  ${pages.join('\n')}
</body>
</html>`;
  }, [paragraphs, planWithResults, theme, meta, storyText]);

  const exportStoryPdf = React.useCallback(async () => {
    if (!storyText?.trim()) throw new Error('No hay cuento para exportar.');
    setExportingPdf(true);
    const html = await createStoryHtml();

    // Web: abrir ventana con el HTML y lanzar imprimir (expo-print ignora el HTML en web)
    if (Platform.OS === 'web') {
      const opened = typeof window !== 'undefined' ? window.open('', '_blank') : null;
      if (!opened) {
        setExportingPdf(false);
        throw new Error('Permite pop-ups para poder generar el PDF.');
      }
      opened.document.write(html);
      opened.document.close();
      opened.focus();
      setTimeout(() => opened.print(), 300);
      setExportingPdf(false);
      return null;
    }

    if (typeof Print.printToFileAsync !== 'function') {
      setExportingPdf(false);
      throw new Error('Generar PDF no esta disponible en esta plataforma.');
    }

    let tempUri: string | undefined;
    try {
      const result = await Print.printToFileAsync({ html });
      tempUri = result?.uri;
    } catch (printErr) {
      setExportingPdf(false);
      throw printErr;
    }

    if (!tempUri) {
      setExportingPdf(false);
      throw new Error('No se pudo generar el archivo PDF.');
    }

    const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
    if (!baseDir) {
      setExportingPdf(false);
      return tempUri;
    }
    const baseTitle = theme?.trim() || DEFAULT_STORY_TITLE;
    const displayTitle = `${baseTitle} ${BRAND_SUFFIX}`;
    const fileName = `${slugify(displayTitle)}-${Date.now()}.pdf`;
    const targetUri = `${baseDir}${fileName}`;
    await FileSystem.moveAsync({ from: tempUri, to: targetUri });
    setExportingPdf(false);
    return targetUri;
  }, [createStoryHtml, storyText, theme]);

  const handleLogout = React.useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await clearCurrentSession();
      clearStory();
      await logout();
      router.replace(LOGIN_ROUTE);
    } catch (e: any) {
      Alert.alert('Error al cerrar sesion', e?.message || 'Intentalo de nuevo.');
    } finally {
      setLoggingOut(false);
    }
  }, [logout, loggingOut, clearStory]);

  const handleShare = React.useCallback(async () => {
    if (!storyText || exportingPdf) return;
    try {
      const pdfUri = await exportStoryPdf();
      const baseTitle = theme?.trim() || DEFAULT_STORY_TITLE;
      const dialogTitle = `${baseTitle} ${BRAND_SUFFIX}`;
      const shareMessage = `${dialogTitle}\n\n${storyText}`;
      if (Platform.OS === 'web' || !pdfUri) {
        Alert.alert('Abre el PDF', 'Se abrio la opcion del navegador para guardar/imprimir tu cuento en PDF.');
        return;
      }
      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle,
        });
      } else {
        await Share.share({ message: shareMessage });
      }
    } catch (e: any) {
      Alert.alert('No se pudo compartir', e?.message || 'Error desconocido');
    }
  }, [storyText, exportStoryPdf, hasIllustrations, theme, exportingPdf]);

  // Guardar = armar la carpeta del cuento en la biblioteca (texto, ilustraciones, PDF, musica y
  // narracion ya generada). Compartir es otra cosa y vive en handleShare: antes este boton hacia
  // las dos, y el indice que escribia no lo leia ninguna pantalla.
  const saveStory = React.useCallback(async () => {
    if (!storyText || exportingPdf || savingStory) return;
    if (Platform.OS === 'web') {
      try {
        await exportStoryPdf();
        Alert.alert('Descarga tu PDF', 'Usa la opcion "Guardar como PDF" que abrio el navegador.');
      } catch (err: any) {
        Alert.alert('Ups', err?.message || 'No se pudo guardar el cuento.');
      }
      return;
    }
    setSavingStory(true);
    try {
      const entry = await saveStoryBundle({
        existingId: savedId,
        title: theme?.trim() || DEFAULT_STORY_TITLE,
        story: storyText,
        meta,
        illustrations: illustrations.map((item) => ({
          slot: item.slot,
          label: item.label,
          uri: item.uri ?? null,
        })),
        audioMap: sanitizeAudioMap(audioMap),
        musicTrackId,
        exportPdf: exportStoryPdf,
      });
      setSavedId(entry.id);
      Alert.alert(
        'Cuento guardado',
        entry.hasAudio
          ? 'Ya esta en "Cuentos guardados", listo para volver a escucharlo.'
          : 'Ya esta en "Cuentos guardados". Todavia no tiene narracion: generala en "Musica y narrador" y volve a guardar.',
      );
    } catch (err: any) {
      console.warn('saveStory failed', err);
      const message = err?.message || 'No se pudo guardar el cuento.';
      if (typeof message === 'string' && message.toLowerCase().includes('sqlite_full')) {
        Alert.alert('Sin espacio', 'Tu biblioteca esta llena. Borra cuentos guardados o libera espacio en el dispositivo.');
      } else {
        Alert.alert('Ups', message);
      }
    } finally {
      setSavingStory(false);
    }
  }, [storyText, exportingPdf, savingStory, meta, illustrations, audioMap, musicTrackId, savedId, setSavedId, exportStoryPdf, theme]);

  const onGenerate = React.useCallback(async () => {
    setLoading(true);
    setExportingPdf(false);
    setStoryText('');
    setMeta(null);
    setIllustrationPlan([]);
    setIllustrations([]);
    setAudioMap({});
    // Cuento nuevo => entrada nueva en la biblioteca, no una actualizacion de la anterior.
    setSavedId(null);
    try {
      const payload = {
        age_range: ageRange,
        theme,
        skill,
        characters: characters || 'protagonista sin nombre y un amigo imaginario',
        locale,
        reading_time_minutes: minutes,
        story_language: storyLanguage,
        category: category || undefined,
        genre: ageRange === '6-10' && genre ? genre : undefined,
      };
      const content = await callBackend(payload);
      const metaJson = extractJsonBlock(content);
      const storyOnly = stripJsonBlock(content);
      setStoryText(storyOnly);
      setMeta(metaJson);
      const plan = buildIllustrationPlan(storyOnly);
      setIllustrationPlan(plan);
    } catch (e: any) {
      Alert.alert('No se pudo generar', e?.message || 'Error desconocido');
    } finally { setLoading(false); }
  }, [ageRange, theme, skill, characters, locale, minutes, storyLanguage, category, genre, setSavedId]);

  const onIllustrate = React.useCallback(async () => {
    if (!storyText) { Alert.alert(t.alert_missing_story_title, t.alert_missing_story_msg); return; }
    const plan = illustrationPlan.length ? illustrationPlan : buildIllustrationPlan(storyText);
    setIllustrationPlan(plan);
    const effectiveTheme = theme || 'cuento infantil';

    const requestSceneImage = async (
      scene: IllustrationPlan,
      index: number,
      sharedPlan?: IllustrationApiPlan,
      sharedSynopsis?: string,
    ) => {
      const sceneContext = [
        `Escena ${index + 1}: ${scene.label}.`,
        `Fragmento clave: ${scene.excerpt}`,
        'Manten los mismos personajes y estilo a lo largo de las ilustraciones.',
        'Ilustra solamente esta escena en una unica imagen (sin paneles ni collage).',
      ].join(' ');

      const { images, plan: returnedPlan, synopsis: returnedSynopsis } = await callIllustrations({
        age_range: (ageRange || '2-5') as '2-5' | '6-10',
        theme: effectiveTheme,
        skill: skill || 'empatia',
        characters,
        locale,
        story: `${sceneContext}

Resumen del cuento:
${storyText.slice(0, 900)}`,
        count: 1,
        scene_index: sceneKeyForSlot(scene.slot),
        plan: sharedPlan,
        synopsis: sharedSynopsis,
      });

      let finalUri: string | null = images[0] ?? null;
      if (finalUri) {
        try {
          finalUri = await persistIllustrationAsset(finalUri, scene.slot, index);
        } catch {
          // conservar el uri original si falla la persistencia local
        }
      }
      return { uri: finalUri, plan: returnedPlan, synopsis: returnedSynopsis };
    };

    const introScene = plan.find((s) => s.slot === 'intro');
    const middleScene = plan.find((s) => s.slot === 'conflict');
    const endScene = plan.find((s) => s.slot === 'resolution');
    if (!introScene || !middleScene || !endScene) {
      Alert.alert('No se pudieron generar imagenes', 'El plan de ilustraciones esta incompleto.');
      return;
    }

    setIllustrationLoading({ intro: true, conflict: true, resolution: true });
    try {
      // Llamada 1 (escena intro): sin plan compartido -> el backend lo genera y lo devuelve. El botón
      // "Ilustrar" (derivado de illustrationLoading) sigue deshabilitado hasta que las 3 escenas terminen,
      // para evitar que un doble tap dispare una segunda tanda de llamadas en paralelo con la primera.
      const first = await requestSceneImage(introScene, 0, undefined);
      setIllustrations((prev) => mergeIllustrationResult(prev, plan, 'intro', first.uri));
      setIllustrationLoading((prev) => ({ ...prev, intro: false }));
      if (!first.uri) {
        throw new Error('No se pudo generar la primera escena.');
      }

      const sharedPlan = first.plan ?? undefined;
      const sharedSynopsis = first.synopsis ?? undefined;

      // Llamadas 2 y 3, en paralelo entre si, reutilizando el plan y la sinopsis de la llamada 1 para
      // consistencia de personaje (y para no pagar 2 llamadas extra a OpenAI de pura sinopsis repetida).
      // allSettled (no all) para que si una falla, la otra igual se muestre en vez de perderse.
      const [middleResult, endResult] = await Promise.allSettled([
        requestSceneImage(middleScene, 1, sharedPlan, sharedSynopsis),
        requestSceneImage(endScene, 2, sharedPlan, sharedSynopsis),
      ]);

      if (middleResult.status === 'fulfilled') {
        setIllustrations((prev) => mergeIllustrationResult(prev, plan, 'conflict', middleResult.value.uri));
      }
      if (endResult.status === 'fulfilled') {
        setIllustrations((prev) => mergeIllustrationResult(prev, plan, 'resolution', endResult.value.uri));
      }

      const failedCount = [middleResult, endResult].filter((r) => r.status === 'rejected').length;
      if (failedCount > 0) {
        Alert.alert('Algunas ilustraciones fallaron', `No se pudieron generar ${failedCount} de 3 escenas. Toca "Reilustrar" para reintentar.`);
      }
    } catch (e: any) {
      Alert.alert('No se pudieron generar imagenes', e?.message || 'Error');
    } finally {
      setIllustrationLoading({ intro: false, conflict: false, resolution: false });
    }
  }, [storyText, ageRange, theme, skill, characters, locale, illustrationPlan]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBG>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
          <AppNavbar
            name={greetingName || undefined}
            menuItems={menuItems}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />

          <CardBox title={t.maker_customization_title}>
            {/* Age range */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {AGE_OPTIONS.map(({ value }) => (
                <Chip
                  key={value}
                  label={value === '2-5' ? t.age_2_5 : t.age_6_10}
                  selected={ageRange === value}
                  onPress={() => setAgeRange(value)}
                />
              ))}
            </View>

            {/* Genre — only for 6-10 */}
            {ageRange === '6-10' && (
              <>
                <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{t.maker_genre_label}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', paddingRight: 8 }}>
                    {GENRE_OPTIONS.map(({ value, tKey }) => (
                      <Chip
                        key={value}
                        label={(t as any)[tKey] || value}
                        selected={genre === value}
                        onPress={() => setGenre(genre === value ? '' : value)}
                      />
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{t.maker_central_theme_label}</Text>
            <TextInput placeholder={t.maker_central_theme_placeholder} placeholderTextColor="#8fa0c2" value={theme} onChangeText={setTheme} style={{ color: THEME.text, borderColor: THEME.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }} />

            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{t.maker_skill_label}</Text>
            {skillsContent}

            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{t.maker_characters_label}</Text>
            <TextInput placeholder={t.maker_characters_placeholder} placeholderTextColor="#8fa0c2" value={characters} onChangeText={setCharacters} style={{ color: THEME.text, borderColor: THEME.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }} />

            {/* Narrative category */}
            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{t.maker_category_label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', paddingRight: 8 }}>
                {CATEGORY_OPTIONS.map(({ value, tKey }) => (
                  <Chip
                    key={value}
                    label={(t as any)[tKey] || value}
                    selected={category === value}
                    onPress={() => setCategory(category === value ? '' : value)}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: THEME.textDim }}>{t.maker_duration_label}: {minutes} min</Text>
              <View style={{ flexDirection: 'row' }}>
                <Pressable onPress={() => setMinutes(m => Math.max(2, m - 1))} style={{ marginRight: 8 }}>
                  <Feather name="minus-circle" size={22} color={THEME.accent} />
                </Pressable>
                <Pressable onPress={() => setMinutes(m => Math.min(10, m + 1))}>
                  <Feather name="plus-circle" size={22} color={THEME.accent} />
                </Pressable>
              </View>
            </View>

            {/* Story language selector */}
            <Text style={{ color: THEME.textDim, marginTop: 12, marginBottom: 6 }}>{t.maker_story_language_label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', paddingRight: 8 }}>
                {STORY_LANGUAGE_OPTIONS.map(({ value, label }) => (
                  <Chip
                    key={value}
                    label={label}
                    selected={storyLanguage === value}
                    onPress={() => {
                      hasOverriddenStoryLanguage.current = true;
                      setStoryLanguage(value);
                    }}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={{ height: 12 }} />
            <PrimaryButton label={loading ? t.btn_generating : t.btn_generate} icon="moon" disabled={!canGenerate} onPress={onGenerate} />
          </CardBox>

          <View style={{ height: 16 }} />
          <CardBox title={t.maker_your_story_title}>
            {loading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color={THEME.accent} size="large" />
                <Text style={{ color: THEME.textDim, marginTop: 12 }}>{t.story_generating_message}</Text>
              </View>
            ) : storyText ? (
              <>
                <View style={{ marginBottom: 16 }}>
                  <PrimaryButton
                    label={illustrateButtonLabel}
                    icon="image"
                    disabled={imgLoading || !storyText}
                    onPress={onIllustrate}
                  />
                  {planWithResults.length > 0 && !hasIllustrations && !imgLoading ? (
                    <Text style={{ color: THEME.textDim, marginTop: 8, fontSize: 12 }}>
                      Toca "Ilustrar cuento" para generar tres escenas clave.
                    </Text>
                  ) : null}
                </View>

                <View>
                  {paragraphs.map((paragraph, index) => {
                    const group = groupedIllustrations.get(index);
                    const beforeItems = group?.before ?? [];
                    const afterItems = group?.after ?? [];
                    const before = beforeItems.filter((item) => illustrationLoading[item.slot] || Boolean(item.uri));
                    const after = afterItems.filter((item) => illustrationLoading[item.slot] || Boolean(item.uri));
                    return (
                      <View key={`story-paragraph-${index}`} style={{ marginBottom: 12 }}>
                        {before.map((item, idx) => renderIllustrationItem(item, `before-${index}-${idx}`))}
                        <View style={{ paddingHorizontal: 10 }}>
                          <Text style={{ color: THEME.text, lineHeight: 22 }}>{paragraph}</Text>
                        </View>
                        {after.map((item, idx) => renderIllustrationItem(item, `after-${index}-${idx}`))}
                      </View>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    <Pressable
                      onPress={saveStory}
                      disabled={exportingPdf || savingStory}
                      style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18, opacity: exportingPdf || savingStory ? 0.5 : 1 }}
                    >
                      {exportingPdf || savingStory ? (
                        <ActivityIndicator size="small" color={THEME.accent} />
                      ) : (
                        <Feather name="folder-plus" size={20} color={THEME.accent} />
                      )}
                      <Text style={{ color: THEME.accent, marginLeft: 6 }}>
                        {exportingPdf ? t.btn_generating_pdf : savingStory ? 'Guardando...' : 'Guardar cuento completo'}
                      </Text>
                    </Pressable>
                    <Pressable onPress={handleShare} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18, opacity: exportingPdf ? 0.5 : 1 }}>
                      <Feather name="share-2" size={20} color={THEME.accent} />
                      <Text style={{ color: THEME.accent, marginLeft: 6 }}>{exportingPdf ? '...' : t.btn_share}</Text>
                    </Pressable>
                    <Pressable onPress={() => router.push('/story-audio')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="music" size={20} color={THEME.accent} />
                      <Text style={{ color: THEME.accent, marginLeft: 6 }}>Música y narrador</Text>
                    </Pressable>
                  </View>
                </View>

                {meta && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: THEME.textDim, fontSize: 12 }}>
                      Meta: edad {meta.age_range} anos - habilidad {meta.skill}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={{ color: THEME.textDim }}>
                {t.story_empty_placeholder}
              </Text>
            )}
          </CardBox>

          <View style={{ height: 56 }} />
        </ScrollView>
      </GradientBG>
    </GestureHandlerRootView>
  );
}
