import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth, type EstadoTwoFactor } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import Field from '../src/components/Field';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import { fmt } from '../src/i18n/format';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';
import BackupCodes from '../src/components/BackupCodes';

/** Pantalla principal de 2FA: muestra el estado y permite activar, desactivar
 *  y regenerar los códigos de respaldo. */
export default function TwoFactorScreen() {
    const { twoFactorStatus, twoFactorDisable, regenerateBackupCodes } = useAuth();
    const { t } = useLanguage();

    const [estado, setEstado] = React.useState<EstadoTwoFactor | null>(null);
    const [cargando, setCargando] = React.useState(true);
    const [password, setPassword] = React.useState('');
    const [accion, setAccion] = React.useState<'desactivar' | 'regenerar' | null>(null);
    const [enviando, setEnviando] = React.useState(false);
    const [codigosNuevos, setCodigosNuevos] = React.useState<string[] | null>(null);

    const cargar = React.useCallback(async () => {
        const res = await twoFactorStatus();
        if (res.ok && res.data) setEstado(res.data);
        setCargando(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // useFocusEffect y no useEffect: al volver del enrolamiento el estado cambió.
    useFocusEffect(
        React.useCallback(() => {
            cargar();
        }, [cargar])
    );

    const cerrarFormulario = () => {
        setAccion(null);
        setPassword('');
    };

    const onDesactivar = async () => {
        const confirmado = await feedback.dialog({
            kind: 'warning',
            title: t.twofa_disable_confirm_title,
            message: t.twofa_disable_confirm_msg,
            confirmLabel: t.twofa_deactivate,
            cancelLabel: t.msg_cancel,
            destructive: true,
        });
        if (!confirmado) return;

        setEnviando(true);
        const res = await twoFactorDisable(password);
        setEnviando(false);

        if (!res.ok) {
            feedback.error(t.msg_twofa_invalid_code_title, res.error || t.msg_retry_hint);
            return;
        }
        cerrarFormulario();
        feedback.success(t.msg_twofa_disabled_title);
        await cargar();
    };

    const onRegenerar = async () => {
        setEnviando(true);
        const res = await regenerateBackupCodes(password);
        setEnviando(false);

        if (!res.ok || !res.backupCodes) {
            feedback.error(t.msg_twofa_invalid_code_title, res.error || t.msg_retry_hint);
            return;
        }
        cerrarFormulario();
        setCodigosNuevos(res.backupCodes);
        feedback.success(t.msg_twofa_codes_regenerated_title);
        await cargar();
    };

    // Los códigos recién generados se muestran solos: no se vuelven a ver nunca.
    if (codigosNuevos) {
        return (
            <Contenedor titulo={t.twofa_backup_title} onBack={() => setCodigosNuevos(null)}>
                <BackupCodes
                    codigos={codigosNuevos}
                    onListo={() => {
                        setCodigosNuevos(null);
                        cargar();
                    }}
                />
            </Contenedor>
        );
    }

    return (
        <Contenedor titulo={t.twofa_title} onBack={() => router.back()}>
            {cargando ? (
                <Card>
                    <ActivityIndicator color={THEME.primary} />
                </Card>
            ) : (
                <>
                    <Card>
                        <Text style={{ color: THEME.textDim, marginBottom: 12 }}>{t.twofa_intro}</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Feather
                                name={estado?.enabled ? 'shield' : 'shield-off'}
                                size={20}
                                color={estado?.enabled ? THEME.success : THEME.textDim}
                            />
                            <Text
                                style={{
                                    color: estado?.enabled ? THEME.success : THEME.textDim,
                                    fontWeight: 'bold',
                                    marginLeft: 8,
                                }}
                            >
                                {estado?.enabled ? t.twofa_status_on : t.twofa_status_off}
                            </Text>
                        </View>

                        {estado?.enabled && (
                            <Text style={{ color: THEME.textDim, marginTop: 8 }}>
                                {t.twofa_backup_remaining}: {estado.backupCodesRemaining}
                            </Text>
                        )}

                        {!estado?.enabled && accion === null && (
                            <PrimaryButton
                                icon="shield"
                                label={t.twofa_activate}
                                onPress={() => router.push('/two-factor-setup')}
                            />
                        )}
                    </Card>

                    {estado?.enabled && accion === null && (
                        <Card style={{ marginTop: 12 }}>
                            <Pressable onPress={() => setAccion('regenerar')} style={{ paddingVertical: 12 }}>
                                <Text style={{ color: THEME.accent }}>{t.twofa_backup_regenerate}</Text>
                                <Text style={{ color: THEME.textDim, fontSize: 12, marginTop: 2 }}>
                                    {t.twofa_backup_regenerate_warning}
                                </Text>
                            </Pressable>

                            <View style={{ height: 1, backgroundColor: THEME.border, marginVertical: 8 }} />

                            <Pressable onPress={() => setAccion('desactivar')} style={{ paddingVertical: 12 }}>
                                <Text style={{ color: THEME.error }}>{t.twofa_deactivate}</Text>
                            </Pressable>
                        </Card>
                    )}

                    {accion !== null && (
                        <Card style={{ marginTop: 12 }}>
                            <Text style={{ color: THEME.text, marginBottom: 12, fontWeight: 'bold' }}>
                                {accion === 'desactivar' ? t.twofa_deactivate : t.twofa_backup_regenerate}
                            </Text>
                            <Field
                                label={t.twofa_password_label}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                            <PrimaryButton
                                icon={accion === 'desactivar' ? 'shield-off' : 'refresh-cw'}
                                label={accion === 'desactivar' ? t.twofa_deactivate : t.twofa_backup_regenerate}
                                onPress={accion === 'desactivar' ? onDesactivar : onRegenerar}
                                disabled={password.length < 1 || enviando}
                            />
                            <Text
                                style={{ color: THEME.textDim, textAlign: 'center', marginTop: 12 }}
                                onPress={cerrarFormulario}
                            >
                                {t.msg_cancel}
                            </Text>
                        </Card>
                    )}
                </>
            )}
        </Contenedor>
    );
}

/** Cabecera compartida con las demás pantallas de 2FA. */
export function Contenedor({
    titulo,
    onBack,
    children,
}: {
    titulo: string;
    onBack: () => void;
    children: React.ReactNode;
}) {
    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={{ flex: 1, backgroundColor: THEME.bgTop }}
        >
            <View
                style={{
                    paddingTop: 50,
                    paddingHorizontal: 16,
                    paddingBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Pressable onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
                    <Feather name="arrow-left" size={24} color={THEME.text} />
                </Pressable>
                <Text style={{ color: THEME.text, fontSize: 20, fontWeight: 'bold', flex: 1 }}>
                    {titulo}
                </Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>{children}</ScrollView>
        </KeyboardAvoidingView>
    );
}

/** Helper de formato para textos con {n}. Se exporta para las otras pantallas. */
export const formatear = fmt;
