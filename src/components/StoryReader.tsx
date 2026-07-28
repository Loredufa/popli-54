// src/components/StoryReader.tsx
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import {
  Pressable,
  Text,
  View,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import { fetchNarrationTemp } from '../lib/ttsClient';

/** Mini tema para mantener el look&feel */
const THEME = {
  text: '#e7eefc',
  textDim: '#b5c3e6',
  card: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.12)',
  primary: '#5aa0ff',
  accent: '#9fd2ff',
};

type Props = {
  text: string;
  locale?: string; // ej. 'es-AR'
  voiceLabel?: string;
  voiceId?: string; // alloy | nova | shimmer | custom:<id>
  referenceAudioUri?: string | null; // grabación local para voces custom
  onNarrationStart?: () => void;
  onNarrationStop?: () => void;
  audioUri?: string | null;
  onNarrationReady?: (voiceId: string, uri: string) => void;
};

export default function StoryReader({
  text,
  locale = 'es-AR',
  voiceLabel,
  voiceId,
  referenceAudioUri,
  onNarrationStart,
  onNarrationStop,
  audioUri,
  onNarrationReady,
}: Props) {
  const segments = React.useMemo(() => splitIntoSegments(text), [text]);
  const [rate] = React.useState(0.98);
  const [speaking, setSpeaking] = React.useState(false);
  const [loadingAudio, setLoadingAudio] = React.useState(false);
  const [hasSound, setHasSound] = React.useState(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const [statusText, setStatusText] = React.useState<string | null>(null);
  const currentUriRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      currentUriRef.current = null;
      setHasSound(false);
    };
  }, []);

  // Si cambia el cuento, parar el sonido en curso
  React.useEffect(() => {
    soundRef.current?.stopAsync().catch(() => {});
    setSpeaking(false);
  }, [text]);

  const playFromStart = React.useCallback(async () => {
    if (!text?.trim()) return;
    try {
      setLoadingAudio(true);
      setStatusText('Generando la voz de tu cuento...');
      let uri = audioUri;
      if (uri?.startsWith('blob:')) {
        console.log('[StoryReader] cached blob uri invalidated, will re-fetch');
        uri = null;
      }
      if (!uri) {
        console.log('[StoryReader] play -> fetchNarrationTemp');
        const vid = voiceId || 'shimmer';
        uri = await fetchNarrationTemp({ storyText: text, voiceId: vid, locale, referenceAudioUri });
        onNarrationReady?.(vid, uri);
      }

      // Si ya tenemos audio cargado y coincide, reanuda
      const existingSound = soundRef.current;
      if (existingSound && currentUriRef.current === uri) {
        const status = await existingSound.getStatusAsync().catch(() => null as any);
        if (status?.isLoaded && !status.isPlaying) {
          await existingSound.playAsync();
          setSpeaking(true);
          setStatusText('Reproduciendo...');
          onNarrationStart?.();
          setHasSound(true);
          return;
        }
      }

      setStatusText('Reproduciendo...');
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      currentUriRef.current = uri;
      setSpeaking(true);
      setHasSound(true);
      onNarrationStart?.();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (!status.isPlaying) setSpeaking(false);
        if (status.didJustFinish) {
          setSpeaking(false);
          onNarrationStop?.();
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
          currentUriRef.current = null;
          setHasSound(false);
          setStatusText(null);
        }
      });
    } catch (e: any) {
      console.warn('Narracion error', e);
      const isAbort = e?.name === 'AbortError';
      const msg = isAbort
        ? 'La generación de voz tardó demasiado. Intenta nuevamente.'
        : (e?.message || 'No se pudo narrar el cuento.');
      Alert.alert('Narracion', msg);
      setSpeaking(false);
      onNarrationStop?.();
      setStatusText(null);
    } finally {
      setLoadingAudio(false);
    }
  }, [text, voiceId, locale, referenceAudioUri, onNarrationStart, onNarrationStop]);

  const onPause = React.useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setSpeaking(false);
        setStatusText('Pausado');
        onNarrationStop?.();
      }
    } catch {
      // ignore pause errors
    }
  }, [onNarrationStop]);

  const onStop = React.useCallback(() => {
    soundRef.current?.stopAsync().catch(() => {});
    setSpeaking(false);
    onNarrationStop?.();
    setStatusText(null);
    setHasSound(false);
  }, [onNarrationStop]);

  return (
    <View
      style={{
        backgroundColor: THEME.card,
        borderColor: THEME.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text
          style={{ color: THEME.text, fontSize: 16, fontWeight: '600', flex: 1 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Narrador: {voiceLabel || 'Pablo'}
        </Text>
      </View>
      <Text style={{ color: THEME.textDim, marginBottom: 12, fontSize: 12 }}>
        Voz es-AR
      </Text>

      {/* Controles */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <IconButton icon="play" onPress={playFromStart} disabled={!segments.length || loadingAudio} />
        <IconButton icon="pause" onPress={onPause} disabled={!hasSound || loadingAudio} />
        <IconButton icon="square" onPress={onStop} />
      </View>
      {loadingAudio ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <SparkSpinner />
          <Text
            style={{ color: THEME.textDim, fontSize: 12, flexShrink: 1 }}
            numberOfLines={2}
          >
            {statusText || 'Generando la voz de tu cuento...'}
          </Text>
        </View>
      ) : null}

      {/* Nota: la velocidad ya no aplica al audio TTS descargado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        <Text style={{ color: THEME.textDim, flexShrink: 1 }}>
          Velocidad (solo lector del dispositivo)
        </Text>
        <Text style={{ color: THEME.text, fontWeight: '600' }}>{rate.toFixed(2)}x</Text>
      </View>

      {/* Texto oculta para evitar duplicados: usaremos solo controles */}
    </View>
  );
}

/* ----------------- helpers ----------------- */

function splitIntoSegments(txt: string): string[] {
  if (!txt?.trim()) return [];
  const paras = txt
    .replace(/\r/g, '')
    .split(/\n{2,}/) // parrafos
    .map(s => s.trim())
    .filter(Boolean);

  if (paras.length >= 3) return paras.slice(0, 8);

  // Si hay pocos parrafos, segmentamos por oraciones en bloques ~240 chars
  const sents = txt.split(/(?<=[.!?...])\s+/);
  const out: string[] = [];
  let buf = '';
  for (const s of sents) {
    if ((buf + ' ' + s).length > 240) {
      out.push(buf.trim());
      buf = s;
    } else {
      buf += (buf ? ' ' : '') + s;
    }
  }
  if (buf) out.push(buf);
  return out.slice(0, 8);
}

/* ----------------- UI atomos ----------------- */

const IconButton = ({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => ({
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: disabled ? '#2a3d63' : THEME.primary,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: pressed ? 0.85 : 1,
      shadowColor: THEME.primary,
      shadowOpacity: pressed ? 0.15 : 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    })}
  >
    <Feather name={icon} size={18} color="#0b1226" />
  </Pressable>
);


const SparkSpinner = () => {
  const spin = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Feather name="music" size={16} color={THEME.accent} />
    </Animated.View>
  );
};
