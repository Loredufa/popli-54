import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';

const MAKER_ROUTE = '/maker' as Href;

export default function LoginScreen() {
  const { login } = useAuth();   // placeholder actual; luego lo cambiamos por tu API
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState(''); // listo para API
  const [loading, setLoading] = React.useState(false);

  const canSubmit = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

   const onSubmit = async () => {
   if (!canSubmit) return;
   setLoading(true);
   const res = await login(email, password);
   setLoading(false);
   if (!res.ok) return Alert.alert('No se pudo iniciar sesiÃ³n', res.error);
   router.replace(MAKER_ROUTE);
 };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: THEME.bgTop }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card title="Iniciar sesión">
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

type FieldProps = {
  label: string;
  style?: any;
  secureTextEntry?: boolean;
  [key: string]: any;
};

function Field({ label, style, secureTextEntry, ...rest }: FieldProps) {
  const isPassword = Boolean(secureTextEntry);
  const [hidden, setHidden] = React.useState(isPassword);
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          {...rest}
          placeholderTextColor={THEME.textDim}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          style={[
            {
              color: THEME.text,
              borderColor: THEME.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
              paddingRight: isPassword ? 40 : 10,
            },
            style,
          ]}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden(prev => !prev)}
            hitSlop={10}
            style={{ position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center' }}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={THEME.textDim} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

