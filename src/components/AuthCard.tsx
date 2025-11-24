import * as React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import * as Theme from '../theme';

// THEME y componentes opcionales del theme (Chip/Stars)
const THEME = (Theme as any).THEME ?? (Theme as any).default ?? {};
const Chip = (Theme as any).Chip;
const Stars = (Theme as any).Stars;

// Botón minimalista que respeta colores del tema
function Button({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: { pressed: boolean }) => ({
        backgroundColor: disabled ? '#2a3d63' : THEME.primary ?? '#84E1FF',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        opacity: pressed ? 0.95 : 1,
        shadowColor: THEME.primary ?? '#84E1FF',
        shadowOpacity: pressed ? 0.15 : 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      })}
    >
      <Text style={{ color: '#0b1226', fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export default function AuthCard() {
  const { user, loading, forgotPassword, logout } = useAuth();
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Ejemplo simple de “etiquetas” si tu theme trae Chip:
  const [role, setRole] = React.useState<'invitado' | 'creador'>('invitado');

  if (user) {
    return (
      <View
        style={{
          backgroundColor: THEME.card ?? 'rgba(255,255,255,0.06)',
          borderColor: THEME.border ?? 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          borderRadius: 16,
          padding: 14,
          overflow: 'hidden',
        }}
      >
        {Stars ? (
          <View style={{ position: 'absolute', inset: 0 }}>
            <Stars />
          </View>
        ) : null}

        <Text style={{ color: THEME.textDim ?? '#a9b4d0', marginBottom: 6 }}>
          Sesión iniciada
        </Text>
        <Text style={{ color: THEME.text ?? '#e6eef9', fontWeight: '700' }}>
          {user.email}
        </Text>

        {/* Etiquetas (solo si existe Chip en tu theme) */}
        {Chip ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Chip label="Invitado" selected={role === 'invitado'} onPress={() => setRole('invitado')} />
            <Chip label="Creador" selected={role === 'creador'} onPress={() => setRole('creador')} />
          </View>
        ) : null}

        <Button label="Cerrar sesión" onPress={logout} />
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: THEME.card ?? 'rgba(255,255,255,0.06)',
        borderColor: THEME.border ?? 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        overflow: 'hidden',
      }}
    >
      {Stars ? (
        <View style={{ position: 'absolute', inset: 0 }}>
          <Stars />
        </View>
      ) : null}

      <Text style={{ color: THEME.textDim ?? '#a9b4d0', marginBottom: 6 }}>
        Ingresá tu email para continuar
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tucorreo@dominio.com"
        placeholderTextColor={THEME.textDim ?? '#a9b4d0'}
        style={{
          color: THEME.text ?? '#e6eef9',
          backgroundColor: 'transparent',
          borderColor: THEME.border ?? 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />

      {/* Etiquetas (solo si existe Chip en tu theme) */}
      {Chip ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Chip label="Invitado" selected={role === 'invitado'} onPress={() => setRole('invitado')} />
          <Chip label="Creador" selected={role === 'creador'} onPress={() => setRole('creador')} />
        </View>
      ) : null}

      {loading || sending ? (
        <View style={{ marginTop: 12 }}>
          <ActivityIndicator color={THEME.primary ?? '#84E1FF'} />
        </View>
      ) : (
        <Button
          label="Enviar enlace"
          onPress={async () => {
            setSending(true);
            const response = await forgotPassword(email.trim());
            if (!response.ok && response.error) {
              console.warn('Auth error:', response.error);
            }
            setSending(false);
          }}
          disabled={!email.trim()}
        />
      )}
    </View>
  );
}
