import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import BrandLogo from '../src/components/BrandLogo';
import { THEME } from '../src/theme';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';

export default function MenuScreen() {
    const { logout, user } = useAuth();
    const { t } = useLanguage();

    const handleLogout = async () => {
        const confirmed = await feedback.dialog({
            kind: 'warning',
            title: t.msg_logout_confirm_title,
            message: t.msg_logout_confirm_msg,
            cancelLabel: t.msg_cancel,
            confirmLabel: t.msg_exit,
            destructive: true,
        });
        if (!confirmed) return;
        try {
            await logout();
            router.replace('/login');
        } catch (e: any) {
            feedback.error(t.msg_logout_failed_title, e?.message || t.msg_retry_hint);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: THEME.bgTop }} contentContainerStyle={{ padding: 16 }}>
            <Card title="Menú">
                <BrandLogo size={110} style={{ marginBottom: 16 }} />
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: THEME.text, fontSize: 18, fontWeight: 'bold' }}>
                        {user?.first_name} {user?.last_name}
                    </Text>
                    <Text style={{ color: THEME.textDim }}>{user?.email}</Text>
                </View>

                <MenuItem
                    icon="lock"
                    label="Cambiar Contraseña"
                    onPress={() => router.push('/change-password')}
                />

                <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 10 }} />

                <MenuItem
                    icon="log-out"
                    label="Cerrar Sesión"
                    onPress={handleLogout}
                    danger
                />
            </Card>
        </ScrollView>
    );
}

function MenuItem({ icon, label, onPress, danger }: { icon: any; label: string; onPress: () => void; danger?: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
            }}
        >
            <Feather name={icon} size={20} color={danger ? 'red' : THEME.text} style={{ marginRight: 12 }} />
            <Text style={{ color: danger ? 'red' : THEME.text, fontSize: 16 }}>{label}</Text>
            <View style={{ flex: 1 }} />
            <Feather name="chevron-right" size={20} color={THEME.textDim} />
        </TouchableOpacity>
    );
}
