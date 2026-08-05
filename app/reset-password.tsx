import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import { clearLastResetEmail, loadLastResetEmail, saveLastResetEmail } from '../src/auth/resetStorage';
import Card from '../src/components/Card';
import Field from '../src/components/Field';
import BrandLogo from '../src/components/BrandLogo';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';

export default function ResetPasswordScreen() {
    const { resetPassword } = useAuth();
    const { t } = useLanguage();
    const params = useLocalSearchParams<{ email?: string }>();

    const [email, setEmail] = React.useState(params.email || '');
    const [code, setCode] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // Restaurar email guardado si volvemos desde el mail o la app se reinicia
    React.useEffect(() => {
        if (params.email) {
            const normalized = params.email.toString();
            setEmail(normalized);
            saveLastResetEmail(normalized);
            return;
        }
        (async () => {
            const stored = await loadLastResetEmail();
            if (stored) setEmail(stored);
        })();
    }, [params.email]);

    React.useEffect(() => {
        if (email) saveLastResetEmail(email);
    }, [email]);

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
            feedback.error(t.msg_password_change_failed_title, res.error || t.msg_retry_hint);
        } else {
            feedback.success(t.msg_password_reset_title, t.msg_password_reset_msg);
            await clearLastResetEmail();
            router.replace('/login');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Card title="Restablecer Contraseña">
                    <BrandLogo size={110} style={{ marginBottom: 16 }} />
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
