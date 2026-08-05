// app/modal.tsx
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { useApi } from '../src/api/useApi';
import { saveLastResetEmail } from '../src/auth/resetStorage';
import Card from '../src/components/Card';
import Field from '../src/components/Field';
import BrandLogo from '../src/components/BrandLogo';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';

const EXTRA = (Constants.expoConfig?.extra as any) || {};
const FORGOT_PATH = EXTRA.FORGOT_PATH || '/api/forgot-password';

export default function ModalScreen() {
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const api = useApi();
  const { t } = useLanguage();

  // Si querés usar este modal para varias cosas, discriminamos por "topic"
  const isForgot = topic === 'forgot' || !topic;

  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const canSubmit = /\S+@\S+\.\S+/.test(email);

  const submitForgot = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      // Tu API debe enviar el mail de recuperación (Supabase o lo que uses)
      await api.post(FORGOT_PATH, { email: normalizedEmail });
      await saveLastResetEmail(normalizedEmail);
      feedback.success(t.msg_reset_link_sent_title, t.msg_reset_link_sent_msg);
      router.push({ pathname: '/reset-password', params: { email: normalizedEmail } });
    } catch (e: any) {
      feedback.error(t.msg_reset_link_failed_title, e?.message || t.msg_retry_hint);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: THEME.bgTop }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {isForgot ? (
          <Card title="Recuperar contraseña">
            <BrandLogo size={110} style={{ marginBottom: 16 }} />
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <PrimaryButton label={loading ? 'Enviando…' : 'Enviar enlace'} onPress={submitForgot} disabled={!canSubmit || loading} />
            <View style={{ height: 16 }} />
            <Text
              style={{ color: THEME.accent, textAlign: 'center', marginBottom: 10 }}
              onPress={async () => {
                await saveLastResetEmail(email);
                router.push({ pathname: '/reset-password', params: { email } });
              }}
            >
              Ya tengo un código
            </Text>
            <Text style={{ color: THEME.textDim, textAlign: 'center' }} onPress={() => router.back()}>
              Cerrar
            </Text>
          </Card>
        ) : (
          <Card title="Ayuda">
            <BrandLogo size={110} style={{ marginBottom: 16 }} />
            <Text style={{ color: THEME.text }}>
              Si algo falla, revisá la URL de la API en <Text style={{ fontWeight: '700' }}>app.json</Text>.
            </Text>
            <View style={{ height: 8 }} />
            <Text style={{ color: THEME.textDim, textAlign: 'center' }} onPress={() => router.back()}>
              Cerrar
            </Text>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
