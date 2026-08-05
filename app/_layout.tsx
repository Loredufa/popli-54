import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../src/auth/AuthProvider';
import { LanguageProvider } from '../src/i18n/LanguageContext';
import { StoryProvider } from '../src/story/StoryContext';
import { PlaybackProvider } from '../src/story/PlaybackContext';
import { FeedbackProvider } from '../src/ui/feedback';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StoryProvider>
          {/* PlaybackProvider va ACÁ, por encima del <Stack>: si viviera dentro de una
              pantalla se desmontaría al navegar y cortaría la narración a la mitad. */}
          <PlaybackProvider>
          {/* FeedbackProvider por encima del <Stack> y dentro de LanguageProvider:
              los avisos sobreviven a la navegación y pueden usar las traducciones. */}
          <FeedbackProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="register" options={{ presentation: 'card', headerShown: false }} />
            {/* Tu modal: si querés que sea modal real */}
            <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="record-voice" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="story-audio" options={{ presentation: 'card', headerShown: false }} />
          </Stack>
          </FeedbackProvider>
          </PlaybackProvider>
        </StoryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

