// app/cuentos-guardados/[id].tsx
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../../src/auth/AuthProvider';
import AppNavbar from '../../src/components/AppNavbar';
import MusicBar from '../../src/components/MusicBar';
import SavedStoryPlayer, { StoryIllustration } from '../../src/components/SavedStoryPlayer';
import { buildMenuItems } from '../../src/constants/menu';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { usePlayback } from '../../src/story/PlaybackContext';
import { clearCurrentSession } from '../../src/lib/storage';
import { loadStoryBundle, type LoadedStory } from '../../src/lib/storyLibrary';
import { useStory } from '../../src/story/StoryContext';
import { CardBox, GradientBG, THEME } from '../../src/ui/theme';

export default function SavedStoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { clearStory } = useStory();
  const menuItems = buildMenuItems(t);

  const [bundle, setBundle] = React.useState<LoadedStory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Un solo reproductor de musica en toda la app (PlaybackProvider). Si esta pantalla
  // creara el suyo, sonarian dos pistas encimadas.
  const { music } = usePlayback();

  // La musica arranca en el track con el que se guardo el cuento, no en el default.
  const savedTrackId = bundle?.manifest.musicTrackId;
  const selectTrack = music.selectTrack;
  React.useEffect(() => {
    if (savedTrackId) selectTrack(savedTrackId);
  }, [savedTrackId, selectTrack]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const loaded = id ? await loadStoryBundle(String(id)) : null;
      if (alive) {
        setBundle(loaded);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // El reproductor es global (PlaybackProvider) y ya no se desmonta con la pantalla, asi
  // que hay que parar la musica a mano al salir de un cuento guardado.
  const pauseMusic = music.pause;
  React.useEffect(() => () => { pauseMusic(); }, [pauseMusic]);

  const greetingName = React.useMemo(() => {
    if (!user) return '';
    const base = (user.first_name || user.email || '').trim();
    return base ? base.split(' ')[0] : '';
  }, [user]);

  const handleLogout = React.useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await clearCurrentSession();
      clearStory();
      await logout();
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Error al cerrar sesion', e?.message || 'Intentalo de nuevo.');
    } finally {
      setLoggingOut(false);
    }
  }, [logout, loggingOut, clearStory]);

  const handleOpenPdf = React.useCallback(async () => {
    if (!bundle?.pdfUri) return;
    if (Platform.OS === 'web') {
      Alert.alert('Usa la app móvil', 'Abrir el PDF funciona en dispositivo o emulador, no en web.');
      return;
    }
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(bundle.pdfUri, { mimeType: 'application/pdf', dialogTitle: bundle.entry.title });
      }
    } catch (e: any) {
      Alert.alert('No se pudo abrir', e?.message || 'Intentalo de nuevo.');
    }
  }, [bundle]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBG>
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
          <AppNavbar
            name={greetingName || undefined}
            menuItems={menuItems}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={THEME.accent} />
            </View>
          ) : !bundle ? (
            <CardBox title={t.menu_saved_stories}>
              <Text style={{ color: THEME.textDim }}>
                No encontramos este cuento. Puede que lo hayas borrado.
              </Text>
            </CardBox>
          ) : (
            <CardBox title={bundle.entry.title}>
              <MusicBar player={music} theme={THEME} />
              <View style={{ height: 12 }} />
              <SavedStoryPlayer
                narrations={bundle.audioUris}
                onPlaybackStart={() => { if (!music.isPlaying) music.play(); }}
                onPlaybackStop={() => { if (music.isPlaying) music.pause(); }}
              />

              {bundle.pdfUri ? (
                <Pressable onPress={handleOpenPdf} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
                  <Feather name="file-text" size={20} color={THEME.accent} />
                  <Text style={{ color: THEME.accent, marginLeft: 6, fontWeight: '700' }}>Abrir el PDF</Text>
                </Pressable>
              ) : null}

              <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 14 }} />

              {bundle.illustrationUris.map((ill) => (
                <StoryIllustration key={ill.uri} uri={ill.uri} label={ill.label} />
              ))}

              <Text style={{ color: THEME.text, lineHeight: 24 }}>{bundle.manifest.story}</Text>
            </CardBox>
          )}

          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
            <Feather name="arrow-left" size={18} color={THEME.accent} />
            <Text style={{ color: THEME.accent, marginLeft: 6 }}>Volver a mis cuentos</Text>
          </Pressable>

          <View style={{ height: 56 }} />
        </ScrollView>
      </GradientBG>
    </GestureHandlerRootView>
  );
}
