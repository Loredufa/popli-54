import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import Field from '../src/components/Field';
import BrandLogo from '../src/components/BrandLogo';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';

export default function ChangePasswordScreen() {
    const { changePassword, logout } = useAuth();
    const { t } = useLanguage();
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
            feedback.error(t.msg_password_change_failed_title, res.error || t.msg_retry_hint);
            return;
        }
        // El diálogo bloquea hasta que el usuario acepta: recién ahí se cierra la sesión.
        await feedback.dialog({
            kind: 'success',
            title: t.msg_password_changed_title,
            message: t.msg_password_changed_msg,
            confirmLabel: t.msg_ok,
        });
        await logout();
        router.replace('/login');
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
                    <BrandLogo size={110} style={{ marginBottom: 16 }} />
                    <Field label="Contraseña Actual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
                    <Field label="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                    <Field label="Confirmar Nueva Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                    <PrimaryButton label={loading ? 'Actualizando...' : 'Actualizar'} onPress={onSubmit} disabled={!canSubmit || loading} />
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
