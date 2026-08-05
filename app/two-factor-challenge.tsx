import { router, type Href } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import Field from '../src/components/Field';
import BrandLogo from '../src/components/BrandLogo';
import PrimaryButton from '../src/components/PrimaryButton';
import { THEME } from '../src/theme';
import { fmt } from '../src/i18n/format';
import { useLanguage } from '../src/i18n/LanguageContext';
import { feedback } from '../src/ui/feedback';
import { Contenedor } from './two-factor';

const MAKER_ROUTE = '/maker' as Href;

/**
 * Segundo paso del login: la contraseña ya se validó y falta el código.
 *
 * El mfaToken no llega por params — vive en un ref del AuthProvider. Con
 * `web.output: "static"` pasarlo por la URL lo dejaría a la vista.
 */
export default function TwoFactorChallengeScreen() {
    const { verifyTwoFactor, cancelTwoFactor, hayDesafioPendiente } = useAuth();
    const { t } = useLanguage();

    const [codigo, setCodigo] = React.useState('');
    const [usarRespaldo, setUsarRespaldo] = React.useState(false);
    const [verificando, setVerificando] = React.useState(false);
    const [intentos, setIntentos] = React.useState<number | null>(null);

    const volverAlLogin = React.useCallback(() => {
        cancelTwoFactor();
        router.replace('/login');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Si se recarga la pantalla sin desafío (ej. refresh en web), no hay nada
    // que verificar: el token vive en memoria y se perdió.
    React.useEffect(() => {
        if (!hayDesafioPendiente()) volverAlLogin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const largoOk = usarRespaldo ? codigo.trim().length >= 10 : codigo.trim().length === 6;

    const onVerificar = async () => {
        setVerificando(true);
        const res = await verifyTwoFactor(codigo, usarRespaldo ? 'backup_code' : 'totp');
        setVerificando(false);

        if (res.ok) {
            router.replace(MAKER_ROUTE);
            return;
        }

        // Si el desafío se quemó, el provider ya lo descartó: hay que volver a
        // pasar por la contraseña.
        if (!hayDesafioPendiente()) {
            feedback.error(t.msg_twofa_expired_title, t.msg_twofa_expired_msg);
            volverAlLogin();
            return;
        }

        const restantes = (res as any).attemptsLeft;
        if (typeof restantes === 'number') setIntentos(restantes);
        feedback.error(t.msg_twofa_invalid_code_title, res.error || t.msg_retry_hint);
        setCodigo('');
    };

    const alternarModo = () => {
        setUsarRespaldo((v) => !v);
        setCodigo('');
    };

    return (
        <Contenedor titulo={t.twofa_challenge_title} onBack={volverAlLogin}>
            <Card>
                <BrandLogo size={110} style={{ marginBottom: 16 }} />

                <Text style={{ color: THEME.textDim, marginBottom: 14 }}>
                    {usarRespaldo ? t.twofa_backup_intro : t.twofa_challenge_intro}
                </Text>

                {usarRespaldo ? (
                    <Field
                        label={t.twofa_backup_code_label}
                        value={codigo}
                        onChangeText={setCodigo}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        style={{ letterSpacing: 2, fontSize: 18, textAlign: 'center' }}
                    />
                ) : (
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
                )}

                {intentos !== null && (
                    <Text style={{ color: THEME.warning, marginBottom: 8 }}>
                        {fmt(t.twofa_attempts_left, { n: intentos })}
                    </Text>
                )}

                <PrimaryButton
                    icon="unlock"
                    label={t.twofa_verify}
                    onPress={onVerificar}
                    disabled={!largoOk || verificando}
                />

                <Text
                    style={{ color: THEME.accent, textAlign: 'center', marginTop: 16 }}
                    onPress={alternarModo}
                >
                    {usarRespaldo ? t.twofa_use_totp_code : t.twofa_use_backup_code}
                </Text>

                <Text
                    style={{ color: THEME.textDim, textAlign: 'center', marginTop: 12 }}
                    onPress={volverAlLogin}
                >
                    {t.msg_cancel}
                </Text>

                {!usarRespaldo && (
                    <Text style={{ color: THEME.textDim, fontSize: 12, marginTop: 16 }}>
                        {t.twofa_clock_hint}
                    </Text>
                )}
            </Card>
        </Contenedor>
    );
}
