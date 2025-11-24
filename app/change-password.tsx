import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';

export default function ChangePasswordScreen() {
    const { changePassword, logout } = useAuth();
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const canSubmit =
        currentPassword.length >= 1 &&
        newPassword.length >= 6 &&
        newPassword === confirmPassword;

    const onSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        const res = await changePassword(currentPassword, newPassword);
        setLoading(false);
        if (!res.ok) {
            Alert.alert('Error', res.error);
        } else {
            Alert.alert(
                'Contraseña Actualizada',
                'Tu contraseña ha sido cambiada exitosamente. Por favor inicia sesión nuevamente.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            await logout();
                            router.replace('/login');
                        }
                    }
                ]
            );
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Pressable onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }}>
                    <Feather name="arrow-left" size={24} color={THEME.text} />
                </Pressable>
                <Text style={{ color: THEME.text, fontSize: 20, fontWeight: 'bold' }}>Cambiar Contraseña</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Card>
                    <Field label="Contraseña Actual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
                    <Field label="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                    <Field label="Confirmar Nueva Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                    <PrimaryButton label={loading ? 'Actualizando...' : 'Actualizar'} onPress={onSubmit} disabled={!canSubmit || loading} />
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
