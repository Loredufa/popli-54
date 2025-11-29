import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MusicPlayer } from '../lib/musicPlayer';

type Props = {
  player: MusicPlayer;
  theme: { text: string; textDim: string; accent: string; card: string; border: string };
};

export default function MusicBar({ player, theme }: Props) {
  const { isPlaying, currentTrack, tracks, volume } = player;
  const [showList, setShowList] = React.useState(false);

  const toggle = async () => {
    if (isPlaying) return player.pause();
    return player.play();
  };

  return (
    <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name={isPlaying ? 'pause' : 'play'} size={20} color={theme.accent} />
          <Text style={{ color: theme.text, marginLeft: 8, fontWeight: '700' }}>{currentTrack.title}</Text>
        </Pressable>
        <Pressable onPress={() => setShowList((v) => !v)}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Elegir música</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: theme.textDim, fontSize: 12, marginRight: 8 }}>Volumen</Text>
        <Pressable onPress={() => player.setVolume(Math.max(0, volume - 0.1))} style={{ padding: 4 }}>
          <Feather name="minus-circle" size={18} color={theme.accent} />
        </Pressable>
        <Text style={{ color: theme.text, marginHorizontal: 6 }}>{Math.round(volume * 100)}%</Text>
        <Pressable onPress={() => player.setVolume(Math.min(1, volume + 0.1))} style={{ padding: 4 }}>
          <Feather name="plus-circle" size={18} color={theme.accent} />
        </Pressable>
      </View>

      {showList ? (
        <View style={{ marginTop: 8 }}>
          {tracks.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                player.setTrack(t.id);
                setShowList(false);
              }}
              style={{ paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}
            >
              <Feather
                name={t.id === currentTrack.id ? 'check-circle' : 'circle'}
                size={18}
                color={t.id === currentTrack.id ? theme.accent : theme.textDim}
              />
              <Text style={{ color: theme.text, marginLeft: 8 }}>{t.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
