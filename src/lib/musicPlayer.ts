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

export const DEFAULT_TRACK_ID = TRACKS[0].id;

export function trackTitle(id?: string | null) {
  return TRACKS.find((t) => t.id === id)?.title ?? '';
}

type MusicPlayerOptions = {
  /** Track con el que arranca el hook (p. ej. el guardado en la sesión del cuento). */
  initialTrackId?: string | null;
  /** Se llama cada vez que cambia el track, para poder persistir la elección. */
  onTrackChange?: (trackId: string) => void;
};

export function useMusicPlayer(options: MusicPlayerOptions = {}) {
  const { initialTrackId, onTrackChange } = options;
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [currentTrackId, setCurrentTrackId] = React.useState<string>(
    () => (initialTrackId && TRACKS.some((t) => t.id === initialTrackId) ? initialTrackId : TRACKS[0].id),
  );
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(0.6);
  const isChanging = React.useRef(false);

  // `initialTrackId` puede llegar tarde (la sesión se hidrata async): mientras el usuario no haya
  // elegido nada a mano, seguimos el valor externo. Después manda la elección local.
  const userPickedRef = React.useRef(false);
  React.useEffect(() => {
    if (userPickedRef.current) return;
    if (!initialTrackId) return;
    if (!TRACKS.some((t) => t.id === initialTrackId)) return;
    setCurrentTrackId((prev) => (prev === initialTrackId ? prev : initialTrackId));
  }, [initialTrackId]);

  const onTrackChangeRef = React.useRef(onTrackChange);
  React.useEffect(() => { onTrackChangeRef.current = onTrackChange; }, [onTrackChange]);

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
      onTrackChangeRef.current?.(track.id);
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
    console.log('[Music] play request', track.id);
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
      console.log('[Music] pause request');
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
    setTrack: (id: string) => {
      userPickedRef.current = true;
      return play(id);
    },
  };
}

export type MusicPlayer = ReturnType<typeof useMusicPlayer>;
