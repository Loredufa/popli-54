import * as React from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

type Track = {
  id: string;
  title: string;
  file: number; // require() result
};

const TRACKS: Track[] = [
  { id: 'daydreams', title: 'Pufino - Daydreams', file: require('../../assets/audio/Pufino - Daydreams (freetouse.com).mp3') },
  { id: 'kitty', title: 'Piki - Kitty', file: require('../../assets/audio/Piki - Kitty (freetouse.com).mp3') },
  { id: 'pinnacle', title: 'Alegend - Pinnacle', file: require('../../assets/audio/Alegend - Pinnacle (freetouse.com).mp3') },
  { id: 'fun-time', title: 'Zambolino - Fun Time', file: require('../../assets/audio/Zambolino - Fun Time (freetouse.com).mp3') },
];

export function useMusicPlayer() {
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [currentTrackId, setCurrentTrackId] = React.useState<string>(TRACKS[0].id);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(0.6);
  const isChanging = React.useRef(false);

  const currentTrack = React.useMemo(
    () => TRACKS.find((t) => t.id === currentTrackId) ?? TRACKS[0],
    [currentTrackId],
  );

  const unload = React.useCallback(async () => {
    if (sound) {
      try { await sound.unloadAsync(); } catch { /* ignore */ }
      setSound(null);
    }
  }, [sound]);

  const loadAndPlay = React.useCallback(async (track: Track, shouldPlay: boolean) => {
    isChanging.current = true;
    try {
      await unload();
      const { sound: newSound } = await Audio.Sound.createAsync(
        track.file,
        { shouldPlay, volume, isLooping: true },
      );
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
      });
      setSound(newSound);
      setCurrentTrackId(track.id);
    } finally {
      isChanging.current = false;
    }
  }, [unload, volume]);

  const ensureAudioMode = React.useCallback(async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
    });
  }, []);

  const play = React.useCallback(async (trackId?: string) => {
    if (isChanging.current) return;
    await ensureAudioMode();
    const track = trackId ? TRACKS.find((t) => t.id === trackId) ?? currentTrack : currentTrack;
    if (!sound) {
      await loadAndPlay(track, true);
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (track.id !== currentTrack.id) {
          await loadAndPlay(track, true);
        } else if (!status.isPlaying) {
          await sound.playAsync();
        }
      }
    } catch {
      await loadAndPlay(track, true);
    }
  }, [currentTrack, ensureAudioMode, loadAndPlay, sound]);

  const pause = React.useCallback(async () => {
    if (!sound) return;
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
      }
    } catch { /* ignore */ }
  }, [sound]);

  const setVolumeSafe = React.useCallback(async (v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolume(clamped);
    if (!sound) return;
    try {
      await sound.setVolumeAsync(clamped);
    } catch { /* ignore */ }
  }, [sound]);

  React.useEffect(() => {
    return () => { unload(); };
  }, [unload]);

  return {
    tracks: TRACKS,
    currentTrack,
    isPlaying,
    volume,
    play,
    pause,
    setVolume: setVolumeSafe,
    setTrack: (id: string) => play(id),
  };
}

export type MusicPlayer = ReturnType<typeof useMusicPlayer>;
