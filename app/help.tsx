import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../src/auth/AuthProvider';
import Card from '../src/components/Card';
import { THEME } from '../src/theme';
import AppNavbar from '../src/components/AppNavbar';
import { MENU_ITEMS } from '../src/constants/menu';

export default function HelpScreen() {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <View style={{ flex: 1, backgroundColor: THEME.bgTop }}>
            <AppNavbar title="Ayuda" menuItems={MENU_ITEMS} onLogout={handleLogout} />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Card title="Acerca de PopliCuentos">
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 16 }}>
                        PopliCuentos es una aplicación diseñada para crear historias mágicas y personalizadas para niños.
                        Utilizamos inteligencia artificial para generar cuentos únicos basados en tus preferencias.
                    </Text>
                    <Text style={{ color: THEME.text, fontWeight: 'bold', marginBottom: 4 }}>Empresa:</Text>
                    <Text style={{ color: THEME.textDim, marginBottom: 16 }}>PopliCuentos Inc.</Text>

                    <Text style={{ color: THEME.text, fontWeight: 'bold', marginBottom: 4 }}>Versión:</Text>
                    <Text style={{ color: THEME.textDim, marginBottom: 16 }}>1.0.0</Text>
                </Card>

                <View style={{ height: 16 }} />

                <Card title="Guia rapida">
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        1) Personaliza edad, tema, habilidad, personajes, tono y duracion.
                    </Text>
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        2) Toca "Generar cuento" y luego "Ilustrar cuento" para crear 3 escenas clave.
                    </Text>
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        3) Escucha la narracion, elige narrador, agrega musica y guarda el PDF.
                    </Text>
                </Card>

                <View style={{ height: 16 }} />

                <Card title="Funciones principales">
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        - Generador de cuentos personalizados con tema, habilidad socioemocional, personajes y tono.
                    </Text>
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        - Ilustraciones automaticas (3 escenas) con opcion de re-generar.
                    </Text>
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        - Narracion con voces seleccionables y demo de voz.
                    </Text>
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        - Musica de fondo con selector de pistas y control de volumen.
                    </Text>
                    <Text style={{ color: THEME.textDim, lineHeight: 22, marginBottom: 10 }}>
                        - Exportar PDF en formato A4 y compartir cuento o audio.
                    </Text>
                </Card>

                <View style={{ height: 16 }} />

                <Card title="Preguntas Frecuentes">
                    <FaqItem
                        question="¿Cómo creo un cuento?"
                        answer="Ve a 'Inicio' (Generador), selecciona la edad, el tema y los valores que deseas, y presiona 'Crear Cuento'."
                    />
                    <FaqItem
                        question="¿Puedo guardar los cuentos?"
                        answer="Sí, los cuentos se guardan automáticamente en tu historial reciente."
                    />
                    <FaqItem
                        question="¿Cómo elijo o cambio la voz?"
                        answer="En el panel 'Narrador' toca 'Elegir narrador' y selecciona la voz. También puedes hacerlo desde Configuración > Voces narradoras y escuchar una demo."
                    />
                    <FaqItem
                        question="¿Cómo escucho el cuento?"
                        answer="Usa los controles de reproducción (play, pausa y detener) en el lector del cuento. Si no hay voz generada, se crea automáticamente al reproducir."
                    />
                    <FaqItem
                        question="¿Cómo guardo o comparto la narración?"
                        answer="En el panel de narración toca 'Guardar narración' para generar el audio y 'Compartir audio' para enviarlo."
                    />
                    <FaqItem
                        question="¿Cómo agrego o cambio la musica?"
                        answer="En 'Elegir musica' selecciona una pista y ajusta el volumen con +/-. El play/pausa controla la musica de fondo."
                    />
                    <FaqItem
                        question="¿Cómo genero las ilustraciones?"
                        answer="Con el cuento creado, toca 'Ilustrar cuento'. Si quieres otras imagenes, usa 'Re-generar ilustraciones'."
                    />
                    <FaqItem
                        question="¿Cómo guardo el PDF?"
                        answer="Toca 'Guardar' en el cuento. Se genera un PDF en formato A4 con las imagenes grandes."
                    />
                    <FaqItem
                        question="¿Cómo comparto el cuento?"
                        answer="Toca 'Compartir' para enviar el PDF o compartir el texto cuando no se pueda adjuntar el archivo."
                    />
                    <FaqItem
                        question="¿Es gratuito?"
                        answer="Tienes un número limitado de cuentos gratuitos por día. Para más, consulta nuestros planes."
                    />
                </Card>
            </ScrollView>
        </View>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [expanded, setExpanded] = React.useState(false);

    return (
        <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            style={{ borderBottomWidth: 1, borderBottomColor: THEME.border, paddingVertical: 12 }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: THEME.text, fontWeight: '600', flex: 1, paddingRight: 8 }}>{question}</Text>
                <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color={THEME.textDim} />
            </View>
            {expanded && (
                <Text style={{ color: THEME.textDim, marginTop: 8, lineHeight: 20 }}>
                    {answer}
                </Text>
            )}
        </TouchableOpacity>
    );
}
