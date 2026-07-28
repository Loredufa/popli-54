// src/components/NarratorPicker.tsx
//
// Selector de narrador con el MISMO comportamiento que MusicBar: arranca colapsado, "Elegir
// narrador" despliega la lista justo debajo, y elegir una voz vuelve a colapsarla.
//
// Antes el link "Elegir narrador" vivia en StoryReader y la lista se renderizaba en otra tarjeta
// mas abajo, expandida por defecto: el link parecia muerto.
import { Feather } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { THEME } from '../ui/theme';

export type NarratorVoice = {
  id: string;
  label: string;
  description?: string;
  isCustom?: boolean;
  referenceAudioUri?: string;
};

type Props = {
  voices: NarratorVoice[];
  voiceId: string;
  voiceLabel: string;
  loading?: boolean;
  loadingLabel?: string;
  previewingId?: string | null;
  /** Qué dice el botón mientras suena la muestra. Es una acción, no un estado: al
   *  tocarlo frena, así que debería decir "Detener", no "Sonando...". */
  previewingLabel?: string;
  onSelect: (voiceId: string) => void;
  onPreview: (voiceId: string) => void;
  /** Solo se ofrece en las voces grabadas por el usuario. */
  onDelete?: (voice: NarratorVoice) => void;
};

export default function NarratorPicker({
  voices,
  voiceId,
  voiceLabel,
  loading,
  loadingLabel = 'Cargando voces...',
  previewingId,
  previewingLabel = 'Detener',
  onSelect,
  onPreview,
  onDelete,
}: Props) {
  const [showList, setShowList] = React.useState(false);

  if (loading) {
    return <Text style={{ color: THEME.textDim }}>{loadingLabel}</Text>;
  }

  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: THEME.border,
        padding: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ color: THEME.textDim, flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
          Narrador actual: {voiceLabel}
        </Text>
        <Pressable onPress={() => setShowList((v) => !v)}>
          <Text style={{ color: THEME.accent, fontWeight: '700' }}>Elegir narrador</Text>
        </Pressable>
      </View>

      {showList ? (
        <View style={{ marginTop: 8, gap: 6 }}>
          {voices.map((v) => {
            const selected = voiceId === v.id;
            return (
              <View
                key={v.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  borderRadius: 10,
                  backgroundColor: selected ? 'rgba(159,210,255,0.08)' : 'transparent',
                }}
              >
                {/* Seleccion y Demo son hermanos, no anidados: en Android un Pressable dentro de
                    otro Pressable se come el toque del de adentro. */}
                <Pressable
                  onPress={() => {
                    onSelect(v.id);
                    setShowList(false);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}
                >
                  <Feather
                    name={selected ? 'check-circle' : 'circle'}
                    size={18}
                    color={selected ? THEME.accent : THEME.textDim}
                  />
                  <View style={{ marginLeft: 8, flex: 1, minWidth: 0 }}>
                    <Text style={{ color: THEME.text, fontWeight: '700' }} numberOfLines={1} ellipsizeMode="tail">
                      {v.label}
                    </Text>
                    {v.description ? (
                      <Text style={{ color: THEME.textDim, fontSize: 12 }} numberOfLines={2}>
                        {v.description}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>

                {/* El mismo botón alterna: mientras suena la muestra, frena. Así no hay
                    que bancarse los 20-60s enteros de una grabación para probar otra. */}
                <Pressable
                  onPress={() => onPreview(v.id)}
                  accessibilityLabel={
                    previewingId === v.id ? `Detener la muestra de ${v.label}` : `Escuchar una muestra de ${v.label}`
                  }
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  <Feather
                    name={previewingId === v.id ? 'square' : 'play'}
                    size={14}
                    color={previewingId === v.id ? '#ffc9a0' : THEME.accent}
                  />
                  <Text style={{ color: previewingId === v.id ? '#ffc9a0' : THEME.accent }}>
                    {previewingId === v.id ? previewingLabel : 'Demo'}
                  </Text>
                </Pressable>

                {v.isCustom && onDelete ? (
                  <Pressable
                    onPress={() => onDelete(v)}
                    accessibilityLabel={`Borrar la voz ${v.label}`}
                    style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                  >
                    <Feather name="trash-2" size={18} color="#ff8080" />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
