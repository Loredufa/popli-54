// app/cuentos-guardados/index.tsx
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../../src/auth/AuthProvider';
import AppNavbar from '../../src/components/AppNavbar';
import { buildMenuItems } from '../../src/constants/menu';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { clearCurrentSession } from '../../src/lib/storage';
import { deleteStoryBundle, loadLibrary, loadStoryBundle, type SavedStoryEntry } from '../../src/lib/storyLibrary';
import { useStory } from '../../src/story/StoryContext';
import { CardBox, GradientBG, THEME } from '../../src/ui/theme';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function SavedStoriesScreen() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { clearStory } = useStory();
  const menuItems = buildMenuItems(t);

  const [entries, setEntries] = React.useState<SavedStoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const greetingName = React.useMemo(() => {
    if (!user) return '';
    const base = (user.first_name || user.email || '').trim();
    return base ? base.split(' ')[0] : '';
  }, [user]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await loadLibrary());
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Volver desde el detalle (o desde un guardado nuevo) tiene que reflejar la lista al dia.
  useFocusEffect(React.useCallback(() => { refresh(); }, [refresh]));

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

  const handleOpenPdf = React.useCallback(async (entry: SavedStoryEntry) => {
    if (Platform.OS === 'web') {
      Alert.alert('Usa la app móvil', 'Abrir el PDF funciona en dispositivo o emulador, no en web.');
      return;
    }
    try {
      const bundle = await loadStoryBundle(entry.id);
      if (!bundle?.pdfUri) {
        Alert.alert('Sin PDF', 'Este cuento se guardó sin PDF. Abrilo desde "Inicio" y volvé a guardarlo.');
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(bundle.pdfUri, { mimeType: 'application/pdf', dialogTitle: entry.title });
      } else {
        Alert.alert('No disponible', 'Este dispositivo no puede abrir el PDF.');
      }
    } catch (e: any) {
      Alert.alert('No se pudo abrir', e?.message || 'Intentalo de nuevo.');
    }
  }, []);

  const handleDelete = React.useCallback((entry: SavedStoryEntry) => {
    Alert.alert(
      'Borrar cuento',
      `¿Borrar "${entry.title}"? Se borran el texto, las ilustraciones y la narración guardados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStoryBundle(entry.id);
              setEntries((prev) => prev.filter((e) => e.id !== entry.id));
            } catch (e: any) {
              Alert.alert('No se pudo borrar', e?.message || 'Intentalo de nuevo.');
            }
          },
        },
      ],
    );
  }, []);

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

          <CardBox title={t.menu_saved_stories}>
            {loading ? (
              <ActivityIndicator color={THEME.accent} />
            ) : !entries.length ? (
              <Text style={{ color: THEME.textDim }}>
                Todavía no guardaste ningún cuento. Generá uno y tocá “Guardar cuento completo”.
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {entries.map((entry) => (
                  <View
                    key={entry.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: THEME.border,
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <Pressable
                      onPress={() => router.push(`/cuentos-guardados/${entry.id}` as Href)}
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 12 }}
                    >
                      {entry.coverUri ? (
                        <Image
                          source={{ uri: entry.coverUri }}
                          style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 56, height: 56, borderRadius: 10,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                          }}
                        >
                          <Feather name="book-open" size={22} color={THEME.textDim} />
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ color: THEME.text, fontWeight: '700' }} numberOfLines={1}>
                          {entry.title}
                        </Text>
                        <Text style={{ color: THEME.textDim, fontSize: 12 }} numberOfLines={1}>
                          {formatDate(entry.createdAt)}
                          {entry.metaSummary?.skill ? ` · ${entry.metaSummary.skill}` : ''}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                          <Text style={{ color: entry.hasAudio ? THEME.accent : THEME.textDim, fontSize: 12 }}>
                            {entry.hasAudio ? '🎧 con narración' : 'sin narración'}
                          </Text>
                          {entry.hasPdf ? (
                            <Text style={{ color: THEME.textDim, fontSize: 12 }}>PDF</Text>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>

                    {entry.hasPdf ? (
                      <Pressable onPress={() => handleOpenPdf(entry)} style={{ padding: 6 }} accessibilityLabel="Abrir el PDF">
                        <Feather name="file-text" size={20} color={THEME.accent} />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => handleDelete(entry)} style={{ padding: 6 }} accessibilityLabel="Borrar el cuento">
                      <Feather name="trash-2" size={20} color="#ff8080" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </CardBox>

          <View style={{ height: 56 }} />
        </ScrollView>
      </GradientBG>
    </GestureHandlerRootView>
  );
}
