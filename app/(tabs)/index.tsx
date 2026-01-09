// app/(tabs)/index.tsx
import { router } from 'expo-router';
import * as React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../src/auth/AuthProvider';
import Card from '../../src/components/Card';
import BrandLogo from '../../src/components/BrandLogo';
import PrimaryButton from '../../src/components/PrimaryButton';
import { THEME } from '../../src/theme';

export default function HomeScreen() {
  const { user } = useAuth();

  // Si hay sesión activa, mandamos directo al generador
  React.useEffect(() => {
    if (user) {
      router.replace('/maker');
    }
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bgTop, padding: 20, paddingTop: 100 }}>
      <Animated.View entering={FadeIn.duration(700)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <BrandLogo size={48} style={{ marginRight: 12 }} />
        <View style={{ flexShrink: 1 }}>
          <Text style={{ color: THEME.text, fontSize: 22, fontWeight: '800' }}>PopliCuentos</Text>
          <Text style={{ color: THEME.textDim }}>cuentos para dormir</Text>
        </View>
      </Animated.View>

      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <BrandLogo size={160} />
      </View>

      <Card title="Comienza ahora">
        <PrimaryButton
          label="Registrarme"
          onPress={() => router.push('/register')}
        />
        <PrimaryButton
          label="Iniciar sesión"
          onPress={() => router.push('/login')}
        />
        <PrimaryButton
          label="Probar generador"
          onPress={() => router.push('/maker')}
        />
      </Card>
    </View>
  );
}
