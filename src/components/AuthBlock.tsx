// src/components/AuthBlock.tsx
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import PrimaryButton from '../components/PrimaryButton';
import { THEME } from '../theme';

export default function AuthBlock() {
  const { user, logout } = useAuth();

  return (
    <View
      style={{
        backgroundColor: THEME.card,
        borderColor: THEME.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        gap: 10,
      }}
    >
      <Text
        style={{
          color: THEME.text,
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 8,
        }}
      >
        Autenticación
      </Text>

      {user ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: THEME.text }}>
            Sesión:{' '}
            <Text style={{ fontWeight: '700' }}>{user.email}</Text>
          </Text>

          <PrimaryButton
            label="Ir al generador"
            onPress={() => router.push('/maker')}
          />

          <PrimaryButton
            label="Cerrar sesión"
            onPress={logout}
          />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <PrimaryButton
            label="Registrarme"
            onPress={() => router.push('/register')}
          />
          <PrimaryButton
            label="Iniciar sesión"
            onPress={() => router.push('/login')}
          />
        </View>
      )}
    </View>
  );
}
