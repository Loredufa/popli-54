// src/components/SavedStoryPlayer.tsx
//
// Reproduce un cuento YA guardado: el audio existe como archivo local, no hay que generarlo.
// Por eso no reusamos StoryReader, que esta acoplado al TTS remoto (fetch, reintentos, spinner
// de "generando la voz"): aca todo eso sobra.
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as React from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { THEME } from '../ui/theme';

export type SavedNarrationOption = { voiceId: string; label: string; uri: string };

type Props = {
  narrations: SavedNarrationOption[];
  onPlaybackStart?: () => void;
  onPlaybackStop?: () => void;
};

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
    })}
  >
    <Feather name={icon} size={18} color="#0b1226" />
  </Pressable>
);

export default function SavedStoryPlayer({ narrations, onPlaybackStart, onPlaybackStop }: Props) {
  const [selected, setSelected] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const loadedUriRef = React.useRef<string | null>(null);

  const current = narrations[selected] ?? null;

  React.useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      loadedUriRef.current = null;
    };
  }, []);

  const stop = React.useCallback(async () => {
    await soundRef.current?.stopAsync().catch(() => {});
    setPlaying(false);
    onPlaybackStop?.();
  }, [onPlaybackStop]);

  // Cambiar de voz descarga la anterior: dos narraciones sonando a la vez es lo peor que puede
  // pasar en una app que un chico usa solo.
  const selectNarration = React.useCallback(async (index: number) => {
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    loadedUriRef.current = null;
    setPlaying(false);
    onPlaybackStop?.();
    setSelected(index);
  }, [onPlaybackStop]);

  const play = React.useCallback(async () => {
    if (!current) return;
    setLoading(true);
    try {
      if (soundRef.current && loadedUriRef.current === current.uri) {
        await soundRef.current.playAsync();
        setPlaying(true);
        onPlaybackStart?.();
        return;
      }
      await soundRef.current?.unloadAsync().catch(() => {});
      const { sound } = await Audio.Sound.createAsync({ uri: current.uri }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      loadedUriRef.current = current.uri;
      setPlaying(true);
      onPlaybackStart?.();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (!status.isPlaying) setPlaying(false);
        if (status.didJustFinish) {
          setPlaying(false);
          onPlaybackStop?.();
        }
      });
    } catch (e: any) {
      Alert.alert('No se pudo reproducir', e?.message || 'El archivo de narración no está disponible.');
    } finally {
      setLoading(false);
    }
  }, [current, onPlaybackStart, onPlaybackStop]);

  const pause = React.useCallback(async () => {
    await soundRef.current?.pauseAsync().catch(() => {});
    setPlaying(false);
    onPlaybackStop?.();
  }, [onPlaybackStop]);

  if (!narrations.length) {
    return (
      <View style={{ backgroundColor: THEME.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: THEME.border }}>
        <Text style={{ color: THEME.textDim }}>
          Este cuento se guardó sin narración. Abrilo en “Música y narrador”, generá la voz y
          volvé a guardarlo.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: THEME.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: THEME.border }}>
      <Text style={{ color: THEME.text, fontWeight: '700', marginBottom: 8 }} numberOfLines={1}>
        Narrador: {current?.label}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton icon="play" onPress={play} disabled={playing || loading} />
        <IconButton icon="pause" onPress={pause} disabled={!playing} />
        <IconButton icon="square" onPress={stop} />
      </View>

      {narrations.length > 1 ? (
        <View style={{ marginTop: 10, gap: 6 }}>
          {narrations.map((n, i) => (
            <Pressable
              key={n.voiceId}
              onPress={() => selectNarration(i)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Feather
                name={i === selected ? 'check-circle' : 'circle'}
                size={18}
                color={i === selected ? THEME.accent : THEME.textDim}
              />
              <Text style={{ color: THEME.text, marginLeft: 8, flex: 1 }} numberOfLines={1}>
                {n.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function StoryIllustration({ uri, label }: { uri: string; label?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Image
        source={{ uri }}
        style={{ width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' }}
        resizeMode="cover"
      />
      {label ? (
        <Text style={{ color: THEME.textDim, fontSize: 12, marginTop: 4 }}>{label}</Text>
      ) : null}
    </View>
  );
}
