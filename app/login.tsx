import { router, type Href } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import Field from '../src/components/Field';
import BrandLogo from '../src/components/BrandLogo';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';

const MAKER_ROUTE = '/maker' as Href;

export default function LoginScreen() {
  const { login } = useAuth();   // placeholder actual; luego lo cambiamos por tu API
  const { t } = useLanguage();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState(''); // listo para API
  const [loading, setLoading] = React.useState(false);

  const canSubmit = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

   const onSubmit = async () => {
   if (!canSubmit) return;
   setLoading(true);
   const res = await login(email, password);
   setLoading(false);
   if (!res.ok) return feedback.error(t.msg_login_failed_title, res.error || t.msg_retry_hint);
   // Contraseña correcta pero falta el segundo factor: todavía no hay sesión.
   if (res.mfaRequired) return router.push('/two-factor-challenge');
   router.replace(MAKER_ROUTE);
 };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: THEME.bgTop }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card title="Iniciar sesión">
          <BrandLogo size={120} style={{ marginBottom: 16 }} />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
          <Text style={{ color: THEME.accent, textAlign: 'right', marginBottom: 10 }}
            onPress={() => router.push({ pathname: '/modal', params: { topic: 'forgot' } })}
          >
            ¿Olvidaste tu contraseña?
          </Text>
          <PrimaryButton label={loading ? 'Entrando...' : 'Entrar'} onPress={onSubmit} disabled={!canSubmit || loading} />
          <View style={{ height: 8 }} />
          <Text style={{ color: THEME.textDim, textAlign: 'center' }} onPress={() => router.back()}>Volver</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
