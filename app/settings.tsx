import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import { THEME } from '../src/theme';
import AppNavbar from '../src/components/AppNavbar';
import { buildMenuItems } from '../src/constants/menu';
import { fetchVoices, fetchVoicePreview, type VoiceOption } from '../src/lib/ttsClient';
import {
  loadVoicePreference,
  saveVoicePreference,
  loadNamedVoices,
  deleteNamedVoiceCascade,
  MAX_NAMED_VOICES,
  type NamedVoiceData,
} from '../src/lib/voicePrefs';
import { useStory } from '../src/story/StoryContext';
import { useLanguage } from '../src/i18n/LanguageContext';
import { AppLocale } from '../src/i18n/translations';

const AVAILABLE_LANGUAGES: { value: AppLocale; label: string }[] = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
    { value: 'ja', label: '日本語' },
];

export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const { t, appLocale, setAppLocale } = useLanguage();
    const menuItems = buildMenuItems(t);
    const { voiceId, setVoiceId, audioMap, setAudioMap } = useStory();

    const [voices, setVoices] = React.useState<VoiceOption[]>([]);
    const [selectedVoice, setSelectedVoice] = React.useState<string>('alloy');
    const [loadingVoices, setLoadingVoices] = React.useState(false);
    const [previewing, setPreviewing] = React.useState<string | null>(null);
    const [namedVoices, setNamedVoices] = React.useState<NamedVoiceData[]>([]);
    const soundRef = React.useRef<Audio.Sound | null>(null);

    useFocusEffect(
      React.useCallback(() => {
        let active = true;
        loadNamedVoices().then((v) => { if (active) setNamedVoices(v); });
        return () => { active = false; };
      }, [])
    );

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/login');
        } catch (e) {
            // ignore
        }
    };

    React.useEffect(() => {
      let alive = true;
      (async () => {
        const pref = await loadVoicePreference();
        if (alive && pref) setSelectedVoice(pref);
        setLoadingVoices(true);
        try {
          const list = await fetchVoices();
          if (alive) setVoices(list);
        } catch (e) {
          // ignore
        } finally {
          if (alive) setLoadingVoices(false);
        }
      })();
      return () => {
        alive = false;
        soundRef.current?.unloadAsync?.();
      };
    }, []);

    const handleSelectVoice = React.useCallback(async (id: string) => {
      setSelectedVoice(id);
      await saveVoicePreference(id);
    }, []);

    // Descarta muestras que llegan tarde: pedir el preview de una voz fija al backend
    // tarda, y en el medio el usuario puede haber frenado o elegido otra voz.
    const previewRunIdRef = React.useRef(0);

    const stopPreview = React.useCallback(async () => {
      previewRunIdRef.current += 1;
      setPreviewing(null);
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        await sound.stopAsync().catch(() => {});
        await sound.unloadAsync().catch(() => {});
      }
    }, []);

    /** El mismo botón alterna: si esa muestra ya suena, la frena.
     *  Antes el `finally` limpiaba `previewing` apenas arrancaba la reproducción, así que
     *  el botón nunca llegaba a mostrar que estaba sonando y no había forma de cortarla. */
    const playPreview = React.useCallback(async (key: string, resolveUri: () => Promise<string> | string) => {
      if (previewing === key) {
        await stopPreview();
        return;
      }
      await stopPreview();
      const runId = ++previewRunIdRef.current;
      try {
        setPreviewing(key);
        const uri = await resolveUri();
        if (runId !== previewRunIdRef.current) return;
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        if (runId !== previewRunIdRef.current) {
          await sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            soundRef.current = null;
            setPreviewing((current) => (current === key ? null : current));
          }
        });
      } catch {
        if (runId === previewRunIdRef.current) setPreviewing(null);
      }
    }, [previewing, stopPreview]);

    const handlePreview = React.useCallback(
      (id: string) => playPreview(id, () => fetchVoicePreview(id)),
      [playPreview],
    );

    const handlePreviewNamedVoice = React.useCallback(
      (v: NamedVoiceData) => playPreview(v.id, () => v.localUri),
      [playPreview],
    );

    const handleDeleteNamedVoice = React.useCallback((v: NamedVoiceData) => {
      Alert.alert(
        'Borrar grabación',
        `¿Borrar la voz "${v.label}"? Vas a poder volver a grabarla cuando quieras.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Borrar', style: 'destructive', onPress: async () => {
              const composedId = `custom:${v.id}`;
              // La cascada limpia tambien la narracion ya generada con esa voz y la preferencia
              // global; el estado en memoria (local y del cuento activo) lo sincronizamos aca.
              const result = await deleteNamedVoiceCascade(v.id, {
                // Si la voz borrada estaba activa en cualquiera de los dos lados, hay que resetear.
                currentVoiceId: selectedVoice === composedId || voiceId === composedId ? composedId : selectedVoice,
                audioMap,
              });
              setNamedVoices((prev) => prev.filter((x) => x.id !== v.id));
              setAudioMap(result.audioMap);
              if (selectedVoice === composedId) setSelectedVoice(result.nextVoiceId);
              if (voiceId === composedId) setVoiceId(result.nextVoiceId);
            }
          },
        ],
      );
    }, [selectedVoice, audioMap, setAudioMap, voiceId, setVoiceId]);

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <AppNavbar title={t.settings_title} menuItems={menuItems} onLogout={handleLogout} />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                <Card title={t.settings_title}>
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: THEME.text, fontSize: 18, fontWeight: 'bold' }}>
                            {user?.first_name} {user?.last_name}
                        </Text>
                        <Text style={{ color: THEME.textDim }}>{user?.email}</Text>
                    </View>

                    <MenuItem
                        icon="lock"
                        label={t.settings_change_password}
                        onPress={() => router.push('/change-password')}
                    />

                    <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 10 }} />

                    {/* App language selector */}
                    <Text style={{ color: THEME.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        {t.settings_app_language_title}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                        {AVAILABLE_LANGUAGES.map(({ value, label }) => (
                            <TouchableOpacity
                                key={value}
                                onPress={() => setAppLocale(value)}
                                style={{
                                    paddingVertical: 6,
                                    paddingHorizontal: 14,
                                    borderRadius: 999,
                                    borderWidth: 1,
                                    borderColor: appLocale === value ? THEME.primary : THEME.border,
                                    backgroundColor: appLocale === value ? 'rgba(90,160,255,0.15)' : 'transparent',
                                    marginRight: 8,
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{
                                    color: appLocale === value ? THEME.accent : THEME.textDim,
                                    fontWeight: appLocale === value ? '700' : '400',
                                    fontSize: 14,
                                }}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 10 }} />

                    <Text style={{ color: THEME.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        {t.settings_voices_title}
                    </Text>
                    {loadingVoices ? (
                      <Text style={{ color: THEME.textDim, marginBottom: 12 }}>{t.settings_loading_voices}</Text>
                    ) : voices.map((voice) => (
                      <TouchableOpacity
                        key={voice.id}
                        onPress={() => handleSelectVoice(voice.id)}
                        style={{
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: THEME.border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: THEME.text, fontSize: 15, fontWeight: '600' }}>
                              {voice.label} {selectedVoice === voice.id ? '✓' : ''}
                            </Text>
                            <Text style={{ color: THEME.textDim, fontSize: 13 }}>{voice.description}</Text>
                            <Text style={{ color: THEME.textDim, fontSize: 12 }}>{voice.idealFor}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handlePreview(voice.id)}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 10,
                              borderWidth: 1,
                              borderColor: THEME.border,
                              borderRadius: 10,
                            }}
                          >
                            <Text style={{ color: THEME.text }}>
                              {previewing === voice.id ? t.settings_stop_preview : t.settings_listen_demo}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}

                    <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 10 }} />
                    <Text style={{ color: THEME.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        Mis voces
                    </Text>
                    {namedVoices.map((v) => (
                      <View key={v.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.border }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => handleSelectVoice(`custom:${v.id}`)}>
                          <Text style={{ color: THEME.text, fontWeight: '600' }}>
                            🎙️ {v.label} {selectedVoice === `custom:${v.id}` ? '✓' : ''}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handlePreviewNamedVoice(v)} style={{ marginRight: 12 }}>
                          <Text style={{ color: THEME.text }}>
                            {previewing === v.id ? t.settings_stop_preview : t.settings_listen_demo}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteNamedVoice(v)}>
                          <Feather name="trash-2" size={18} color="#ff8080" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      disabled={namedVoices.length >= MAX_NAMED_VOICES}
                      onPress={() => router.push('/record-voice')}
                      style={{ paddingVertical: 12, opacity: namedVoices.length >= MAX_NAMED_VOICES ? 0.4 : 1 }}
                    >
                      <Text style={{ color: THEME.accent, fontWeight: '700' }}>+ Grabar nueva voz</Text>
                    </TouchableOpacity>

                    <Text style={{ color: THEME.textDim, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                        {t.settings_version}
                    </Text>
                </Card>
            </ScrollView>
        </View>
    );
}

function MenuItem({ icon, label, onPress, danger }: { icon: any; label: string; onPress: () => void; danger?: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
            }}
        >
            <Feather name={icon} size={20} color={danger ? 'red' : THEME.text} style={{ marginRight: 12 }} />
            <Text style={{ color: danger ? 'red' : THEME.text, fontSize: 16 }}>{label}</Text>
            <View style={{ flex: 1 }} />
            <Feather name="chevron-right" size={20} color={THEME.textDim} />
        </TouchableOpacity>
    );
}
