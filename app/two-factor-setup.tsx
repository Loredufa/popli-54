import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth, type SetupTwoFactor } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import Field from '../src/components/Field';
import PrimaryButton from '../src/components/PrimaryButton';
import BackupCodes from '../src/components/BackupCodes';
import { THEME } from '../src/theme';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';
import { Contenedor } from './two-factor';

/** Agrupa el secreto de a 4 caracteres para que se pueda leer y tipear. */
function agruparSecreto(secreto: string): string {
    return secreto.replace(/(.{4})/g, '$1 ').trim();
}

export default function TwoFactorSetupScreen() {
    const { twoFactorSetup, twoFactorEnable } = useAuth();
    const { t } = useLanguage();

    const [setup, setSetup] = React.useState<SetupTwoFactor | null>(null);
    const [cargando, setCargando] = React.useState(true);
    const [codigo, setCodigo] = React.useState('');
    const [verificando, setVerificando] = React.useState(false);
    const [verQr, setVerQr] = React.useState(false);
    const [codigosRespaldo, setCodigosRespaldo] = React.useState<string[] | null>(null);

    React.useEffect(() => {
        (async () => {
            const res = await twoFactorSetup();
            if (!res.ok || !res.data) {
                feedback.error(t.msg_unknown_error, res.error || t.msg_retry_hint);
                router.back();
                return;
            }
            setSetup(res.data);
            setCargando(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Vía primaria del enrolamiento: el autenticador está en ESTE teléfono, así
     * que el QR no puede escanearse a sí mismo. El esquema `otpauth://` lo
     * registran Google Authenticator, Authy, 1Password, Microsoft Authenticator
     * y Bitwarden, así que la cuenta se agrega sola.
     *
     * try/catch y no canOpenURL: en iOS este último devuelve false para
     * esquemas no declarados en LSApplicationQueriesSchemes, y openURL igual
     * funciona.
     */
    const abrirAutenticador = async () => {
        if (!setup) return;
        try {
            await Linking.openURL(setup.otpauthUri);
        } catch {
            feedback.warning(t.twofa_open_app_failed);
            setVerQr(true);
        }
    };

    const copiarSecreto = async () => {
        if (!setup) return;
        await Clipboard.setStringAsync(setup.secret);
        feedback.success(t.twofa_copied);
    };

    const onVerificar = async () => {
        setVerificando(true);
        const res = await twoFactorEnable(codigo);
        setVerificando(false);

        if (!res.ok || !res.backupCodes) {
            feedback.error(t.msg_twofa_invalid_code_title, res.error || t.twofa_clock_hint);
            return;
        }
        setCodigosRespaldo(res.backupCodes);
    };

    if (codigosRespaldo) {
        return (
            <Contenedor titulo={t.twofa_backup_title} onBack={() => router.replace('/two-factor')}>
                <BackupCodes
                    codigos={codigosRespaldo}
                    onListo={() => {
                        feedback.success(t.msg_twofa_enabled_title, t.msg_twofa_enabled_msg);
                        router.replace('/two-factor');
                    }}
                />
            </Contenedor>
        );
    }

    return (
        <Contenedor titulo={t.twofa_title} onBack={() => router.back()}>
            {cargando || !setup ? (
                <Card>
                    <ActivityIndicator color={THEME.primary} />
                </Card>
            ) : (
                <>
                    {/* ---- Paso 1: vincular ---- */}
                    <Card>
                        <Text style={{ color: THEME.text, fontWeight: 'bold', marginBottom: 10 }}>
                            {t.twofa_step_link}
                        </Text>

                        <PrimaryButton
                            icon="external-link"
                            label={t.twofa_open_app}
                            onPress={abrirAutenticador}
                        />

                        <Text style={{ color: THEME.textDim, marginTop: 18, marginBottom: 6 }}>
                            {t.twofa_manual_secret}
                        </Text>
                        <Pressable
                            onPress={copiarSecreto}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(0,0,0,0.25)',
                                borderRadius: 12,
                                padding: 12,
                            }}
                        >
                            <Text
                                selectable
                                style={{
                                    color: THEME.text,
                                    flex: 1,
                                    fontFamily: Platform.select({
                                        ios: 'Menlo',
                                        android: 'monospace',
                                        default: 'monospace',
                                    }),
                                    letterSpacing: 1,
                                }}
                            >
                                {agruparSecreto(setup.secret)}
                            </Text>
                            <Feather name="copy" size={18} color={THEME.accent} />
                        </Pressable>

                        <Text
                            style={{ color: THEME.accent, marginTop: 14 }}
                            onPress={() => setVerQr((v) => !v)}
                        >
                            {verQr ? t.twofa_hide_qr : t.twofa_show_qr}
                        </Text>

                        {verQr && (
                            <View style={{ alignItems: 'center', marginTop: 12 }}>
                                {/* Fondo blanco con margen: sobre THEME.bgTop (#0e1630) el QR
                                    no tiene contraste ni quiet zone, y no escanea. */}
                                <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
                                    <QRCode value={setup.otpauthUri} size={200} />
                                </View>
                                <Text style={{ color: THEME.textDim, marginTop: 10, textAlign: 'center' }}>
                                    {t.twofa_qr_hint}
                                </Text>
                            </View>
                        )}
                    </Card>

                    {/* ---- Paso 2: confirmar ---- */}
                    <Card style={{ marginTop: 12 }}>
                        <Text style={{ color: THEME.text, fontWeight: 'bold', marginBottom: 6 }}>
                            {t.twofa_step_confirm}
                        </Text>
                        <Text style={{ color: THEME.textDim, marginBottom: 12 }}>
                            {t.twofa_enter_code}
                        </Text>

                        <Field
                            label={t.twofa_code_label}
                            value={codigo}
                            onChangeText={setCodigo}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoComplete="one-time-code"
                            textContentType="oneTimeCode"
                            style={{ letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
                        />

                        <PrimaryButton
                            icon="check"
                            label={t.twofa_verify}
                            onPress={onVerificar}
                            disabled={codigo.trim().length !== 6 || verificando}
                        />

                        <Text style={{ color: THEME.textDim, fontSize: 12, marginTop: 12 }}>
                            {t.twofa_clock_hint}
                        </Text>
                    </Card>
                </>
            )}
        </Contenedor>
    );
}
