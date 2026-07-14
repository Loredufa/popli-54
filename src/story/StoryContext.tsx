// src/story/StoryContext.tsx
import * as React from 'react';
import { saveCurrentSession, loadCurrentSession, type StorySession } from '../lib/storage';
import { loadVoicePreference } from '../lib/voicePrefs';
import { buildIllustrationPlan } from './plan';
import type { IllustrationPlan, IllustrationResult } from './types';

export function sanitizeAudioMap(map: Record<string, string> = {}): Record<string, string> {
  const cleaned: Record<string, string> = {};
  Object.entries(map).forEach(([k, v]) => {
    if (typeof v === 'string' && !v.startsWith('blob:') && v.trim()) {
      cleaned[k] = v;
    }
  });
  return cleaned;
}

type StoryContextType = {
  storyText: string;
  setStoryText: React.Dispatch<React.SetStateAction<string>>;
  meta: any;
  setMeta: React.Dispatch<React.SetStateAction<any>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  illustrationPlan: IllustrationPlan[];
  setIllustrationPlan: React.Dispatch<React.SetStateAction<IllustrationPlan[]>>;
  illustrations: IllustrationResult[];
  setIllustrations: React.Dispatch<React.SetStateAction<IllustrationResult[]>>;
  voiceId: string;
  setVoiceId: React.Dispatch<React.SetStateAction<string>>;
  audioMap: Record<string, string>;
  setAudioMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  hydrated: boolean;
  /** Limpia el cuento activo en memoria (llamar SIEMPRE al cerrar sesión: el Provider vive a nivel de toda
   * la app, así que sin esto el cuento de un usuario quedaría visible tras el logout en el mismo dispositivo). */
  clearStory: () => void;
};

const noop = () => {};

const StoryContext = React.createContext<StoryContextType>({
  storyText: '',
  setStoryText: noop,
  meta: null,
  setMeta: noop,
  theme: '',
  setTheme: noop,
  illustrationPlan: [],
  setIllustrationPlan: noop,
  illustrations: [],
  setIllustrations: noop,
  voiceId: 'shimmer',
  setVoiceId: noop,
  audioMap: {},
  setAudioMap: noop,
  hydrated: false,
  clearStory: noop,
});

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [storyText, setStoryText] = React.useState('');
  const [meta, setMeta] = React.useState<any>(null);
  const [theme, setTheme] = React.useState('');
  const [illustrationPlan, setIllustrationPlan] = React.useState<IllustrationPlan[]>([]);
  const [illustrations, setIllustrations] = React.useState<IllustrationResult[]>([]);
  const [voiceId, setVoiceId] = React.useState('shimmer');
  const [audioMap, setAudioMap] = React.useState<Record<string, string>>({});
  const [hydrated, setHydrated] = React.useState(false);

  // Hidratar desde AsyncStorage una sola vez, al montar el Provider (envuelve toda la app en _layout.tsx).
  React.useEffect(() => {
    let alive = true;
    (async () => {
      // Orden original: la preferencia global de voz es el default, la sesión resumida (si existe) la sobreescribe.
      const pref = await loadVoicePreference();
      if (alive && pref) setVoiceId(pref);
      const session = await loadCurrentSession();
      if (alive && session?.story) {
        setStoryText(session.story);
        if (session.meta) setMeta(session.meta);
        if (session.title) setTheme(session.title);
        if (session.voiceId) setVoiceId(session.voiceId);
        if (session.audioMap) {
          setAudioMap(sanitizeAudioMap(session.audioMap));
        } else if (session.audioUri && session.voiceId) {
          setAudioMap(sanitizeAudioMap({ [session.voiceId]: session.audioUri }));
        }
        const plan = buildIllustrationPlan(session.story);
        setIllustrationPlan(plan);
        const imgs = session.images || [];
        setIllustrations(plan.map((item, idx) => ({ ...item, uri: imgs[idx] ?? null })));
      }
      if (alive) setHydrated(true);
    })();
    return () => { alive = false; };
  }, []);

  // Autoguardado centralizado (antes vivía en maker.tsx).
  React.useEffect(() => {
    if (!hydrated || !storyText?.trim()) return;
    const session: StorySession = {
      id: 'current',
      story: storyText,
      title: theme,
      images: illustrations.map((item) => item.uri).filter(Boolean) as string[],
      voiceId,
      audioMap: Object.keys(audioMap).length ? audioMap : undefined,
      meta,
      createdAt: new Date().toISOString(),
    };
    saveCurrentSession(session).catch(() => {});
  }, [hydrated, storyText, illustrations, voiceId, audioMap, meta, theme]);

  const clearStory = React.useCallback(() => {
    setStoryText('');
    setMeta(null);
    setTheme('');
    setIllustrationPlan([]);
    setIllustrations([]);
    setVoiceId('shimmer');
    setAudioMap({});
  }, []);

  const value = React.useMemo<StoryContextType>(() => ({
    storyText, setStoryText,
    meta, setMeta,
    theme, setTheme,
    illustrationPlan, setIllustrationPlan,
    illustrations, setIllustrations,
    voiceId, setVoiceId,
    audioMap, setAudioMap,
    hydrated,
    clearStory,
  }), [storyText, meta, theme, illustrationPlan, illustrations, voiceId, audioMap, hydrated, clearStory]);

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory() {
  return React.useContext(StoryContext);
}
