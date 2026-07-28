// src/components/StoryReader.tsx
//
// Panel del narrador en "Música y narrador". Ya no reproduce nada: la narración vive en
// PlaybackProvider (src/story/PlaybackContext.tsx), por encima del router, así que sigue
// sonando cuando el usuario se va a leer el cuento a otra pantalla. Acá solo se dibuja.
import * as React from 'react';
import { Text, View } from 'react-native';
import NarrationControls from './NarrationControls';
import { THEME } from '../ui/theme';

type Props = {
  voiceLabel?: string;
  locale?: string;
};

export default function StoryReader({ voiceLabel, locale = 'es-AR' }: Props) {
  return (
    <View
      style={{
        backgroundColor: THEME.card,
        borderColor: THEME.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text
          style={{ color: THEME.text, fontSize: 16, fontWeight: '600', flex: 1 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Narrador: {voiceLabel || 'Pablo'}
        </Text>
      </View>
      <Text style={{ color: THEME.textDim, marginBottom: 12, fontSize: 12 }}>
        Voz {locale}
      </Text>

      <NarrationControls hint="La narración sigue sonando si vas a leer el cuento." />
    </View>
  );
}
