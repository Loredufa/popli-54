import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { THEME } from '../theme';

export type FieldProps = {
  label: string;
  style?: any;
  secureTextEntry?: boolean;
  [key: string]: any;
};

/**
 * Campo de formulario compartido por las pantallas de auth.
 *
 * Estaba duplicado literalmente en login, register, reset-password y
 * change-password (mas una variante recortada en modal), asi que cualquier
 * ajuste habia que hacerlo cinco veces.
 *
 * Cuando `secureTextEntry` esta activo agrega el toggle de ojo para mostrar y
 * ocultar la contrasena.
 */
export default function Field({ label, style, secureTextEntry, ...rest }: FieldProps) {
  const isPassword = Boolean(secureTextEntry);
  const [hidden, setHidden] = React.useState(isPassword);

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: THEME.textDim, marginBottom: 6 }}>{label}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          {...rest}
          placeholderTextColor={THEME.textDim}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          style={[
            {
              color: THEME.text,
              borderColor: THEME.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
              paddingRight: isPassword ? 40 : 10,
            },
            style,
          ]}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden(prev => !prev)}
            hitSlop={10}
            style={{ position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center' }}
          >
            <Feather name={hidden ? 'eye' : 'eye-off'} size={20} color={THEME.textDim} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
