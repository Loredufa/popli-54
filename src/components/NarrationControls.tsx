// src/components/NarrationControls.tsx
//
// Botonera de narración (play / pausa / stop). No tiene estado propio: todo sale del
// PlaybackProvider, así que se puede renderizar en varias pantallas a la vez y las tres
// muestran lo mismo — y la narración sigue sonando aunque el usuario navegue.
import * as React from 'react';
import { Text, View } from 'react-native';
import { useNarration } from '../story/PlaybackContext';
import { useRotatingMessage } from '../lib/useRotatingMessage';
import { THEME } from '../ui/theme';
import IconButton from './IconButton';
import SparkSpinner from './SparkSpinner';

/** Se alternan mientras se genera la voz, que puede tardar varios minutos. */
export const NARRATION_WAIT_MESSAGES = [
  'Generando la voz de tu cuento...',
  'Esto puede tardar un ratito, no cierres la app...',
  'Preparando la narración...',
  'Ya falta poco...',
];

type Props = {
  /** Texto de ayuda debajo de los botones cuando no está generando. */
  hint?: string;
  compact?: boolean;
};

export default function NarrationControls({ hint, compact }: Props) {
  const { status, statusText, loading, hasSound, play, pause, stop } = useNarration();
  const waitMessage = useRotatingMessage(NARRATION_WAIT_MESSAGES, loading);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton
          icon="play"
          onPress={play}
          disabled={loading || status === 'playing'}
          size={compact ? 36 : 42}
        />
        <IconButton icon="pause" onPress={pause} disabled={!hasSound || status !== 'playing'} size={compact ? 36 : 42} />
        <IconButton icon="square" onPress={stop} disabled={!hasSound && status === 'idle'} size={compact ? 36 : 42} />
      </View>

      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <SparkSpinner />
          <Text style={{ color: THEME.textDim, fontSize: 12, flexShrink: 1 }} numberOfLines={2}>
            {waitMessage}
          </Text>
        </View>
      ) : statusText ? (
        <Text style={{ color: THEME.textDim, fontSize: 12, marginTop: 8 }}>{statusText}</Text>
      ) : hint ? (
        <Text style={{ color: THEME.textDim, fontSize: 12, marginTop: 8 }}>{hint}</Text>
      ) : null}
    </View>
  );
}
