import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';
import AppNavbar, { NavbarMenuItem } from '../src/components/AppNavbar';
import { MENU_ITEMS } from '../src/constants/menu';

export default function ContactScreen() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [name, setName] = React.useState(user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
    const [email, setEmail] = React.useState(user?.email || '');
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const canSubmit = name.length > 0 && email.length > 0 && message.length > 0;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            // We need to get the API URL. 
            // I'll use the one from Constants which I saw in AuthProvider.
            const Constants = require('expo-constants').default;
            const API_BASE = Constants.expoConfig?.extra?.API_BASE_URL || '';
            const url = `${API_BASE}/api/contact`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al enviar');

            feedback.success(t.msg_contact_sent_title, t.msg_contact_sent_msg);
            router.back();
        } catch (e: any) {
            feedback.error(t.msg_contact_failed_title, e?.message || t.msg_retry_hint);
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <AppNavbar title="Contacto" menuItems={MENU_ITEMS} onLogout={handleLogout} />
            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <Card title="Contáctanos">
                        <Text style={{ color: THEME.textDim, marginBottom: 16 }}>
                            Envíanos tus dudas o comentarios y te responderemos a la brevedad.
                        </Text>

                        <Field label="Nombre" value={name} onChangeText={setName} />
                        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <Field label="Mensaje" value={message} onChangeText={setMessage} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />

                        <PrimaryButton label={loading ? 'Enviando...' : 'Enviar Mensaje'} onPress={handleSubmit} disabled={!canSubmit || loading} />
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

function Field({ label, style, ...rest }: any) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{label}</Text>
            <TextInput
                {...rest}
                placeholderTextColor={THEME.textDim}
                style={[
                    {
                        color: THEME.text,
                        borderColor: THEME.border,
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        backgroundColor: 'rgba(255,255,255,0.03)',
                    },
                    style,
                ]}
            />
        </View>
    );
}
