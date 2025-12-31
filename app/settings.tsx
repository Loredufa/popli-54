import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import { THEME } from '../src/theme';
import AppNavbar from '../src/components/AppNavbar';
import { MENU_ITEMS } from '../src/constants/menu';
import { fetchVoices, fetchVoicePreview, type VoiceOption } from '../src/lib/ttsClient';
import { loadVoicePreference, saveVoicePreference } from '../src/lib/voicePrefs';

export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const [voices, setVoices] = React.useState<VoiceOption[]>([]);
    const [selectedVoice, setSelectedVoice] = React.useState<string>('alloy');
    const [loadingVoices, setLoadingVoices] = React.useState(false);
    const [previewing, setPreviewing] = React.useState<string | null>(null);
    const soundRef = React.useRef<Audio.Sound | null>(null);

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

    const handlePreview = React.useCallback(async (id: string) => {
      try {
        setPreviewing(id);
        const uri = await fetchVoicePreview(id);
        if (soundRef.current) {
          await soundRef.current.stopAsync().catch(() => {});
          await soundRef.current.unloadAsync().catch(() => {});
        }
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        soundRef.current = sound;
      } catch (e) {
        // ignore preview error
      } finally {
        setPreviewing(null);
      }
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <AppNavbar title="Configuración" menuItems={MENU_ITEMS} onLogout={handleLogout} />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                <Card title="Configuración">
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: THEME.text, fontSize: 18, fontWeight: 'bold' }}>
                            {user?.first_name} {user?.last_name}
                        </Text>
                        <Text style={{ color: THEME.textDim }}>{user?.email}</Text>
                    </View>

                    <MenuItem
                        icon="lock"
                        label="Cambiar Contraseña"
                        onPress={() => router.push('/change-password')}
                    />

                    <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 10 }} />

                    <Text style={{ color: THEME.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Voces narradoras</Text>
                    {loadingVoices ? (
                      <Text style={{ color: THEME.textDim, marginBottom: 12 }}>Cargando voces...</Text>
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
                              {previewing === voice.id ? 'Reproduciendo...' : 'Escuchar demo'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}

                    <Text style={{ color: THEME.textDim, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                        Versión 1.0.0
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
