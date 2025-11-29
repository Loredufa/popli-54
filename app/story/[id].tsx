// app/story/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import StoryReader from '../../src/components/StoryReader';
import { getStory } from '../../src/lib/storage';
import MusicBar from '../../src/components/MusicBar';
import { useMusicPlayer } from '../../src/lib/musicPlayer';

const Btn = (p: { label: string; onPress: () => void; disabled?: boolean }) => (
  <Text
    onPress={p.onPress}
    style={{
      backgroundColor: p.disabled ? '#2a3d63' : '#84E1FF',
      color: '#0b1226',
      fontWeight: '700',
      fontSize: 16,
      paddingVertical: 14,
      textAlign: 'center',
      borderRadius: 14,
      marginTop: 12,
    }}
  >
    {p.label}
  </Text>
);

export default function StoryReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [text, setText] = React.useState<string>('');
  const [speaking, setSpeaking] = React.useState(false);
  const [rate, setRate] = React.useState(0.98);
  const music = useMusicPlayer();

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const item = id ? await getStory(id) : undefined;
      if (alive) setText(item?.story ?? '');
    })();
    return () => {
      alive = false;
      Speech.stop();
      setSpeaking(false);
    };
  }, [id]);

  const speak = React.useCallback(() => {
    if (!text) return;
    if (!music.isPlaying) music.play();
    setSpeaking(true);
    Speech.speak(text, {
      language: 'es-AR',
      rate,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [text, rate]);

  const stop = React.useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1226' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28 }}>
        <Text onPress={() => router.back()} style={{ color: '#84E1FF', marginBottom: 8 }}>
          ← Volver
        </Text>
        <Text style={{ color: '#e6eef9', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>
          Lector
        </Text>
        
        <Text style={{ color: '#a9b4d0', lineHeight: 22 }}>{text || 'No se encontró el cuento.'}</Text>
        <MusicBar player={music} theme={{ text: '#e6eef9', textDim: '#a9b4d0', accent: '#84E1FF', card: '#131c34', border: '#1f2a46' }} />
        <View style={{ height: 10 }} />
        <StoryReader
          text={text}
          locale="es-AR"
          onNarrationStart={() => { if (!music.isPlaying) music.play(); }}
        />
        <Btn label="Leer" onPress={speak} disabled={speaking || !text} />
        <Btn label="Detener" onPress={stop} disabled={!speaking} />
        <Text
          onPress={() => setRate(r => Math.min(1.2, +(r + 0.02).toFixed(2)))}
          style={{ color: '#84E1FF', marginTop: 10 }}
        >
          Velocidad: {rate.toFixed(2)} (tocar para +)
        </Text>
      </ScrollView>
    </View>
  );
}
