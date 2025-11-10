// app/(tabs)explore.tsx
import React from 'react';
import { Alert, Text, View } from 'react-native';
import { useApi } from '../../src/api/useApi';
import { AuthGate } from '../../src/auth/AuthProvider';
import Card from '../../src/components/Card';
import PrimaryButton from '../../src/components/PrimaryButton';

export default function Explore() {
  const api = useApi();
  const [me, setMe] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Carga el perfil al montar
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const profile = await api.get('/api/me');
        if (alive) setMe(profile);
      } catch (e: any) {
        Alert.alert('Error al cargar perfil', e.message || 'No se pudo cargar /api/me');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [api]);

  const updateLanguage = async () => {
    try {
      await api.put('/api/profile', { language: 'es' });
      Alert.alert('Listo', 'Idioma actualizado a ES');
      // Opcional: refrescar los datos
      const profile = await api.get('/api/me');
      setMe(profile);
    } catch (e: any) {
      Alert.alert('Error al actualizar', e.message || 'No se pudo actualizar /api/profile');
    }
  };

  return (
    <AuthGate
      loadingFallback={<Text style={{ color: '#b5c3e6', padding: 16 }}>Cargando sesión…</Text>}
      fallback={
        <View style={{ padding: 16 }}>
          <Card title="Acceso restringido">
            <Text style={{ color: '#b5c3e6' }}>
              Necesitás iniciar sesión para explorar esta sección.
              Volvé a Home y tocá “Iniciar sesión”.
            </Text>
          </Card>
        </View>
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        <Card title="Mi perfil">
          {loading ? (
            <Text style={{ color: '#b5c3e6' }}>Cargando…</Text>
          ) : (
            <Text style={{ color: '#e7eefc', fontFamily: 'monospace' }}>
              {JSON.stringify(me, null, 2)}
            </Text>
          )}
          <View style={{ height: 12 }} />
          <PrimaryButton label="Poner idioma en ES" onPress={updateLanguage} />
        </Card>

        <Card title="Explore">
          <Text style={{ color: '#e7eefc' }}>¡Contenido premium desbloqueado! 🎉</Text>
        </Card>
      </View>
    </AuthGate>
  );
}
