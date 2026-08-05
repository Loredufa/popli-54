// app/(tabs)explore.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useApi } from '../../src/api/useApi';
import { AuthGate } from '../../src/auth/AuthProvider';
import { useLanguage } from '../../src/i18n/LanguageContext';
import { feedback } from '../../src/ui/feedback';
import Card from '../../src/components/Card';
import PrimaryButton from '../../src/components/PrimaryButton';

export default function Explore() {
  const api = useApi();
  const { t } = useLanguage();
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
        feedback.error(t.msg_profile_load_failed_title, e?.message || t.msg_retry_hint);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [api, t]);

  const updateLanguage = async () => {
    try {
      await api.put('/api/profile', { language: 'es' });
      feedback.success(t.msg_language_updated_title);
      // Opcional: refrescar los datos
      const profile = await api.get('/api/me');
      setMe(profile);
    } catch (e: any) {
      feedback.error(t.msg_profile_update_failed_title, e?.message || t.msg_retry_hint);
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
