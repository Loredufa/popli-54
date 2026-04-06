import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../src/auth/AuthProvider';
import { LanguageProvider } from '../src/i18n/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="register" options={{ presentation: 'card', headerShown: false }} />
          {/* Tu modal: si querés que sea modal real */}
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}

