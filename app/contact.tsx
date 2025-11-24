import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import AppNavbar, { NavbarMenuItem } from '../src/components/AppNavbar';
import { MENU_ITEMS } from '../src/constants/menu';

export default function ContactScreen() {
    const { user, logout } = useAuth();
    const [name, setName] = React.useState(user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
    const [email, setEmail] = React.useState(user?.email || '');
    const [message, setMessage] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const canSubmit = name.length > 0 && email.length > 0 && message.length > 0;

    const onSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            // Assuming we have a helper or using fetch directly for now. 
            // Since AuthProvider doesn't have a generic 'post' exposed publicly for non-auth routes easily without typing, 
            // we'll use the one from AuthProvider if available or just fetch.
            // Actually, let's use a direct fetch to the API.
            // We need the API_BASE_URL. It's usually in AuthProvider or constants.
            // For now, I'll assume relative path works if proxy is set up, or I'll need to grab the base URL.
            // Let's try to use a simple fetch with the relative path since we have the proxy setup in maker.tsx, 
            // but here we might not have it. 
            // Let's just use the same logic as in AuthProvider or similar.
            // For simplicity in this step, I will assume the proxy works or use the hardcoded localhost if needed, 
            // but better to use the AuthProvider's context if I could. 
            // Wait, I can't access `post` from `useAuth` if it's not exposed.
            // I'll implement a local fetcher here or expose `post` in AuthProvider later if needed.
            // For now, let's try to use the global fetch and assume the proxy handles '/api'.

            // NOTE: In a real app, we should import the API client. 
            // I'll use a direct fetch to '/api/contact' and hope the proxy setup in app.json handles it 
            // or if we are in Expo Go, we might need the full URL.
            // I'll try to grab the base URL from Expo constants if possible.

            const response = await fetch(process.env.EXPO_PUBLIC_API_URL + '/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message }),
            });

            // Fallback for dev if env var is not set (common in this project structure)
            // Actually, let's look at how maker.tsx does it. It uses `fetchJSON` with proxy logic.
            // I'll just use a simple fetch for now and if it fails I'll copy the logic.
            // But wait, I don't have the full URL here.
            // I will use a hardcoded check or just try relative.

            // Re-using logic from AuthProvider would be best but it's private.
            // Let's just try to fetch to the likely endpoint.

            // Hack: accessing internal API_BASE_URL from Constants if possible or just hardcoding for this task 
            // since I can't easily import the helper.
            // Actually, I'll just write a small helper here.

            const API_URL = 'http://localhost:3000/api/contact'; // Default for local
            // In production/device this will fail. 
            // I should probably expose the `request` method from AuthProvider or similar.
            // For now, I will put a placeholder and ask the user to verify, or better, 
            // I will copy the `API_BASE_URL` logic from `src/auth/AuthProvider.tsx` which I saw earlier.

            // ... logic inside component ...
        } catch (e) {
            Alert.alert('Error', 'No se pudo enviar el mensaje.');
        }
        // ...
    };

    // Re-implementing fetch logic properly below
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

            Alert.alert('Mensaje Enviado', 'Gracias por contactarnos.');
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Ocurrió un error');
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
