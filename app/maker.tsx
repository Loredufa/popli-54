// app/maker.tsx
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
    ActivityIndicator, Alert, Image, Pressable, ScrollView, Share, Text, TextInput, View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../src/auth/AuthProvider';
import AppNavbar, { type NavbarMenuItem } from '../src/components/AppNavbar';
import StoryReader from '../src/components/StoryReader';

/* ---------------- THEME ---------------- */
const THEME = {
  bgTop: '#0e1630',
  bgBottom: '#1b2a4a',
  card: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.12)',
  text: '#e7eefc',
  textDim: '#b5c3e6',
  primary: '#5aa0ff',
  accent: '#9fd2ff',
};

const HOME_ROUTE = '/(tabs)/index' as Href;
const LOGIN_ROUTE = '/login' as Href;
const MENU_ITEMS: NavbarMenuItem[] = [
  { label: 'Inicio', icon: 'home', href: HOME_ROUTE, replace: true },
  { label: 'Explorar', icon: 'compass', href: '/(tabs)/explore' as Href },
  { label: 'Generador', icon: 'edit-3', href: '/maker' as Href, replace: true },
  { label: 'Ayuda', icon: 'help-circle', href: '/modal' as Href },
  { label: 'Cerrar sesion', icon: 'log-out', action: 'logout' },
];

/* ------------- HABILIDADES ------------- */
const SKILLS = [
  'Identificar emociones','Tolerancia a la frustracion','Empatia','Pedir ayuda','Asertividad','Compartir/turnos','Gratitud','Perseverancia','Cooperacion','Escucha activa','Autocontrol','Resolucion de conflictos','Autoestima','Amabilidad','Mindfulness/respiracion','Regulacion del miedo','Gestion de celos','Adaptacion a cambios','Curiosidad segura','Cuidado del entorno',
];

/* ----- Edad ----- */
const AGE_OPTIONS = [
  { value: '2-5' as const, label: '2-5 anos' },
  { value: '6-10' as const, label: '6-10 anos' },
];

/* ---- Semillas filosoficas (solo 6-10) ---- */
const PHILO_SEEDS = [
  'amistad y justicia','verdad vs opinion','responsabilidad y consecuencias','identidad y cambio','perspectivas multiples','reglas y acuerdos','bien comun',
];
function themeWithPhilosophy(theme: string, age: '2-5' | '6-10') {
  if (age !== '6-10') return theme;
  return `${theme}. Integra de forma sutil semillas filosoficas apropiadas para 6-10: ${PHILO_SEEDS.join(', ')}. Usa metaforas, micro-dilemas amables y 1-2 preguntas abiertas de un mentor; evita sermonear y no menciones la palabra "filosofia".`;
}

/* ---------------- HELPERS ---------------- */
function extractJsonBlock(text: string) {
  const fence = /```json([\s\S]*?)```/i.exec(text);
  if (fence?.[1]) try { return JSON.parse(fence[1]); } catch {}
  const brace = text.match(/\{[\s\S]*\}$/m);
  if (brace) try { return JSON.parse(brace[0]); } catch {}
  return null;
}
function stripJsonBlock(text: string) {
  return text.replace(/```json[\s\S]*?```/gi, '').replace(/\{[\s\S]*\}$/m, '').trim();
}
function baseTo(path: string) {
  const base = (Constants.expoConfig?.extra as any)?.API_BASE_URL as string | undefined;
  if (!base) throw new Error('Falta API_BASE_URL en app.json (expo.extra).');
  const clean = base.replace(/\/+$/, '');
  const root = /\/api(\/|$)/i.test(clean) ? clean.replace(/\/api.*$/i, '') : clean;
  return `${root}${path}`;
}
async function callBackend(payload: any): Promise<string> {
  const res = await fetch(baseTo('/api/story'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    let msg = `API ${res.status}`;
    if (ct.includes('application/json')) {
      const d = await res.json().catch(() => ({} as any));
      if ((d as any)?.error) msg += `: ${(d as any).error}`;
    }
    throw new Error(msg);
  }
  const { content } = await res.json();
  return (content || '').trim();
}
type IllustrationSlot = 'intro' | 'conflict' | 'resolution';
type IllustrationPlacement = 'before' | 'after';
type IllustrationPlan = {
  slot: IllustrationSlot;
  label: string;
  paragraphIndex: number;
  placement: IllustrationPlacement;
  excerpt: string;
};
type IllustrationResult = IllustrationPlan & {
  uri?: string | null;
};

async function callIllustrations(payload: {
  age_range: '2-5' | '6-10'; theme: string; skill: string; characters?: string; tone?: string; locale?: string; story?: string;
  beats?: Array<{ slot: IllustrationSlot; label: string; excerpt: string; order: number }>;
  count?: number;
}): Promise<string[]> {
  const res = await fetch(baseTo('/api/illustrate'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    let msg = `API ${res.status}`;
    if (ct.includes('application/json')) {
      const d = await res.json().catch(() => ({} as any));
      if ((d as any)?.error) msg += `: ${(d as any).error}`;
    }
    throw new Error(msg);
  }
  const { images } = await res.json();
  return Array.isArray(images) ? images : [];
}

const ILLUSTRATION_CAPTIONS: Record<IllustrationSlot, string> = {
  intro: 'Presentacion de los personajes',
  conflict: 'Conflicto en desarrollo',
  resolution: 'Resolucion del cuento',
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value: string) {
  const basic = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return basic || 'cuento';
}

const MAX_STORIES_SAVED = 10;
const DEFAULT_STORY_TITLE = 'Tu cuento';
const BRAND_SUFFIX = 'by PopliLandia';

const ILLUSTRATION_DIR =
  (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + 'illustrations/';
const SAVED_STORIES_DIR =
  (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + 'savedStories/';

async function ensureDir(path: string) {
  if (!path) return;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

function guessImageExtension(uri: string) {
  if (/\.png($|\?)/i.test(uri)) return 'png';
  if (/\.jpe?g($|\?)/i.test(uri)) return 'jpg';
  if (/\.webp($|\?)/i.test(uri)) return 'webp';
  if (/^data:image\/png/i.test(uri)) return 'png';
  if (/^data:image\/jpe?g/i.test(uri)) return 'jpg';
  if (/^data:image\/webp/i.test(uri)) return 'webp';
  return 'png';
}

function extToMime(ext: string) {
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

async function persistIllustrationAsset(uri: string, slot: IllustrationSlot, index: number) {
  if (!FileSystem.documentDirectory && !FileSystem.cacheDirectory) return uri;
  await ensureDir(ILLUSTRATION_DIR);
  const ext = guessImageExtension(uri);
  const fileName = `${slugify(slot)}-${Date.now()}-${index}.${ext}`;
  const targetUri = `${ILLUSTRATION_DIR}${fileName}`;

  if (uri.startsWith('data:image/')) {
    const base64 = uri.split(',')[1] ?? '';
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
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

type SavedStoryMetadata = {
  id: string;
  title: string;
  createdAt: string;
  story: string;
  meta?: any;
  illustrations: Array<Pick<IllustrationResult, 'slot' | 'label' | 'uri'>>;
  fileUri: string;
};

type SavedStoryIndexItem = {
  id: string;
  title: string;
  createdAt: string;
  fileUri: string;
  metadataUri: string;
  metaSummary?: {
    age_range?: string;
    skill?: string;
    tone?: string;
  };
};

async function deleteFileQuiet(uri?: string | null) {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {}
}

async function persistStoryMetadataFile(data: SavedStoryMetadata) {
  await ensureDir(SAVED_STORIES_DIR);
  const path = `${SAVED_STORIES_DIR}${data.id}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
  return path;
}

async function normalizeStoredIndexItem(raw: any): Promise<SavedStoryIndexItem | null> {
  if (!raw || typeof raw !== 'object') return null;
  const idRaw = raw.id ?? raw.createdAt ?? '';
  const id = typeof idRaw === 'string' && idRaw ? idRaw : String(idRaw || '');
  if (!id) return null;
  const title =
    typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : DEFAULT_STORY_TITLE;
  const createdAt =
    typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  const fileUri = typeof raw.fileUri === 'string' ? raw.fileUri : '';
  let metadataUri = typeof raw.metadataUri === 'string' ? raw.metadataUri : '';

  const metaSummarySource = raw.metaSummary || raw.meta;
  const metaSummary =
    metaSummarySource && typeof metaSummarySource === 'object'
      ? {
          age_range:
            typeof metaSummarySource.age_range === 'string'
              ? metaSummarySource.age_range
              : undefined,
          skill:
            typeof metaSummarySource.skill === 'string' ? metaSummarySource.skill : undefined,
          tone: typeof metaSummarySource.tone === 'string' ? metaSummarySource.tone : undefined,
        }
      : undefined;

  if (!metadataUri && (typeof raw.story === 'string' || Array.isArray(raw.illustrations))) {
    const metadataPayload: SavedStoryMetadata = {
      id,
      title,
      createdAt,
      story: typeof raw.story === 'string' ? raw.story : '',
      meta: raw.meta && typeof raw.meta === 'object' ? raw.meta : undefined,
      illustrations: Array.isArray(raw.illustrations)
        ? raw.illustrations.map((item: any) => ({
            slot: item?.slot ?? 'intro',
            label: typeof item?.label === 'string' ? item.label : '',
            uri: item?.uri ?? null,
          }))
        : [],
      fileUri,
    };
    metadataUri = await persistStoryMetadataFile(metadataPayload);
  }

  return {
    id,
    title,
    createdAt,
    fileUri,
    metadataUri,
    metaSummary,
  };
}

function splitStoryParagraphs(story: string): string[] {
  return story
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function buildIllustrationPlan(story: string): IllustrationPlan[] {
  const paragraphs = splitStoryParagraphs(story);
  const fallbackExcerpt = story.trim() || 'Cuento sin texto';
  if (!paragraphs.length) {
    return [
      { slot: 'intro', label: ILLUSTRATION_CAPTIONS.intro, paragraphIndex: 0, placement: 'after', excerpt: fallbackExcerpt },
      { slot: 'conflict', label: ILLUSTRATION_CAPTIONS.conflict, paragraphIndex: 0, placement: 'after', excerpt: fallbackExcerpt },
      { slot: 'resolution', label: ILLUSTRATION_CAPTIONS.resolution, paragraphIndex: 0, placement: 'before', excerpt: fallbackExcerpt },
    ];
  }

  const firstIndex = 0;
  const lastIndex = Math.max(paragraphs.length - 1, 0);
  const middleIndex = paragraphs.length === 1
    ? 0
    : paragraphs.length === 2
      ? 1
      : Math.max(1, Math.floor(paragraphs.length / 2));

  return [
    {
      slot: 'intro',
      label: ILLUSTRATION_CAPTIONS.intro,
      paragraphIndex: firstIndex,
      placement: 'after',
      excerpt: paragraphs[firstIndex] ?? fallbackExcerpt,
    },
    {
      slot: 'conflict',
      label: ILLUSTRATION_CAPTIONS.conflict,
      paragraphIndex: middleIndex,
      placement: 'after',
      excerpt: paragraphs[middleIndex] ?? paragraphs[lastIndex] ?? fallbackExcerpt,
    },
    {
      slot: 'resolution',
      label: ILLUSTRATION_CAPTIONS.resolution,
      paragraphIndex: lastIndex,
      placement: paragraphs.length === 1 ? 'after' : 'before',
      excerpt: paragraphs[lastIndex] ?? fallbackExcerpt,
    },
  ];
}

/* --------------- UI PRIMITIVES --------------- */
const GradientBG: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={{ flex: 1 }}>
    <LinearGradient colors={[THEME.bgTop, THEME.bgBottom]} style={{ position: 'absolute', inset: 0 }} />
    <View style={{ position: 'absolute', inset: 0 }}>
      {[...Array(20)].map((_, i) => (
        <View key={i} style={{ position: 'absolute', top: Math.random() * 700, left: Math.random() * 360, width: 2, height: 2, backgroundColor: THEME.accent, borderRadius: 2, opacity: 0.9 }} />
      ))}
    </View>
    {children}
  </View>
);
const CardBox: React.FC<{ title?: string; children: React.ReactNode; style?: any }> = ({ title, children, style }) => (
  <Animated.View entering={FadeInUp.duration(600)} style={[{ backgroundColor: THEME.card, borderColor: THEME.border, borderWidth: 1, borderRadius: 16, padding: 14 }, style]}>
    {!!title && <Text style={{ color: THEME.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{title}</Text>}
    {children}
  </Animated.View>
);
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
  const [ageRange, setAgeRange] = React.useState<'2-5' | '6-10' | ''>('');
  const [theme, setTheme] = React.useState('');
  const [skill, setSkill] = React.useState('');
  const [characters, setCharacters] = React.useState('');
  const [tone, setTone] = React.useState<'tierno' | 'aventurero' | 'humor'>('tierno');
  const [locale] = React.useState<'es-AR' | 'es-LATAM'>('es-LATAM');
  const [minutes, setMinutes] = React.useState(4);

  const [loading, setLoading] = React.useState(false);
  const [storyText, setStoryText] = React.useState('');
  const [meta, setMeta] = React.useState<any>(null);
  const [imgLoading, setImgLoading] = React.useState(false);
  const [illustrationPlan, setIllustrationPlan] = React.useState<IllustrationPlan[]>([]);
  const [illustrations, setIllustrations] = React.useState<IllustrationResult[]>([]);
  const speakingRef = React.useRef(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace(LOGIN_ROUTE);
    }
  }, [authLoading, user]);

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

  const illustrateButtonLabel = React.useMemo(() => {
    if (imgLoading) return 'Ilustrando...';
    return hasIllustrations ? 'Re-generar ilustraciones' : 'Ilustrar cuento';
  }, [imgLoading, hasIllustrations]);

  const renderIllustrationItem = (item: IllustrationResult, key: string) => {
    const waiting = !item.uri;
    return (
      <View key={key} style={{ marginVertical: 12 }}>
        {waiting ? (
          <View style={{ borderWidth: 1, borderColor: THEME.border, borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: 'rgba(11,18,38,0.3)' }}>
            {imgLoading ? (
              <ActivityIndicator color={THEME.accent} style={{ marginBottom: 8 }} />
            ) : (
              <Feather name='image' size={24} color={THEME.accent} style={{ marginBottom: 8 }} />
            )}
            <Text style={{ color: THEME.textDim, textAlign: 'center' }}>
              {imgLoading ? 'Generando ilustracion...' : `Ilustracion pendiente: ${item.label}`}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.uri }}
            style={{ width: '100%', height: 220, borderRadius: 14, borderWidth: 1, borderColor: THEME.border, backgroundColor: 'rgba(255,255,255,0.05)' }}
            resizeMode='cover'
          />
        )}
      </View>
    );
  };

  const createStoryHtml = React.useCallback(async () => {
    const baseTitle = theme?.trim() || DEFAULT_STORY_TITLE;
    const displayTitle = `${baseTitle} ${BRAND_SUFFIX}`;
    const escapedDisplayTitle = escapeHtml(displayTitle);
    const storyBlocks = (paragraphs.length ? paragraphs : (storyText ? [storyText.trim()] : []))
      .map((block) => `<p class="paragraph">${escapeHtml(block)}</p>`)
      .join('\n');

    const imagesHtmlParts: string[] = [];
    for (const [idx, item] of planWithResults.entries()) {
      if (!item.uri) continue;
      try {
        let dataUri = item.uri;
        if (item.uri.startsWith('file://')) {
          const ext = guessImageExtension(item.uri);
          const mime = extToMime(ext);
          const b64 = await FileSystem.readAsStringAsync(item.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          dataUri = `data:${mime};base64,${b64}`;
        } else if (/^https?:/i.test(item.uri)) {
          const ext = guessImageExtension(item.uri);
          const tempFile = `${ILLUSTRATION_DIR}${slugify(item.slot)}-pdf-${Date.now()}-${idx}.${ext}`;
          await ensureDir(ILLUSTRATION_DIR);
          await FileSystem.downloadAsync(item.uri, tempFile);
          const mime = extToMime(ext);
          const b64 = await FileSystem.readAsStringAsync(tempFile, {
            encoding: FileSystem.EncodingType.Base64,
          });
          dataUri = `data:${mime};base64,${b64}`;
          await FileSystem.deleteAsync(tempFile, { idempotent: true });
        }
        imagesHtmlParts.push(`
          <div class="image-block">
            <img src="${dataUri}" alt="${escapeHtml(item.label)}-${idx + 1}" />
          </div>
        `);
      } catch (imageErr) {
        console.warn('No se pudo incluir ilustracion en PDF', item.uri, imageErr);
      }
    }

    const metaLine = meta
      ? `<p class="meta">Meta: edad ${escapeHtml(String(meta.age_range ?? ''))} anos - habilidad ${escapeHtml(String(meta.skill ?? ''))} - tono ${escapeHtml(String(meta.tone ?? ''))}</p>`
      : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapedDisplayTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f7; color: #1b1b1f; padding: 24px; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    .meta { color: #54545a; margin-bottom: 16px; font-size: 13px; }
    .paragraph { margin-bottom: 14px; line-height: 1.55; }
    .image-block { margin: 18px 0; text-align: center; }
    .image-block img { max-width: 100%; border-radius: 14px; border: 1px solid #d0d0d6; }
  </style>
</head>
<body>
  <h1>${escapedDisplayTitle}</h1>
  ${metaLine}
  ${storyBlocks || '<p class="paragraph">Cuento sin contenido.</p>'}
  ${imagesHtmlParts.join('\n')}
</body>
</html>`;
  }, [paragraphs, planWithResults, theme, meta, storyText]);

  const exportStoryPdf = React.useCallback(async () => {
    if (!storyText?.trim()) throw new Error('No hay cuento para exportar.');
    const html = await createStoryHtml();
    const { uri: tempUri } = await Print.printToFileAsync({ html });
    const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
    if (!baseDir) return tempUri;
    const baseTitle = theme?.trim() || DEFAULT_STORY_TITLE;
    const fileName = `${slugify(`${baseTitle} ${BRAND_SUFFIX}`)}-${Date.now()}.pdf`;
    const targetUri = `${baseDir}${fileName}`;
    await FileSystem.moveAsync({ from: tempUri, to: targetUri });
    return targetUri;
  }, [createStoryHtml, storyText, theme]);

  const handleLogout = React.useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace(LOGIN_ROUTE);
    } catch (e: any) {
      Alert.alert('Error al cerrar sesion', e?.message || 'Intentalo de nuevo.');
    } finally {
      setLoggingOut(false);
    }
  }, [logout, loggingOut]);

  const handleShare = React.useCallback(async () => {
    if (!storyText) return;
    if (!hasIllustrations) {
      Alert.alert('Faltan ilustraciones', 'Primero toca "Ilustrar cuento" para generar las imagenes.');
      return;
    }
    try {
      const pdfUri = await exportStoryPdf();
      const baseTitle = theme?.trim() || DEFAULT_STORY_TITLE;
      const dialogTitle = `${baseTitle} ${BRAND_SUFFIX}`;
      const shareMessage = `${dialogTitle}\n\n${storyText}`;
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
  }, [storyText, exportStoryPdf, hasIllustrations, theme]);

  const saveStory = React.useCallback(async () => {
    if (!storyText) return;
    if (!hasIllustrations) {
      Alert.alert('Faltan ilustraciones', 'Genera las ilustraciones antes de guardar el cuento.');
      return;
    }
    const key = 'cuentero_stories';
    let arrRef: SavedStoryIndexItem[] = [];
    let pdfUri: string | null = null;
    let metadataUri: string | null = null;
    let entryId: string | null = null;
    try {
      const baseTitle = theme?.trim() || DEFAULT_STORY_TITLE;
      const dialogTitle = `${baseTitle} ${BRAND_SUFFIX}`;
      entryId = String(Date.now());
      const createdAt = new Date().toISOString();
      pdfUri = await exportStoryPdf();

      const metadataPayload: SavedStoryMetadata = {
        id: entryId,
        title: baseTitle,
        createdAt,
        story: storyText,
        meta,
        illustrations: illustrations.map((item) => ({
          slot: item.slot,
          label: item.label,
          uri: item.uri ?? null,
        })),
        fileUri: pdfUri,
      };
      metadataUri = await persistStoryMetadataFile(metadataPayload);

      const indexEntry: SavedStoryIndexItem = {
        id: entryId,
        title: baseTitle,
        createdAt,
        fileUri: pdfUri,
        metadataUri,
        metaSummary: meta
          ? {
              age_range: meta?.age_range,
              skill: meta?.skill,
              tone: meta?.tone,
            }
          : undefined,
      };

      const prev = await AsyncStorage.getItem(key);
      let arr: SavedStoryIndexItem[] = [];
      if (prev) {
        try {
          const parsed = JSON.parse(prev);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              const normalized = await normalizeStoredIndexItem(item);
              if (normalized) arr.push(normalized);
            }
          }
        } catch {
          arr = [];
        }
      }

      arr.unshift(indexEntry);
      while (arr.length > MAX_STORIES_SAVED) {
        const removed = arr.pop();
        if (removed) {
          await deleteFileQuiet(removed.fileUri);
          await deleteFileQuiet(removed.metadataUri);
        }
      }

      arrRef = arr;
      await AsyncStorage.setItem(key, JSON.stringify(arr));

      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile && pdfUri) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle,
        });
      }

      Alert.alert(
        'Guardado',
        canShareFile && pdfUri
          ? 'Se genero un PDF del cuento. Selecciona Guardar en tu dispositivo.'
          : `Se genero un PDF del cuento en: ${pdfUri ?? 'archivo'}`,
      );
    } catch (err: any) {
      console.warn('saveStory failed', err);
      await deleteFileQuiet(metadataUri);
      await deleteFileQuiet(pdfUri);
      const message = err?.message || 'No se pudo guardar el cuento.';
      if (typeof message === 'string' && message.toLowerCase().includes('sqlite_full')) {
        try {
          if (arrRef.length) {
            const reverted = entryId ? arrRef.filter(item => item.id !== entryId) : arrRef;
            await AsyncStorage.setItem(key, JSON.stringify(reverted));
          }
        } catch {}
        Alert.alert('Sin espacio', 'Tu biblioteca esta llena. Borra cuentos guardados o libera espacio en el dispositivo.');
      } else {
        Alert.alert('Ups', message);
      }
    }
  }, [storyText, meta, illustrations, exportStoryPdf, hasIllustrations, theme]);

  const onGenerate = React.useCallback(async () => {
    setLoading(true);
    setStoryText('');
    setMeta(null);
    setIllustrationPlan([]);
    setIllustrations([]);
    try {
      const effectiveTheme = themeWithPhilosophy(theme, (ageRange || '2-5') as '2-5' | '6-10');
      const payload = {
        age_range: ageRange,
        theme: effectiveTheme,
        skill,
        characters: characters || 'protagonista sin nombre y un amigo imaginario',
        locale,
        tone,
        reading_time_minutes: minutes,
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
  }, [ageRange, theme, skill, characters, tone, locale, minutes]);

  const onIllustrate = React.useCallback(async () => {
    if (!storyText) { Alert.alert('Falta el cuento', 'Primero genera el cuento.'); return; }
    setImgLoading(true);
    try {
      const effectiveTheme = themeWithPhilosophy(theme || 'cuento infantil', (ageRange || '2-5') as '2-5' | '6-10');
      const plan = illustrationPlan.length ? illustrationPlan : buildIllustrationPlan(storyText);

      const results = await Promise.all(
        plan.map(async (scene, index) => {
          const sceneContext = [
            `Escena ${index + 1}: ${scene.label}.`,
            `Fragmento clave: ${scene.excerpt}`,
            'Manten los mismos personajes y estilo a lo largo de las ilustraciones.',
            'Ilustra solamente esta escena en una unica imagen (sin paneles ni collage).',
          ].join(' ');

          const [uri] = await callIllustrations({
            age_range: (ageRange || '2-5') as '2-5' | '6-10',
            theme: effectiveTheme,
            skill: skill || 'empatia',
            characters,
            tone,
            locale,
            story: `${sceneContext}

Resumen del cuento:
${storyText.slice(0, 900)}`,
            num_images: 1,
          });

          let finalUri: string | null = uri ?? null;
          if (uri) {
            try {
              finalUri = await persistIllustrationAsset(uri, scene.slot, index);
            } catch {
              finalUri = uri;
            }
          }

          return { ...scene, uri: finalUri };
        }),
      );

      setIllustrationPlan(plan);
      setIllustrations(results);
    } catch (e: any) {
      Alert.alert('No se pudieron generar imagenes', e?.message || 'Error');
    } finally { setImgLoading(false); }
  }, [storyText, ageRange, theme, skill, characters, tone, locale, illustrationPlan]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBG>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
          <AppNavbar
            name={greetingName || undefined}
            menuItems={MENU_ITEMS}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />

          <CardBox title="Personalizacion">
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {AGE_OPTIONS.map(({ value, label }) => (<Chip key={value} label={label} selected={ageRange === value} onPress={() => setAgeRange(value)} />))}
            </View>

            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>Tema central</Text>
            <TextInput placeholder="p. ej., miedo a la oscuridad" placeholderTextColor="#8fa0c2" value={theme} onChangeText={setTheme} style={{ color: THEME.text, borderColor: THEME.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }} />

            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>Habilidad socioemocional</Text>
            {skillsContent}

            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>Personajes (nombres/comas)</Text>
            <TextInput placeholder="Luna (prota), Tito (amigo)" placeholderTextColor="#8fa0c2" value={characters} onChangeText={setCharacters} style={{ color: THEME.text, borderColor: THEME.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {(['tierno','aventurero','humor'] as const).map((t) => (<Chip key={t} label={t} selected={tone === t} onPress={() => setTone(t)} />))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: THEME.textDim }}>Duracion: {minutes} min</Text>
              <View style={{ flexDirection: 'row' }}>
                <Pressable onPress={() => setMinutes(m => Math.max(2, m - 1))} style={{ marginRight: 8 }}>
                  <Feather name="minus-circle" size={22} color={THEME.accent} />
                </Pressable>
                <Pressable onPress={() => setMinutes(m => Math.min(10, m + 1))}>
                  <Feather name="plus-circle" size={22} color={THEME.accent} />
                </Pressable>
              </View>
            </View>

            <View style={{ height: 12 }} />
            <PrimaryButton label={loading ? 'Generando...' : 'Generar cuento'} icon="moon" disabled={!canGenerate} onPress={onGenerate} />
          </CardBox>

          <View style={{ height: 16 }} />
          <CardBox title="Tu cuento">
            {loading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color={THEME.accent} size="large" />
                <Text style={{ color: THEME.textDim, marginTop: 12 }}>Creando una historia suave y luminosa...</Text>
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
                    const before = beforeItems.filter((item) => imgLoading || Boolean(item.uri));
                    const after = afterItems.filter((item) => imgLoading || Boolean(item.uri));
                    return (
                      <View key={`story-paragraph-${index}`} style={{ marginBottom: 12 }}>
                        {before.map((item, idx) => renderIllustrationItem(item, `before-${index}-${idx}`))}
                        <Text style={{ color: THEME.text, lineHeight: 22 }}>{paragraph}</Text>
                        {after.map((item, idx) => renderIllustrationItem(item, `after-${index}-${idx}`))}
                      </View>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Pressable onPress={saveStory} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
                      <Feather name="bookmark" size={20} color={THEME.accent} />
                      <Text style={{ color: THEME.accent, marginLeft: 6 }}>Guardar</Text>
                    </Pressable>
                    <Pressable onPress={handleShare} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="share-2" size={20} color={THEME.accent} />
                      <Text style={{ color: THEME.accent, marginLeft: 6 }}>Compartir</Text>
                    </Pressable>
                  </View>
                </View>

                {meta && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: THEME.textDim, fontSize: 12 }}>
                      Meta: edad {meta.age_range} anos - habilidad {meta.skill} - tono {meta.tone}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={{ color: THEME.textDim }}>
                Tu cuento aparecera aqui. Completa el formulario y toca "Generar".
              </Text>
            )}
          </CardBox>

          {storyText?.trim() ? (
            <>
              <View style={{ height: 16 }} />
              <Text style={{ color: THEME.textDim, marginBottom: 6, fontWeight: '700' }}>Tu cuento</Text>
              <StoryReader text={storyText} locale={ageRange === '6-10' ? 'es-AR' : 'es-AR'} />
            </>
          ) : null}

          <View style={{ height: 56 }} />
        </ScrollView>
      </GradientBG>
    </GestureHandlerRootView>
  );
}
