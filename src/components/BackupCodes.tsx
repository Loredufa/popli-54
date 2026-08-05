import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import { THEME } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { feedback } from '../ui/feedback';

/**
 * Muestra los códigos de respaldo recién generados.
 *
 * Se ven UNA sola vez: en la base solo queda el hash. Por eso el botón de
 * continuar está bloqueado detrás de una confirmación explícita — si el usuario
 * los pierde junto con el teléfono, la cuenta queda inaccesible por diseño.
 */
export default function BackupCodes({
  codigos,
  onListo,
}: {
  codigos: string[];
  onListo: () => void;
}) {
  const { t } = useLanguage();
  const [confirmado, setConfirmado] = React.useState(false);

  const comoTexto = codigos.join('\n');

  const copiar = async () => {
    await Clipboard.setStringAsync(comoTexto);
    feedback.success(t.twofa_copied);
  };

  const compartir = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        await copiar();
        return;
      }
      // Sharing necesita un archivo: se escribe en cache, no en el directorio
      // de documentos, para que no quede persistido.
      const ruta = `${FileSystem.cacheDirectory}poplicuentos-codigos-respaldo.txt`;
      await FileSystem.writeAsStringAsync(ruta, comoTexto);
      await Sharing.shareAsync(ruta);
    } catch {
      await copiar();
    }
  };

  return (
    <Card>
      <Text style={{ color: THEME.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        {t.twofa_backup_title}
      </Text>
      <Text style={{ color: THEME.textDim, marginBottom: 12 }}>{t.twofa_backup_intro}</Text>

      <View
        style={{
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        }}
      >
        {codigos.map((c) => (
          <Text
            key={c}
            selectable
            style={{
              color: THEME.text,
              fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
              fontSize: 16,
              letterSpacing: 1,
              paddingVertical: 3,
            }}
          >
            {c}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <Pressable
          onPress={copiar}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: THEME.border,
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 10,
          }}
        >
          <Feather name="copy" size={16} color={THEME.accent} />
          <Text style={{ color: THEME.accent, marginLeft: 6 }}>{t.twofa_backup_copy_all}</Text>
        </Pressable>

        <Pressable
          onPress={compartir}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: THEME.border,
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 10,
          }}
        >
          <Feather name="share-2" size={16} color={THEME.accent} />
          <Text style={{ color: THEME.accent, marginLeft: 6 }}>{t.twofa_backup_share}</Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          borderColor: THEME.error,
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <Feather name="alert-triangle" size={18} color={THEME.error} />
        <Text style={{ color: THEME.error, marginLeft: 8, flex: 1 }}>
          {t.twofa_backup_warning}
        </Text>
      </View>

      <Pressable
        onPress={() => setConfirmado((v) => !v)}
        hitSlop={8}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
      >
        <Feather
          name={confirmado ? 'check-square' : 'square'}
          size={22}
          color={confirmado ? THEME.success : THEME.textDim}
        />
        <Text style={{ color: THEME.text, marginLeft: 10, flex: 1 }}>
          {t.twofa_backup_saved_check}
        </Text>
      </Pressable>

      <PrimaryButton icon="check" label={t.twofa_done} onPress={onListo} disabled={!confirmado} />
    </Card>
  );
}
