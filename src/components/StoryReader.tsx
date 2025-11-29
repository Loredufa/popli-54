// src/components/StoryReader.tsx
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
  onNarrationStart?: () => void;
  onNarrationStop?: () => void;
};

/** Voz preferida; si no existe en el dispositivo, elegimos la 1a en espanol. */
const PREFERRED_VOICE = 'es-us-x-esd-local'; // "Pablo"

export default function StoryReader({ text, locale = 'es-AR', onNarrationStart, onNarrationStop }: Props) {
  const segments = React.useMemo(() => splitIntoSegments(text), [text]);
  const [idx, setIdx] = React.useState(0);
  const [rate, setRate] = React.useState(0.98);
  const [speaking, setSpeaking] = React.useState(false);

  const chosenVoice = React.useRef<string | undefined>(undefined);
  const canceled = React.useRef(false);

  // Resolver voz disponible en el dispositivo
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync?.();
        const pick =
          voices?.find(v => v.identifier === PREFERRED_VOICE) ||
          voices?.find(v => v.language?.startsWith('es'));
        if (alive) chosenVoice.current = pick?.identifier || PREFERRED_VOICE;
      } catch {
        chosenVoice.current = PREFERRED_VOICE;
      }
    })();
    return () => {
      alive = false;
      Speech.stop();
      setSpeaking(false);
    };
  }, []);

  // Si cambia el cuento, reiniciar cursor
  React.useEffect(() => setIdx(0), [text]);

  const speakFrom = React.useCallback(
    async (start: number) => {
      canceled.current = false;
      setSpeaking(true);
      for (let i = start; i < segments.length; i++) {
        setIdx(i);
        await speakOnce(segments[i], locale, rate, chosenVoice.current);
        if (canceled.current) break;
        await wait(120);
      }
      setSpeaking(false);
    },
    [segments, locale, rate]
  );

  const onPlay = React.useCallback(() => {
    Speech.stop();
    onNarrationStart?.();
    speakFrom(idx);
  }, [idx, speakFrom, onNarrationStart]);

  const onPause = React.useCallback(() => {
    canceled.current = true;
    Speech.stop(); // "pausa" efectiva
    setSpeaking(false);
    onNarrationStop?.();
  }, [onNarrationStop]);

  const onStop = React.useCallback(() => {
    canceled.current = true;
    Speech.stop();
    setSpeaking(false);
    setIdx(0);
    onNarrationStop?.();
  }, [onNarrationStop]);

  const goTo = React.useCallback((i: number) => {
    canceled.current = true;
    Speech.stop();
    setSpeaking(false);
    setIdx(i);
  }, []);

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
      <Text style={{ color: THEME.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
        Narrador: Pablo
      </Text>
      <Text style={{ color: THEME.textDim, marginBottom: 12, fontSize: 12 }}>
        Voz es-AR
      </Text>

      {/* Controles */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <IconButton icon="play" onPress={onPlay} disabled={!segments.length} />
        <IconButton icon="pause" onPress={onPause} disabled={!speaking} />
        <IconButton icon="square" onPress={onStop} />
      </View>

      {/* Velocidad */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: THEME.textDim, marginRight: 8 }}>Velocidad</Text>
        <RoundIcon icon="minus" onPress={() => setRate(r => Math.max(0.8, +(r - 0.05).toFixed(2)))} />
        <Text style={{ color: THEME.text, marginHorizontal: 6 }}>{rate.toFixed(2)}x</Text>
        <RoundIcon icon="plus" onPress={() => setRate(r => Math.min(1.2, +(r + 0.05).toFixed(2)))} />
        <View style={{ flex: 1 }} />
      </View>

      {/* Ir a... */}
      <Text style={{ color: THEME.textDim, marginBottom: 6 }}>Ir a...</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 6 }}>
        <View style={{ flexDirection: 'row' }}>
          {segments.map((_, i) => (
            <PageChip key={i} label={`${i + 1}`} selected={i === idx} onPress={() => goTo(i)} />
          ))}
        </View>
      </ScrollView>

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

function speakOnce(
  text: string,
  language: string,
  rate: number,
  voice?: string
): Promise<void> {
  return new Promise<void>((resolve) => {
    Speech.speak(text.replace(/\*\*/g, ''), {
      language,
      voice,
      rate,
      onDone: resolve,
      onStopped: resolve,
      onError: () => resolve(), // -> envolvemos para que el tipo sea (err: Error) => void
    });
  });
}
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

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

const RoundIcon = ({ icon, onPress }: { icon: keyof typeof Feather.glyphMap; onPress?: () => void }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      width: 34,
      height: 34,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: THEME.border,
      marginHorizontal: 4,
      opacity: pressed ? 0.8 : 1,
    })}
  >
    <Feather name={icon} size={16} color={THEME.accent} />
  </Pressable>
);

const PageChip = ({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      opacity: pressed ? 0.8 : 1,
      width: 36,
      height: 36,
      borderRadius: 10,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: selected ? THEME.accent : THEME.border,
      backgroundColor: selected ? 'rgba(159,210,255,0.06)' : 'transparent',
    })}
  >
    <Text style={{ color: selected ? THEME.accent : THEME.text }}>{label}</Text>
  </Pressable>
);
