import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';

export default function ResetPasswordScreen() {
    const { resetPassword } = useAuth();
    const params = useLocalSearchParams<{ email?: string }>();

    const [email, setEmail] = React.useState(params.email || '');
    const [code, setCode] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const canSubmit =
        /\S+@\S+\.\S+/.test(email) &&
        code.length >= 4 &&
        newPassword.length >= 6 &&
        newPassword === confirmPassword;

    const onSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        const res = await resetPassword(email, code, newPassword);
        setLoading(false);
        if (!res.ok) {
            Alert.alert('Error', res.error);
        } else {
            Alert.alert('Éxito', 'Contraseña restablecida. Ahora podés iniciar sesión.');
            router.replace('/login');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Card title="Restablecer Contraseña">
                    <Text style={{ color: THEME.textDim, marginBottom: 20 }}>
                        Ingresá el código que te enviamos por email y tu nueva contraseña.
                    </Text>

                    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    <Field label="Código" value={code} onChangeText={setCode} keyboardType="number-pad" />
                    <Field label="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                    <Field label="Confirmar Nueva Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                    <PrimaryButton label={loading ? 'Restableciendo...' : 'Restablecer'} onPress={onSubmit} disabled={!canSubmit || loading} />
                    <View style={{ height: 8 }} />
                    <Text style={{ color: THEME.textDim, textAlign: 'center' }} onPress={() => router.back()}>Cancelar</Text>
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
