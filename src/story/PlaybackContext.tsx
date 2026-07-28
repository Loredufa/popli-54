// src/story/PlaybackContext.tsx
//
// Dueño ÚNICO de todo lo que suena: la narración del cuento activo y la música de fondo.
//
// Antes cada pantalla tenía lo suyo: `StoryReader` guardaba el `Audio.Sound` de la
// narración en un ref propio y lo descargaba al desmontarse, y `useMusicPlayer` se
// llamaba por pantalla. Resultado: irse de "Música y narrador" para seguir el cuento en
// la pantalla del texto cortaba la narración a la mitad, y la música se reiniciaba al
// navegar.
//
// Este provider vive en app/_layout.tsx, por encima del <Stack>, así que no se desmonta
// al cambiar de pantalla y el audio sigue sonando. Las pantallas ya no tienen estado de
// reproducción: solo dibujan botones que llaman acá.
import * as React from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useMusicPlayer } from '../lib/musicPlayer';
import { fetchNarrationTemp } from '../lib/ttsClient';
import { localAssetExists } from '../lib/localAssets';
import { loadNamedVoices } from '../lib/voicePrefs';
import { useStory } from './StoryContext';

export type NarrationStatus = 'idle' | 'loading' | 'playing' | 'paused';

type NarrationApi = {
  status: NarrationStatus;
  /** Mensaje de progreso para mostrar mientras genera. */
  statusText: string | null;
  /** `true` mientras se está generando la voz (puede tardar minutos). */
  loading: boolean;
  /** Hay audio cargado que se puede pausar/reanudar. */
  hasSound: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
};

type PlaybackContextType = {
  narration: NarrationApi;
  music: ReturnType<typeof useMusicPlayer>;
};

const PlaybackContext = React.createContext<PlaybackContextType | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const { storyText, voiceId, audioMap, setAudioMap, musicTrackId, setMusicTrackId } = useStory();

  const music = useMusicPlayer({ initialTrackId: musicTrackId, onTrackChange: setMusicTrackId });

  const [status, setStatus] = React.useState<NarrationStatus>('idle');
  const [statusText, setStatusText] = React.useState<string | null>(null);
  const [hasSound, setHasSound] = React.useState(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const loadedUriRef = React.useRef<string | null>(null);

  // Generar la voz tarda minutos. Si el usuario toca stop mientras tanto, la petición ya
  // está en vuelo y no se puede abortar desde acá; este token deja que la respuesta que
  // llegue tarde se descarte en vez de arrancar a reproducir sola.
  const runIdRef = React.useRef(0);

  // Se leen dentro de callbacks async largos: con refs evitamos capturar valores viejos.
  const musicRef = React.useRef(music);
  React.useEffect(() => { musicRef.current = music; }, [music]);

  const unload = React.useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    loadedUriRef.current = null;
    setHasSound(false);
    if (sound) {
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
    }
  }, []);

  React.useEffect(() => () => { unload(); }, [unload]);

  // Cuento nuevo (o logout, que limpia `storyText`): lo que estaba sonando ya no aplica.
  const previousStoryRef = React.useRef(storyText);
  React.useEffect(() => {
    if (previousStoryRef.current === storyText) return;
    previousStoryRef.current = storyText;
    unload();
    setStatus('idle');
    setStatusText(null);
    musicRef.current.pause();
  }, [storyText, unload]);

  const resolveReferenceAudioUri = React.useCallback(async (id: string) => {
    if (!id.startsWith('custom:')) return undefined;
    const named = await loadNamedVoices();
    return named.find((v) => v.id === id.slice('custom:'.length))?.localUri;
  }, []);

  const play = React.useCallback(async () => {
    if (!storyText?.trim()) return;
    const vid = voiceId || 'shimmer';

    // Reanudar lo que ya está cargado, sin volver a pedirle audio al backend.
    if (soundRef.current && status === 'paused') {
      await soundRef.current.playAsync().catch(() => {});
      setStatus('playing');
      setStatusText(null);
      musicRef.current.play();
      return;
    }

    const runId = ++runIdRef.current;
    try {
      setStatus('loading');
      setStatusText('Generando la voz de tu cuento...');

      let uri = audioMap[vid] || null;
      // Las blob: URI de web mueren al recargar, y el .wav de `cacheDirectory` lo puede haber
      // purgado Android aunque la URI siga guardada en AsyncStorage. En los dos casos el audio
      // ya no se puede reproducir: hay que soltar la referencia muerta y volver a pedirlo.
      if (uri && !(await localAssetExists(uri))) {
        const dead = uri;
        uri = null;
        if (loadedUriRef.current === dead) {
          await unload();
        }
        setAudioMap((prev) => {
          if (prev[vid] !== dead) return prev;
          const next = { ...prev };
          delete next[vid];
          return next;
        });
      }

      if (!uri) {
        const referenceAudioUri = await resolveReferenceAudioUri(vid);
        uri = await fetchNarrationTemp({ storyText, voiceId: vid, locale: 'es-AR', referenceAudioUri });
        // El audio ya generado se guarda igual aunque el usuario haya cancelado: costó
        // minutos de GPU, y así el próximo play arranca al toque.
        setAudioMap((prev) => ({ ...prev, [vid]: uri as string }));
      }

      // Cancelaron (stop) o arrancó otra reproducción mientras esto estaba en vuelo.
      if (runId !== runIdRef.current) return;

      if (soundRef.current && loadedUriRef.current === uri) {
        await soundRef.current.playAsync().catch(() => {});
      } else {
        await unload();
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
        soundRef.current = sound;
        loadedUriRef.current = uri;
        sound.setOnPlaybackStatusUpdate((s) => {
          if (!s.isLoaded) return;
          if (s.didJustFinish) {
            setStatus('idle');
            setStatusText(null);
            setHasSound(false);
            soundRef.current = null;
            loadedUriRef.current = null;
            sound.unloadAsync().catch(() => {});
            musicRef.current.pause();
          }
        });
      }

      setHasSound(true);
      setStatus('playing');
      setStatusText(null);
      musicRef.current.play();
    } catch (e: any) {
      if (runId !== runIdRef.current) return; // cancelado: el error ya no le importa a nadie
      const isAbort = e?.name === 'AbortError';
      Alert.alert(
        'Narracion',
        isAbort
          ? 'La generación de voz tardó demasiado. Intentá de nuevo.'
          : (e?.message || 'No se pudo narrar el cuento.'),
      );
      setStatus('idle');
      setStatusText(null);
    }
  }, [storyText, voiceId, audioMap, setAudioMap, status, unload, resolveReferenceAudioUri]);

  const pause = React.useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.pauseAsync().catch(() => {});
    setStatus('paused');
    setStatusText('Pausado');
    musicRef.current.pause();
  }, []);

  const stop = React.useCallback(async () => {
    runIdRef.current += 1; // descarta una generación en vuelo, si la hay
    await unload();
    setStatus('idle');
    setStatusText(null);
    musicRef.current.pause();
  }, [unload]);

  const narration = React.useMemo<NarrationApi>(() => ({
    status,
    statusText,
    loading: status === 'loading',
    hasSound,
    play,
    pause,
    stop,
  }), [status, statusText, hasSound, play, pause, stop]);

  const value = React.useMemo<PlaybackContextType>(() => ({ narration, music }), [narration, music]);

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlayback(): PlaybackContextType {
  const ctx = React.useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback debe usarse dentro de <PlaybackProvider>');
  return ctx;
}

export function useNarration(): NarrationApi {
  return usePlayback().narration;
}
