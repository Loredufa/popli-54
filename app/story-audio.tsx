// app/story-audio.tsx
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../src/auth/AuthProvider';
import AppNavbar from '../src/components/AppNavbar';
import MusicBar from '../src/components/MusicBar';
import NarratorPicker, { type NarratorVoice } from '../src/components/NarratorPicker';
import StoryReader from '../src/components/StoryReader';
import { buildMenuItems } from '../src/constants/menu';
import { useLanguage } from '../src/i18n/LanguageContext';
import { useMusicPlayer } from '../src/lib/musicPlayer';
import { clearCurrentSession } from '../src/lib/storage';
import { saveStoryBundle } from '../src/lib/storyLibrary';
import { downloadNarrationToGallery, fetchVoices, fetchVoicePreview, type VoiceOption } from '../src/lib/ttsClient';
import {
  deleteNamedVoiceCascade,
  loadVoicePreference,
  saveVoicePreference,
  loadNamedVoices,
  type NamedVoiceData,
} from '../src/lib/voicePrefs';
import { sanitizeAudioMap, useStory } from '../src/story/StoryContext';
import { CardBox, GradientBG, THEME } from '../src/ui/theme';

const BRAND_SUFFIX = 'by PopliLandia';
const VOICE_LABELS: Record<string, string> = {
  shimmer: 'Voz tierna (Shimmer)',
  nova: 'Voz aventura (Nova)',
  alloy: 'Voz calida (Alloy)',
};

export default function StoryAudioScreen() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const {
    storyText, meta, theme, illustrations,
    voiceId, setVoiceId, audioMap, setAudioMap,
    musicTrackId, setMusicTrackId, savedId, setSavedId,
    hydrated, clearStory,
  } = useStory();

  const [loggingOut, setLoggingOut] = React.useState(false);
  const music = useMusicPlayer({ initialTrackId: musicTrackId, onTrackChange: setMusicTrackId });
  const [audioLoading, setAudioLoading] = React.useState(false);
  const [savingStory, setSavingStory] = React.useState(false);
  const [voices, setVoices] = React.useState<VoiceOption[]>([]);
  const [loadingVoices, setLoadingVoices] = React.useState(false);
  const [previewing, setPreviewing] = React.useState<string | null>(null);
  const [namedVoices, setNamedVoices] = React.useState<NamedVoiceData[]>([]);
  const previewSoundRef = React.useRef<any>(null);
  const previewObjectUrlRef = React.useRef<string | null>(null);

  const menuItems = buildMenuItems(t);
  const greetingName = React.useMemo(() => {
    if (!user) return '';
    const base = (user.first_name || user.email || '').trim();
    if (!base) return '';
    return base.split(' ')[0];
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

  React.useEffect(() => {
    return () => {
      if (previewSoundRef.current) {
        previewSoundRef.current.unloadAsync?.().catch(() => {});
      }
      if (previewObjectUrlRef.current && Platform.OS === 'web') {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      // La preferencia global de voz y la sesión resumida ya se aplican en StoryProvider al montar la app
      // (en ese orden: pref primero, sesión después si existe) — acá solo cargamos la lista de voces
      // disponibles para mostrar. Importante: NO tocar `voiceId` acá con un default propio, porque este
      // efecto corre cada vez que se entra a esta pantalla y pisaría el voiceId ya restaurado de la sesión.
      setLoadingVoices(true);
      try {
        const list = await fetchVoices();
        if (alive) {
          const finalList = list.length >= 3 ? list : [
            { id: 'shimmer', label: 'Voz tierna (Shimmer)', description: 'Dulce y amable', idealFor: '', timbre: '' },
            { id: 'nova', label: 'Voz aventura (Nova)', description: 'Expresiva y dinamica', idealFor: '', timbre: '' },
            { id: 'alloy', label: 'Voz calida (Alloy)', description: 'Narrador neutro y cercano', idealFor: '', timbre: '' },
          ];
          setVoices(finalList);
        }
      } catch {
        // ignore
      } finally {
        if (alive) setLoadingVoices(false);
      }
      try {
        const named = await loadNamedVoices();
        if (alive) setNamedVoices(named);
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        const pref = await loadVoicePreference();
        if (active && pref) setVoiceId(pref);
        try {
          const [list, named] = await Promise.all([fetchVoices(), loadNamedVoices()]);
          if (active) { setVoices(list); setNamedVoices(named); }
        } catch {
          // ignore
        }
      })();
      return () => { active = false; };
    }, [])
  );

  const voiceList = React.useMemo<(VoiceOption & { isCustom?: boolean; referenceAudioUri?: string })[]>(() => {
    const fixed: VoiceOption[] = voices.length ? voices : [
      { id: 'shimmer', label: 'Voz tierna (Shimmer)', description: 'Dulce y amable', idealFor: '', timbre: '' },
      { id: 'nova', label: 'Voz aventura (Nova)', description: 'Expresiva y dinamica', idealFor: '', timbre: '' },
      { id: 'alloy', label: 'Voz calida (Alloy)', description: 'Narrador neutro y cercano', idealFor: '', timbre: '' },
    ];
    const custom = namedVoices.map((v) => ({
      id: `custom:${v.id}`,
      label: `🎙️ ${v.label}`,
      description: 'Voz grabada por vos',
      idealFor: 'Narración con tu propia voz o la de un familiar',
      timbre: '',
      isCustom: true,
      referenceAudioUri: v.localUri,
    }));
    return [...fixed, ...custom];
  }, [voices, namedVoices]);

  const selectedVoiceEntry = React.useMemo(
    () => voiceList.find((v) => v.id === voiceId) || null,
    [voiceList, voiceId]
  );

  const voiceLabel = React.useMemo(() => {
    return VOICE_LABELS[voiceId] || selectedVoiceEntry?.label || voiceId;
  }, [voiceId, selectedVoiceEntry]);

  const currentAudioUri = audioMap[voiceId] || null;

  const handleNarrationDownload = React.useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Usa la app móvil', 'La descarga de audio funciona en dispositivo o emulador, no en web.');
      return;
    }
    if (!storyText?.trim()) { Alert.alert(t.alert_missing_story_title, t.alert_missing_story_msg); return; }
    const currentVoiceId = voiceId || 'shimmer';
    const cleanedMap = sanitizeAudioMap(audioMap);
    if (Object.keys(cleanedMap).length !== Object.keys(audioMap).length) {
      setAudioMap(cleanedMap);
    }
    setAudioLoading(true);
    try {
      const res = await downloadNarrationToGallery({
        storyText,
        voiceId: currentVoiceId,
        locale: 'es-LATAM',
        referenceAudioUri: selectedVoiceEntry?.referenceAudioUri,
      });
      // Guardamos SIEMPRE `fileUri` (documentDirectory, nuestro) y no el asset de galería: ese
      // el usuario lo puede borrar desde la galería, y ademas en iOS es un `ph://` que despues
      // no podemos copiar a la carpeta del cuento.
      setAudioMap((prev) => ({ ...prev, [currentVoiceId]: res.fileUri }));
      Alert.alert(t.alert_narration_ready_title, t.alert_narration_ready_msg);
    } catch (e: any) {
      Alert.alert('No se pudo narrar', e?.message || 'Intentalo de nuevo.');
    } finally {
      setAudioLoading(false);
    }
  }, [storyText, voiceId, selectedVoiceEntry, audioMap, setAudioMap, t]);

  const handleShareAudio = React.useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Usa la app móvil', 'Compartir audio funciona en dispositivo o emulador, no en web.');
      return;
    }
    const uri = audioMap[voiceId] || null;
    if (!uri) {
      Alert.alert(t.alert_no_audio_title, t.alert_no_audio_msg);
      return;
    }
    try {
      const canShare = await Sharing.isAvailableAsync();
      const dialogTitle = `${(theme || 'Cuento')} ${BRAND_SUFFIX}`;
      const mimeType = uri.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType, dialogTitle });
      } else {
        await Share.share({ message: dialogTitle });
      }
    } catch (e: any) {
      Alert.alert('No se pudo compartir', e?.message || 'Intentalo de nuevo.');
    }
  }, [audioMap, voiceId, theme, t]);

  const handlePreviewVoice = React.useCallback(async (id: string) => {
    try {
      setPreviewing(id);
      const customEntry = voiceList.find((v) => v.id === id && v.isCustom);
      const { Audio } = await import('expo-av');
      const uri = customEntry?.referenceAudioUri || (await fetchVoicePreview(id));
      if (previewSoundRef.current) {
        await previewSoundRef.current.stopAsync().catch(() => {});
        await previewSoundRef.current.unloadAsync().catch(() => {});
        previewSoundRef.current = null;
      }
      if (previewObjectUrlRef.current && Platform.OS === 'web') {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        previewObjectUrlRef.current = uri;
      }
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      previewSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          previewSoundRef.current = null;
          if (previewObjectUrlRef.current && Platform.OS === 'web') {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
          }
          setPreviewing(null);
        }
      });
    } catch (e: any) {
      Alert.alert('No se pudo reproducir la voz', e?.message || 'Intentalo de nuevo.');
      setPreviewing(null);
    }
  }, [voiceList]);

  const handleDeleteVoice = React.useCallback((voice: NarratorVoice) => {
    const namedId = voice.id.replace(/^custom:/, '');
    Alert.alert(
      'Borrar grabación',
      `¿Borrar la voz "${voice.label}"? Vas a poder volver a grabarla cuando quieras.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteNamedVoiceCascade(namedId, {
                currentVoiceId: voiceId,
                audioMap,
              });
              setNamedVoices((prev) => prev.filter((v) => v.id !== namedId));
              setAudioMap(result.audioMap);
              if (result.preferenceReset) setVoiceId(result.nextVoiceId);
            } catch (e: any) {
              Alert.alert('No se pudo borrar', e?.message || 'Intentalo de nuevo.');
            }
          },
        },
      ],
    );
  }, [voiceId, audioMap, setAudioMap, setVoiceId]);

  const handleSaveStory = React.useCallback(async () => {
    if (savingStory) return;
    if (Platform.OS === 'web') {
      Alert.alert('Usa la app móvil', 'Guardar el cuento completo funciona en dispositivo o emulador, no en web.');
      return;
    }
    if (!storyText?.trim()) { Alert.alert(t.alert_missing_story_title, t.alert_missing_story_msg); return; }
    setSavingStory(true);
    try {
      const voiceLabels: Record<string, string> = {};
      voiceList.forEach((v) => { voiceLabels[v.id] = v.label; });
      const entry = await saveStoryBundle({
        existingId: savedId,
        title: theme?.trim() || 'Tu cuento',
        story: storyText,
        meta,
        illustrations: illustrations.map((item) => ({ slot: item.slot, label: item.label, uri: item.uri ?? null })),
        audioMap: sanitizeAudioMap(audioMap),
        voiceLabels,
        musicTrackId: music.currentTrack.id,
      });
      setSavedId(entry.id);
      Alert.alert(
        'Cuento guardado',
        entry.hasAudio
          ? 'Lo vas a encontrar en "Cuentos guardados", listo para volver a escucharlo.'
          : 'Lo vas a encontrar en "Cuentos guardados". Todavía no tiene narración: generala y volvé a guardar.',
      );
    } catch (e: any) {
      const message = e?.message || 'No se pudo guardar el cuento.';
      if (typeof message === 'string' && message.toLowerCase().includes('sqlite_full')) {
        Alert.alert('Sin espacio', 'Tu biblioteca está llena. Borrá cuentos guardados o liberá espacio en el dispositivo.');
      } else {
        Alert.alert('Ups', message);
      }
    } finally {
      setSavingStory(false);
    }
  }, [savingStory, storyText, theme, meta, illustrations, audioMap, voiceList, music, savedId, setSavedId, t]);

  if (!hydrated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GradientBG>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={THEME.accent} />
          </View>
        </GradientBG>
      </GestureHandlerRootView>
    );
  }

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

          {!storyText?.trim() ? (
            <CardBox title="Música y narrador">
              <Text style={{ color: THEME.textDim }}>
                No hay un cuento activo. Volvé a "Inicio" para generar uno.
              </Text>
            </CardBox>
          ) : (
            <CardBox title="Música y narrador">
              <Text style={{ color: THEME.textDim, marginBottom: 6, fontWeight: '700' }}>Tu cuento</Text>
              <MusicBar player={music} theme={THEME} />
              <View style={{ height: 12 }} />
              <StoryReader
                text={storyText}
                locale="es-AR"
                voiceLabel={voiceLabel}
                voiceId={voiceId}
                referenceAudioUri={selectedVoiceEntry?.referenceAudioUri}
                audioUri={currentAudioUri}
                onNarrationReady={(voice, uri) => setAudioMap((prev) => ({ ...prev, [voice]: uri }))}
                onNarrationStart={() => { if (!music.isPlaying) music.play(); }}
                onNarrationStop={() => { if (music.isPlaying) music.pause(); }}
              />
              <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: THEME.border }}>
                <Text style={{ color: THEME.text, fontWeight: '700', marginBottom: 8 }}>Narrador</Text>
                <Pressable
                  onPress={() => router.push('/record-voice')}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
                >
                  <Feather name="mic" size={18} color={THEME.accent} />
                  <Text style={{ color: THEME.accent, marginLeft: 6, fontWeight: '700' }}>Grabar mi voz</Text>
                </Pressable>
                <NarratorPicker
                  voices={voiceList}
                  voiceId={voiceId}
                  voiceLabel={voiceLabel}
                  loading={loadingVoices}
                  loadingLabel={t.settings_loading_voices}
                  previewingId={previewing}
                  previewingLabel={t.settings_playing}
                  onSelect={(id) => {
                    setVoiceId(id);
                    saveVoicePreference(id).catch(() => {});
                  }}
                  onPreview={handlePreviewVoice}
                  onDelete={handleDeleteVoice}
                />

                <View style={{ height: 12 }} />
                <Text style={{ color: THEME.textDim, marginBottom: 6, flexShrink: 1 }}>Narracion (guarda en galeria)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <Pressable onPress={handleNarrationDownload} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, flexShrink: 1 }}>
                    <Feather name="bookmark" size={20} color={THEME.accent} />
                    <Text style={{ color: THEME.accent, marginLeft: 6, flexShrink: 1 }}>
                      {audioLoading ? 'Narrando...' : currentAudioUri ? t.alert_narration_ready_title : 'Guardar narracion'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={handleShareAudio} style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                    <Feather name="share-2" size={20} color={THEME.accent} />
                    <Text style={{ color: THEME.accent, marginLeft: 6, flexShrink: 1 }}>{t.btn_share} audio</Text>
                  </Pressable>
                </View>

                <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 14 }} />

                <Pressable
                  onPress={handleSaveStory}
                  disabled={savingStory}
                  style={{ flexDirection: 'row', alignItems: 'center', opacity: savingStory ? 0.5 : 1 }}
                >
                  <Feather name="folder-plus" size={20} color={THEME.accent} />
                  <Text style={{ color: THEME.accent, marginLeft: 6, fontWeight: '700', flexShrink: 1 }}>
                    {savingStory ? 'Guardando...' : 'Guardar cuento completo'}
                  </Text>
                </Pressable>
                <Text style={{ color: THEME.textDim, marginTop: 6, fontSize: 12 }}>
                  Guarda el texto, las ilustraciones, el PDF, la música elegida y la narración ya
                  generada en “Cuentos guardados”, para volver a escucharlo dentro de la app.
                </Text>
              </View>
            </CardBox>
          )}

          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
            <Feather name="arrow-left" size={18} color={THEME.accent} />
            <Text style={{ color: THEME.accent, marginLeft: 6 }}>Volver al cuento</Text>
          </Pressable>

          <View style={{ height: 56 }} />
        </ScrollView>
      </GradientBG>
    </GestureHandlerRootView>
  );
}
