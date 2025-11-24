import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
// luego esto apuntarÃ¡ a API a travÃ©s de tu AuthProvider actualizado
import { useAuth } from '../src/auth/AuthProvider';


export default function RegisterScreen() {
  const { register } = useAuth();  // mientras definimos tu API real
  const [firstName, setFirstName] = React.useState('');
  const [lastName,  setLastName]  = React.useState('');
  const [email,     setEmail]     = React.useState('');
  const [country,   setCountry]   = React.useState('');
  const [phone,     setPhone]     = React.useState('');
  const [language,  setLanguage]  = React.useState('es');
  const [password,  setPassword]  = React.useState('');
  const [loading,   setLoading]   = React.useState(false);

  const canSubmit =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    country.trim().length >= 2 &&
    language.trim().length >= 2 &&
    password.length >= 6;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const res = await register({
      first_name: firstName, last_name: lastName, email,
      country, phone, language, password,
    });
    setLoading(false);
    if (!res.ok) return Alert.alert('No se pudo registrar', res.error);
    router.replace('/maker');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: THEME.bgTop }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card title="Crear cuenta">
          <Field label="Nombre" value={firstName} onChangeText={setFirstName} />
          <Field label="Apellido" value={lastName} onChangeText={setLastName} />
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Field label="Pais" value={country} onChangeText={setCountry} />
          <Field label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Idioma (es, en)" value={language} onChangeText={setLanguage} autoCapitalize="none" />
          <Field label="Crear contraseña" value={password} onChangeText={setPassword} secureTextEntry />
          <PrimaryButton label={loading ? 'Creando...' : 'Crear cuenta'} onPress={onSubmit} disabled={!canSubmit || loading} />
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

