import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import { THEME } from '../src/theme';

export default function MenuScreen() {
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        Alert.alert('Cerrar Sesión', '¿Estás seguro que querés salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Salir',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/login');
                },
            },
        ]);
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: THEME.bgTop }} contentContainerStyle={{ padding: 16 }}>
            <Card title="Menú">
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
